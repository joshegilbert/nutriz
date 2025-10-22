const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = module.constructor;

function loadHelpers() {
  const filePath = path.resolve(__dirname, '../src/components/MealCalendar/utils/mealHelpers.js');
  let code = fs.readFileSync(filePath, 'utf8');

  // Transform ESM exports into CommonJS so we can evaluate within Node without a bundler.
  code = code.replace(/export\s+function\s+/g, 'function ');
  code += '\nmodule.exports = { sumMacros, calculateItemMacros, recalcMealTotals, recalcDayTotals, recalcWeekTotals, overrideMacros, resetMacros, isOverridden };\n';

  const helperModule = new Module();
  helperModule.paths = module.paths.slice();
  helperModule._compile(code, filePath);
  return helperModule.exports;
}

function createRef(value) {
  return { value };
}

function test(name, fn) {
  try {
    fn();
    console.log(`\u2714\ufe0f ${name}`);
  } catch (error) {
    console.error(`\u274c ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

const helpers = loadHelpers();
const { sumMacros, calculateItemMacros, recalcMealTotals, recalcDayTotals, overrideMacros, resetMacros, isOverridden } = helpers;

const foods = createRef([
  {
    id: 1,
    name: 'Greek Yogurt',
    macrosPerServing: { calories: 150, protein: 15, carbs: 12, fat: 5 },
  },
  {
    id: 2,
    name: 'Blueberries',
    macrosPerServing: { calories: 80, protein: 1, carbs: 20, fat: 0.5 },
  },
]);

const meals = createRef([
  {
    id: 10,
    name: 'Yogurt Bowl',
    components: [
      { foodId: 1, amount: 1 },
      { foodId: 2, amount: 0.5 },
    ],
  },
]);

const recipes = createRef([
  {
    id: 20,
    name: 'Fruit Parfait',
    components: [
      { type: 'food', foodId: 1, amount: 1 },
      { type: 'food', foodId: 2, amount: 1.5 },
    ],
  },
]);

test('sumMacros aggregates totals and ignores missing macros', () => {
  const result = sumMacros([
    { macros: { calories: 100, protein: 10, carbs: 5, fat: 2 } },
    { macros: { calories: 50, protein: 2, carbs: 10, fat: 1 } },
    {},
  ]);

  assert.deepStrictEqual(result, { calories: 150, protein: 12, carbs: 15, fat: 3 });
});

test('calculateItemMacros derives totals for foods and nested recipes', () => {
  const foodItem = { type: 'food', sourceId: 1, amount: 2 };
  calculateItemMacros(foodItem, foods, meals, recipes);
  assert.deepStrictEqual(foodItem.macros, { calories: 300, protein: 30, carbs: 24, fat: 10 });
  assert.strictEqual(foodItem.macrosSource, 'auto');

  const recipeItem = { type: 'recipe', sourceId: 20, amount: 1 };
  calculateItemMacros(recipeItem, foods, meals, recipes);
  assert.deepStrictEqual(recipeItem.macros, { calories: 270, protein: 16.5, carbs: 42, fat: 5.75 });
});

test('recalcMealTotals and recalcDayTotals sum nested macros unless overridden', () => {
  const meal = {
    items: [
      { macros: { calories: 200, protein: 15, carbs: 25, fat: 5 } },
      { macros: { calories: 150, protein: 10, carbs: 20, fat: 4 } },
    ],
  };
  recalcMealTotals(meal);
  assert.deepStrictEqual(meal.macros, { calories: 350, protein: 25, carbs: 45, fat: 9 });

  overrideMacros(meal, { calories: 500 });
  assert.strictEqual(isOverridden(meal), true);
  recalcMealTotals(meal); // Should skip because overridden
  assert.deepStrictEqual(meal.macros, { calories: 500, protein: 25, carbs: 45, fat: 9 });

  const day = {
    meals: [meal, { macros: { calories: 100, protein: 5, carbs: 10, fat: 2 } }],
  };
  resetMacros(day);
  recalcDayTotals(day);
  assert.deepStrictEqual(day.macros, { calories: 600, protein: 30, carbs: 55, fat: 11 });
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

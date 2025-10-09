// src/components/MealCalendar/utils/mealHelpers.js

/**
 * Sum macros across an array of items (foods, meals, or days)
 */
export function sumMacros(items = []) {
    return items.reduce(
      (totals, i) => ({
        calories: totals.calories + (i.macros?.calories || 0),
        protein: totals.protein + (i.macros?.protein || 0),
        carbs: totals.carbs + (i.macros?.carbs || 0),
        fat: totals.fat + (i.macros?.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }
  
  /**
   * Recalculate macros for a single item (food, meal, or recipe)
   */
  export function calculateItemMacros(item, foods, meals, recipes) {
    if (!item) return;
  
    // --- Food ---
    if (item.type === "food") {
      const food = foods.value?.find(f => f.id === item.sourceId);
      if (!food) return;
      const multiplier = item.amount || 1;
      item.macros = {
        calories: (food.macrosPerServing.calories || 0) * multiplier,
        protein: (food.macrosPerServing.protein || 0) * multiplier,
        carbs: (food.macrosPerServing.carbs || 0) * multiplier,
        fat: (food.macrosPerServing.fat || 0) * multiplier,
      };
      item.macrosSource = "auto";
    }
  
    // --- Meal ---
    if (item.type === "meal") {
      const meal = meals.value?.find(m => m.id === item.sourceId);
      if (!meal || !meal.components) return;
      const subFoods = meal.components.map(c => {
        const f = foods.value.find(f => f.id === c.foodId);
        if (!f) return { macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
        const multiplier = c.amount || 1;
        return {
          macros: {
            calories: f.macrosPerServing.calories * multiplier,
            protein: f.macrosPerServing.protein * multiplier,
            carbs: f.macrosPerServing.carbs * multiplier,
            fat: f.macrosPerServing.fat * multiplier,
          }
        };
      });
      item.macros = sumMacros(subFoods);
      item.macrosSource = "auto";
    }
  
    // --- Recipe ---
    if (item.type === "recipe") {
      const recipe = recipes.value?.find(r => r.id === item.sourceId);
      if (!recipe || !recipe.components) return;
      const subFoods = recipe.components.map(c => {
        const f = foods.value.find(f => f.id === c.foodId);
        if (!f) return { macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } };
        const multiplier = c.amount || 1;
        return {
          macros: {
            calories: f.macrosPerServing.calories * multiplier,
            protein: f.macrosPerServing.protein * multiplier,
            carbs: f.macrosPerServing.carbs * multiplier,
            fat: f.macrosPerServing.fat * multiplier,
          }
        };
      });
      item.macros = sumMacros(subFoods);
      item.macrosSource = "auto";
    }
  }
  
  /**
   * Recalculate macros for a meal from its items
   */
  export function recalcMealTotals(meal) {
    if (!meal || meal.macrosSource === "overridden") return;
    meal.macros = sumMacros(meal.items || []);
  }
  
  /**
   * Recalculate macros for a day from its meals
   */
  export function recalcDayTotals(day) {
    if (!day || day.macrosSource === "overridden") return;
    day.macros = sumMacros(day.meals || []);
  }
  
  /**
   * Recalculate macros for a week from its days
   */
  export function recalcWeekTotals(week) {
    if (!week || week.macrosSource === "overridden") return;
    week.macros = sumMacros(week.days || []);
  }
  
  /**
   * Mark a node (item, meal, day, week) as manually overridden
   */
  export function overrideMacros(node, partial) {
    if (!node || typeof node !== "object") return;
    node.macros = { ...node.macros, ...partial };
    node.macrosSource = "overridden";
  }
  
  /**
   * Reset a node back to auto-calculated macros
   */
  export function resetMacros(node) {
    if (!node || typeof node !== "object") return;
    node.macrosSource = "auto";
  }
  
  /**
   * Quick helper to check if a node is overridden
   */
  export function isOverridden(node) {
    return node?.macrosSource === "overridden";
  }
  
import { defineStore } from "pinia";
import { ref } from "vue";
import { toRaw } from "vue";

function createId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createMacroTotals(seed = {}) {
  return {
    calories: seed.calories || 0,
    protein: seed.protein || 0,
    carbs: seed.carbs || 0,
    fat: seed.fat || 0,
  };
}

function roundMacros(macros) {
  return {
    calories: Math.round(macros.calories || 0),
    protein: +Number(macros.protein || 0).toFixed(1),
    carbs: +Number(macros.carbs || 0).toFixed(1),
    fat: +Number(macros.fat || 0).toFixed(1),
  };
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function toLocalISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalISO(iso) {
  const [y, m, d] = (iso || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const useDataStore = defineStore("data", () => {
  // ---------------------------------------------------------------------------
  //  DATA LIBRARIES
  // ---------------------------------------------------------------------------
  const foods = ref([
    {
      id: 101,
      brand: "Fage",
      name: "Total 2% Greek Yogurt",
      category: "Proteins",
      servingSize: 1,
      servingUnit: "170g container",
      macrosPerServing: {
        calories: 150,
        protein: 20,
        carbs: 7,
        fat: 4,
        fiber: 0,
      },
    },
    {
      id: 102,
      brand: "Kirkland Signature",
      name: "Organic Berries",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup",
      macrosPerServing: {
        calories: 70,
        protein: 1,
        carbs: 17,
        fat: 0.5,
        fiber: 4,
      },
    },
    {
      id: 103,
      brand: "Nature Valley",
      name: "Protein Chewy Bars",
      category: "Snacks",
      servingSize: 1,
      servingUnit: "bar",
      macrosPerServing: {
        calories: 190,
        protein: 10,
        carbs: 14,
        fat: 12,
        fiber: 5,
      },
    },
    {
      id: 104,
      brand: "Generic",
      name: "Chicken Breast",
      category: "Proteins",
      servingSize: 100,
      servingUnit: "g",
      macrosPerServing: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
      },
    },
    {
      id: 105,
      brand: "Wild Harvest",
      name: "Atlantic Salmon Fillet",
      category: "Proteins",
      servingSize: 4,
      servingUnit: "oz",
      gramsPerServing: 113,
      macrosPerServing: {
        calories: 240,
        protein: 23,
        carbs: 0,
        fat: 15,
        fiber: 0,
      },
    },
    {
      id: 106,
      brand: "Happy Hens",
      name: "Liquid Egg Whites",
      category: "Proteins",
      servingSize: 0.5,
      servingUnit: "cup",
      gramsPerServing: 120,
      macrosPerServing: {
        calories: 60,
        protein: 13,
        carbs: 1,
        fat: 0,
        fiber: 0,
      },
    },
    {
      id: 107,
      brand: "Green Terra",
      name: "Tempeh Blocks",
      category: "Plant Proteins",
      servingSize: 3,
      servingUnit: "oz",
      gramsPerServing: 85,
      macrosPerServing: {
        calories: 160,
        protein: 16,
        carbs: 11,
        fat: 7,
        fiber: 5,
      },
    },
    {
      id: 108,
      brand: "Andes Harvest",
      name: "Quinoa (Cooked)",
      category: "Carbohydrates",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 185,
      macrosPerServing: {
        calories: 222,
        protein: 8,
        carbs: 39,
        fat: 4,
        fiber: 5,
      },
    },
    {
      id: 109,
      brand: "Rooted Farms",
      name: "Roasted Sweet Potato",
      category: "Carbohydrates",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 200,
      macrosPerServing: {
        calories: 180,
        protein: 4,
        carbs: 41,
        fat: 0.5,
        fiber: 6,
      },
    },
    {
      id: 110,
      brand: "Sun Valley",
      name: "Hass Avocado",
      category: "Healthy Fats",
      servingSize: 0.5,
      servingUnit: "fruit",
      gramsPerServing: 100,
      macrosPerServing: {
        calories: 160,
        protein: 2,
        carbs: 9,
        fat: 15,
        fiber: 7,
      },
    },
    {
      id: 111,
      brand: "Nutty Co.",
      name: "Almond Butter",
      category: "Healthy Fats",
      servingSize: 2,
      servingUnit: "tbsp",
      gramsPerServing: 32,
      macrosPerServing: {
        calories: 190,
        protein: 7,
        carbs: 7,
        fat: 17,
        fiber: 3,
      },
    },
    {
      id: 112,
      brand: "Deli Direct",
      name: "Oven-Roasted Turkey Breast",
      category: "Proteins",
      servingSize: 3,
      servingUnit: "oz",
      gramsPerServing: 85,
      macrosPerServing: {
        calories: 120,
        protein: 26,
        carbs: 2,
        fat: 1.5,
        fiber: 0,
      },
    },
    {
      id: 113,
      brand: "Soy Good",
      name: "Extra Firm Tofu",
      category: "Plant Proteins",
      servingSize: 0.5,
      servingUnit: "block",
      gramsPerServing: 170,
      macrosPerServing: {
        calories: 180,
        protein: 20,
        carbs: 5,
        fat: 10,
        fiber: 3,
      },
    },
    {
      id: 114,
      brand: "Prairie Dairy",
      name: "Low-Fat Cottage Cheese",
      category: "Proteins",
      servingSize: 0.75,
      servingUnit: "cup",
      gramsPerServing: 170,
      macrosPerServing: {
        calories: 140,
        protein: 19,
        carbs: 6,
        fat: 4,
        fiber: 0,
      },
    },
    {
      id: 115,
      brand: "Lotus Foods",
      name: "Brown Jasmine Rice",
      category: "Carbohydrates",
      servingSize: 0.75,
      servingUnit: "cup cooked",
      gramsPerServing: 140,
      macrosPerServing: {
        calories: 170,
        protein: 4,
        carbs: 36,
        fat: 1.5,
        fiber: 2,
      },
    },
    {
      id: 116,
      brand: "Morning Rise",
      name: "Rolled Oats",
      category: "Carbohydrates",
      servingSize: 0.5,
      servingUnit: "cup dry",
      gramsPerServing: 40,
      macrosPerServing: {
        calories: 190,
        protein: 7,
        carbs: 33,
        fat: 4,
        fiber: 5,
      },
    },
    {
      id: 117,
      brand: "Field Fresh",
      name: "Baby Spinach",
      category: "Produce",
      servingSize: 2,
      servingUnit: "cups",
      gramsPerServing: 60,
      macrosPerServing: {
        calories: 14,
        protein: 2,
        carbs: 2,
        fat: 0,
        fiber: 2,
      },
    },
    {
      id: 118,
      brand: "Crisp Leaf",
      name: "Chopped Kale",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 67,
      macrosPerServing: {
        calories: 33,
        protein: 3,
        carbs: 6,
        fat: 0.5,
        fiber: 2,
      },
    },
    {
      id: 119,
      brand: "Pod Squad",
      name: "Shelled Edamame",
      category: "Plant Proteins",
      servingSize: 0.75,
      servingUnit: "cup",
      gramsPerServing: 120,
      macrosPerServing: {
        calories: 150,
        protein: 14,
        carbs: 12,
        fat: 7,
        fiber: 6,
      },
    },
    {
      id: 120,
      brand: "Pastalicious",
      name: "Chickpea Pasta",
      category: "Carbohydrates",
      servingSize: 2,
      servingUnit: "oz dry",
      gramsPerServing: 56,
      macrosPerServing: {
        calories: 200,
        protein: 13,
        carbs: 35,
        fat: 3,
        fiber: 5,
      },
    },
    {
      id: 121,
      brand: "Hearth Kitchen",
      name: "Hearty Lentil Soup",
      category: "Plant Proteins",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 240,
      macrosPerServing: {
        calories: 180,
        protein: 12,
        carbs: 30,
        fat: 3,
        fiber: 8,
      },
    },
    {
      id: 122,
      brand: "Canyon Goods",
      name: "Seasoned Black Beans",
      category: "Plant Proteins",
      servingSize: 0.75,
      servingUnit: "cup",
      gramsPerServing: 130,
      macrosPerServing: {
        calories: 160,
        protein: 11,
        carbs: 28,
        fat: 1,
        fiber: 9,
      },
    },
    {
      id: 123,
      brand: "Alpine Creamery",
      name: "0% Greek Yogurt",
      category: "Proteins",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 227,
      macrosPerServing: {
        calories: 130,
        protein: 23,
        carbs: 9,
        fat: 0,
        fiber: 0,
      },
    },
    {
      id: 124,
      brand: "Peak Performance",
      name: "Whey Protein Isolate",
      category: "Supplements",
      servingSize: 1,
      servingUnit: "scoop",
      gramsPerServing: 30,
      macrosPerServing: {
        calories: 120,
        protein: 25,
        carbs: 2,
        fat: 1,
        fiber: 0,
      },
    },
    {
      id: 125,
      brand: "Night Fuel",
      name: "Micellar Casein",
      category: "Supplements",
      servingSize: 1,
      servingUnit: "scoop",
      gramsPerServing: 34,
      macrosPerServing: {
        calories: 130,
        protein: 24,
        carbs: 3,
        fat: 2,
        fiber: 0,
      },
    },
    {
      id: 126,
      brand: "Trail Ridge",
      name: "Mixed Nuts",
      category: "Healthy Fats",
      servingSize: 1,
      servingUnit: "oz",
      gramsPerServing: 28,
      macrosPerServing: {
        calories: 170,
        protein: 6,
        carbs: 8,
        fat: 15,
        fiber: 3,
      },
    },
    {
      id: 127,
      brand: "Cacao Collective",
      name: "85% Dark Chocolate Squares",
      category: "Snacks",
      servingSize: 2,
      servingUnit: "squares",
      gramsPerServing: 20,
      macrosPerServing: {
        calories: 120,
        protein: 2,
        carbs: 10,
        fat: 9,
        fiber: 3,
      },
    },
    {
      id: 128,
      brand: "Swift Fuel",
      name: "Vanilla Protein Shake",
      category: "Drinks",
      servingSize: 1,
      servingUnit: "bottle",
      gramsPerServing: 325,
      macrosPerServing: {
        calories: 180,
        protein: 30,
        carbs: 8,
        fat: 3,
        fiber: 2,
      },
    },
    {
      id: 129,
      brand: "Island Drop",
      name: "Pure Coconut Water",
      category: "Drinks",
      servingSize: 12,
      servingUnit: "fl oz",
      gramsPerServing: 355,
      macrosPerServing: {
        calories: 60,
        protein: 1,
        carbs: 15,
        fat: 0,
        fiber: 0,
      },
    },
    {
      id: 130,
      brand: "Hydrate+",
      name: "Citrus Electrolyte Powder",
      category: "Supplements",
      servingSize: 1,
      servingUnit: "packet",
      gramsPerServing: 10,
      macrosPerServing: {
        calories: 35,
        protein: 0,
        carbs: 9,
        fat: 0,
        fiber: 0,
      },
    },
    {
      id: 131,
      brand: "Golden Grove",
      name: "Extra Virgin Olive Oil",
      category: "Healthy Fats",
      servingSize: 1,
      servingUnit: "tbsp",
      gramsPerServing: 14,
      macrosPerServing: {
        calories: 120,
        protein: 0,
        carbs: 0,
        fat: 14,
        fiber: 0,
      },
    },
    {
      id: 132,
      brand: "Seed & Sprout",
      name: "Chia Seeds",
      category: "Healthy Fats",
      servingSize: 2,
      servingUnit: "tbsp",
      gramsPerServing: 28,
      macrosPerServing: {
        calories: 140,
        protein: 5,
        carbs: 12,
        fat: 9,
        fiber: 10,
      },
    },
    {
      id: 133,
      brand: "Frostbite",
      name: "Frozen Blueberries",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 140,
      macrosPerServing: {
        calories: 80,
        protein: 1,
        carbs: 21,
        fat: 0,
        fiber: 4,
      },
    },
    {
      id: 134,
      brand: "Sunrise Patch",
      name: "Fresh Strawberries",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup sliced",
      gramsPerServing: 150,
      macrosPerServing: {
        calories: 50,
        protein: 1,
        carbs: 12,
        fat: 0.5,
        fiber: 3,
      },
    },
    {
      id: 135,
      brand: "Harvest Bell",
      name: "Tri-Color Bell Peppers",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup sliced",
      gramsPerServing: 92,
      macrosPerServing: {
        calories: 45,
        protein: 1,
        carbs: 9,
        fat: 0,
        fiber: 3,
      },
    },
    {
      id: 136,
      brand: "Snap Fresh",
      name: "Baby Carrots",
      category: "Produce",
      servingSize: 10,
      servingUnit: "carrots",
      gramsPerServing: 85,
      macrosPerServing: {
        calories: 35,
        protein: 1,
        carbs: 8,
        fat: 0,
        fiber: 3,
      },
    },
    {
      id: 137,
      brand: "Green Crown",
      name: "Broccoli Florets",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 90,
      macrosPerServing: {
        calories: 55,
        protein: 4,
        carbs: 11,
        fat: 0.5,
        fiber: 4,
      },
    },
    {
      id: 138,
      brand: "Riced Right",
      name: "Cauliflower Rice",
      category: "Produce",
      servingSize: 1,
      servingUnit: "cup",
      gramsPerServing: 120,
      macrosPerServing: {
        calories: 30,
        protein: 2,
        carbs: 6,
        fat: 0,
        fiber: 2,
      },
    },
    {
      id: 139,
      brand: "Baker's Hearth",
      name: "Whole Wheat Bread",
      category: "Carbohydrates",
      servingSize: 2,
      servingUnit: "slices",
      gramsPerServing: 56,
      macrosPerServing: {
        calories: 160,
        protein: 8,
        carbs: 28,
        fat: 2,
        fiber: 4,
      },
    },
    {
      id: 140,
      brand: "Crunch Cabin",
      name: "Honey Almond Granola",
      category: "Snacks",
      servingSize: 0.5,
      servingUnit: "cup",
      gramsPerServing: 55,
      macrosPerServing: {
        calories: 220,
        protein: 6,
        carbs: 30,
        fat: 9,
        fiber: 4,
      },
    },
    {
      id: 141,
      brand: "Fuel Bite",
      name: "Salted Caramel Energy Bar",
      category: "Snacks",
      servingSize: 1,
      servingUnit: "bar",
      gramsPerServing: 60,
      macrosPerServing: {
        calories: 210,
        protein: 12,
        carbs: 24,
        fat: 8,
        fiber: 5,
      },
    },
  ]);

  const meals = ref([
    {
      id: 201,
      name: "Yogurt Bowl",
      components: [
        { foodId: 101, amount: 1 },
        { foodId: 102, amount: 0.5 },
      ],
    },
  ]);

  const recipes = ref([
    {
      id: 301,
      name: "Simple Grilled Chicken",
      instructions: "1. Season chicken breast. 2. Grill until cooked through.",
      components: [{ type: "food", foodId: 104, amount: 1.5 }],
    },
  ]);

  const clients = ref([
    {
      id: 1,
      name: "John Doe",
      status: "Active",
      programs: [
        {
          id: 1,
          clientId: 1,
          startDate: "2025-10-02",
          length: 28,
          days: [],
        },
      ],
    },
  ]);

  // Clipboard for meals (copy/paste across the day editor)
  const mealClipboard = ref(null);

  // ---------------------------------------------------------------------------
  //  DATA NORMALISERS
  // ---------------------------------------------------------------------------
  function toMeal(meal) {
    const base = meal || {};
    return {
      id: base.id || createId("meal"),
      name: base.name || base.mealTime || "Meal",
      mealTime: base.mealTime || base.name || "Meal",
      time: base.time || "",
      items: Array.isArray(base.items)
        ? base.items.map((item) => toMealItem(item)).filter(Boolean)
        : [],
      macros: createMacroTotals(base.macros),
      macrosSource: base.macrosSource || "auto",
    };
  }

  function toMealItem(item) {
    if (!item) return null;
    const inferredType = item.type || (item.foodId ? "food" : "custom");
    const sourceId =
      item.sourceId !== undefined
        ? item.sourceId
        : item.foodId !== undefined
        ? item.foodId
        : item.id;

    return {
      id: item.id || createId("item"),
      type: inferredType,
      sourceId: sourceId ?? null,
      name: item.name || item.label || "",
      amount: item.amount ?? 1,
      unit: item.unit || "",
      notes: item.notes || "",
      time: item.time || "",
      macros: createMacroTotals(item.macros),
      macrosSource: item.macrosSource || "auto",
    };
  }

  function toDay(day) {
    return {
      date: day.date,
      meals: Array.isArray(day.meals)
        ? day.meals.map((meal) => toMeal(meal))
        : [],
      macros: createMacroTotals(day.macros),
      macrosSource: day.macrosSource || "auto",
    };
  }

  function ensureProgramStructure(program) {
    if (!program) return null;
    program.days = (program.days || []).map((day) => toDay(day));
    return program;
  }

  // ---------------------------------------------------------------------------
  //  INITIAL DATA SHAPING
  // ---------------------------------------------------------------------------
  function initializeProgramData() {
    for (const client of clients.value) {
      for (const program of client.programs) {
        const start = new Date(program.startDate);
        const hydrated = [];

        for (let i = 0; i < program.length; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const localISO = toLocalISODate(date);

          hydrated.push(
            toDay({
              date: localISO,
              meals: [],
              macros: createMacroTotals(),
              macrosSource: "auto",
            })
          );
        }

        program.days = hydrated;
      }
    }
  }

  initializeProgramData();

  // ---------------------------------------------------------------------------
  //  UTILITIES
  // ---------------------------------------------------------------------------
  function getItemDetails(type, id) {
    if (!type || id == null) return null;
    if (type === "food") return foods.value.find((f) => f.id === id) || null;
    if (type === "meal") return meals.value.find((m) => m.id === id) || null;
    if (type === "recipe")
      return recipes.value.find((r) => r.id === id) || null;
    return null;
  }

  function calculateItemMacros(type, id, amount = 1) {
    const details = getItemDetails(type, id);
    if (!details) {
      return createMacroTotals();
    }

    if (type === "food") {
      const macros = details.macrosPerServing || {};
      return roundMacros({
        calories: (macros.calories || 0) * amount,
        protein: (macros.protein || 0) * amount,
        carbs: (macros.carbs || 0) * amount,
        fat: (macros.fat || 0) * amount,
      });
    }

    const components = details.components || details.ingredients || [];
    const totals = components.reduce((acc, component) => {
      let componentAmount = component.amount ?? component.quantity ?? 1;

      if (component.type && component.id) {
        const nested = calculateItemMacros(
          component.type,
          component.id,
          componentAmount
        );
        acc.calories += nested.calories;
        acc.protein += nested.protein;
        acc.carbs += nested.carbs;
        acc.fat += nested.fat;
        return acc;
      }

      if (component.foodId) {
        const food = foods.value.find((f) => f.id === component.foodId);
        if (!food) return acc;
        const macros = food.macrosPerServing || {};
        acc.calories += (macros.calories || 0) * componentAmount;
        acc.protein += (macros.protein || 0) * componentAmount;
        acc.carbs += (macros.carbs || 0) * componentAmount;
        acc.fat += (macros.fat || 0) * componentAmount;
      }
      return acc;
    }, createMacroTotals());

    totals.calories *= amount;
    totals.protein *= amount;
    totals.carbs *= amount;
    totals.fat *= amount;

    return roundMacros(totals);
  }

  function calcMealTotals(meal) {
    if (!meal) return createMacroTotals();
    if (meal.macrosSource === "overridden") {
      return roundMacros(meal.macros);
    }

    const totals = (meal.items || []).reduce((acc, item) => {
      const macros =
        item.macrosSource === "overridden"
          ? item.macros
          : calculateItemMacros(item.type, item.sourceId, item.amount);

      acc.calories += macros.calories || 0;
      acc.protein += macros.protein || 0;
      acc.carbs += macros.carbs || 0;
      acc.fat += macros.fat || 0;
      return acc;
    }, createMacroTotals());

    return roundMacros(totals);
  }

  function recalcMealTotals(meal) {
    if (!meal || meal.macrosSource === "overridden") return;
    meal.macros = calcMealTotals(meal);
  }

  function calcDayTotals(day) {
    if (!day) return createMacroTotals();
    if (day.macrosSource === "overridden") return roundMacros(day.macros);

    const totals = (day.meals || []).reduce((acc, meal) => {
      const macros =
        meal.macrosSource === "overridden" ? meal.macros : calcMealTotals(meal);
      acc.calories += macros.calories || 0;
      acc.protein += macros.protein || 0;
      acc.carbs += macros.carbs || 0;
      acc.fat += macros.fat || 0;
      return acc;
    }, createMacroTotals());

    return roundMacros(totals);
  }

  function recalcDayTotals(day) {
    if (!day || day.macrosSource === "overridden") return;
    day.macros = calcDayTotals(day);
  }

  // ---------------------------------------------------------------------------
  //  ACTIONS
  // ---------------------------------------------------------------------------
  async function getProgramByClientId(clientId) {
    const client = clients.value.find((c) => c.id === clientId);
    if (!client) return null;
    const program = client.programs[0];
    return ensureProgramStructure(program);
  }

  function updateProgram(updatedProgram) {
    const client = clients.value.find((c) => c.id === updatedProgram.clientId);
    if (!client) return;

    const index = client.programs.findIndex((p) => p.id === updatedProgram.id);
    if (index === -1) return;

    client.programs[index] = cloneDeep(toRaw(updatedProgram));
  }

  function createMeal(payload = {}) {
    return toMeal({
      id: createId("meal"),
      name: payload.name || "Meal",
      mealTime: payload.name || payload.mealTime,
      time: payload.time || "",
      items: [],
      macros: createMacroTotals(),
      macrosSource: "auto",
    });
  }

  function createMealItem(payload = {}) {
    const item = toMealItem({
      id: createId("item"),
      ...payload,
    });

    if (item.macrosSource !== "overridden") {
      item.macros = calculateItemMacros(item.type, item.sourceId, item.amount);
      item.macrosSource = "auto";
    }
    return item;
  }

  function addMealToDay(programInstance, dayDate, payload = {}) {
    if (!programInstance) return;
    const targetDay = programInstance.days.find((d) => d.date === dayDate);
    if (!targetDay) return;

    const meal = createMeal(payload);
    targetDay.meals.push(meal);
    recalcDayTotals(targetDay);
    return meal;
  }

  function removeMealFromDay(programInstance, dayDate, mealId) {
    if (!programInstance) return;
    const targetDay = programInstance.days.find((d) => d.date === dayDate);
    if (!targetDay) return;

    const idx = targetDay.meals.findIndex((m) => m.id === mealId);
    if (idx === -1) return;

    targetDay.meals.splice(idx, 1);
    recalcDayTotals(targetDay);
  }

  function updateMeal(programInstance, dayDate, mealId, updater) {
    if (!programInstance) return;
    const targetDay = programInstance.days.find((d) => d.date === dayDate);
    if (!targetDay) return;

    const mealIndex = targetDay.meals.findIndex((m) => m.id === mealId);
    if (mealIndex === -1) return;

    const draft = toMeal(targetDay.meals[mealIndex]);
    const next =
      typeof updater === "function" ? updater(cloneDeep(draft)) : updater;
    targetDay.meals.splice(mealIndex, 1, toMeal(next));
    recalcMealTotals(targetDay.meals[mealIndex]);
    recalcDayTotals(targetDay);
  }

  function attachItemToMeal(meal, itemPayload) {
    if (!meal) return;
    const newItem = createMealItem(itemPayload);
    meal.items.push(newItem);
    recalcMealTotals(meal);
  }

  function removeItemFromMeal(meal, itemId) {
    if (!meal) return;
    const idx = meal.items.findIndex((item) => item.id === itemId);
    if (idx === -1) return;
    meal.items.splice(idx, 1);
    recalcMealTotals(meal);
  }

  function duplicateMealItems(meal) {
    if (!meal || !Array.isArray(meal.items)) return;
    const copies = meal.items.map((item) =>
      createMealItem({
        ...item,
        id: undefined,
      })
    );
    meal.items.push(...copies);
    recalcMealTotals(meal);
  }

  function ensureProgramIncludesDate(programInstance, isoDate) {
    if (!programInstance || !isoDate) return;
    if (!Array.isArray(programInstance.days) || programInstance.days.length === 0) return;
    const firstIso = programInstance.days[0].date;
    const lastIso = programInstance.days[programInstance.days.length - 1].date;
    let first = parseLocalISO(firstIso);
    let last = parseLocalISO(lastIso);
    const target = parseLocalISO(isoDate);

    // Extend backwards
    while (target < first) {
      first.setDate(first.getDate() - 1);
      const newIso = toLocalISODate(first);
      programInstance.days.unshift(
        toDay({ date: newIso, meals: [], macros: createMacroTotals(), macrosSource: "auto" })
      );
    }
    // Extend forwards
    while (target > last) {
      last.setDate(last.getDate() + 1);
      const newIso = toLocalISODate(last);
      programInstance.days.push(
        toDay({ date: newIso, meals: [], macros: createMacroTotals(), macrosSource: "auto" })
      );
    }
  }

  function cloneMeal(meal) {
    if (!meal) return null;
    const base = toMeal(meal);
    const cloned = createMeal({ name: base.name, time: base.time });
    // Recreate items with new IDs and recalculated macros
    (base.items || []).forEach((it) => {
      const newItem = createMealItem({
        type: it.type,
        sourceId: it.sourceId,
        name: it.name,
        amount: it.amount,
        unit: it.unit,
        notes: it.notes,
        time: it.time,
        macros: it.macros,
        macrosSource: it.macrosSource,
      });
      cloned.items.push(newItem);
    });
    recalcMealTotals(cloned);
    return cloned;
  }

  function setMealClipboard(meal) {
    mealClipboard.value = cloneMeal(meal);
  }

  function clearMealClipboard() {
    mealClipboard.value = null;
  }

  // ---------------------------------------------------------------------------
  //  RETURN API
  // ---------------------------------------------------------------------------
  return {
    foods,
    meals,
    recipes,
    clients,
    // lookups & math
    getItemDetails,
    calculateItemMacros,
    calcMealTotals,
    recalcMealTotals,
    recalcDayTotals,
    // program manipulation
    getProgramByClientId,
    updateProgram,
    createMeal,
    createMealItem,
    addMealToDay,
    removeMealFromDay,
    updateMeal,
    attachItemToMeal,
    removeItemFromMeal,
    duplicateMealItems,
    ensureProgramIncludesDate,
    // clipboard
    mealClipboard,
    setMealClipboard,
    clearMealClipboard,
    cloneMeal,
  };
});

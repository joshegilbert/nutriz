import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

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

export const MEAL_TIMES = Object.freeze([
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
]);

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
  const isLoadingClients = ref(false);
  const isLoadingFoods = ref(false);
  const isLoadingMeals = ref(false);
  const isLoadingRecipes = ref(false);
  const lastError = ref("");

  // Clipboard for meals (copy/paste across the day editor)
  const mealClipboard = ref(null);

  function resetAll() {
    foods.value = [];
    meals.value = [];
    recipes.value = [];
    clients.value = [];
    isLoadingClients.value = false;
    isLoadingFoods.value = false;
    isLoadingMeals.value = false;
    isLoadingRecipes.value = false;
    lastError.value = "";
    mealClipboard.value = null;
  }

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
    const base = cloneDeep(program);
    const id = base._id || base.id || createId("program");
    const clientId = base.clientId || base.client || base.owner || null;
    const startDate = base.startDate || base.days?.[0]?.date || toLocalISODate(new Date());
    const macros = createMacroTotals(base.macros);
    const macrosSource = base.macrosSource === "overridden" ? "overridden" : "auto";

    let days = Array.isArray(base.days) ? base.days.map((day) => toDay(day)) : [];
    if (!days.length) {
      const blank = createBlankProgram({ clientId, startDate, length: base.length || 7 });
      days = blank.days;
    }

    return {
      id,
      clientId,
      name: base.name || "",
      startDate,
      length: base.length || days.length,
      days,
      macros,
      macrosSource,
    };
  }

  function createBlankProgram({
    clientId,
    startDate = toLocalISODate(new Date()),
    length = 7,
  } = {}) {
    const days = [];
    const start = parseLocalISO(startDate);
    for (let i = 0; i < length; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(
        toDay({
          date: toLocalISODate(date),
          meals: [],
          macros: createMacroTotals(),
          macrosSource: "auto",
        })
      );
    }

    return {
      id: createId("program"),
      clientId,
      startDate,
      length,
      days,
      macros: createMacroTotals(),
      macrosSource: "auto",
    };
  }

  // ---------------------------------------------------------------------------
  //  INITIAL DATA SHAPING
  // ---------------------------------------------------------------------------
  function normaliseClient(document, previous = null) {
    if (!document && !previous) return null;
    const existing = previous || {};
    const id = document?._id || document?.id || existing.id || createId("client");

    const dobIso = document?.dob
      ? toLocalISODate(new Date(document.dob))
      : existing.dob || "";

    const createdIso = document?.lastActive
      ? toLocalISODate(new Date(document.lastActive))
      : document?.createdAt
      ? toLocalISODate(new Date(document.createdAt))
      : existing.last_active || toLocalISODate(new Date());

    const programSource = document?.programs?.length
      ? document.programs.map((program) => ensureProgramStructure(program))
      : existing.programs?.length
      ? existing.programs.map((program) => ensureProgramStructure(program))
      : [];

    return {
      id,
      name: document?.name ?? existing.name ?? "",
      status: document?.status ?? existing.status ?? "Active",
      email: document?.contact?.email ?? existing.email ?? "",
      phone: document?.contact?.phone ?? existing.phone ?? "",
      dob: dobIso,
      gender: document?.gender ?? existing.gender ?? "",
      weight: document?.weight ?? existing.weight ?? null,
      state: document?.state ?? existing.state ?? "",
      goals: document?.goals ?? existing.goals ?? [],
      notes: document?.notes ?? existing.notes ?? "",
      last_active: createdIso,
      programs: programSource,
      raw: document || existing.raw || null,
    };
  }

  function serialiseClient(payload = {}) {
    const body = {
      name: payload.name,
      dob: payload.dob || null,
      status: payload.status || undefined,
      gender: payload.gender || undefined,
      weight: payload.weight ?? undefined,
      state: payload.state || undefined,
      lastActive: payload.last_active || payload.lastActive || undefined,
      contact: {
        email: payload.email || "",
        phone: payload.phone || "",
      },
      goals: payload.goals || [],
      notes: payload.notes || "",
    };

    if (!body.contact.phone) delete body.contact.phone;
    if (!body.contact.email) delete body.contact.email;
    if (!Object.keys(body.contact).length) delete body.contact;

    // Remove undefined optional fields to avoid overwriting
    Object.keys(body).forEach((k) => {
      if (body[k] === undefined) delete body[k];
    });

    return body;
  }

  function normaliseFood(document) {
    if (!document) return null;
    return {
      id: document._id || document.id,
      name: document.name || "",
      category: document.category || "Other",
      defaultServingSize: document.defaultServingSize || "1 serving",
      servingUnit: document.defaultServingSize || "1 serving",
      brand: document.brand || "",
      caloriesPerServing: document.caloriesPerServing || 0,
      proteinPerServing: document.proteinPerServing || 0,
      carbsPerServing: document.carbsPerServing || 0,
      fatPerServing: document.fatPerServing || 0,
      macrosPerServing: {
        calories: document.caloriesPerServing || 0,
        protein: document.proteinPerServing || 0,
        carbs: document.carbsPerServing || 0,
        fat: document.fatPerServing || 0,
      },
    };
  }

  function serialiseFood(payload = {}) {
    return {
      name: payload.name,
      category: payload.category || "Other",
      defaultServingSize: payload.defaultServingSize || "1 serving",
      caloriesPerServing: Number(payload.caloriesPerServing) || 0,
      proteinPerServing: Number(payload.proteinPerServing) || 0,
      carbsPerServing: Number(payload.carbsPerServing) || 0,
      fatPerServing: Number(payload.fatPerServing) || 0,
    };
  }

  function normaliseRecipe(document) {
    if (!document) return null;

    const components = (document.ingredients || []).map((ingredient) => {
      const food = ingredient.foodItem || {};
      const quantity = ingredient.quantity || 1;
      return {
        id: ingredient._id || createId("component"),
        type: "food",
        foodId: food._id || ingredient.foodItem,
        amount: quantity,
        notes: ingredient.notes || ingredient.amount || "",
        macros: {
          calories: (food.caloriesPerServing || 0) * quantity,
          protein: (food.proteinPerServing || 0) * quantity,
          carbs: (food.carbsPerServing || 0) * quantity,
          fat: (food.fatPerServing || 0) * quantity,
        },
        macrosSource: "auto",
        expanded: false,
      };
    });

    const totalMacros = components.reduce(
      (acc, component) => {
        acc.calories += component.macros?.calories || 0;
        acc.protein += component.macros?.protein || 0;
        acc.carbs += component.macros?.carbs || 0;
        acc.fat += component.macros?.fat || 0;
        return acc;
      },
      createMacroTotals()
    );

    return {
      id: document._id || document.id,
      name: document.name || "",
      description: document.description || "",
      instructions: document.instructions || "",
      components,
      tags: document.tags || [],
      totalMacros,
    };
  }

  function serialiseRecipe(payload = {}) {
    const ingredients = [];
    (payload.components || []).forEach((component) => {
      if (component.type === "food" && component.foodId) {
        ingredients.push({
          foodItem: component.foodId,
          amount: component.notes || "",
          quantity: Number(component.amount) || 1,
          notes: component.notes || "",
        });
      } else if (component.type === "meal" && Array.isArray(component.components)) {
        component.components.forEach((item) => {
          if (item.foodId) {
            ingredients.push({
              foodItem: item.foodId,
              amount: item.notes || "",
              quantity: Number(item.amount) || 1,
              notes: item.notes || "",
            });
          }
        });
      }
    });

    return {
      name: payload.name,
      description: payload.description || "",
      instructions: payload.instructions || "",
      ingredients,
      tags: payload.tags || [],
    };
  }

  function normaliseMeal(document) {
    if (!document) return null;

    const components = (document.components || []).map((component) => {
      const type = component.type || (component.foodItem ? "food" : "custom");
      const food = component.foodItem || {};
      return {
        id: component._id || component.id || createId("component"),
        type,
        foodId: food._id || component.foodItem || component.foodId || null,
        customName: component.customName || "",
        serving: component.serving || "",
        amount: component.amount ?? 1,
        notes: component.notes || "",
        macros: createMacroTotals(component.macros),
        macrosSource:
          component.macrosSource || (type === "custom" ? "overridden" : "auto"),
        expanded: false,
      };
    });

    return {
      id: document._id || document.id,
      name: document.name || "",
      description: document.description || "",
      components,
      macros: createMacroTotals(document.macros),
      macrosSource: document.macrosSource || "auto",
    };
  }

  function serialiseMeal(payload = {}) {
    const components = (payload.components || []).map((component) => {
      const type = component.type || (component.customName ? "custom" : "food");
      const macrosSource =
        component.macrosSource === "overridden" || type === "custom"
          ? "overridden"
          : "auto";

      const base = {
        type,
        amount: Number(component.amount) || 0,
        notes: component.notes || "",
        macrosSource,
      };

      if (type === "food") {
        base.foodId = component.foodId || component.sourceId || null;
      } else {
        base.customName = component.customName || "";
        base.serving = component.serving || "";
      }

      if (macrosSource === "overridden" || type === "custom") {
        base.macros = {
          calories: Number(component.macros?.calories) || 0,
          protein: Number(component.macros?.protein) || 0,
          carbs: Number(component.macros?.carbs) || 0,
          fat: Number(component.macros?.fat) || 0,
        };
      }

      return base;
    });

    return {
      name: payload.name,
      description: payload.description || "",
      macrosSource: payload.macrosSource || "auto",
      components,
    };
  }

  function normaliseProgram(document, previous = null) {
    if (!document && !previous) return null;
    const existing = previous || {};
    const program = {
      ...existing,
      ...(document || {}),
    };

    program.id = document?._id || document?.id || existing.id || createId("program");
    program.clientId =
      program.clientId || document?.client || document?.clientId || existing.clientId || null;
    if (program.clientId) {
      program.clientId = String(program.clientId);
    }
    program.name = document?.name || existing.name || "";
    program.startDate =
      document?.startDate || existing.startDate || program.days?.[0]?.date || toLocalISODate(new Date());
    program.length =
      document?.length || existing.length || (document?.days?.length ?? existing.days?.length ?? 0);
    program.days = document?.days || existing.days || [];
    program.macros = document?.macros || existing.macros || createMacroTotals();
    program.macrosSource = document?.macrosSource || existing.macrosSource || "auto";

    return ensureProgramStructure(program);
  }

  function serialiseProgram(program = {}) {
    const structured = ensureProgramStructure(program);
    return {
      clientId: structured.clientId,
      name: structured.name,
      startDate: structured.startDate,
      length: structured.length || structured.days.length,
      macros: roundMacros(structured.macros),
      macrosSource: structured.macrosSource === "overridden" ? "overridden" : "auto",
      days: (structured.days || []).map((day) => ({
        date: day.date,
        macros: roundMacros(day.macros),
        macrosSource: day.macrosSource === "overridden" ? "overridden" : "auto",
        meals: (day.meals || []).map((meal) => ({
          id: meal.id,
          name: meal.name || meal.mealTime || "Meal",
          mealTime: meal.mealTime || meal.name || "Meal",
          time: meal.time || "",
          macros: roundMacros(meal.macros),
          macrosSource: meal.macrosSource === "overridden" ? "overridden" : "auto",
          items: (meal.items || []).map((item) => ({
            id: item.id,
            type: item.type || (item.sourceId ? "food" : "custom"),
            sourceId: item.sourceId ?? null,
            name: item.name || "",
            amount: Number(item.amount) || 0,
            unit: item.unit || "",
            notes: item.notes || "",
            time: item.time || "",
            macros: roundMacros(item.macros),
            macrosSource: item.macrosSource === "overridden" ? "overridden" : "auto",
          })),
        })),
      })),
    };
  }

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

  const EMPTY_MACROS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  function normaliseNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function addMacros(base, addition) {
    return {
      calories: base.calories + normaliseNumber(addition?.calories),
      protein: base.protein + normaliseNumber(addition?.protein),
      carbs: base.carbs + normaliseNumber(addition?.carbs),
      fat: base.fat + normaliseNumber(addition?.fat),
    };
  }

  function scaleMacros(macros, factor) {
    const multiplier = normaliseNumber(factor);
    if (multiplier === 0) {
      return { ...EMPTY_MACROS };
    }

    return {
      calories: normaliseNumber(macros?.calories) * multiplier,
      protein: normaliseNumber(macros?.protein) * multiplier,
      carbs: normaliseNumber(macros?.carbs) * multiplier,
      fat: normaliseNumber(macros?.fat) * multiplier,
    };
  }

  // NOTE: getItemDetails declared above (with null-check) — remove duplicate

  function collectComponentMacros(component) {
    if (!component) return { ...EMPTY_MACROS };

    if (component.macrosSource === "overridden" && component.macros) {
      return {
        calories: normaliseNumber(component.macros.calories),
        protein: normaliseNumber(component.macros.protein),
        carbs: normaliseNumber(component.macros.carbs),
        fat: normaliseNumber(component.macros.fat),
      };
    }

    if (component.customName) {
      return {
        calories: normaliseNumber(component.macros?.calories),
        protein: normaliseNumber(component.macros?.protein),
        carbs: normaliseNumber(component.macros?.carbs),
        fat: normaliseNumber(component.macros?.fat),
      };
    }

    const nestedType = component.type;
    const nestedId = component.sourceId || component.id;

    if (nestedType && nestedId != null) {
      return calculateItemMacros(nestedType, nestedId, component.amount);
    }

    const foodId = component.foodId ?? component.sourceId ?? component.id;
    if (foodId != null) {
      const food = getItemDetails("food", foodId);
      if (!food) return { ...EMPTY_MACROS };
      return scaleMacros(food.macrosPerServing, component.amount ?? 1);
    }

    return { ...EMPTY_MACROS };
  }

  function collectMealMacros(components = []) {
    return components.reduce((totals, component) => {
      return addMacros(totals, collectComponentMacros(component));
    }, { ...EMPTY_MACROS });
  }

  function collectRecipeMacros(components = []) {
    return components.reduce((totals, component) => {
      const componentType = component.type || (component.foodId ? "food" : null);

      if (componentType === "food") {
        const foodId = component.foodId ?? component.sourceId ?? component.id;
        if (foodId == null) {
          return totals;
        }

        const food = getItemDetails("food", foodId);
        if (!food) {
          return totals;
        }

        const macros = scaleMacros(food.macrosPerServing, component.amount ?? 1);
        return addMacros(totals, macros);
      }

      if (componentType && component.sourceId != null) {
        const macros = calculateItemMacros(componentType, component.sourceId, component.amount);
        return addMacros(totals, macros);
      }

      return addMacros(totals, component.macros);
    }, { ...EMPTY_MACROS });
  }

  function calculateItemMacros(type, id, amount = 1) {
    const quantity = amount == null ? 1 : normaliseNumber(amount);
    if (!type || id == null || quantity <= 0) {
      return { ...EMPTY_MACROS };
    }

    if (type === "food") {
      const food = getItemDetails("food", id);
      if (!food) return { ...EMPTY_MACROS };
      return scaleMacros(food.macrosPerServing, quantity);
    }

    if (type === "meal") {
      const meal = getItemDetails("meal", id);
      if (!meal) return { ...EMPTY_MACROS };
      const baseMacros = collectMealMacros(meal.components);
      return scaleMacros(baseMacros, quantity);
    }

    if (type === "recipe") {
      const recipe = getItemDetails("recipe", id);
      if (!recipe) return { ...EMPTY_MACROS };
      const baseMacros = collectRecipeMacros(recipe.components);
      return scaleMacros(baseMacros, quantity);
    }

    return { ...EMPTY_MACROS };
  }

  function calcMealTotals(meal) {
    if (!meal) return createMacroTotals();
    const totals = (meal.items || []).reduce((acc, item) => {
      const macros =
        item?.macrosSource === "overridden"
          ? item.macros
          : calculateItemMacros(item.type, item.sourceId, item.amount);

      acc.calories += macros?.calories || 0;
      acc.protein += macros?.protein || 0;
      acc.carbs += macros?.carbs || 0;
      acc.fat += macros?.fat || 0;
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

  function setLastError(err) {
    lastError.value = err || "";
  }

  async function persistProgram(program) {
    if (!program || !program.clientId) return null;
    const body = serialiseProgram(program);
    const isNew = !program.id || program.id.startsWith("program_");
    const endpoint = isNew ? "/programs" : `/programs/${program.id}`;
    const method = isNew ? api.post : api.put;
    const { data } = await method(endpoint, body);
    return normaliseProgram(data, program);
  }

  async function ensureClientProgram(clientId) {
    const client = clients.value.find((c) => c.id === clientId);
    if (!client) return null;

    if (!Array.isArray(client.programs)) {
      client.programs = [];
    }

    if (client.programs.length) {
      const normalised = client.programs.map((program) => ensureProgramStructure(program));
      client.programs.splice(0, client.programs.length, ...normalised);
      return normalised[0] || null;
    }

    const placeholder = ensureProgramStructure(createBlankProgram({ clientId }));
    client.programs = [placeholder];

    try {
      const saved = await persistProgram(placeholder);
      if (saved) {
        Object.assign(placeholder, cloneDeep(saved));
      }
      return placeholder;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to save program.";
      setLastError(message);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  //  ACTIONS
  // ---------------------------------------------------------------------------
  async function fetchClients({ force = false } = {}) {
    isLoadingClients.value = true;
    setLastError("");
    try {
      const [clientResponse, programResponse] = await Promise.all([
        api.get("/clients"),
        api.get("/programs"),
      ]);

      const programsByClient = new Map();
      (programResponse.data || []).forEach((programDoc) => {
        const normalised = normaliseProgram(programDoc);
        const key =
          normalised?.clientId || programDoc.client || programDoc.clientId || null;
        if (!key) return;
        const id = String(key);
        if (!programsByClient.has(id)) {
          programsByClient.set(id, []);
        }
        programsByClient.get(id).push(normalised);
      });

      const mapped = (clientResponse.data || []).map((doc) => {
        const id = String(doc._id || doc.id);
        const existing = clients.value.find((client) => client.id === id) || null;
        const enriched = {
          ...doc,
          programs: programsByClient.get(id) || existing?.programs || [],
        };
        return normaliseClient(enriched, existing);
      });

      clients.value = mapped;

      const needsPrograms = clients.value.filter((client) => !client.programs.length);
      if (needsPrograms.length) {
        await Promise.all(
          needsPrograms.map((client) => ensureClientProgram(client.id).catch(() => null))
        );
      }

      return clients.value;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to load clients.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingClients.value = false;
    }
  }

  async function createClient(payload) {
    isLoadingClients.value = true;
    setLastError("");
    try {
      const body = serialiseClient(payload);
      const { data } = await api.post("/clients", body);
      const normalised = normaliseClient({ ...data, programs: [] }, payload);
      clients.value = [normalised, ...clients.value];
      await ensureClientProgram(normalised.id).catch(() => {});
      return normalised;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create client.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingClients.value = false;
    }
  }

  async function updateClient(clientId, payload) {
    if (!clientId) return null;
    isLoadingClients.value = true;
    setLastError("");
    try {
      const body = serialiseClient(payload);
      const { data } = await api.put(`/clients/${clientId}`, body);
      const previous = clients.value.find((client) => client.id === clientId);
      const updated = normaliseClient(data, previous);
      const index = clients.value.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        clients.value.splice(index, 1, updated);
      }
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update client.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingClients.value = false;
    }
  }

  async function deleteClient(clientId) {
    if (!clientId) return;
    isLoadingClients.value = true;
    setLastError("");
    try {
      await api.delete(`/clients/${clientId}`);
      clients.value = clients.value.filter((client) => client.id !== clientId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete client.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingClients.value = false;
    }
  }

  async function fetchFoods({ force = false } = {}) {
    isLoadingFoods.value = true;
    setLastError("");
    try {
      const { data } = await api.get("/fooditems");
      foods.value = data.map((doc) => normaliseFood(doc));
      return foods.value;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to load foods.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingFoods.value = false;
    }
  }

  async function fetchMeals({ force = false } = {}) {
    isLoadingMeals.value = true;
    setLastError("");
    try {
      const { data } = await api.get("/meals");
      meals.value = data.map((doc) => normaliseMeal(doc));
      return meals.value;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to load meals.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingMeals.value = false;
    }
  }

  async function createMealTemplate(payload) {
    isLoadingMeals.value = true;
    setLastError("");
    try {
      const body = serialiseMeal(payload);
      const { data } = await api.post("/meals", body);
      const normalised = normaliseMeal(data);
      meals.value = [normalised, ...meals.value];
      return normalised;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create meal.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingMeals.value = false;
    }
  }

  async function updateMealTemplate(mealId, payload) {
    if (!mealId) return null;
    isLoadingMeals.value = true;
    setLastError("");
    try {
      const body = serialiseMeal(payload);
      const { data } = await api.put(`/meals/${mealId}`, body);
      const updated = normaliseMeal(data);
      const index = meals.value.findIndex((meal) => meal.id === mealId);
      if (index !== -1) {
        meals.value.splice(index, 1, updated);
      }
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update meal.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingMeals.value = false;
    }
  }

  async function deleteMealTemplate(mealId) {
    if (!mealId) return;
    isLoadingMeals.value = true;
    setLastError("");
    try {
      await api.delete(`/meals/${mealId}`);
      meals.value = meals.value.filter((meal) => meal.id !== mealId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete meal.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingMeals.value = false;
    }
  }

  async function createFood(payload) {
    isLoadingFoods.value = true;
    setLastError("");
    try {
      const body = serialiseFood(payload);
      const { data } = await api.post("/fooditems", body);
      const normalised = normaliseFood(data);
      foods.value = [normalised, ...foods.value];
      return normalised;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create food item.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingFoods.value = false;
    }
  }

  async function updateFood(foodId, payload) {
    if (!foodId) return null;
    isLoadingFoods.value = true;
    setLastError("");
    try {
      const body = serialiseFood(payload);
      const { data } = await api.put(`/fooditems/${foodId}`, body);
      const updated = normaliseFood(data);
      const index = foods.value.findIndex((food) => food.id === foodId);
      if (index !== -1) {
        foods.value.splice(index, 1, updated);
      }
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update food item.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingFoods.value = false;
    }
  }

  async function deleteFood(foodId) {
    if (!foodId) return;
    isLoadingFoods.value = true;
    setLastError("");
    try {
      await api.delete(`/fooditems/${foodId}`);
      foods.value = foods.value.filter((food) => food.id !== foodId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete food item.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingFoods.value = false;
    }
  }

  async function fetchRecipes({ force = false } = {}) {
    isLoadingRecipes.value = true;
    setLastError("");
    try {
      const { data } = await api.get("/recipes");
      recipes.value = data.map((doc) => normaliseRecipe(doc));
      return recipes.value;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to load recipes.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingRecipes.value = false;
    }
  }

  async function createRecipe(payload) {
    isLoadingRecipes.value = true;
    setLastError("");
    try {
      const body = serialiseRecipe(payload);
      const { data } = await api.post("/recipes", body);
      const normalised = normaliseRecipe(data);
      recipes.value = [normalised, ...recipes.value];
      return normalised;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create recipe.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingRecipes.value = false;
    }
  }

  async function updateRecipe(recipeId, payload) {
    if (!recipeId) return null;
    isLoadingRecipes.value = true;
    setLastError("");
    try {
      const body = serialiseRecipe(payload);
      const { data } = await api.put(`/recipes/${recipeId}`, body);
      const updated = normaliseRecipe(data);
      const index = recipes.value.findIndex((recipe) => recipe.id === recipeId);
      if (index !== -1) {
        recipes.value.splice(index, 1, updated);
      }
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to update recipe.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingRecipes.value = false;
    }
  }

  async function deleteRecipe(recipeId) {
    if (!recipeId) return;
    isLoadingRecipes.value = true;
    setLastError("");
    try {
      await api.delete(`/recipes/${recipeId}`);
      recipes.value = recipes.value.filter((recipe) => recipe.id !== recipeId);
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to delete recipe.";
      setLastError(message);
      throw error;
    } finally {
      isLoadingRecipes.value = false;
    }
  }
  async function getProgramByClientId(clientId) {
    const client = clients.value.find((c) => c.id === clientId);
    if (!client) return null;

    if (!Array.isArray(client.programs) || client.programs.length === 0) {
      try {
        return await ensureClientProgram(clientId);
      } catch (error) {
        return null;
      }
    }

    const structured = ensureProgramStructure(client.programs[0]);
    client.programs.splice(0, 1, structured);
    return structured;
  }

  async function updateProgram(updatedProgram) {
    if (!updatedProgram) return null;
    const client = clients.value.find((c) => c.id === updatedProgram.clientId);
    if (!client) return null;

    if (!Array.isArray(client.programs)) {
      client.programs = [];
    }

    const structured = ensureProgramStructure(updatedProgram);
    const previousId = structured.id;
    const index = client.programs.findIndex((p) => p.id === previousId);

    if (index === -1) {
      client.programs.push(structured);
    } else {
      client.programs.splice(index, 1, structured);
    }

    try {
      const saved = await persistProgram(structured);
      if (saved) {
        const replaceIndex = client.programs.findIndex((p) => p.id === previousId);
        if (replaceIndex !== -1) {
          client.programs.splice(replaceIndex, 1, saved);
        } else {
          client.programs.push(saved);
        }
        Object.assign(updatedProgram, cloneDeep(saved));
        return saved;
      }
      return structured;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to save program.";
      setLastError(message);
      throw error;
    }
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
    // collections
    clients,
    foods,
    meals,
    recipes,

    // loading flags + errors
    isLoadingClients,
    isLoadingFoods,
    isLoadingMeals,
    isLoadingRecipes,
    lastError,

    // fetch + CRUD
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    fetchFoods,
    createFood,
    updateFood,
    deleteFood,
    fetchMeals,
    createMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,

    // programs
    getProgramByClientId,
    updateProgram,
    addMealToDay,
    removeMealFromDay,
    updateMeal,
    ensureProgramIncludesDate,
    createMeal,

    // calculators/utils
    getItemDetails,
    calculateItemMacros,
    calcMealTotals,
    recalcMealTotals,
    recalcDayTotals,

    // clipboard
    mealClipboard,
    setMealClipboard,
    clearMealClipboard,
    cloneMeal,

    // misc
    resetAll,
  };
});

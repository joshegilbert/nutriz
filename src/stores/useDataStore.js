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

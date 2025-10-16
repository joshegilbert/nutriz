import { defineStore } from "pinia";
import { ref } from "vue";
import { toRaw } from "vue";
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

export const useDataStore = defineStore("data", () => {
  // ---------------------------------------------------------------------------
  //  DATA LIBRARIES
  // ---------------------------------------------------------------------------
  const foods = ref([]);

  const meals = ref([]);

  const recipes = ref([]);

  const clients = ref([]);

  const isLoadingClients = ref(false);
  const isLoadingFoods = ref(false);
  const isLoadingRecipes = ref(false);
  const lastError = ref("");

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
  function hydrateClientPrograms(clientList = clients.value) {
    for (const client of clientList) {
      if (!Array.isArray(client.programs) || client.programs.length === 0) {
        continue;
      }

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

  function normaliseClient(document, previous = null) {
    if (!document && !previous) return null;
    const existing = previous || {};
    const id = document?._id || document?.id || existing.id || createId("client");

    const dobIso = document?.dob
      ? toLocalISODate(new Date(document.dob))
      : existing.dob || "";

    const createdIso = document?.createdAt
      ? toLocalISODate(new Date(document.createdAt))
      : existing.last_active || toLocalISODate(new Date());

    const programSource = document?.programs?.length
      ? document.programs.map((program) => ensureProgramStructure(cloneDeep(program)))
      : existing.programs?.length
      ? existing.programs.map((program) => ensureProgramStructure(cloneDeep(program)))
      : [createBlankProgram({ clientId: id })];

    return {
      id,
      name: document?.name ?? existing.name ?? "",
      status: existing.status || "Active",
      email: document?.contact?.email ?? existing.email ?? "",
      phone: document?.contact?.phone ?? existing.phone ?? "",
      dob: dobIso,
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

  function setLastError(err) {
    lastError.value = err || "";
  }

  // ---------------------------------------------------------------------------
  //  ACTIONS
  // ---------------------------------------------------------------------------
  async function fetchClients({ force = false } = {}) {
    if (clients.value.length && !force) return clients.value;
    isLoadingClients.value = true;
    setLastError("");
    try {
      const { data } = await api.get("/clients");
      const mapped = data.map((doc) => normaliseClient(doc));
      hydrateClientPrograms(mapped);
      clients.value = mapped;
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
      const normalised = normaliseClient(data, payload);
      hydrateClientPrograms([normalised]);
      clients.value = [normalised, ...clients.value];
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
      hydrateClientPrograms([updated]);
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
    if (foods.value.length && !force) return foods.value;
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
    if (recipes.value.length && !force) return recipes.value;
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
    isLoadingClients,
    isLoadingFoods,
    isLoadingRecipes,
    lastError,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    fetchFoods,
    createFood,
    updateFood,
    deleteFood,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
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

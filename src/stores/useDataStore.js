import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { apiClient } from "@/services/httpClient";
import { buildProgramTemplate } from "@/utils/programBuilder";

const withId = (doc) => ({
  ...doc,
  id: doc._id?.toString?.() || doc._id,
});

export const useDataStore = defineStore("data", () => {
  const clients = ref([]);
  const foods = ref([]);
  const recipes = ref([]);
  const programs = ref([]);

  const loading = reactive({
    clients: false,
    foods: false,
    recipes: false,
    programs: false,
  });

  const errors = reactive({
    clients: "",
    foods: "",
    recipes: "",
    programs: "",
  });

  function setError(key, message) {
    errors[key] = message || "";
  }

  async function fetchClients(force = false) {
    if (clients.value.length && !force) return;
    loading.clients = true;
    setError("clients");
    try {
      const response = await apiClient.get("/clients");
      clients.value = response.data.map(withId);
    } catch (err) {
      setError("clients", err.response?.data?.message || "Failed to load clients");
      throw err;
    } finally {
      loading.clients = false;
    }
  }

  async function createClient(payload) {
    loading.clients = true;
    setError("clients");
    try {
      const response = await apiClient.post("/clients", payload);
      clients.value.unshift(withId(response.data));
      return response.data;
    } catch (err) {
      setError("clients", err.response?.data?.message || "Failed to create client");
      throw err;
    } finally {
      loading.clients = false;
    }
  }

  async function updateClient(id, payload) {
    loading.clients = true;
    setError("clients");
    try {
      const response = await apiClient.put(`/clients/${id}`, payload);
      const index = clients.value.findIndex((client) => client.id === id);
      if (index !== -1) {
        clients.value[index] = withId(response.data);
      }
      return response.data;
    } catch (err) {
      setError("clients", err.response?.data?.message || "Failed to update client");
      throw err;
    } finally {
      loading.clients = false;
    }
  }

  async function deleteClient(id) {
    loading.clients = true;
    setError("clients");
    try {
      await apiClient.delete(`/clients/${id}`);
      clients.value = clients.value.filter((client) => client.id !== id);
    } catch (err) {
      setError("clients", err.response?.data?.message || "Failed to delete client");
      throw err;
    } finally {
      loading.clients = false;
    }
  }

  async function fetchFoods(force = false) {
    if (foods.value.length && !force) return;
    loading.foods = true;
    setError("foods");
    try {
      const response = await apiClient.get("/fooditems");
      foods.value = response.data.map((food) => ({
        id: food._id?.toString?.() || food._id,
        name: food.name,
        category: food.category,
        defaultServingSize: food.defaultServingSize,
        caloriesPerServing: food.caloriesPerServing,
        proteinPerServing: food.proteinPerServing || 0,
        carbsPerServing: food.carbsPerServing || 0,
        fatPerServing: food.fatPerServing || 0,
        raw: food,
      }));
    } catch (err) {
      setError("foods", err.response?.data?.message || "Failed to load foods");
      throw err;
    } finally {
      loading.foods = false;
    }
  }

  async function createFood(payload) {
    loading.foods = true;
    setError("foods");
    try {
      const response = await apiClient.post("/fooditems", payload);
      await fetchFoods(true);
      return response.data;
    } catch (err) {
      setError("foods", err.response?.data?.message || "Failed to create food");
      throw err;
    } finally {
      loading.foods = false;
    }
  }

  async function updateFood(id, payload) {
    loading.foods = true;
    setError("foods");
    try {
      const response = await apiClient.put(`/fooditems/${id}`, payload);
      await fetchFoods(true);
      return response.data;
    } catch (err) {
      setError("foods", err.response?.data?.message || "Failed to update food");
      throw err;
    } finally {
      loading.foods = false;
    }
  }

  async function deleteFood(id) {
    loading.foods = true;
    setError("foods");
    try {
      await apiClient.delete(`/fooditems/${id}`);
      foods.value = foods.value.filter((food) => food.id !== id);
    } catch (err) {
      setError("foods", err.response?.data?.message || "Failed to delete food");
      throw err;
    } finally {
      loading.foods = false;
    }
  }

  async function fetchRecipes(force = false) {
    if (recipes.value.length && !force) return;
    loading.recipes = true;
    setError("recipes");
    try {
      const response = await apiClient.get("/recipes");
      recipes.value = response.data.map((recipe) => ({
        id: recipe._id?.toString?.() || recipe._id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients?.map((ingredient) => ({
          id: ingredient._id,
          foodItem: ingredient.foodItem,
          amount: ingredient.amount,
          quantity: ingredient.quantity,
          notes: ingredient.notes,
        })) || [],
        totals: recipe.totals || null,
        raw: recipe,
      }));
    } catch (err) {
      setError("recipes", err.response?.data?.message || "Failed to load recipes");
      throw err;
    } finally {
      loading.recipes = false;
    }
  }

  async function createRecipe(payload) {
    loading.recipes = true;
    setError("recipes");
    try {
      const response = await apiClient.post("/recipes", payload);
      await fetchRecipes(true);
      return response.data;
    } catch (err) {
      setError("recipes", err.response?.data?.message || "Failed to create recipe");
      throw err;
    } finally {
      loading.recipes = false;
    }
  }

  async function updateRecipe(id, payload) {
    loading.recipes = true;
    setError("recipes");
    try {
      const response = await apiClient.put(`/recipes/${id}`, payload);
      await fetchRecipes(true);
      return response.data;
    } catch (err) {
      setError("recipes", err.response?.data?.message || "Failed to update recipe");
      throw err;
    } finally {
      loading.recipes = false;
    }
  }

  async function deleteRecipe(id) {
    loading.recipes = true;
    setError("recipes");
    try {
      await apiClient.delete(`/recipes/${id}`);
      recipes.value = recipes.value.filter((recipe) => recipe.id !== id);
    } catch (err) {
      setError("recipes", err.response?.data?.message || "Failed to delete recipe");
      throw err;
    } finally {
      loading.recipes = false;
    }
  }

  const programsByClient = computed(() => {
    const map = new Map();
    programs.value.forEach((program) => {
      const key = program.clientId;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(program);
    });
    return map;
  });

  function normalizeProgram(program) {
    return {
      ...program,
      id: program._id?.toString?.() || program._id,
      clientId: program.client?.toString?.() || program.client,
    };
  }

  function upsertProgram(programDoc) {
    const normalized = normalizeProgram(programDoc);
    const index = programs.value.findIndex((program) => program.id === normalized.id);
    if (index === -1) {
      programs.value.push(normalized);
    } else {
      programs.value[index] = normalized;
    }
    return normalized;
  }

  async function fetchPrograms({ clientId, force = false } = {}) {
    loading.programs = true;
    setError("programs");
    try {
      const response = await apiClient.get("/programs", {
        params: clientId ? { clientId } : undefined,
      });
      if (!clientId || force) {
        programs.value = response.data.map(normalizeProgram);
      } else {
        const filtered = programs.value.filter((program) => program.clientId !== clientId);
        const fresh = response.data.map(normalizeProgram);
        programs.value = [...filtered, ...fresh];
      }
      return response.data;
    } catch (err) {
      setError("programs", err.response?.data?.message || "Failed to load programs");
      throw err;
    } finally {
      loading.programs = false;
    }
  }

  async function createProgram({ clientId, name, startDate, length, notes }) {
    loading.programs = true;
    setError("programs");
    try {
      const template = buildProgramTemplate({ clientId, startDate, length });
      const payload = {
        client: clientId,
        name,
        startDate,
        length,
        notes,
        days: template.days,
      };
      const response = await apiClient.post("/programs", payload);
      const normalized = normalizeProgram(response.data);
      programs.value.push(normalized);
      return normalized;
    } catch (err) {
      setError("programs", err.response?.data?.message || "Failed to create program");
      throw err;
    } finally {
      loading.programs = false;
    }
  }

  async function updateProgram(programId, payload) {
    loading.programs = true;
    setError("programs");
    try {
      const response = await apiClient.put(`/programs/${programId}`, payload);
      return upsertProgram(response.data);
    } catch (err) {
      setError("programs", err.response?.data?.message || "Failed to update program");
      throw err;
    } finally {
      loading.programs = false;
    }
  }

  async function deleteProgram(programId) {
    loading.programs = true;
    setError("programs");
    try {
      await apiClient.delete(`/programs/${programId}`);
      programs.value = programs.value.filter((program) => program.id !== programId);
    } catch (err) {
      setError("programs", err.response?.data?.message || "Failed to delete program");
      throw err;
    } finally {
      loading.programs = false;
    }
  }

  async function fetchProgramById(programId) {
    loading.programs = true;
    setError("programs");
    try {
      const response = await apiClient.get(`/programs/${programId}`);
      return upsertProgram(response.data);
    } catch (err) {
      setError("programs", err.response?.data?.message || "Failed to load program");
      throw err;
    } finally {
      loading.programs = false;
    }
  }

  function getProgramsForClient(clientId) {
    return programsByClient.value.get(clientId) || [];
  }

  function getProgramById(programId) {
    return programs.value.find((program) => program.id === programId);
  }

  return {
    clients,
    foods,
    recipes,
    programs,
    loading,
    errors,
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
    fetchPrograms,
    fetchProgramById,
    createProgram,
    updateProgram,
    deleteProgram,
    getProgramsForClient,
    getProgramById,
  };
});

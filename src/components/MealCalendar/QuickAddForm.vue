<template>
  <div class="quick-add-form">
    <v-text-field
      ref="searchInput"
      v-model="searchQuery"
      placeholder="Type to add item..."
      variant="outlined"
      density="compact"
      hide-details
      prepend-inner-icon="mdi-magnify"
      append-inner-icon="mdi-plus"
      @click:append-inner="handleAddClick"
      @keydown="handleKeydown"
      @focus="showDropdown = true"
      @blur="handleBlur"
    />

    <!-- Dropdown Results -->
    <v-card
      v-if="showDropdown && (hasResults || searchQuery.trim())"
      class="quick-add-dropdown"
      elevation="4"
    >
      <v-list density="compact" class="py-2">
        <!-- Recent Custom Items (when search is empty/short) -->
        <template v-if="!searchQuery.trim() || searchQuery.length < 2">
          <v-list-subheader v-if="recentCustoms.length > 0">
            Recent Custom Items
          </v-list-subheader>
          <v-list-item
            v-for="custom in recentCustoms.slice(0, 3)"
            :key="`custom-${custom.name}`"
            @click="addCustomItem(custom)"
            :class="{ active: selectedIndex === getCustomIndex(custom) }"
          >
            <template #prepend>
              <v-icon color="primary">mdi-plus-circle</v-icon>
            </template>
            <v-list-item-title>{{ custom.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ custom.macros.calories }} cal • {{ custom.macros.protein }}P /
              {{ custom.macros.carbs }}C / {{ custom.macros.fat }}F
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider v-if="recentCustoms.length > 0" class="my-2" />

          <v-list-subheader>Browse All</v-list-subheader>
          <v-list-item
            @click="showAllFoods"
            :class="{ active: selectedIndex === 0 }"
          >
            <template #prepend>
              <v-icon color="orange">mdi-food</v-icon>
            </template>
            <v-list-item-title>All Foods</v-list-item-title>
          </v-list-item>
          <v-list-item
            @click="showAllRecipes"
            :class="{ active: selectedIndex === 1 }"
          >
            <template #prepend>
              <v-icon color="blue">mdi-book-open</v-icon>
            </template>
            <v-list-item-title>All Recipes</v-list-item-title>
          </v-list-item>
          <v-list-item
            @click="showAllMeals"
            :class="{ active: selectedIndex === 2 }"
          >
            <template #prepend>
              <v-icon color="green">mdi-food-turkey</v-icon>
            </template>
            <v-list-item-title>All Saved Meals</v-list-item-title>
          </v-list-item>
        </template>

        <!-- Search Results -->
        <template v-else>
          <!-- Foods -->
          <v-list-subheader v-if="filteredFoods.length > 0">
            🍗 Foods
          </v-list-subheader>
          <v-list-item
            v-for="(food, index) in filteredFoods.slice(0, 5)"
            :key="`food-${food.id}`"
            @click="addFoodItem(food)"
            :class="{ active: selectedIndex === getFoodIndex(index) }"
          >
            <v-list-item-title>
              {{ food.brand }} {{ food.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ food.macrosPerServing.calories }} cal •
              {{ food.macrosPerServing.protein }}P /
              {{ food.macrosPerServing.carbs }}C /
              {{ food.macrosPerServing.fat }}F
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Recipes -->
          <v-list-subheader v-if="filteredRecipes.length > 0">
            📖 Recipes
          </v-list-subheader>
          <v-list-item
            v-for="(recipe, index) in filteredRecipes.slice(0, 3)"
            :key="`recipe-${recipe.id}`"
            @click="addRecipeItem(recipe)"
            :class="{ active: selectedIndex === getRecipeIndex(index) }"
          >
            <v-list-item-title>{{ recipe.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ recipe.totalMacros.calories }} cal •
              {{ recipe.totalMacros.protein }}P /
              {{ recipe.totalMacros.carbs }}C / {{ recipe.totalMacros.fat }}F
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Meals -->
          <v-list-subheader v-if="filteredMeals.length > 0">
            🍱 Saved Meals
          </v-list-subheader>
          <v-list-item
            v-for="(meal, index) in filteredMeals.slice(0, 3)"
            :key="`meal-${meal.id}`"
            @click="addMealItem(meal)"
            :class="{ active: selectedIndex === getMealIndex(index) }"
          >
            <v-list-item-title>{{ meal.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ meal.macros.calories }} cal • {{ meal.macros.protein }}P /
              {{ meal.macros.carbs }}C / {{ meal.macros.fat }}F
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Custom Item Option -->
          <v-divider v-if="hasResults" class="my-2" />
          <v-list-item
            @click="createCustomItem"
            :class="{ active: selectedIndex === getCustomCreateIndex() }"
          >
            <template #prepend>
              <v-icon color="primary">mdi-plus-circle</v-icon>
            </template>
            <v-list-item-title>
              Add "{{ searchQuery }}" as custom item
            </v-list-item-title>
          </v-list-item>
        </template>
      </v-list>
    </v-card>

    <!-- Custom Item Form -->
    <v-card v-if="showCustomForm" class="custom-item-form mt-2" elevation="2">
      <v-card-text class="py-3">
        <div class="text-subtitle-2 mb-3">Custom: {{ customItemName }}</div>
        <v-row dense>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="customQuantity"
              label="Quantity"
              type="number"
              min="0.1"
              step="0.1"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="customUnit"
              label="Unit"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field
              v-model.number="customMacros.calories"
              label="Calories"
              type="number"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field
              v-model.number="customMacros.protein"
              label="Protein"
              type="number"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="1">
            <v-text-field
              v-model.number="customMacros.carbs"
              label="Carbs"
              type="number"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="1">
            <v-text-field
              v-model.number="customMacros.fat"
              label="Fat"
              type="number"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>
        <div class="d-flex justify-end mt-3" style="gap: 8px">
          <v-btn size="small" variant="text" @click="cancelCustomForm">
            Cancel
          </v-btn>
          <v-btn size="small" color="primary" @click="saveCustomItem">
            Save
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";

const props = defineProps({
  foods: { type: Array, required: true },
  recipes: { type: Array, required: true },
  meals: { type: Array, required: true },
  mealTime: { type: String, default: "Meal" },
});

const emit = defineEmits(["add"]);

const store = useDataStore();

// State
const searchQuery = ref("");
const showDropdown = ref(false);
const selectedIndex = ref(0);
const showCustomForm = ref(false);
const customItemName = ref("");
const customQuantity = ref(1);
const customUnit = ref("serving");
const customMacros = ref({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});

const searchInput = ref(null);

// Computed
const filteredFoods = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const query = searchQuery.value.toLowerCase();
  return props.foods.filter(
    (food) =>
      food.name.toLowerCase().includes(query) ||
      food.brand.toLowerCase().includes(query)
  );
});

const filteredRecipes = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const query = searchQuery.value.toLowerCase();
  return props.recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(query)
  );
});

const filteredMeals = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const query = searchQuery.value.toLowerCase();
  return props.meals.filter((meal) => meal.name.toLowerCase().includes(query));
});

const hasResults = computed(
  () =>
    filteredFoods.value.length > 0 ||
    filteredRecipes.value.length > 0 ||
    filteredMeals.value.length > 0
);

const recentCustoms = computed(() => {
  // Get from localStorage or store
  try {
    const stored = localStorage.getItem("nutriz.recentCustoms");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
});

// Index calculations for keyboard navigation
function getFoodIndex(index) {
  return index;
}

function getRecipeIndex(index) {
  return filteredFoods.value.length + index;
}

function getMealIndex(index) {
  return filteredFoods.value.length + filteredRecipes.value.length + index;
}

function getCustomCreateIndex() {
  return (
    filteredFoods.value.length +
    filteredRecipes.value.length +
    filteredMeals.value.length
  );
}

function getCustomIndex(custom) {
  return recentCustoms.value.indexOf(custom);
}

// Methods
function handleKeydown(event) {
  if (!showDropdown.value) return;

  const totalItems = getTotalItems();

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems - 1);
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;
    case "Enter":
      event.preventDefault();
      selectCurrentItem();
      break;
    case "Escape":
      event.preventDefault();
      hideDropdown();
      break;
  }
}

function getTotalItems() {
  if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
    return recentCustoms.value.length + 3; // Recent customs + 3 browse options
  }
  return (
    filteredFoods.value.length +
    filteredRecipes.value.length +
    filteredMeals.value.length +
    1
  ); // +1 for custom create
}

function selectCurrentItem() {
  if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
    // Handle browse options
    if (selectedIndex.value < recentCustoms.value.length) {
      addCustomItem(recentCustoms.value[selectedIndex.value]);
    } else {
      const browseIndex = selectedIndex.value - recentCustoms.value.length;
      switch (browseIndex) {
        case 0:
          showAllFoods();
          break;
        case 1:
          showAllRecipes();
          break;
        case 2:
          showAllMeals();
          break;
      }
    }
  } else {
    // Handle search results
    if (selectedIndex.value < filteredFoods.value.length) {
      addFoodItem(filteredFoods.value[selectedIndex.value]);
    } else if (
      selectedIndex.value <
      filteredFoods.value.length + filteredRecipes.value.length
    ) {
      const recipeIndex = selectedIndex.value - filteredFoods.value.length;
      addRecipeItem(filteredRecipes.value[recipeIndex]);
    } else if (
      selectedIndex.value <
      filteredFoods.value.length +
        filteredRecipes.value.length +
        filteredMeals.value.length
    ) {
      const mealIndex =
        selectedIndex.value -
        filteredFoods.value.length -
        filteredRecipes.value.length;
      addMealItem(filteredMeals.value[mealIndex]);
    } else {
      createCustomItem();
    }
  }
}

function handleBlur() {
  // Delay hiding to allow clicks on dropdown items
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}

function hideDropdown() {
  showDropdown.value = false;
  selectedIndex.value = 0;
}

function handleAddClick() {
  if (searchQuery.value.trim()) {
    createCustomItem();
  } else {
    showDropdown.value = !showDropdown.value;
  }
}

// Add item methods
function addFoodItem(food) {
  const item = {
    type: "food",
    sourceId: food.id,
    name: food.name,
    amount: 1,
    unit: food.servingUnit || "serving",
    macros: { ...food.macrosPerServing },
    macrosSource: "auto",
  };

  emit("add", item);
  clearAndFocus();
}

function addRecipeItem(recipe) {
  const item = {
    type: "recipe",
    sourceId: recipe.id,
    name: recipe.name,
    amount: 1,
    unit: "serving",
    macros: { ...recipe.totalMacros },
    macrosSource: "auto",
  };

  emit("add", item);
  clearAndFocus();
}

function addMealItem(meal) {
  const item = {
    type: "meal",
    sourceId: meal.id,
    name: meal.name,
    amount: 1,
    unit: "serving",
    macros: { ...meal.macros },
    macrosSource: "auto",
  };

  emit("add", item);
  clearAndFocus();
}

function addCustomItem(custom) {
  const item = {
    type: "custom",
    sourceId: null,
    name: custom.name,
    amount: 1,
    unit: custom.defaultUnit || "serving",
    macros: { ...custom.macros },
    macrosSource: "overridden",
  };

  emit("add", item);
  clearAndFocus();
}

function createCustomItem() {
  customItemName.value = searchQuery.value.trim();
  customQuantity.value = 1;
  customUnit.value = "serving";
  customMacros.value = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  showCustomForm.value = true;
  hideDropdown();
}

function saveCustomItem() {
  const item = {
    type: "custom",
    sourceId: null,
    name: customItemName.value,
    amount: customQuantity.value,
    unit: customUnit.value,
    macros: { ...customMacros.value },
    macrosSource: "overridden",
  };

  // Save to recent customs
  saveToRecentCustoms(item);

  emit("add", item);
  cancelCustomForm();
  clearAndFocus();
}

function cancelCustomForm() {
  showCustomForm.value = false;
  customItemName.value = "";
}

function clearAndFocus() {
  searchQuery.value = "";
  selectedIndex.value = 0;
  focusInput();
}

// Browse methods
function showAllFoods() {
  // Could emit event to show full foods list
  console.log("Show all foods");
  hideDropdown();
}

function showAllRecipes() {
  console.log("Show all recipes");
  hideDropdown();
}

function showAllMeals() {
  console.log("Show all meals");
  hideDropdown();
}

// Recent customs management
function saveToRecentCustoms(item) {
  try {
    const customs = [...recentCustoms.value];
    const existing = customs.find((c) => c.name === item.name);

    if (existing) {
      // Update existing
      Object.assign(existing, {
        macros: item.macros,
        defaultUnit: item.unit,
        lastUsed: new Date().toISOString(),
      });
    } else {
      // Add new
      customs.unshift({
        name: item.name,
        macros: item.macros,
        defaultUnit: item.unit,
        lastUsed: new Date().toISOString(),
      });
    }

    // Keep only last 20
    const limited = customs.slice(0, 20);
    localStorage.setItem("nutriz.recentCustoms", JSON.stringify(limited));
  } catch (error) {
    console.error("Failed to save recent custom:", error);
  }
}

// Watch for search changes to reset selection
watch(searchQuery, () => {
  selectedIndex.value = 0;
});

function focusInput() {
  nextTick(() => {
    const component = searchInput.value;
    if (component?.focus) {
      component.focus();
      return;
    }
    const inputEl = component?.$el?.querySelector("input");
    inputEl?.focus();
  });
}

defineExpose({
  focus: focusInput,
});
</script>

<style scoped>
.quick-add-form {
  position: relative;
}

.quick-add-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.custom-item-form {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.v-list-item.active {
  background-color: rgb(var(--v-theme-primary-lighten-4));
}

.v-list-item:hover {
  background-color: rgb(var(--v-theme-primary-lighten-5));
}
</style>

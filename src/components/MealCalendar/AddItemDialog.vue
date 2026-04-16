<template>
  <v-dialog v-model="localModel" max-width="900px" persistent scrollable>
    <v-card>
      <!-- HEADER -->
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <v-icon left class="mr-2">mdi-plus-box</v-icon>
          <span class="text-h6 font-weight-medium">Add Item to {{ mealTime }}</span>
        </div>
        <div v-if="selectedItem" class="text-caption text-grey">
          Cal: <b>{{ macros.calories.toFixed(0) }}</b> ·
          P: <b>{{ macros.protein.toFixed(0) }}</b>g ·
          C: <b>{{ macros.carbs.toFixed(0) }}</b>g ·
          F: <b>{{ macros.fat.toFixed(0) }}</b>g
        </div>
      </v-card-title>

      <v-divider />

      <!-- MAIN CONTENT -->
      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="6">
              <!-- TABS -->
              <v-tabs v-model="selectedTab" grow>
                <v-tab value="food">Foods</v-tab>
                <v-tab value="recipe">Recipes</v-tab>
                <v-tab value="meal">Meals</v-tab>
                <v-tab value="custom">Custom</v-tab>
              </v-tabs>

              <!-- SEARCH + SELECTION -->
              <v-window v-model="selectedTab">
                <!-- FOOD TAB -->
                <v-window-item value="food">
                  <v-text-field
                    v-model="searchQuery"
                    label="Search Foods..."
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    hide-details
                    class="mt-3"
                  />
                  <v-list dense class="item-list">
                    <v-list-item
                      v-for="item in filteredFoods"
                      :key="item.id"
                      @click="selectItem(item, 'food')"
                      :class="{ active: selectedItem?.id === item.id }"
                    >
                      <v-list-item-title>{{ item.brand }} {{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ item.macrosPerServing.calories }} Cal / {{ item.macrosPerServing.protein }}P / {{ item.macrosPerServing.carbs }}C / {{ item.macrosPerServing.fat }}F
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <div v-if="selectedItem?.type === 'food'" class="mt-2">
                    <v-select
                      v-model="selectedServing"
                      :items="getServingOptions(selectedItem)"
                      label="Serving Size"
                      density="compact"
                      clearable
                      hide-details
                      hint="Select a serving size or enter custom amount below"
                      persistent-hint
                    />
                  </div>
                </v-window-item>

                <!-- RECIPE TAB -->
                <v-window-item value="recipe">
                  <v-list dense>
                    <v-list-item
                      v-for="recipe in recipes"
                      :key="recipe.id"
                      @click="selectItem(recipe, 'recipe')"
                      :class="{ active: selectedItem?.id === recipe.id }"
                    >
                      <v-list-item-title>{{ recipe.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ getLibraryMacros('recipe', recipe).calories.toFixed(0) }} Cal ·
                        {{ getLibraryMacros('recipe', recipe).protein.toFixed(0) }}P /
                        {{ getLibraryMacros('recipe', recipe).carbs.toFixed(0) }}C /
                        {{ getLibraryMacros('recipe', recipe).fat.toFixed(0) }}F
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-window-item>

                <!-- MEAL TAB -->
                <v-window-item value="meal">
                  <v-list dense>
                    <v-list-item
                      v-for="meal in meals"
                      :key="meal.id"
                      @click="selectItem(meal, 'meal')"
                      :class="{ active: selectedItem?.id === meal.id }"
                    >
                      <v-list-item-title>{{ meal.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ getLibraryMacros('meal', meal).calories.toFixed(0) }} Cal ·
                        {{ getLibraryMacros('meal', meal).protein.toFixed(0) }}P /
                        {{ getLibraryMacros('meal', meal).carbs.toFixed(0) }}C /
                        {{ getLibraryMacros('meal', meal).fat.toFixed(0) }}F
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-window-item>

                <!-- CUSTOM TAB -->
                <v-window-item value="custom">
                  <v-text-field
                    v-model="customName"
                    label="Custom Item Name"
                    variant="outlined"
                    density="compact"
                    class="mt-3"
                  />
                </v-window-item>
              </v-window>
            </v-col>

            <!-- DETAILS + OVERRIDE -->
            <v-col cols="12" md="6">
              <div v-if="!selectedItem && selectedTab !== 'custom'" class="text-grey text-center mt-8">
                Select an item to view details
              </div>

              <div v-else>
                <v-text-field
                  v-model.number="quantity"
                  label="Quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mb-3"
                />

                <!-- Macro override -->
                <v-btn
                  variant="text"
                  prepend-icon="mdi-tune"
                  size="small"
                  @click="showOverrides = !showOverrides"
                  class="mb-1"
                >
                  {{ showOverrides ? 'Hide' : 'Show' }} Macro Overrides
                </v-btn>

                <v-expand-transition>
                  <div v-if="showOverrides" class="pa-2 bg-grey-lighten-4 rounded-lg mb-3">
                    <v-row dense>
                      <v-col><v-text-field v-model.number="macros.calories" label="Calories" type="number" density="compact" /></v-col>
                      <v-col><v-text-field v-model.number="macros.protein" label="Protein (g)" type="number" density="compact" /></v-col>
                      <v-col><v-text-field v-model.number="macros.carbs" label="Carbs (g)" type="number" density="compact" /></v-col>
                      <v-col><v-text-field v-model.number="macros.fat" label="Fat (g)" type="number" density="compact" /></v-col>
                    </v-row>
                  </div>
                </v-expand-transition>

                <!-- Totals -->
                <v-card variant="outlined" class="pa-3 bg-grey-lighten-4">
                  <div class="d-flex justify-space-between">
                    <div>Calories: <b>{{ macros.calories.toFixed(0) }}</b></div>
                    <div>Protein: <b>{{ macros.protein.toFixed(0) }}</b>g</div>
                    <div>Carbs: <b>{{ macros.carbs.toFixed(0) }}</b>g</div>
                    <div>Fat: <b>{{ macros.fat.toFixed(0) }}</b>g</div>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!isValid"
          @click="handleAddItem"
        >
          Add to {{ mealTime }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { getSuggestedUnits } from "@/utils/unitConverter";

const store = useDataStore();
const props = defineProps({
  modelValue: Boolean,
  mealTime: String,
  foods: Array,
  recipes: Array,
  meals: Array,
});
const emit = defineEmits(["update:modelValue", "add"]);

const localModel = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const selectedTab = ref("food");
const searchQuery = ref("");
const selectedItem = ref(null);
const selectedServing = ref('');
const customName = ref("");
const quantity = ref(1);
const showOverrides = ref(false);

const macros = ref({ calories: 0, protein: 0, carbs: 0, fat: 0 });

const filteredFoods = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return props.foods;
  return props.foods.filter((f) =>
    [f.name, f.brand].some((x) => x?.toLowerCase().includes(q))
  );
});

const isValid = computed(() => {
  return (
    (selectedItem.value || (selectedTab.value === "custom" && customName.value)) &&
    quantity.value > 0
  );
});

watch(selectedServing, () => {
  if (!selectedItem.value || selectedItem.value.type !== 'food' || showOverrides.value) return;
  const food = store.getItemDetails('food', selectedItem.value.id);
  macros.value = calcFoodMacros(food, quantity.value || 1, selectedServing.value);
});

function getLibraryMacros(type, entity) {
  if (!entity) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return store.calculateItemMacros(type, entity.id, 1);
}

// --- Select and calculate macros ---
function selectItem(item, type) {
  selectedItem.value = { ...item, type };
  showOverrides.value = false;
  if (type === "custom") {
    macros.value = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return;
  }
  if (type === 'food') {
    // default serving selection
    const food = store.getItemDetails('food', item.id);
    const list = (food?.servings || []).map((s) => s.label).filter(Boolean);
    selectedServing.value = list[0] || '';
    macros.value = calcFoodMacros(food, quantity.value || 1, selectedServing.value);
  } else {
    macros.value = store.calculateItemMacros(type, item.id, quantity.value || 1);
  }
}

watch(quantity, () => {
  if (!selectedItem.value || showOverrides.value) return;
  if (selectedItem.value.type === 'food') {
    const food = store.getItemDetails('food', selectedItem.value.id);
    macros.value = calcFoodMacros(food, quantity.value || 1, selectedServing.value);
  } else {
    macros.value = store.calculateItemMacros(selectedItem.value.type, selectedItem.value.id, quantity.value || 1);
  }
});
watch(showOverrides, (next) => {
  if (!next && selectedItem.value && selectedItem.value.type !== "custom") {
    macros.value = store.calculateItemMacros(
      selectedItem.value.type,
      selectedItem.value.id,
      quantity.value || 1
    );
  }
});

// --- Handle add ---
function handleAddItem() {
  const type = selectedTab.value;
  const isCustom = type === "custom";
  const itemRecord = selectedItem.value;

  const result = {
    type: isCustom ? "custom" : type,
    sourceId: isCustom ? null : itemRecord?.id ?? null,
    name: isCustom ? customName.value.trim() : itemRecord?.name,
    amount: quantity.value,
    unit: type === 'food' ? (selectedServing.value || resolveUnit(itemRecord)) : resolveUnit(isCustom ? null : itemRecord),
    notes: "",
    macros: { ...macros.value },
    macrosSource: showOverrides.value || isCustom ? "overridden" : "auto",
  };

  const newItem = {
    ...result,
  };
  emit("add", newItem);
  closeDialog();
}

function resolveUnit(item) {
  if (!item) return "";
  if (item.servingUnit) return item.servingUnit;
  if (item.defaultServingSize) return item.defaultServingSize;
  return "";
}

function calcFoodMacros(food, amount, unitLabel) {
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (unitLabel && (food.servings || []).length && (food.gramsPerServing || 0) > 0) {
    const perGram = {
      calories: (food.macrosPerServing.calories || 0) / food.gramsPerServing,
      protein: (food.macrosPerServing.protein || 0) / food.gramsPerServing,
      carbs: (food.macrosPerServing.carbs || 0) / food.gramsPerServing,
      fat: (food.macrosPerServing.fat || 0) / food.gramsPerServing,
    };
    const target = (food.servings || []).find((s) => s.label === unitLabel);
    if (target && target.grams > 0) {
      const gramsTotal = target.grams * (amount || 1);
      return {
        calories: perGram.calories * gramsTotal,
        protein: perGram.protein * gramsTotal,
        carbs: perGram.carbs * gramsTotal,
        fat: perGram.fat * gramsTotal,
      };
    }
  }
  return store.calculateItemMacros('food', food.id, amount || 1);
}

function getServingOptions(item) {
  if (!item || item.type !== 'food') return [];
  
  const food = store.getItemDetails('food', item.id);
  if (!food) return [];
  
  // Get existing servings
  const existingServings = (food.servings || []).map(s => s.label).filter(Boolean);
  
  // Get suggested units based on category
  const suggested = getSuggestedUnits(food.category || '');
  const suggestedLabels = suggested.map(u => {
    // Format: "1 cup" or "1 oz"
    return `1 ${u.label}`;
  });
  
  // Combine and deduplicate
  const all = [...existingServings, ...suggestedLabels];
  return [...new Set(all)];
}

function closeDialog() {
  localModel.value = false;
  selectedItem.value = null;
  selectedServing.value = '';
  customName.value = "";
  quantity.value = 1;
  showOverrides.value = false;
}
</script>

<style scoped>
.item-list {
  max-height: 400px;
  overflow-y: auto;
}
.item-list .v-list-item.active {
  background-color: #e8f1ff;
}
</style>

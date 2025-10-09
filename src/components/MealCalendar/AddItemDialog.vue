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
                        {{ getRecipeMacros(recipe).calories.toFixed(0) }} Cal ·
                        {{ getRecipeMacros(recipe).protein.toFixed(0) }}P /
                        {{ getRecipeMacros(recipe).carbs.toFixed(0) }}C /
                        {{ getRecipeMacros(recipe).fat.toFixed(0) }}F
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
                      <v-list-item-subtitle>{{ meal.components?.length || 0 }} components</v-list-item-subtitle>
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

// --- Select and calculate macros ---
function selectItem(item, type) {
  selectedItem.value = { ...item, type };
  const base =
    type === "food"
      ? item.macrosPerServing
      : type === "recipe"
      ? getRecipeMacros(item)
      : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  macros.value = {
    calories: base.calories * quantity.value,
    protein: base.protein * quantity.value,
    carbs: base.carbs * quantity.value,
    fat: base.fat * quantity.value,
  };
}

watch(quantity, () => {
  if (!selectedItem.value) return;
  selectItem(selectedItem.value, selectedItem.value.type);
});

function getRecipeMacros(recipe) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  (recipe.components || []).forEach((c) => {
    const food = store.foods.find((f) => f.id === c.foodId);
    if (food) {
      totals.calories += food.macrosPerServing.calories * c.amount;
      totals.protein += food.macrosPerServing.protein * c.amount;
      totals.carbs += food.macrosPerServing.carbs * c.amount;
      totals.fat += food.macrosPerServing.fat * c.amount;
    }
  });
  return totals;
}

// --- Handle add ---
function handleAddItem() {
  const newItem = {
    id: Date.now(),
    type: selectedTab.value,
    sourceId: selectedItem.value?.id || null,
    name: selectedItem.value?.name || customName.value,
    amount: quantity.value,
    macros: macros.value,
    macrosSource: showOverrides.value ? "manual" : "auto",
  };
  emit("add", newItem);
  closeDialog();
}

function closeDialog() {
  localModel.value = false;
  selectedItem.value = null;
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

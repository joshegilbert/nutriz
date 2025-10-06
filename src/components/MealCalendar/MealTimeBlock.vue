<template>
  <v-card class="meal-time-block pa-4 rounded-lg elevation-1">
    <!-- Header -->
    <v-row align="center" class="mb-3">
      <v-col cols="auto">
        <h3 class="text-subtitle-1 font-weight-bold">{{ mealData.mealTime }}</h3>
      </v-col>

      <v-spacer />

      <v-btn
        size="small"
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="showAddDialog = true"
      >
        Add Item
      </v-btn>

      <v-btn
        size="small"
        color="primary"
        prepend-icon="mdi-content-duplicate"
        class="ml-2"
        variant="text"
        @click="duplicateMeal"
      >
        Copy
      </v-btn>
    </v-row>

    <!-- Meal Items -->
    <div v-if="mealData.items.length" class="meal-list">
      <div
        v-for="(item, idx) in mealData.items"
        :key="item.id || idx"
        class="meal-item"
      >
        <!-- Item Header -->
        <div class="item-header">
          <div class="item-name">{{ getItemName(item) }}</div>
          <div class="item-serving text-grey">{{ getServingInfo(item) }}</div>
        </div>

        <!-- Item Time Field -->
        <v-row dense class="mb-2">
          <v-col cols="6" sm="3">
            <v-text-field
              v-model="item.time"
              label="Time"
              type="time"
              density="compact"
              hide-details
              variant="outlined"
            />
          </v-col>
        </v-row>

        <!-- Item Macros -->
        <div class="item-macros">
          <v-row dense>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model.number="item.amount"
                label="Amount"
                type="number"
                hide-details
                density="compact"
                variant="outlined"
                @input="updateItemMacros(item)"
              />
            </v-col>

            <v-col cols="6" sm="2">
              <v-text-field
                v-model.number="item.macros.calories"
                label="Cal"
                type="number"
                hide-details
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6" sm="2">
              <v-text-field
                v-model.number="item.macros.protein"
                label="P"
                suffix="g"
                type="number"
                hide-details
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6" sm="2">
              <v-text-field
                v-model.number="item.macros.carbs"
                label="C"
                suffix="g"
                type="number"
                hide-details
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6" sm="2">
              <v-text-field
                v-model.number="item.macros.fat"
                label="F"
                suffix="g"
                type="number"
                hide-details
                density="compact"
                variant="outlined"
              />
            </v-col>

            <v-col cols="6" sm="1" class="text-right">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                @click="removeItem(idx)"
              />
            </v-col>
          </v-row>
        </div>

        <v-divider class="my-2" />
      </div>
    </div>

    <!-- Empty message -->
    <div v-else class="text-grey text-center pa-4">
      No items yet — click <strong>Add Item</strong> to get started.
    </div>

    <!-- Totals -->
    <div class="totals mt-3 pa-2 rounded-lg">
      <strong>Total:</strong>
      {{ totals.calories }} Cal •
      {{ totals.protein }}P /
      {{ totals.carbs }}C /
      {{ totals.fat }}F
    </div>

    <!-- Add Dialog -->
    <AddItemDialog
      v-model="showAddDialog"
      :mealTime="mealData.mealTime"
      :foods="foods"
      :recipes="recipes"
      :meals="meals"
      @add="addItem"
    />
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import AddItemDialog from "./AddItemDialog.vue";

const props = defineProps({
  mealData: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const emit = defineEmits(["updateMeal"]);
const store = useDataStore();
const showAddDialog = ref(false);

// --- Helpers ---
function getItemName(item) {
  const food = props.foods.find((f) => f.id === item.foodId);
  return food
    ? `${food.brand ? food.brand + " – " : ""}${food.name}`
    : item.name || "Unknown Item";
}

function getServingInfo(item) {
  const food = props.foods.find((f) => f.id === item.foodId);
  return food ? `${food.servingSize} ${food.servingUnit}` : "";
}

// --- Macro Logic ---
function updateItemMacros(item) {
  const food = props.foods.find((f) => f.id === item.foodId);
  if (food) {
    const amt = Number(item.amount) || 1;
    const m = food.macrosPerServing;
    item.macros = {
      calories: Math.round(m.calories * amt),
      protein: +(m.protein * amt).toFixed(1),
      carbs: +(m.carbs * amt).toFixed(1),
      fat: +(m.fat * amt).toFixed(1),
    };
  }
  store.recalcMealTotals(props.mealData);
  emit("updateMeal", props.mealData);
}

// --- Add / Remove / Duplicate ---
function addItem(newItem) {
  props.mealData.items.push({
    ...newItem,
    time: "",
    macros: newItem.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  });
  store.recalcMealTotals(props.mealData);
  emit("updateMeal", props.mealData);
}

function removeItem(idx) {
  props.mealData.items.splice(idx, 1);
  store.recalcMealTotals(props.mealData);
  emit("updateMeal", props.mealData);
}

function duplicateMeal() {
  const copy = JSON.parse(JSON.stringify(props.mealData.items));
  props.mealData.items.push(...copy);
  store.recalcMealTotals(props.mealData);
  emit("updateMeal", props.mealData);
}

// --- Watch for Macro Changes ---
watch(
  () =>
    props.mealData.items.map((i) => ({
      amount: i.amount,
      calories: i.macros?.calories,
      protein: i.macros?.protein,
      carbs: i.macros?.carbs,
      fat: i.macros?.fat,
    })),
  async () => {
    await nextTick();
    store.recalcMealTotals(props.mealData);
    emit("updateMeal", props.mealData);
  },
  { deep: true }
);

const totals = computed(() => store.calcMealTotals(props.mealData));
</script>

<style scoped>
.meal-item {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
}

.item-header {
  display: flex;
  flex-direction: column;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-name {
  font-size: 1rem;
  color: #333;
}

.item-serving {
  font-size: 0.85rem;
}

.totals {
  background: #f5f7fa;
  border: 1px solid #e0e0e0;
  text-align: right;
  font-size: 0.95rem;
}

.v-text-field {
  max-width: 100%;
}
</style>

<template>
  <div class="meal-section">
    <!-- Meal Header -->
    <div class="meal-header">
      <h4 class="meal-title">{{ mealData.mealTime }}</h4>
      <v-spacer />
    </div>

    <!-- Items -->
    <div v-if="mealData.items.length === 0" class="text-caption text-grey">
      No items
    </div>

    <div v-for="item in mealData.items" :key="item.id" class="item-container">
      <PlanItemCard
        :item="item"
        is-top-level
        @remove="removeItem(item.id)"
        @reset="resetItem(item)"
      />
    </div>

    <!-- Add Button -->
    <v-btn
      size="x-small"
      variant="text"
      prepend-icon="mdi-plus"
      class="add-btn"
      @click="addDialogVisible = true"
    >
      Add Item
    </v-btn>

    <!-- Add Item Dialog -->
    <AddItemDialog
      v-model="addDialogVisible"
      :meal-data="mealData"
      :foods="foods"
      :meals="meals"
      :recipes="recipes"
      :meal-time="mealData.mealTime"
      @add="handleAddItem"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import PlanItemCard from "../PlanItemCard.vue";
import AddItemDialog from "./AddItemDialog.vue";
import { calculateItemMacros, recalcMealTotals } from "./utils/mealHelpers";

const props = defineProps({
  mealData: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const addDialogVisible = ref(false);

function handleAddItem(newItem) {
  props.mealData.items.push(newItem);
  calculateItemMacros(newItem, props.foods, props.meals, props.recipes);
  recalcMealTotals(props.mealData);
  addDialogVisible.value = false;
}

function removeItem(id) {
  const index = props.mealData.items.findIndex((i) => i.id === id);
  if (index !== -1) props.mealData.items.splice(index, 1);
  recalcMealTotals(props.mealData);
}

function resetItem(item) {
  item.macrosSource = "auto";
  calculateItemMacros(item, props.foods, props.meals, props.recipes);
  recalcMealTotals(props.mealData);
}
</script>

<style scoped>
.meal-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 6px;
  margin-top: 8px;
}
.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.meal-title {
  font-weight: 600;
  font-size: 0.9rem;
}
.item-container {
  margin-bottom: 6px;
}
.add-btn {
  margin-top: 4px;
  align-self: flex-start;
}
</style>

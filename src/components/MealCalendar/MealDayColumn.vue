<template>
  <div class="day-column">
    <!-- Header -->
    <div class="day-header">
      <h3 class="text-subtitle-1 font-weight-bold">{{ formattedDate }}</h3>
      <p class="text-caption text-grey">{{ dayLabel }}</p>
    </div>

    <!-- Meal Sections -->
    <div
      v-for="meal in dayData.meals"
      :key="meal.mealTime"
      class="meal-block"
    >
      <MealTimeBlock
        :meal-data="meal"
        :foods="foods"
        :meals="meals"
        :recipes="recipes"
      />
    </div>

    <!-- Daily Summary -->
    <DailySummary
      :day-macros="dayData.macros"
      :macros-source="dayData.macrosSource"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { format, parseISO } from "date-fns";
import MealTimeBlock from "./MealTimeBlock.vue";
import DailySummary from "./DailySummary.vue";

const props = defineProps({
  dayData: { type: Object, required: true },
  foods: { type: Object, required: true },
  meals: { type: Object, required: true },
  recipes: { type: Object, required: true },
});

// Format header info
const formattedDate = computed(() => {
  const date = parseISO(props.dayData.date);
  return format(date, "EEE, MMM d");
});
const dayLabel = computed(() => {
  const date = parseISO(props.dayData.date);
  return format(date, "EEEE");
});
</script>

<style scoped>
.day-column {
  min-width: 250px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.day-header {
  text-align: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
  padding-bottom: 4px;
}

.meal-block {
  margin-top: 8px;
}
</style>

<template>
  <div class="day-editor-container">
    <!-- Header -->
    <div class="day-header">
      <div>
        <h2 class="text-h6 mb-1">{{ dayLabel }}</h2>
        <p class="text-caption text-grey">{{ day.date }}</p>
      </div>
      <div class="totals">
        <v-chip color="blue-lighten-4" size="small">
          Cal: {{ totals.calories }}
        </v-chip>
        <v-chip color="green-lighten-4" size="small">
          P: {{ totals.protein }}g
        </v-chip>
        <v-chip color="amber-lighten-4" size="small">
          C: {{ totals.carbs }}g
        </v-chip>
        <v-chip color="red-lighten-4" size="small">
          F: {{ totals.fat }}g
        </v-chip>
      </div>
    </div>

    <v-divider class="my-2"></v-divider>

    <!-- Meal Sections -->
    <div class="meal-blocks">
      <MealTimeBlock
        v-for="meal in day.meals"
        :key="meal.mealTime"
        :meal-data="meal"
        :foods="foods"
        :meals="meals"
        :recipes="recipes"
      />
    </div>

    <v-divider class="my-3"></v-divider>

    <!-- Summary Footer -->
    <DailySummary :day="day" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { format } from "date-fns";
import MealTimeBlock from "./MealTimeBlock.vue";
import DailySummary from "./DailySummary.vue";

const props = defineProps({
  day: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

// --- Format readable label ---
const dayLabel = computed(() => format(new Date(props.day.date), "EEEE, MMMM d"));

// --- Calculate totals ---
const totals = computed(() => {
  return props.day.meals.reduce(
    (sum, meal) => {
      meal.items.forEach((item) => {
        sum.calories += item.macros?.calories || 0;
        sum.protein += item.macros?.protein || 0;
        sum.carbs += item.macros?.carbs || 0;
        sum.fat += item.macros?.fat || 0;
      });
      return sum;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
});
</script>

<style scoped>
.day-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

/* Header */
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.day-header h2 {
  margin: 0;
  font-weight: 600;
}

.totals {
  display: flex;
  gap: 6px;
}

/* Meal sections */
.meal-blocks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* For readability */
.text-grey {
  color: #777;
}
</style>

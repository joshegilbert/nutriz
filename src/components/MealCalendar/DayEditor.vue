<template>
  <div class="day-editor-container pa-4">
    <v-card class="elevation-2 rounded-lg" height="100%">
      <!-- Header -->
      <v-card-title class="day-header pb-3">
        <v-row align="center" no-gutters>
          <v-col cols="auto">
            <h2 class="text-h5 font-weight-bold text-grey-darken-3">{{ dayLabel }}</h2>
            <p class="text-subtitle-2 text-grey-lighten-1 font-weight-regular">{{ formattedDate }}</p>
          </v-col>

          <v-spacer></v-spacer>

          <!-- Totals preview in header -->
          <v-col cols="auto" class="d-none d-md-flex">
            <div class="totals-grid">
              <div v-for="(value, key) in day.macros" :key="key" class="macro-item">
                <span class="macro-label">{{ key }}</span>
                <v-chip color="primary" size="small" text-color="white">{{ value }}</v-chip>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Meal Sections -->
      <v-card-text class="meal-blocks pa-4">
        <MealTimeBlock
          v-for="meal in day.meals"
          :key="meal.mealTime"
          :meal-data="meal"
          :foods="foods"
          :meals="meals"
          :recipes="recipes"
          @updateMeal="updateMeal"
        />
      </v-card-text>

      <v-divider></v-divider>

      <!-- Summary Footer -->
      <v-card-actions class="pa-4">
        <DailySummary :day="day" @updateDay="handleSummaryUpdate" />
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { format } from "date-fns";
import { useDataStore } from "@/stores/useDataStore";
import MealTimeBlock from "./MealTimeBlock.vue";
import DailySummary from "./DailySummary.vue";

const props = defineProps({
  day: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const emit = defineEmits(["updateDay"]);

const store = useDataStore();

// --- Labels ---
const dayLabel = computed(() => format(new Date(props.day.date), "EEEE"));
const formattedDate = computed(() => format(new Date(props.day.date), "MMMM d, yyyy"));

// --- Handle meal updates ---
function updateMeal(updatedMeal) {
  const updatedDay = { ...props.day };

  const idx = updatedDay.meals.findIndex((m) => m.mealTime === updatedMeal.mealTime);
  if (idx !== -1) updatedDay.meals[idx] = updatedMeal;

  // Recalculate totals (only if auto)
  if (updatedDay.macrosSource === "auto") {
    store.recalcDayTotals(updatedDay);
  }

  emit("updateDay", updatedDay);
}

// --- Handle manual summary updates ---
function handleSummaryUpdate(updatedDay) {
  emit("updateDay", updatedDay);
}
</script>

<style scoped>
.day-editor-container {
  background-color: #f7f8fc;
  height: 100%;
  overflow-y: auto;
}

.day-header {
  border-bottom: 1px solid #e0e0e0;
}

.totals-grid {
  display: flex;
  gap: 16px;
  align-items: center;
}

.macro-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-transform: capitalize;
}

.macro-label {
  font-size: 0.7rem;
  color: #555;
  font-weight: 500;
}

.meal-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>

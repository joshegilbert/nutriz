<template>
  <v-card class="day-summary elevation-2 rounded-lg pa-4 mt-6">
    <v-card-title class="text-h6 font-weight-medium">
      Daily Totals
    </v-card-title>

    <v-divider class="my-2" />

    <v-row dense>
      <v-col cols="6" sm="3">
        <div class="metric">
          <div class="label">Calories</div>
          <div class="value">{{ macros.calories }}</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="metric">
          <div class="label">Protein</div>
          <div class="value">{{ macros.protein }} g</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="metric">
          <div class="label">Carbs</div>
          <div class="value">{{ macros.carbs }} g</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="metric">
          <div class="label">Fat</div>
          <div class="value">{{ macros.fat }} g</div>
        </div>
      </v-col>
    </v-row>
  </v-card>
 </template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  day: { type: Object, required: true },
});

// Read-only totals; DayEditor/Store handle recalculation
const macros = computed(() => props.day?.macros || { calories: 0, protein: 0, carbs: 0, fat: 0 });
</script>

<style scoped>
.day-summary {
  background: #fafafa;
}

.metric .label {
  font-size: 0.8rem;
  color: #666;
}

.metric .value {
  font-weight: 600;
  font-size: 1.05rem;
}

.v-card-title {
  align-items: center;
}

.v-divider {
  margin-top: 8px;
  margin-bottom: 12px;
}
</style>

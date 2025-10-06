<template>
  <div class="daily-summary" :class="{ overridden: macrosSource === 'overridden' }">
    <v-divider class="my-2" />

    <!-- Title -->
    <div class="summary-header">
      <span class="text-subtitle-2 font-weight-medium">Daily Totals</span>
      <v-btn
        v-if="macrosSource === 'overridden'"
        icon="mdi-restore"
        size="x-small"
        variant="text"
        color="primary"
        @click="emit('reset')"
        title="Reset to auto-calculated totals"
      />
    </div>

    <!-- Macro Inputs -->
    <v-row dense>
      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.calories"
          label="Cal"
          density="compact"
          hide-details
          type="number"
          @change="emitOverride"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.protein"
          label="Protein"
          suffix="g"
          density="compact"
          hide-details
          type="number"
          @change="emitOverride"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.carbs"
          label="Carbs"
          suffix="g"
          density="compact"
          hide-details
          type="number"
          @change="emitOverride"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.fat"
          label="Fat"
          suffix="g"
          density="compact"
          hide-details
          type="number"
          @change="emitOverride"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";

const props = defineProps({
  dayMacros: { type: Object, required: false, default: () => ({ calories: 0, protein: 0, carbs: 0, fat: 0 }) },
  macrosSource: { type: String, default: "auto" },
});

const emit = defineEmits(["override", "reset"]);

const editableMacros = reactive({
  calories: props.dayMacros?.calories ?? 0,
  protein: props.dayMacros?.protein ?? 0,
  carbs: props.dayMacros?.carbs ?? 0,
  fat: props.dayMacros?.fat ?? 0,
});

// Keep editableMacros synced when props change
watch(
  () => props.dayMacros,
  (newVal) => {
    editableMacros.calories = newVal?.calories ?? 0;
    editableMacros.protein = newVal?.protein ?? 0;
    editableMacros.carbs = newVal?.carbs ?? 0;
    editableMacros.fat = newVal?.fat ?? 0;
  },
  { deep: true }
);

function emitOverride() {
  emit("override", { ...editableMacros });
}
</script>

<style scoped>
.daily-summary {
  margin-top: 8px;
  background: #fafafa;
  border-radius: 8px;
  padding: 8px;
  transition: background-color 0.2s ease;
}

.daily-summary.overridden {
  background-color: #fffbe6; /* light yellow tint for overridden */
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
</style>

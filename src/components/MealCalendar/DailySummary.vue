<template>
  <v-card class="day-summary elevation-2 rounded-lg pa-4 mt-6">
    <!-- Header -->
    <v-card-title class="text-h6 font-weight-medium">
      Daily Totals
      <v-spacer></v-spacer>

      <!-- Reset button -->
      <v-btn
        v-if="macrosSource === 'overridden'"
        icon="mdi-restore"
        variant="text"
        size="small"
        color="primary"
        @click="resetToAuto"
        title="Reset to auto-calculated totals"
      />
    </v-card-title>

    <v-divider class="my-2" />

    <!-- Totals -->
    <v-row dense>
      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.calories"
          label="Calories"
          type="number"
          density="compact"
          hide-details
          @change="emitManualUpdate"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.protein"
          label="Protein (g)"
          type="number"
          density="compact"
          hide-details
          @change="emitManualUpdate"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.carbs"
          label="Carbs (g)"
          type="number"
          density="compact"
          hide-details
          @change="emitManualUpdate"
        />
      </v-col>

      <v-col cols="6" sm="3">
        <v-text-field
          v-model.number="editableMacros.fat"
          label="Fat (g)"
          type="number"
          density="compact"
          hide-details
          @change="emitManualUpdate"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  day: { type: Object, required: true },
});

const emit = defineEmits(["updateDay"]);

// Make editable copy of macros
const editableMacros = ref({ ...props.day.macros });
const macrosSource = ref(props.day.macrosSource || "auto");

// Watch for parent changes (sync down)
watch(
  () => props.day.macros,
  (newMacros) => {
    editableMacros.value = { ...newMacros };
    macrosSource.value = props.day.macrosSource || "auto";
  },
  { deep: true }
);

// When user manually changes a field
function emitManualUpdate() {
  macrosSource.value = "overridden";
  const updatedDay = {
    ...props.day,
    macros: { ...editableMacros.value },
    macrosSource: "overridden",
  };
  emit("updateDay", updatedDay);
}

// Reset to auto-calculated totals
function resetToAuto() {
  const updatedDay = {
    ...props.day,
    macrosSource: "auto",
  };
  emit("updateDay", updatedDay);
}
</script>

<style scoped>
.day-summary {
  background: #fafafa;
}

.v-text-field {
  font-size: 0.9rem;
}

.v-card-title {
  align-items: center;
}

.v-divider {
  margin-top: 8px;
  margin-bottom: 12px;
}
</style>

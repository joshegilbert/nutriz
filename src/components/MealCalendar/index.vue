<template>
  <v-container fluid class="pa-4 meal-calendar" :client-id="clientId">
    <v-row no-gutters>
      <!-- Sidebar: week days -->
      <v-col cols="12" md="3">
        <WeekSidebar
          v-if="program"
          :program="program"
          :selected-date="selectedDay"
          @selectDay="selectDay"
          @updateProgram="updateProgram"
        />
      </v-col>

      <!-- Main Editor -->
      <v-col cols="12" md="9">
        <DayEditor
          v-if="selectedDay"
          :day="selectedDay"
          :foods="foods"
          :meals="meals"
          :recipes="recipes"
          @updateDay="updateDay"
        />
        <div v-else class="text-center pa-6 text-grey">
          Select a day to begin editing
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import WeekSidebar from "./WeekSidebar.vue";
import DayEditor from "./DayEditor.vue";

// --- Props ---
const props = defineProps({
  clientId: { type: Number, required: true },
  initialDate: { type: Date, default: () => new Date() },
});

const store = useDataStore();

// --- Reactive state ---
const program = ref(null);
const selectedDay = ref(null);

// --- Load Data ---
async function loadData() {
  const data = await store.getProgramByClientId(props.clientId);
  program.value = data;

  // auto-select today's date (or first day if none)
  selectedDay.value = program.value?.days?.find(
    (d) => new Date(d.date).toDateString() === props.initialDate.toDateString()
  ) || program.value?.days?.[0];
}

loadData();

// --- Data from store ---
const foods = computed(() => store.foods);
const meals = computed(() => store.meals);
const recipes = computed(() => store.recipes);

// --- Select Day from Sidebar ---
function selectDay(day) {
  selectedDay.value = day;
}

// --- Update a Single Day ---
function updateDay(updatedDay) {
  // Find and replace the correct day in the program
  const dayIndex = program.value.days.findIndex(
    (d) => d.date === updatedDay.date
  );
  if (dayIndex !== -1) {
    program.value.days[dayIndex] = updatedDay;
  }

  // Sync with store
  store.updateProgram(program.value);

  // Keep selectedDay reactive
  selectedDay.value = updatedDay;
}

// --- Update Program (used for copy/paste) ---
function updateProgram(updatedProgram) {
  program.value = updatedProgram;
  store.updateProgram(updatedProgram);
}
</script>

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
        <div v-else class="text-center pa-6 text-grey">No day selected</div>
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
  clientId: { type: [String, Number], required: true },
  initialDate: { type: Date, default: () => new Date() },
});

const store = useDataStore();

// --- Reactive state ---
const program = ref(null);
const selectedDay = ref(null);

// --- Load Data ---
import { format as dfFormat } from "date-fns";

function loadData() {
  // Derive program synchronously from the store
  const client = (store.clients || []).find?.((c) => c.id === props.clientId) ||
    store.clients?.value?.find?.((c) => c.id === props.clientId);
  const prog = client?.programs?.[0];
  if (!prog) return;
  program.value = prog;

  const seedDate = props.initialDate || new Date();
  const target = dfFormat(seedDate, "yyyy-MM-dd");
  store.ensureProgramIncludesDate(program.value, target);
  const days = program.value?.days || [];
  selectedDay.value = days.find((d) => d.date === target) || pickNearestDay(days, target) || days[0];
}

loadData();

// If parent changes the initialDate (e.g., from Month view), sync selection
watch(
  () => props.initialDate,
  (d) => {
    if (!program.value || !d) return;
    const target = dfFormat(d, "yyyy-MM-dd");
    // Extend if needed then select
    store.ensureProgramIncludesDate(program.value, target);
    const match = program.value.days.find((day) => day.date === target);
    selectedDay.value = match || pickNearestDay(program.value.days, target) || program.value.days[0];
    // Persist program after extension
    store.updateProgram(program.value);
  }
);

function pickNearestDay(days, targetIso) {
  if (!Array.isArray(days) || days.length === 0) return null;
  // Convert ISO to comparable timestamps (local)
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const t = new Date(ty, tm - 1, td).getTime();
  let best = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const d of days) {
    const [y, m, dd] = d.date.split('-').map(Number);
    const ts = new Date(y, m - 1, dd).getTime();
    const diff = Math.abs(ts - t);
    if (diff < bestDiff) {
      best = d;
      bestDiff = diff;
    }
  }
  return best;
}

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

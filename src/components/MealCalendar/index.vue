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
          @goToday="goToToday"
          @updateProgram="updateProgram"
        />
      </v-col>

      <!-- Main Editor -->
      <v-col cols="12" md="9">
        <div class="d-flex justify-end px-2 pt-1" v-if="isSaving || savedFlash">
          <v-chip size="x-small" :color="isSaving ? 'grey' : 'success'" variant="tonal">
            {{ isSaving ? 'Saving…' : 'Saved' }}
          </v-chip>
        </div>
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
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
  // Ensure the day exists in the program; extend if needed
  if (!day?.date) return;
  const iso = day.date;
  store.ensureProgramIncludesDate(program.value, iso);
  const match = program.value.days.find((d) => d.date === iso) || day;
  selectedDay.value = match;
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
  scheduleSave();

  // Keep selectedDay reactive
  selectedDay.value = updatedDay;
}

// --- Update Program (used for copy/paste) ---
function updateProgram(updatedProgram) {
  program.value = updatedProgram;
  scheduleSave();
}

// Jump to today (using 4am day start rule)
function computeTodayIso() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const start = 4 * 60; // 04:00
  const ref = new Date(now);
  if (minutes < start) {
    ref.setDate(ref.getDate() - 1);
  }
  return dfFormat(ref, "yyyy-MM-dd");
}

async function goToToday() {
  if (!program.value) return;
  const iso = computeTodayIso();
  store.ensureProgramIncludesDate(program.value, iso);
  const match = program.value.days.find((d) => d.date === iso) || program.value.days[0];
  selectedDay.value = match;
  store.updateProgram(program.value);
}

// Optional: bind 't' to jump to today
function handleKeyDown(e) {
  const tag = (e.target?.tagName || '').toLowerCase();
  const isTyping = ['input', 'textarea'].includes(tag) || e.target?.isContentEditable;
  if (isTyping) return;
  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    goToToday();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

// Debounced auto-save with small feedback
const isSaving = ref(false);
const savedFlash = ref(false);
let saveTimeout = null;
let flashTimeout = null;

async function doSave() {
  isSaving.value = true;
  try {
    await store.updateProgram(program.value);
    savedFlash.value = true;
    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => (savedFlash.value = false), 1200);
  } finally {
    isSaving.value = false;
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    doSave();
  }, 500);
}
</script>

<template>
  <v-card class="week-sidebar elevation-1 rounded-xl pa-4">
    <!-- Week Navigation -->
    <div class="week-nav d-flex align-center justify-space-between mb-2">
      <div class="d-flex align-center" style="gap:6px;">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          density="compact"
          color="primary"
          @click="prevWeek"
        />
        <div class="text-subtitle-2 font-weight-medium text-center week-range">
          {{ weekRangeLabel }}
        </div>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          density="compact"
          color="primary"
          @click="nextWeek"
        />
      </div>
      <v-btn size="x-small" variant="tonal" color="primary" @click="goToday">
        Today
      </v-btn>
    </div>
    <v-divider class="mb-2" />

    <!-- Weekly Averages (compact) -->
    <div class="avg-grid mb-3">
      <div class="avg-item">
        <span class="label">Cal</span>
        <span class="value">{{ weeklyAverages.calories }}</span>
      </div>
      <div class="avg-item">
        <span class="label">P</span>
        <span class="value">{{ weeklyAverages.protein }}</span>
      </div>
      <div class="avg-item">
        <span class="label">C</span>
        <span class="value">{{ weeklyAverages.carbs }}</span>
      </div>
      <div class="avg-item">
        <span class="label">F</span>
        <span class="value">{{ weeklyAverages.fat }}</span>
      </div>
    </div>

    <v-divider class="mb-3" />

    <!-- Days List (Mon–Sun) -->
    <div class="day-list">
      <v-sheet
        v-for="day in visibleDays"
        :key="day.date"
        class="day-block rounded-lg pa-3 mb-3"
        :class="{ active: selectedDate?.date === day.date }"
        @click="$emit('selectDay', day)"
        elevation="0"
      >
        <div class="d-flex justify-space-between align-center mb-1">
          <div class="day-info">
            <div class="day-name">
              {{ format(localDateFromISO(day.date), "EEEE") }}
              <v-chip
                v-if="day.activeVariant && day.activeVariant !== 'A'"
                size="x-small"
                class="ml-1"
                variant="tonal"
                color="primary"
              >
                {{ day.activeVariant }}
              </v-chip>
            </div>
            <div class="day-date text-grey-darken-1">
              {{ format(localDateFromISO(day.date), "MMM d") }}
            </div>
          </div>
        </div>
        <div class="macro-line-compact">
          <span class="value">{{ day.macros?.calories ?? 0 }} kcal</span>
          <span class="sep">·</span>
          <span class="value">P{{ day.macros?.protein ?? 0 }}</span>
          <span class="sep">/</span>
          <span class="value">C{{ day.macros?.carbs ?? 0 }}</span>
          <span class="sep">/</span>
          <span class="value">F{{ day.macros?.fat ?? 0 }}</span>
          <v-spacer />
          <span class="items">{{ (day.meals || []).length }} meals</span>
        </div>
      </v-sheet>
    </div>

    
    

    <!-- Copy / Paste Controls -->
    <v-row no-gutters class="action-row">
      <v-col cols="6" class="pr-1">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-content-copy"
          size="small"
          block
          @click="copyDay"
          :disabled="!selectedDate"
        >
          Copy
        </v-btn>
      </v-col>

      <v-col cols="6" class="pl-1">
        <v-btn
          variant="flat"
          color="secondary"
          prepend-icon="mdi-content-paste"
          size="small"
          block
          @click="pasteDay"
          :disabled="!clipboardDay"
        >
          Paste
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { format, addDays, startOfWeek } from "date-fns";

const props = defineProps({
  program: { type: Object, required: true },
  selectedDate: { type: Object, required: false, default: null },
});

const emit = defineEmits(["selectDay", "updateProgram", "goToday"]);

const clipboardDay = ref(null);
const weekStartsOn = 1; // Monday
const anchorDate = ref(null);

// 🗓️ Build calendar week (Mon–Sun) from anchor
const weekDates = computed(() => {
  const anchor = anchorDate.value || new Date();
  const start = startOfWeek(anchor, { weekStartsOn });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
});

const visibleDays = computed(() => {
  const list = [];
  const all = props.program?.days || [];
  weekDates.value.forEach((d) => {
    const iso = format(d, "yyyy-MM-dd");
    const found = all.find((x) => x.date === iso);
    list.push(
      found || { date: iso, meals: [], macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, macrosSource: "auto", activeVariant: 'A' }
    );
  });
  return list;
});

// Weekly averages across visible days
const weeklyAverages = computed(() => {
  const days = visibleDays.value || [];
  const count = days.length || 1;
  const totals = days.reduce(
    (acc, d) => {
      const m = d?.macros || {};
      acc.calories += Number(m.calories || 0);
      acc.protein += Number(m.protein || 0);
      acc.carbs += Number(m.carbs || 0);
      acc.fat += Number(m.fat || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calories: Math.round(totals.calories / count),
    protein: +(totals.protein / count).toFixed(1),
    carbs: +(totals.carbs / count).toFixed(1),
    fat: +(totals.fat / count).toFixed(1),
  };
});

// 📆 Display range label
const weekRangeLabel = computed(() => {
  if (!weekDates.value.length) return "";
  const start = weekDates.value[0];
  const end = weekDates.value[weekDates.value.length - 1];
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
});

// ◀️ ▶️ Week navigation
function prevWeek() {
  const base = anchorDate.value || new Date();
  anchorDate.value = addDays(base, -7);
  if (visibleDays.value.length) emit("selectDay", visibleDays.value[0]);
}

function nextWeek() {
  const base = anchorDate.value || new Date();
  anchorDate.value = addDays(base, 7);
  if (visibleDays.value.length) emit("selectDay", visibleDays.value[0]);
}

function goToday() {
  emit("goToday");
}

// 🧩 Copy / Paste
function copyDay() {
  if (!props.selectedDate) return;
  clipboardDay.value = JSON.parse(JSON.stringify(props.selectedDate));
}

function pasteDay() {
  if (!clipboardDay.value || !props.selectedDate) return;

  const dayIndex = props.program.days.findIndex(
    (d) => d.date === props.selectedDate.date
  );
  if (dayIndex === -1) return;

  props.program.days[dayIndex].meals = JSON.parse(
    JSON.stringify(clipboardDay.value.meals)
  );
  props.program.days[dayIndex].macros = JSON.parse(
    JSON.stringify(clipboardDay.value.macros)
  );

  emit("updateProgram", props.program);
}

function localDateFromISO(iso) {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Keep the week view aligned to the externally selected day
watch(
  () => props.selectedDate?.date,
  (newDate) => {
    if (!newDate) return;
    const all = props.program?.days || [];
    anchorDate.value = localDateFromISO(newDate);
  },
  { immediate: true }
);
</script>

<style scoped>
.week-sidebar {
  width: 100%;
  max-width: 360px;
  background-color: #fafafa;
}

.week-nav {
  font-weight: 600;
  color: #333;
}

.week-range {
  flex: 1;
  text-align: center;
}

.avg-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.avg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f7fb;
  border: 1px solid #e6ebf5;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 0.85rem;
}

.avg-item .label {
  color: #6b7280;
}

.avg-item .value {
  font-weight: 600;
  color: #111827;
}

.day-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 4px;
}

.day-block {
  background-color: #fff;
  border: 1px solid #eee;
  transition: all 0.2s ease;
  cursor: pointer;
}

.day-block:hover {
  background-color: #f8faff;
  border-color: #90caf9;
}

.day-block.active {
  border-left: 4px solid #2196f3;
  background-color: #e3f2fd;
}

.day-info .day-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}

.day-info .day-date {
  font-size: 0.8rem;
}

.macro-table {
  font-size: 0.8rem;
}

.macro-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.macro-row .label {
  color: #777;
}

.macro-row .value {
  font-weight: 600;
  color: #333;
}

.macro-line-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}
.macro-line-compact .value { font-weight: 600; color: #333; }
.macro-line-compact .sep { color: #9aa0a6; }
.macro-line-compact .items { color: #6b7280; font-size: 0.78rem; }

.action-row {
  margin-top: 8px;
}
</style>

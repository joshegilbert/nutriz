<template>
  <v-card class="week-sidebar elevation-1 rounded-xl pa-4">
    <!-- Week Navigation -->
    <div class="week-nav d-flex align-center justify-space-between mb-3">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        density="compact"
        color="primary"
        @click="prevWeek"
        :disabled="currentWeekIndex === 0"
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
        :disabled="currentWeekIndex === totalWeeks - 1"
      />
    </div>

    <v-divider class="mb-3" />

    <!-- Days List -->
    <div class="day-list">
      <v-sheet
        v-for="day in visibleDays"
        :key="day.date"
        class="day-block rounded-lg pa-3 mb-3"
        :class="{ active: selectedDate?.date === day.date }"
        @click="$emit('selectDay', day)"
        elevation="0"
      >
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="day-info">
            <div class="day-name">
              {{ format(parseISO(day.date), "EEEE") }}
            </div>
            <div class="day-date text-grey-darken-1">
              {{ format(parseISO(day.date), "MMM d") }}
            </div>
          </div>
        </div>

        <v-divider class="my-2" />

        <div class="macro-table">
          <div class="macro-row">
            <span class="label">Calories</span>
            <span class="value">{{ day.macros?.calories ?? 0 }}</span>
          </div>
          <div class="macro-row">
            <span class="label">Protein</span>
            <span class="value">{{ day.macros?.protein ?? 0 }} g</span>
          </div>
          <div class="macro-row">
            <span class="label">Carbs</span>
            <span class="value">{{ day.macros?.carbs ?? 0 }} g</span>
          </div>
          <div class="macro-row">
            <span class="label">Fat</span>
            <span class="value">{{ day.macros?.fat ?? 0 }} g</span>
          </div>
        </div>
      </v-sheet>
    </div>

    <v-divider class="my-4" />

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
import { ref, computed } from "vue";
import { format, parseISO, addDays } from "date-fns";

const props = defineProps({
  program: { type: Object, required: true },
  selectedDate: { type: Object, required: false, default: null },
});

const emit = defineEmits(["selectDay", "updateProgram"]);

const clipboardDay = ref(null);
const currentWeekIndex = ref(0);
const daysPerWeek = 7;

// 🔢 Total weeks in the program
const totalWeeks = computed(() =>
  Math.ceil(props.program.days.length / daysPerWeek)
);

// 🗓️ Days shown in the current week
const visibleDays = computed(() => {
  const start = currentWeekIndex.value * daysPerWeek;
  const end = start + daysPerWeek;
  return props.program.days.slice(start, end);
});

// 📆 Display range label
const weekRangeLabel = computed(() => {
  if (!visibleDays.value.length) return "";
  const start = parseISO(visibleDays.value[0].date);
  const end = parseISO(visibleDays.value[visibleDays.value.length - 1].date);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
});

// ◀️ ▶️ Week navigation
function prevWeek() {
  if (currentWeekIndex.value > 0) currentWeekIndex.value--;
}

function nextWeek() {
  if (currentWeekIndex.value < totalWeeks.value - 1) currentWeekIndex.value++;
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

.action-row {
  margin-top: 8px;
}
</style>

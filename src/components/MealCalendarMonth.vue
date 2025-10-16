<template>
  <div class="month-calendar">
    <!-- Header -->
    <div class="calendar-header">
      <div class="nav-buttons">
        <v-btn icon="mdi-chevron-left" variant="text" @click="prevMonth"></v-btn>
        <h3 class="text-h5 font-weight-medium">{{ monthLabel }}</h3>
        <v-btn icon="mdi-chevron-right" variant="text" @click="nextMonth"></v-btn>
      </div>
      <v-btn variant="outlined" color="primary" size="small" @click="goToToday">
        Today
      </v-btn>
    </div>

    <!-- Day Names -->
    <div class="day-names">
      <div v-for="dayName in dayNames" :key="dayName" class="day-name">
        {{ dayName }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <div
        v-for="(day, idx) in calendarDays"
        :key="idx"
        class="calendar-cell"
        :class="{
          'current-month': day.isCurrentMonth,
          today: day.isToday
        }"
        @click="emit('open-week', day.date)"
      >
        <div class="cell-header">
          <span class="date" :class="{ 'text-primary': day.isToday }">
            {{ day.date.getDate() }}
          </span>
          <v-icon
            v-if="day.programDay"
            size="x-small"
            color="primary"
            title="Has Plan"
          >
            mdi-check-circle
          </v-icon>
        </div>

        <div class="cell-body">
          <div v-if="day.programDay">
            <div
              v-for="meal in day.programDay.meals"
              :key="meal.id || meal.mealTime"
              class="text-caption meal-summary"
            >
              <strong>{{ meal.name || meal.mealTime }}:</strong>
              <span v-if="(meal.items || []).length === 0" class="text-grey">–</span>
              <span v-else>{{ meal.items.length }} item(s)</span>
            </div>
          </div>
          <div v-else class="text-caption text-grey no-plan">No plan</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isToday
} from "date-fns";

const emit = defineEmits(["open-week"]);

const props = defineProps({
  clientId: { type: Number, required: true },
  programId: { type: Number, required: true }
});

const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const currentDate = ref(new Date());
const client = computed(() => clients.value.find(c => c.id === props.clientId));
const program = computed(() =>
  client.value?.programs.find(p => p.id === props.programId)
);

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate.value), { weekStartsOn: 0 });

  const days = [];
  let cur = start;
  while (cur <= end) {
    const iso = format(cur, "yyyy-MM-dd");
    const programDay = program.value?.days.find(d => d.date === iso);
    days.push({
      date: cur,
      isToday: isToday(cur),
      isCurrentMonth: isSameMonth(cur, currentDate.value),
      programDay
    });
    cur = addDays(cur, 1);
  }
  return days;
});

const monthLabel = computed(() => format(currentDate.value, "MMMM yyyy"));

function prevMonth() {
  currentDate.value = addDays(startOfMonth(currentDate.value), -1);
}
function nextMonth() {
  currentDate.value = addDays(endOfMonth(currentDate.value), 1);
}
function goToToday() {
  currentDate.value = new Date();
}
</script>

<style scoped>
.month-calendar {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Header */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Day Names Row */
.day-names {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 600;
  color: #666;
}

/* Calendar Grid */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-cell {
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 6px;
  height: 130px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
}

.calendar-cell:hover {
  transform: scale(1.02);
  background-color: #fff;
}

.current-month {
  background-color: #fff;
}

.today {
  border: 2px solid #1976d2;
}

.cell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.cell-body {
  font-size: 0.8rem;
  line-height: 1.2;
}

.no-plan {
  font-style: italic;
  color: #999;
}
</style>

<template>
  <div class="month-calendar">
    <!-- Header -->
    <div class="calendar-header">
      <div class="nav-buttons">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          @click="prevMonth"
        ></v-btn>
        <h3 class="text-h5 font-weight-medium">{{ monthLabel }}</h3>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          @click="nextMonth"
        ></v-btn>
      </div>
      <v-btn variant="outlined" color="primary" size="small" @click="goToToday">
        Today
      </v-btn>
    </div>

    <!-- Legend -->
    <div class="legend">
      <v-chip size="x-small" class="kcal-chip" variant="flat">kcal</v-chip>
      <v-chip size="x-small" class="p-chip" variant="tonal">P</v-chip>
      <v-chip size="x-small" class="c-chip" variant="tonal">C</v-chip>
      <v-chip size="x-small" class="f-chip" variant="tonal">F</v-chip>
    </div>

    <!-- Day Names -->
    <div class="day-names">
      <div v-for="dayName in dayNames" :key="dayName" class="day-name">
        {{ dayName }}
      </div>
    </div>

    <!-- Selection Controls -->
    <div v-if="getSelectedIndices.length > 0" class="selection-controls mb-2">
      <v-chip color="primary" variant="tonal" class="mr-2">
        {{ getSelectedIndices.length }} day{{ getSelectedIndices.length !== 1 ? 's' : '' }} selected
      </v-chip>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-content-copy"
        @click="copySelectedDays"
      >
        Copy
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-content-paste"
        :disabled="!clipboardDays.length"
        @click="showPasteDialog = true"
      >
        Paste
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-close"
        @click="clearSelection"
      >
        Clear
      </v-btn>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <div
        v-for="(day, idx) in calendarDays"
        :key="idx"
        class="calendar-cell"
        :class="{
          'current-month': day.isCurrentMonth,
          today: day.isToday,
          selected: isSelected(idx),
          'drag-over': dragOverIndex === idx,
        }"
        :draggable="day.isCurrentMonth && day.programDay"
        @dragstart="onDragStart($event, idx)"
        @dragover.prevent="onDragOver($event, idx)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, idx)"
        @click="handleCellClick($event, idx, day)"
      >
        <div class="cell-header">
          <span class="date" :class="{ 'text-primary': day.isToday }">
            {{ day.date.getDate() }}
          </span>
          <div class="cell-indicators">
            <v-tooltip v-if="day.programDay?.notes" location="top">
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  size="x-small"
                  color="primary"
                  class="notes-indicator"
                >
                  mdi-note-text
                </v-icon>
              </template>
              <div class="notes-preview">
                {{ truncateNotes(day.programDay.notes) }}
              </div>
            </v-tooltip>
            <v-icon
              v-if="day.programDay"
              size="x-small"
              color="primary"
              title="Has Plan"
            >
              mdi-check-circle
            </v-icon>
          </div>
        </div>

        <div class="cell-body">
          <div v-if="day.programDay">
            <div class="macro-chips">
              <v-chip
                size="x-small"
                density="compact"
                class="kcal-chip mini-chip"
                variant="flat"
              >
                {{ Math.round(day.programDay.macros?.calories || 0) }}
              </v-chip>
              <v-chip
                v-if="
                  day.programDay.activeVariant &&
                  day.programDay.activeVariant !== 'A'
                "
                size="x-small"
                density="compact"
                class="variant-chip mini-chip"
                variant="outlined"
              >
                {{ day.programDay.activeVariant }}
              </v-chip>
              <v-chip
                size="x-small"
                density="compact"
                class="p-chip mini-chip"
                variant="tonal"
              >
                P{{ +(day.programDay.macros?.protein || 0).toFixed(0) }}
              </v-chip>
              <v-chip
                size="x-small"
                density="compact"
                class="c-chip mini-chip"
                variant="tonal"
              >
                C{{ +(day.programDay.macros?.carbs || 0).toFixed(0) }}
              </v-chip>
              <v-chip
                size="x-small"
                density="compact"
                class="f-chip mini-chip"
                variant="tonal"
              >
                F{{ +(day.programDay.macros?.fat || 0).toFixed(0) }}
              </v-chip>
            </div>
            <div class="text-caption text-grey meal-count d-flex align-center">
              <v-icon size="x-small" class="mr-1">
                mdi-silverware-fork-knife
              </v-icon>
              {{ (day.programDay.meals || []).length }} meal{{
                (day.programDay.meals || []).length === 1 ? "" : "s"
              }}
            </div>
          </div>
          <div v-else class="text-caption text-grey no-plan">No plan</div>
        </div>
      </div>
    </div>

    <!-- Paste Dialog -->
    <v-dialog v-model="showPasteDialog" max-width="400">
      <v-card>
        <v-card-title>Paste to Selected Days?</v-card-title>
        <v-card-text>
          This will replace the content of {{ getSelectedIndices.length }} day{{ getSelectedIndices.length !== 1 ? 's' : '' }} with the copied content.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPasteDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="text" @click="pasteToSelectedDays">Paste</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
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
  isToday,
} from "date-fns";
import { useSelection } from "@/composables/useSelection";

const emit = defineEmits(["open-week", "updateProgram"]);

const { isSelected, toggleSelection, clearSelection, getSelectedIndices } = useSelection();
const dragOverIndex = ref(null);
const draggedIndex = ref(null);
const clipboardDays = ref([]);
const showPasteDialog = ref(false);

const props = defineProps({
  clientId: { type: Number, required: true },
  programId: { type: Number, required: true },
});

const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const currentDate = ref(new Date());
const client = computed(() =>
  clients.value.find((c) => c.id === props.clientId)
);
const program = computed(() =>
  client.value?.programs.find((p) => p.id === props.programId)
);

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const calendarDays = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value), {
    weekStartsOn: 0,
  });
  const end = endOfWeek(endOfMonth(currentDate.value), { weekStartsOn: 0 });

  const days = [];
  let cur = start;
  while (cur <= end) {
    const iso = format(cur, "yyyy-MM-dd");
    const programDay = program.value?.days.find((d) => d.date === iso);
    days.push({
      date: cur,
      isToday: isToday(cur),
      isCurrentMonth: isSameMonth(cur, currentDate.value),
      programDay,
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

function truncateNotes(notes) {
  if (!notes) return "";
  return notes.length > 100 ? notes.substring(0, 100) + "..." : notes;
}

// Selection and drag-and-drop handlers
function handleCellClick(event, idx, day) {
  // Don't open week view if selecting
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    event.stopPropagation();
    toggleSelection(idx, event);
  } else if (getSelectedIndices.value.length === 0) {
    // Normal click - open week view
    emit('open-week', day.date);
  } else {
    // Click with selection - toggle selection
    toggleSelection(idx, event);
  }
}

function onDragStart(event, idx) {
  draggedIndex.value = idx;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', idx.toString());
}

function onDragOver(event, idx) {
  if (draggedIndex.value !== null && draggedIndex.value !== idx) {
    dragOverIndex.value = idx;
    event.dataTransfer.dropEffect = 'move';
  }
}

function onDragLeave() {
  dragOverIndex.value = null;
}

function onDrop(event, targetIdx) {
  event.preventDefault();
  dragOverIndex.value = null;

  if (draggedIndex.value === null || draggedIndex.value === targetIdx) {
    draggedIndex.value = null;
    return;
  }

  const sourceDay = calendarDays.value[draggedIndex.value];
  const targetDay = calendarDays.value[targetIdx];

  if (!sourceDay.programDay || !targetDay.isCurrentMonth) {
    draggedIndex.value = null;
    return;
  }

  // Move day content
  const sourceDate = format(sourceDay.date, 'yyyy-MM-dd');
  const targetDate = format(targetDay.date, 'yyyy-MM-dd');

  const allDays = [...(program.value?.days || [])];
  
  // Find or create target day
  let targetDayObj = allDays.find(d => d.date === targetDate);
  if (!targetDayObj) {
    targetDayObj = {
      date: targetDate,
      meals: [],
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      macrosSource: 'auto',
      activeVariant: 'A',
    };
    allDays.push(targetDayObj);
  }

  // Copy source content to target
  const sourceDayObj = allDays.find(d => d.date === sourceDate);
  if (sourceDayObj) {
    targetDayObj.meals = JSON.parse(JSON.stringify(sourceDayObj.meals));
    targetDayObj.macros = JSON.parse(JSON.stringify(sourceDayObj.macros));
    targetDayObj.activeVariant = sourceDayObj.activeVariant || 'A';
  }

  // Update program
  program.value.days = allDays;
  emit('updateProgram', program.value);
  
  draggedIndex.value = null;
}

function copySelectedDays() {
  const selected = getSelectedIndices.value
    .map(idx => calendarDays.value[idx])
    .filter(day => day.isCurrentMonth && day.programDay)
    .map(day => {
      const dayObj = program.value?.days.find(d => d.date === format(day.date, 'yyyy-MM-dd'));
      return dayObj ? JSON.parse(JSON.stringify(dayObj)) : null;
    })
    .filter(Boolean);

  clipboardDays.value = selected;
}

function pasteToSelectedDays() {
  if (!clipboardDays.value.length) return;

  const allDays = [...(program.value?.days || [])];
  const sourceDay = clipboardDays.value[0]; // Use first copied day

  getSelectedIndices.value.forEach(idx => {
    const targetDay = calendarDays.value[idx];
    if (!targetDay.isCurrentMonth) return;

    const targetDate = format(targetDay.date, 'yyyy-MM-dd');
    let targetDayObj = allDays.find(d => d.date === targetDate);
    
    if (!targetDayObj) {
      targetDayObj = {
        date: targetDate,
        meals: [],
        macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        macrosSource: 'auto',
        activeVariant: 'A',
      };
      allDays.push(targetDayObj);
    }

    // Paste content
    targetDayObj.meals = JSON.parse(JSON.stringify(sourceDay.meals));
    targetDayObj.macros = JSON.parse(JSON.stringify(sourceDay.macros));
    targetDayObj.activeVariant = sourceDay.activeVariant || 'A';
  });

  program.value.days = allDays;
  emit('updateProgram', program.value);
  showPasteDialog.value = false;
  clearSelection();
}

// Keyboard shortcuts
function handleKeyDown(event) {
  if (event.key === 'Escape') {
    clearSelection();
  } else if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    // Select all current month days
    const currentMonthDays = calendarDays.value
      .map((day, idx) => day.isCurrentMonth ? idx : -1)
      .filter(idx => idx >= 0);
    currentMonthDays.forEach(idx => toggleSelection(idx));
  } else if (event.key === 'c' && (event.ctrlKey || event.metaKey) && getSelectedIndices.value.length > 0) {
    event.preventDefault();
    copySelectedDays();
  } else if (event.key === 'v' && (event.ctrlKey || event.metaKey) && clipboardDays.value.length > 0) {
    event.preventDefault();
    if (getSelectedIndices.value.length > 0) {
      showPasteDialog.value = true;
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
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

.legend {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
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
  gap: 8px;
}

.calendar-cell {
  background-color: #ffffff;
  border: 1px solid #e6ebf5;
  border-radius: 10px;
  padding: 8px;
  min-height: 120px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s ease;
  position: relative;
}

.calendar-cell.selected {
  border: 2px solid #1976d2;
  background-color: #e3f2fd;
}

.calendar-cell.drag-over {
  border: 2px dashed #1976d2;
  background-color: #bbdefb;
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
}

.calendar-cell:hover {
  transform: scale(1.015);
  background-color: #f9fbff;
}

.current-month {
  background-color: #ffffff;
}

.calendar-cell:not(.current-month) {
  background-color: #f8fafc;
  border-color: #e5e7eb;
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

.cell-indicators {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notes-indicator {
  opacity: 0.7;
}

.notes-preview {
  max-width: 200px;
  white-space: pre-wrap;
  font-size: 0.8rem;
}

.cell-body {
  font-size: 0.8rem;
  line-height: 1.2;
}

.no-plan {
  font-style: italic;
  color: #999;
}

.macro-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin-top: 6px;
}

.kcal-chip {
  background: #111827;
  color: #fff;
}
.p-chip {
  color: #155e75;
  background: #ecfeff;
}
.c-chip {
  color: #7c2d12;
  background: #fff7ed;
}
.f-chip {
  color: #14532d;
  background: #ecfdf5;
}

.mini-chip {
  padding: 0 6px !important;
  height: 20px !important;
  font-size: 0.7rem !important;
}

.variant-chip {
  border-color: #90caf9 !important;
  color: #1976d2 !important;
}

.meal-count {
  margin-top: 6px;
}
</style>

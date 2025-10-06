<template>
  <div class="meal-calendar-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <WeekSidebar
        :program="currentProgram"
        :selected-date="selectedDate"
        :copied-day="copiedDay"
        @select-day="selectDay"
        @copy-day="copyDay"
        @paste-day="pasteDay"
      />
    </aside>

    <!-- Day Editor -->
    <main class="day-editor">
      <DayEditor
        v-if="selectedDay"
        :day="selectedDay"
        :foods="foods"
        :meals="meals"
        :recipes="recipes"
      />
      <div v-else class="empty-state">Select a day to start editing</div>
    </main>
  </div>
</template>


<script setup>
import { ref, computed } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";
import WeekSidebar from "./WeekSidebar.vue";
import DayEditor from "./DayEditor.vue";

const props = defineProps({
  clientId: { type: Number, required: true },
  initialDate: { type: Date, required: true },
});

const dataStore = useDataStore();
const { clients, foods, meals, recipes } = storeToRefs(dataStore);

const selectedDate = ref(props.initialDate);
const copiedDay = ref(null);

const client = computed(() =>
  clients.value.find((c) => c.id === props.clientId)
);
const currentProgram = computed(() => client.value?.programs[0]);

const selectedDay = computed(() =>
  currentProgram.value?.days.find(
    (d) => d.date === selectedDate.value.toISOString().split("T")[0]
  )
);

function selectDay(date) {
  selectedDate.value = new Date(date);
}

function copyDay() {
  copiedDay.value = selectedDay.value ? structuredClone(selectedDay.value) : null;
}

function pasteDay() {
  if (!copiedDay.value || !selectedDay.value) return;
  selectedDay.value.meals = structuredClone(copiedDay.value.meals);
}
</script>


<style scoped>
.meal-calendar-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* Day Editor (main view) */
.day-editor {
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
  background-color: #fafafa;
}

/* Empty state */
.empty-state {
  color: #999;
  text-align: center;
  margin-top: 100px;
  font-size: 1rem;
}

/* Ensure sidebar tabs don’t push content down */
.sidebar .v-tabs {
  margin: 0 !important;
  padding: 0 !important;
  min-height: 36px !important;
}
</style>

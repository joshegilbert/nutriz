<template>
  <div class="week-sidebar">
    <!-- Sticky Top Nav Tabs -->
    <v-tabs
      v-model="activeTab"
      class="sidebar-tabs"
      density="compact"
      align-tabs="center"
    >
      <v-tab value="week">Week</v-tab>
      <v-tab value="recipes">Recipes</v-tab>
      <v-tab value="ai">AI Chat</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab" class="sidebar-content">
      <!-- WEEK TAB -->
      <v-window-item value="week">
        <v-list density="compact">
          <v-list-item
            v-for="day in weekDays"
            :key="day.iso"
            class="day-item"
            :class="{ selected: isSameDay(day.date, selectedDate) }"
            @click="$emit('select-day', day.date)"
          >
            <v-list-item-title>{{ day.label }}</v-list-item-title>
            <v-list-item-subtitle>
              Cal: {{ dayTotals(day.date).calories }} ·
              P: {{ dayTotals(day.date).protein }}g
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- Copy/Paste Buttons -->
        <div class="sidebar-actions">
          <v-btn size="x-small" color="primary" @click="$emit('copy-day')">
            Copy Day
          </v-btn>
          <v-btn
            size="x-small"
            color="secondary"
            variant="outlined"
            @click="$emit('paste-day')"
          >
            Paste
          </v-btn>
        </div>
      </v-window-item>

      <!-- RECIPES TAB -->
      <v-window-item value="recipes">
        <div class="placeholder">📖 Recipes coming soon...</div>
      </v-window-item>

      <!-- AI TAB -->
      <v-window-item value="ai">
        <div class="placeholder">🤖 AI Chat Assistant coming soon...</div>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { format, isSameDay as isSameDayFn } from "date-fns";

const props = defineProps({
  program: { type: Object, required: true },
  selectedDate: { type: Date, required: true },
});

const emit = defineEmits(["select-day", "copy-day", "paste-day"]);

const activeTab = ref("week");

const weekDays = computed(() => {
  return props.program.days.map((d) => ({
    date: new Date(d.date),
    iso: d.date,
    label: format(new Date(d.date), "EEE, MMM d"),
  }));
});

function isSameDay(d1, d2) {
  return isSameDayFn(new Date(d1), new Date(d2));
}

function dayTotals(date) {
  const dayDate = date instanceof Date ? date : new Date(date);
  const iso = dayDate.toISOString().split("T")[0];
  const day = props.program.days.find((d) => d.date === iso);
  if (!day) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return day.meals.reduce(
    (totals, meal) => {
      meal.items.forEach((item) => {
        totals.calories += item.macros?.calories || 0;
        totals.protein += item.macros?.protein || 0;
      });
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
</script>

<style scoped>
.week-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #eee;
  background: #fff;
}

/* --- Sticky tab bar --- */
.sidebar-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fafafa;
  border-bottom: 1px solid #ddd;
  min-height: 36px !important;
}

.v-tab {
  min-height: 36px !important;
  padding: 0 12px !important;
  font-size: 0.85rem !important;
  text-transform: none !important;
  color: #555 !important;
}

.v-tab--selected {
  color: #1976d2 !important;
  background-color: #f0f6ff !important;
  font-weight: 600 !important;
}

/* --- Sidebar content --- */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* --- Week list --- */
.day-item {
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
  margin-bottom: 2px;
}

.day-item.selected {
  background-color: #e3f2fd !important;
  font-weight: 600;
}

/* --- Copy/paste buttons --- */
.sidebar-actions {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-top: 1px solid #eee;
}

/* --- Placeholder for future tabs --- */
.placeholder {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}
</style>

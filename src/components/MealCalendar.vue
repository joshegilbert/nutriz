<template>
  <div class="meal-calendar">
    <!-- Header: Week Navigation -->
    <v-row align="center" class="mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" @click="prevWeek"></v-btn>
      <div class="text-h6 font-weight-medium mx-3">
        Week of {{ formatWeekLabel(visibleWeekStart) }}
      </div>
      <v-btn icon="mdi-chevron-right" variant="text" @click="nextWeek"></v-btn>
      <v-spacer></v-spacer>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-calendar-month"
        class="mr-2"
        @click="emit('back-to-month')"
      >
        Month View
      </v-btn>
      <v-btn size="small" color="primary" variant="tonal" @click="goToToday">Today</v-btn>
    </v-row>

    <!-- Scrollable Grid -->
    <div class="week-grid">
      <div
        v-for="day in weekPlan"
        :key="day.iso"
        class="day-column"
        :class="{ today: isToday(day.date) }"
      >
        <!-- Day Header -->
        <div class="day-header">
          <strong>{{ day.label }}</strong>
          <span class="text-caption text-grey">{{ formatDate(day.date) }}</span>
          <v-chip-group class="mt-1" density="compact">
            <v-chip size="x-small" color="grey-lighten-2" variant="flat">
              Cal {{ day.totals.calories }}
            </v-chip>
            <v-chip size="x-small" color="grey-lighten-2" variant="flat">
              P {{ day.totals.protein }}g
            </v-chip>
            <v-chip size="x-small" color="grey-lighten-2" variant="flat">
              C {{ day.totals.carbs }}g
            </v-chip>
            <v-chip size="x-small" color="grey-lighten-2" variant="flat">
              F {{ day.totals.fat }}g
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Meals -->
        <div
          v-for="meal in day.meals"
          :key="meal.mealTime"
          class="meal-section"
        >
          <div class="meal-title" :class="mealColor(meal.mealTime)">
            {{ meal.mealTime }}
          </div>

          <div v-if="meal.items.length === 0" class="text-caption text-grey pa-1">
            No items
          </div>

          <div
            v-for="item in meal.items"
            :key="item.id"
            class="item-card"
          >
            <div class="item-main">
              <div class="item-name">{{ getItemName(item) }}</div>
              <div class="item-macros text-caption">
                {{ item.macros.calories }} cal ·
                P{{ item.macros.protein }}g ·
                C{{ item.macros.carbs }}g ·
                F{{ item.macros.fat }}g
              </div>
            </div>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              color="grey"
              @click="removeItem(day.iso, meal.mealTime, item.id)"
            ></v-btn>
          </div>

          <v-btn
            size="x-small"
            variant="text"
            prepend-icon="mdi-plus"
            class="add-btn"
            @click="openAddItemDialog(day.date, meal.mealTime)"
          >
            Add Item
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { MEAL_TIMES, useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";
import {
  startOfWeek,
  addDays,
  format,
  isToday as isTodayDate,
} from "date-fns";

const emit = defineEmits(["back-to-month"]);

const props = defineProps({
  clientId: { type: Number, required: true },
  initialDate: {
    type: [Date, String],
    default: () => new Date(),
  },
});

const dataStore = useDataStore();
const { clients, foods, meals, recipes } = storeToRefs(dataStore);

const mealTimes = MEAL_TIMES;

const foodById = computed(() => {
  const map = new Map();
  foods.value.forEach((food) => {
    map.set(food.id, food);
  });
  return map;
});

const mealById = computed(() => {
  const map = new Map();
  meals.value.forEach((meal) => {
    map.set(meal.id, meal);
  });
  return map;
});

const recipeById = computed(() => {
  const map = new Map();
  recipes.value.forEach((recipe) => {
    map.set(recipe.id, recipe);
  });
  return map;
});

function normalizeDate(value) {
  if (!value) return new Date();
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

const visibleWeekStart = ref(
  startOfWeek(normalizeDate(props.initialDate), { weekStartsOn: 1 })
);

watch(
  () => props.initialDate,
  (newValue) => {
    visibleWeekStart.value = startOfWeek(normalizeDate(newValue), {
      weekStartsOn: 1,
    });
  }
);

const client = computed(() =>
  clients.value.find((c) => c.id === props.clientId)
);
const currentProgram = computed(() => client.value?.programs?.[0]);
const currentProgramId = computed(() => currentProgram.value?.id ?? null);

const programDaysByIso = computed(() => {
  const map = new Map();
  currentProgram.value?.days?.forEach((day) => {
    map.set(day.date, day);
  });
  return map;
});

const zeroTotals = () => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});

function aggregateMacros(items) {
  return items.reduce((acc, item) => {
    const macros = item.macros ?? zeroTotals();
    acc.calories += macros.calories ?? 0;
    acc.protein += macros.protein ?? 0;
    acc.carbs += macros.carbs ?? 0;
    acc.fat += macros.fat ?? 0;
    return acc;
  }, zeroTotals());
}

const weekPlan = computed(() => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(visibleWeekStart.value, i);
    const iso = format(date, "yyyy-MM-dd");
    const programDay = programDaysByIso.value.get(iso);

    const mealsForDay = mealTimes.map((mealTime) => {
      const items =
        programDay?.meals?.find((m) => m.mealTime === mealTime)?.items ?? [];
      return {
        mealTime,
        items,
        totals: aggregateMacros(items),
      };
    });

    const dayTotals = mealsForDay.reduce((acc, meal) => {
      acc.calories += meal.totals.calories;
      acc.protein += meal.totals.protein;
      acc.carbs += meal.totals.carbs;
      acc.fat += meal.totals.fat;
      return acc;
    }, zeroTotals());

    days.push({
      date,
      iso,
      label: format(date, "EEEE"),
      meals: mealsForDay,
      totals: dayTotals,
    });
  }
  return days;
});

function getItemName(item) {
  if (item.type === "food") {
    const f = foodById.value.get(item.sourceId);
    return f ? f.name : "Unknown Food";
  }
  if (item.type === "meal") {
    const m = mealById.value.get(item.sourceId);
    return m ? m.name : "Unknown Meal";
  }
  if (item.type === "recipe") {
    const r = recipeById.value.get(item.sourceId);
    return r ? r.name : "Unknown Recipe";
  }
  return "Unknown Item";
}

function mealColor(mealTime) {
  switch (mealTime) {
    case "Breakfast":
      return "breakfast";
    case "Lunch":
      return "lunch";
    case "Dinner":
      return "dinner";
    case "Snacks":
      return "snacks";
    default:
      return "";
  }
}

function isToday(date) {
  return isTodayDate(date);
}

function formatDate(date) {
  return format(date, "MMM d");
}

function formatWeekLabel(start) {
  const end = addDays(start, 6);
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

function prevWeek() {
  visibleWeekStart.value = addDays(visibleWeekStart.value, -7);
}

function nextWeek() {
  visibleWeekStart.value = addDays(visibleWeekStart.value, 7);
}

function goToToday() {
  visibleWeekStart.value = startOfWeek(new Date(), { weekStartsOn: 1 });
}

function openAddItemDialog(date, mealTime) {
  console.log("Add item to", mealTime, "on", date);
}

function removeItem(dayIso, mealTime, itemId) {
  if (!currentProgramId.value) return;

  dataStore.removeProgramItem({
    clientId: props.clientId,
    programId: currentProgramId.value,
    dayIso,
    mealTime,
    itemId,
  });
}
</script>

<style scoped>
.meal-calendar {
  width: 100%;
  overflow-x: auto;
}

.week-grid {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.day-column {
  min-width: 250px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.day-column.today {
  border-color: #81c784;
  box-shadow: 0 0 6px rgba(129, 199, 132, 0.4);
}

.day-header {
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
  padding-bottom: 4px;
}

.meal-section {
  margin-top: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 4px;
}

.meal-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.breakfast {
  color: #fbc02d;
}
.lunch {
  color: #43a047;
}
.dinner {
  color: #fb8c00;
}
.snacks {
  color: #8e24aa;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  border-radius: 8px;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.item-name {
  font-weight: 500;
}

.item-macros {
  color: #666;
}

.add-btn {
  margin-top: 4px;
  align-self: flex-start;
}
</style>

<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client details...</p>
    </div>
    <div v-else>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn to="/clients" icon="mdi-arrow-left" variant="text" class="mr-2"></v-btn>
            <h1 class="text-h4">{{ client.name }}</h1>
            <v-chip
              :color="client.status === 'Active' ? 'green' : 'orange'"
              class="ml-4"
              size="small"
            >
              {{ client.status }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn
              :to="`/clients/${client.id}/plan`"
              color="secondary"
              prepend-icon="mdi-printer"
            >
              View Client Plan
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Program Snapshot -->
      <v-row v-if="hasActiveProgram" class="mb-6" align="stretch">
        <v-col cols="12" md="8">
          <v-card class="pa-4" elevation="1">
            <div class="d-flex align-center mb-4">
              <h2 class="text-h6 mb-0">Program Snapshot</h2>
              <v-spacer></v-spacer>
              <v-chip v-if="planDateRange.start" size="small" color="primary" variant="tonal">
                {{ formatDateDisplay(planDateRange.start) }}
                <span v-if="planDateRange.end"> → {{ formatDateDisplay(planDateRange.end) }}</span>
              </v-chip>
            </div>

            <v-row>
              <v-col
                v-for="stat in planOverviewStats"
                :key="stat.label"
                cols="12"
                sm="6"
                class="mb-4"
              >
                <div class="text-caption text-uppercase text-grey-darken-1">
                  {{ stat.label }}
                </div>
                <div class="text-h6 font-weight-medium">
                  {{ stat.value }}
                </div>
                <div v-if="stat.hint" class="text-caption text-grey">
                  {{ stat.hint }}
                </div>
              </v-col>
            </v-row>

            <div v-if="progressPercent !== null">
              <v-progress-linear
                :model-value="progressPercent"
                height="6"
                color="primary"
                rounded
              ></v-progress-linear>
              <div class="text-caption text-grey mt-2">
                Scheduled {{ scheduledDayCount }} of
                <span>{{ planLengthDays }}</span>
                days
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="pa-4" elevation="1">
            <h2 class="text-h6 mb-1">Focus Day</h2>
            <div v-if="focusDay">
              <div class="text-caption text-grey-darken-1 mb-1">
                {{ focusDayMeta.descriptor }}
              </div>
              <div class="text-subtitle-1 font-weight-medium mb-3">
                {{ formatDateDisplay(focusDay.dateObj) }}
              </div>

              <div class="d-flex flex-wrap gap-2 mb-3">
                <v-chip size="small" color="grey-lighten-3" variant="flat">
                  {{ focusDay.totals.calories }} cal
                </v-chip>
                <v-chip size="small" color="grey-lighten-3" variant="flat">
                  P {{ focusDay.totals.protein }}g
                </v-chip>
                <v-chip size="small" color="grey-lighten-3" variant="flat">
                  C {{ focusDay.totals.carbs }}g
                </v-chip>
                <v-chip size="small" color="grey-lighten-3" variant="flat">
                  F {{ focusDay.totals.fat }}g
                </v-chip>
              </div>

              <v-list density="compact" border class="rounded-lg">
                <v-list-item
                  v-for="meal in focusDay.meals"
                  :key="meal.mealTime"
                  :title="meal.mealTime"
                  :subtitle="mealSummary(meal)"
                >
                  <template #append>
                    <v-chip
                      v-if="meal.items.length"
                      size="x-small"
                      color="primary"
                      variant="tonal"
                    >
                      {{ meal.items.length }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>

              <v-btn
                block
                size="small"
                color="primary"
                variant="tonal"
                class="mt-4"
                @click="openWeekView(focusDay.dateObj)"
              >
                Open in Week View
              </v-btn>
            </div>
            <div v-else class="text-caption text-grey">
              No scheduled days yet.
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Upcoming Schedule -->
      <v-row v-if="hasActiveProgram && upcomingDays.length" class="mb-6">
        <v-col cols="12">
          <v-card class="pa-4" elevation="1">
            <div class="d-flex align-center mb-3">
              <h2 class="text-h6 mb-0">Upcoming Schedule</h2>
              <v-spacer></v-spacer>
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-calendar-week"
                @click="openWeekView(upcomingDays[0].dateObj)"
              >
                Jump to Next Week
              </v-btn>
            </div>

            <v-list density="comfortable">
              <v-list-item
                v-for="day in upcomingDays"
                :key="day.date"
                :title="formatDayTitle(day)"
                :subtitle="upcomingDaySubtitle(day)"
                class="upcoming-day-item"
                @click="openWeekView(day.dateObj)"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="32">
                    <span class="text-caption font-weight-medium">
                      {{ formatMonthDay(day.dateObj) }}
                    </span>
                  </v-avatar>
                </template>
                <template #append>
                  <v-icon color="primary" size="small">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <template v-if="hasActiveProgram">
        <!-- View Toggle -->
        <v-row class="mb-4">
          <v-btn-toggle v-model="viewMode" mandatory>
            <v-btn value="week" prepend-icon="mdi-calendar-week">Week View</v-btn>
            <v-btn value="month" prepend-icon="mdi-calendar-month">Month View</v-btn>
          </v-btn-toggle>
        </v-row>

        <!-- Calendar Rendering -->
        <MealCalendar
          v-if="viewMode === 'week'"
          :client-id="client.id"
          :initial-date="selectedDate"
          @back-to-month="viewMode = 'month'"
        />
        <MealCalendarMonth
          v-else
          :client-id="client.id"
          :program-id="activeProgramId"
          @open-week="openWeekView"
        />
      </template>

      <v-alert v-else type="info" variant="tonal" color="primary">
        This client does not have an active program yet. Assign a plan to start scheduling meals.
      </v-alert>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { MEAL_TIMES, useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfToday,
} from "date-fns";

const MealCalendar = defineAsyncComponent(() =>
  import("@/components/MealCalendar.vue")
);
const MealCalendarMonth = defineAsyncComponent(() =>
  import("@/components/MealCalendarMonth.vue")
);

const route = useRoute();
const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const viewMode = ref("month");
const selectedDate = ref(new Date());

const mealTimes = MEAL_TIMES;

const zeroTotals = () => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});

function aggregateItems(items = []) {
  return items.reduce(
    (acc, item) => {
      const macros = item.macros ?? {};
      acc.calories += macros.calories ?? 0;
      acc.protein += macros.protein ?? 0;
      acc.carbs += macros.carbs ?? 0;
      acc.fat += macros.fat ?? 0;
      return acc;
    },
    zeroTotals()
  );
}

function buildMealsForDay(day) {
  if (!day) return [];
  return mealTimes.map((mealTime) => {
    const meal = day.meals?.find((m) => m.mealTime === mealTime);
    const items = meal?.items ?? [];
    return {
      mealTime,
      items,
      totals: aggregateItems(items),
    };
  });
}

function enrichProgramDay(day) {
  if (!day) return null;
  const dateObj = parseISO(day.date);
  const meals = buildMealsForDay(day);
  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.totals.calories;
      acc.protein += meal.totals.protein;
      acc.carbs += meal.totals.carbs;
      acc.fat += meal.totals.fat;
      return acc;
    },
    zeroTotals()
  );

  const plannedItemCount = meals.reduce(
    (acc, meal) => acc + meal.items.length,
    0
  );

  return {
    ...day,
    dateObj,
    meals,
    totals,
    plannedItemCount,
  };
}

const client = computed(() =>
  clients.value.find((c) => c.id === Number(route.params.id))
);

const activeProgram = computed(() => client.value?.programs?.[0] ?? null);
const activeProgramId = computed(() => activeProgram.value?.id ?? null);

const enrichedProgramDays = computed(() => {
  if (!activeProgram.value?.days) return [];
  return activeProgram.value.days
    .map(enrichProgramDay)
    .filter(Boolean)
    .sort((a, b) => a.dateObj - b.dateObj);
});

const hasActiveProgram = computed(() => Boolean(activeProgram.value));

const scheduledDayCount = computed(() => enrichedProgramDays.value.length);

const totalPlannedCalories = computed(() =>
  enrichedProgramDays.value.reduce(
    (acc, day) => acc + day.totals.calories,
    0
  )
);

const averageDailyCalories = computed(() => {
  if (!scheduledDayCount.value) return null;
  return Math.round(totalPlannedCalories.value / scheduledDayCount.value);
});

const totalPlannedItems = computed(() =>
  enrichedProgramDays.value.reduce(
    (acc, day) => acc + day.plannedItemCount,
    0
  )
);

const planLengthDays = computed(() => activeProgram.value?.length ?? null);

const planStartDate = computed(() => {
  if (activeProgram.value?.startDate) {
    return parseISO(activeProgram.value.startDate);
  }
  return enrichedProgramDays.value[0]?.dateObj ?? null;
});

const planEndDate = computed(() => {
  if (activeProgram.value?.startDate && planLengthDays.value) {
    return addDays(parseISO(activeProgram.value.startDate), planLengthDays.value - 1);
  }
  const lastDay = enrichedProgramDays.value[enrichedProgramDays.value.length - 1];
  return lastDay?.dateObj ?? null;
});

const planDateRange = computed(() => ({
  start: planStartDate.value,
  end: planEndDate.value,
}));

const remainingScheduledDays = computed(() => {
  const today = startOfToday(new Date());
  return enrichedProgramDays.value.filter((day) => day.dateObj >= today).length;
});

const progressPercent = computed(() => {
  if (!planLengthDays.value) return null;
  const scheduled = Math.min(scheduledDayCount.value, planLengthDays.value);
  return Math.round((scheduled / planLengthDays.value) * 100);
});

const planOverviewStats = computed(() => {
  const stats = [];
  if (planLengthDays.value) {
    stats.push({
      label: "Program Length",
      value: `${planLengthDays.value} days`,
      hint: planDateRange.value.end
        ? `Ends ${formatDateDisplay(planDateRange.value.end)}`
        : null,
    });
  }
  stats.push({
    label: "Days Scheduled",
    value: scheduledDayCount.value,
    hint: remainingScheduledDays.value
      ? `${remainingScheduledDays.value} upcoming`
      : "No upcoming days",
  });

  if (averageDailyCalories.value !== null) {
    stats.push({
      label: "Avg Daily Calories",
      value: `${averageDailyCalories.value} cal`,
    });
  }

  stats.push({
    label: "Items Planned",
    value: totalPlannedItems.value,
  });

  return stats;
});

const today = computed(() => startOfToday(new Date()));

const focusDay = computed(() => {
  if (!enrichedProgramDays.value.length) return null;
  const todaysPlan = enrichedProgramDays.value.find((day) =>
    isSameDay(day.dateObj, today.value)
  );
  if (todaysPlan) return todaysPlan;

  const upcoming = enrichedProgramDays.value.find(
    (day) => day.dateObj >= today.value
  );
  if (upcoming) return upcoming;

  return enrichedProgramDays.value[enrichedProgramDays.value.length - 1];
});

const focusDayMeta = computed(() => {
  if (!focusDay.value) {
    return { descriptor: "" };
  }
  const diff = differenceInCalendarDays(focusDay.value.dateObj, today.value);
  if (diff === 0) {
    return { descriptor: "Today" };
  }
  if (diff === 1) {
    return { descriptor: "Tomorrow" };
  }
  if (diff > 1) {
    return { descriptor: `In ${diff} days` };
  }
  return { descriptor: `${Math.abs(diff)} day(s) ago` };
});

const upcomingDays = computed(() => {
  if (!enrichedProgramDays.value.length) return [];
  const upcoming = enrichedProgramDays.value.filter(
    (day) => day.dateObj >= today.value
  );
  if (upcoming.length) {
    return upcoming.slice(0, 5);
  }
  // If all days are in the past, show the most recent few for quick access
  return enrichedProgramDays.value.slice(-3);
});

function openWeekView(date) {
  selectedDate.value = new Date(date);
  viewMode.value = "week";
}

function formatDateDisplay(date) {
  if (!date) return "";
  return format(date, "EEE, MMM d");
}

function formatMonthDay(date) {
  if (!date) return "";
  return format(date, "MMM d");
}

function formatDayTitle(day) {
  if (!day) return "";
  const title = format(day.dateObj, "EEEE, MMM d");
  const diff = differenceInCalendarDays(day.dateObj, today.value);
  if (diff === 0) return `${title} · Today`;
  if (diff === 1) return `${title} · Tomorrow`;
  if (diff > 1) return `${title} · In ${diff} days`;
  return `${title} · ${Math.abs(diff)} day(s) ago`;
}

function upcomingDaySubtitle(day) {
  if (!day) return "";
  if (!day.plannedItemCount) return "No items planned";
  return `${day.plannedItemCount} item(s) · ${day.totals.calories} cal`;
}

function mealSummary(meal) {
  if (!meal.items.length) return "No items planned";
  return `${meal.items.length} item(s) · ${meal.totals.calories} cal`;
}
</script>

<style scoped>
.upcoming-day-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.upcoming-day-item:hover {
  background-color: rgba(25, 118, 210, 0.08);
}
</style>

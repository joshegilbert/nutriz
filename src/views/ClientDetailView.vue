<template>
  <v-container class="py-6">
    <div v-if="!client">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else>
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="d-flex align-center mb-2">
            <v-btn to="/clients" icon="mdi-arrow-left" variant="text" class="mr-2"></v-btn>
            <h1 class="text-h4">{{ client.name }}</h1>
            <v-chip
              :color="client.status === 'Active' ? 'green' : 'orange'"
              class="ml-4"
              size="small"
            >
              {{ client.status }}
            </v-chip>
            <v-btn
              variant="text"
              class="ml-2"
              color="primary"
              prepend-icon="mdi-account-box-outline"
              @click="aboutDialog = true"
            >
              About
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              v-if="programsForClient.length"
              :to="{ name: 'PlanSummary', params: { clientId: client.id }, query: { programId: programsForClient[0].id } }"
              color="secondary"
              prepend-icon="mdi-eye"
            >
              View Latest Program
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

      <v-dialog v-model="aboutDialog" max-width="520">
        <v-card>
          <v-card-title class="text-h6">
            About {{ client.name }}
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-medium mb-1">Status</h3>
              <p class="text-body-2 mb-0">
                {{ client.status || "Not set" }}
              </p>
            </div>

            <v-expansion-panels multiple>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  Program Details
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Start Day</v-list-item-title>
                      <v-list-item-subtitle>{{ programStartLabel }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Length</v-list-item-title>
                      <v-list-item-subtitle>{{ programLengthLabel }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>End Day</v-list-item-title>
                      <v-list-item-subtitle>{{ programEndLabel }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <p v-if="!primaryProgram" class="text-body-2 mb-0 mt-2">
                    No program has been assigned to this client yet.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Personal Information
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Age</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.age }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Gender</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.gender }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Weight</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.weight }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>State</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.state }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Goals
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-if="goalList.length > 0">
                    <v-list density="compact">
                      <v-list-item v-for="goal in goalList" :key="goal">
                        <v-list-item-title>{{ goal }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="text-body-2 mb-0">
                    No goals recorded.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="primary" @click="aboutDialog = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Calendar Rendering -->
      <v-row justify="center">
        <v-col cols="12" xl="10" lg="11" md="12">
          <MealCalendar
            v-if="viewMode === 'week'"
            :client-id="client.id"
            :initial-date="selectedDate"
            @back-to-month="viewMode = 'month'"
          />
          <MealCalendarMonth
            v-else
            :client-id="client.id"
            :program-id="client.programs[0].id"
            @open-week="openWeekView"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from "vue";
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

const route = useRoute();
const dataStore = useDataStore();
const { clients, programs } = storeToRefs(dataStore);

const viewMode = ref("week");
const aboutDialog = ref(false);
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
  clients.value.find((c) => String(c.id) === route.params.id)
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
.client-detail-view {
  background-color: #f8f9fb;
  min-height: 100vh;
}

const programsForClient = computed(() =>
  programs.value.filter((program) => program.clientId === clientId)
);

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function totalProgramMacros(program) {
  return program.days?.reduce(
    (totals, day) => {
      if (!day?.macros) return totals;
      totals.calories += day.macros.calories || 0;
      totals.protein += day.macros.protein || 0;
      totals.carbs += day.macros.carbs || 0;
      totals.fat += day.macros.fat || 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
}
</style>

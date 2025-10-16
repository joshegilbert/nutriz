<template>
  <!-- Make the container fluid and give more horizontal padding -->
  <v-container fluid class="client-detail-view px-8 py-4">
    <div v-if="!client">
      <p>Loading client details...</p>
    </div>
    <div v-else>
      <!-- Header -->
      <v-row>
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
              :to="`/clients/${client.id}/plan`"
              color="secondary"
              prepend-icon="mdi-printer"
            >
              View Client Plan
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- View Toggle -->
      <v-row class="mb-4">
        <v-btn-toggle v-model="viewMode" mandatory>
          <v-btn value="week" prepend-icon="mdi-calendar-week">Week View</v-btn>
          <v-btn value="month" prepend-icon="mdi-calendar-month">Month View</v-btn>
        </v-btn-toggle>
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
import { ref, computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const MealCalendar = defineAsyncComponent(() =>
  import("@/components/MealCalendar/index.vue")   
);
const MealCalendarMonth = defineAsyncComponent(() =>
  import("@/components/MealCalendarMonth.vue")
);

const route = useRoute();
const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const viewMode = ref("week");
const aboutDialog = ref(false);
const selectedDate = ref(new Date());

const client = computed(() =>
  clients.value.find((c) => c.id === Number(route.params.id))
);

const primaryProgram = computed(() => client.value?.programs?.[0] ?? null);

const programStartLabel = computed(() => {
  const start = primaryProgram.value?.startDate;
  if (!start) return "Not set";
  const parsed = new Date(start);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return start;
  return parsed.toLocaleDateString();
});

const programLengthLabel = computed(() => {
  const length = primaryProgram.value?.length;
  if (!length) return "Not set";
  return `${length} day${length === 1 ? "" : "s"}`;
});

const programEndLabel = computed(() => {
  const start = primaryProgram.value?.startDate;
  const length = primaryProgram.value?.length;
  if (!start || !length) return "Not set";
  const parsed = new Date(start);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return "Not set";
  parsed.setDate(parsed.getDate() + length - 1);
  return parsed.toLocaleDateString();
});

const personalInfo = computed(() => {
  const current = client.value || {};
  const weight = current.weight;
  const formattedWeight =
    typeof weight === "number"
      ? `${weight} lbs`
      : weight || "Not provided";

  return {
    age: current.age ?? "Not provided",
    gender: current.gender ?? "Not provided",
    weight: formattedWeight,
    state: current.state ?? "Not provided",
  };
});

const goalList = computed(() => {
  const goals = client.value?.goals;
  if (Array.isArray(goals)) return goals.length ? goals : [];
  if (typeof goals === "string" && goals.trim().length > 0) {
    return goals.split("\n").map((goal) => goal.trim()).filter(Boolean);
  }
  return [];
});

function openWeekView(date) {
  selectedDate.value = new Date(date);
  viewMode.value = "week";
}
</script>

<style scoped>
.client-detail-view {
  background-color: #f8f9fb;
  min-height: 100vh;
}

.client-detail-view h1 {
  font-weight: 600;
}

.v-btn-toggle {
  background-color: #f5f5f5;
  border-radius: 8px;
}

.v-btn-toggle .v-btn--active {
  background-color: #1976d2;
  color: white;
}
</style>

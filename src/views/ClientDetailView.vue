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
        :program-id="client.programs[0].id"
        @open-week="openWeekView"
      />
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

const selectedDate = ref(new Date());

const client = computed(() =>
  clients.value.find((c) => c.id === Number(route.params.id))
);

function openWeekView(date) {
  selectedDate.value = new Date(date);
  viewMode.value = "week";
}
</script>

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
            <div>
              <h1 class="text-h4">{{ client.name }}</h1>
              <div class="text-subtitle-1">{{ client.contact?.email }}</div>
            </div>
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

      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>Client Details</v-card-title>
            <v-card-text>
              <p><strong>Phone:</strong> {{ client.contact?.phone || "—" }}</p>
              <p><strong>Date of Birth:</strong> {{ client.dob ? formatDate(client.dob) : "—" }}</p>
              <p><strong>Goals:</strong> {{ (client.goals || []).join(", ") || "—" }}</p>
              <p><strong>Notes:</strong></p>
              <p class="text-body-2">{{ client.notes || "No notes yet." }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 mb-3">Meal Programs</h2>
        </v-col>
        <v-col cols="12" md="6" lg="4" v-for="program in programsForClient" :key="program.id">
          <v-card>
            <v-card-title>{{ program.name }}</v-card-title>
            <v-card-subtitle>
              {{ formatDate(program.startDate) }} · {{ program.length }} days
            </v-card-subtitle>
            <v-card-text>
              <p><strong>Notes:</strong> {{ program.notes || "None" }}</p>
              <p>
                <strong>Macros:</strong>
                Cal {{ totalProgramMacros(program).calories.toFixed(0) }} /
                P {{ totalProgramMacros(program).protein.toFixed(0) }}g /
                C {{ totalProgramMacros(program).carbs.toFixed(0) }}g /
                F {{ totalProgramMacros(program).fat.toFixed(0) }}g
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn
                :to="{ name: 'PlanSummary', params: { clientId: client.id }, query: { programId: program.id } }"
                text
                color="primary"
              >
                Open Summary
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const route = useRoute();
const dataStore = useDataStore();
const { clients, programs } = storeToRefs(dataStore);

const clientId = route.params.id;

onMounted(() => {
  dataStore.fetchClients().catch(() => {});
  dataStore.fetchPrograms({ clientId }).catch(() => {});
});

const client = computed(() => clients.value.find((c) => c.id === clientId));

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
</script>

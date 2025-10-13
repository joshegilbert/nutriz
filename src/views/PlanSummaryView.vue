<template>
  <v-container class="py-6">
    <div v-if="!program || !client">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else>
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn :to="`/clients/${client.id}`" icon="mdi-arrow-left" variant="text" class="mr-2"></v-btn>
            <div>
              <h1 class="text-h4">{{ program.name }}</h1>
              <div class="text-subtitle-1">{{ client.name }} · {{ formatDate(program.startDate) }} · {{ program.length }} days</div>
            </div>
            <v-spacer></v-spacer>
            <v-btn @click="printPlan" prepend-icon="mdi-printer" color="secondary">Print</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8" offset-md="2" v-for="day in program.days" :key="day._id || day.date">
          <v-card class="mb-6">
            <v-card-title class="d-flex justify-space-between flex-wrap">
              <span>{{ formatDate(day.date) }}</span>
              <span class="text-subtitle-2 font-weight-light">
                {{ (day.macros?.calories || 0).toFixed(0) }} kcal | P:{{ (day.macros?.protein || 0).toFixed(0) }}g | C:{{ (day.macros?.carbs || 0).toFixed(0) }}g | F:{{ (day.macros?.fat || 0).toFixed(0) }}g
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <div v-for="meal in day.meals" :key="meal._id || meal.mealTime" class="mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <strong>{{ meal.mealTime }}</strong>
                  <span class="text-caption">
                    {{ (meal.macros?.calories || 0).toFixed(0) }} kcal · P {{ (meal.macros?.protein || 0).toFixed(0) }}g · C {{ (meal.macros?.carbs || 0).toFixed(0) }}g · F {{ (meal.macros?.fat || 0).toFixed(0) }}g
                  </span>
                </div>
                <v-list density="comfortable">
                  <v-list-item
                    v-for="(item, index) in meal.items"
                    :key="item._id || index"
                    :title="itemLabel(item)"
                    :subtitle="item.notes"
                  >
                    <template #append>
                      <span class="text-caption">
                        {{ (item.macros?.calories || 0).toFixed(0) }} kcal
                      </span>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/stores/useDataStore";

const route = useRoute();
const dataStore = useDataStore();
const { clients, foods, recipes } = storeToRefs(dataStore);

const clientId = route.params.clientId;
const programId = computed(() => route.query.programId);

onMounted(() => {
  Promise.all([
    dataStore.fetchClients(),
    dataStore.fetchFoods(),
    dataStore.fetchRecipes(),
    dataStore.fetchPrograms({ clientId }),
  ]).then(() => {
    if (programId.value) {
      dataStore.fetchProgramById(programId.value).catch(() => {});
    }
  });
});

watch(programId, (id) => {
  if (id) {
    dataStore.fetchProgramById(id).catch(() => {});
  }
});

const client = computed(() => clients.value.find((c) => c.id === clientId));

const program = computed(() => {
  if (programId.value) {
    return dataStore.getProgramById(programId.value);
  }
  return dataStore.getProgramsForClient(clientId)[0];
});

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function itemLabel(item) {
  if (item?.name) return item.name;
  if (item?.sourceType === "food") {
    const food = foods.value.find((f) => f.id === item.sourceId || f.id === item.foodItem);
    return food ? food.name : "Food";
  }
  if (item?.sourceType === "recipe") {
    const recipe = recipes.value.find((r) => r.id === item.sourceId || r.id === item.recipeId);
    return recipe ? recipe.name : "Recipe";
  }
  return "Custom Item";
}

function printPlan() {
  window.print();
}
</script>

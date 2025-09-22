<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client details or client not found...</p>
    </div>

    <div v-else>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn
              to="/clients"
              icon="mdi-arrow-left"
              variant="text"
              class="mr-2"
            ></v-btn>
            <h1 class="text-h4">{{ client.name }}</h1>
            <v-chip
              :color="client.status === 'Active' ? 'green' : 'orange'"
              class="ml-4"
              size="small"
            >
              {{ client.status }}
            </v-chip>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-tabs v-model="tab" bg-color="primary">
              <v-tab v-for="day in days" :key="day" :value="day">
                {{ day }}
              </v-tab>
            </v-tabs>

            <v-card-text>
              <v-window v-model="tab">
                <v-window-item v-for="day in days" :key="day" :value="day">
                  <div v-if="getRecipesForDay(day.toLowerCase()).length === 0">
                    <p>No recipes assigned for this day.</p>
                  </div>
                  <v-list lines="two" v-else>
                    <v-list-item
                      v-for="recipe in getRecipesForDay(day.toLowerCase())"
                      :key="recipe.id"
                      :title="recipe.name"
                      :subtitle="`${recipe.calories} calories | ${recipe.protein}g protein`"
                      :prepend-avatar="recipe.imageUrl"
                    >
                      <template v-slot:append>
                        <v-btn
                          color="grey-lighten-1"
                          icon="mdi-close"
                          variant="text"
                          @click="
                            removeRecipeFromPlan(day.toLowerCase(), recipe.id)
                          "
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-btn
                    class="mt-4"
                    color="primary"
                    size="small"
                    @click="openAddRecipeDialog(day.toLowerCase())"
                  >
                    Add Recipe
                  </v-btn>
                </v-window-item>
              </v-window>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="dialog" max-width="500px"></v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";

// ... (Most of the script is unchanged)
const route = useRoute();
const { clients, recipes } = useDataStore();
const tab = ref(null);
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const dialog = ref(false);
const dayToAddRecipe = ref(null);

const client = computed(() => {
  const clientId = Number(route.params.id);
  return clients.value.find((c) => c.id === clientId);
});

function getRecipesForDay(day) {
  if (!client.value || !client.value.mealPlan[day]) return [];
  const recipeIds = client.value.mealPlan[day];
  return recipeIds
    .map((id) => recipes.value.find((r) => r.id === id))
    .filter(Boolean);
}

function openAddRecipeDialog(day) {
  dayToAddRecipe.value = day;
  dialog.value = true;
}

function addRecipeToPlan(recipeId) {
  const day = dayToAddRecipe.value;
  if (day && client.value) {
    if (!client.value.mealPlan[day].includes(recipeId)) {
      client.value.mealPlan[day].push(recipeId);
    }
  }
  dialog.value = false;
}

// 👇 This is the new function
function removeRecipeFromPlan(day, recipeId) {
  if (client.value) {
    const dayPlan = client.value.mealPlan[day];
    const recipeIndex = dayPlan.indexOf(recipeId);
    if (recipeIndex > -1) {
      dayPlan.splice(recipeIndex, 1);
    }
  }
}
</script>

<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client details or client not found...</p>
    </div>
    <div v-else>
      <!-- Client Header -->
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
            <v-spacer></v-spacer>
            <v-btn :to="`/clients/${client.id}/plan`" color="secondary">
              View Plan
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Meal Plan Section -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-tabs v-model="tab" bg-color="primary" fixed-tabs>
              <v-tab v-for="day in days" :key="day" :value="day">
                {{ day }}
              </v-tab>
            </v-tabs>
            <v-window v-model="tab">
              <v-window-item v-for="day in days" :key="day" :value="day">
                <v-card-text>
                  <v-card variant="outlined" class="mb-4">
                    <v-card-item>
                      <v-card-title>Daily Summary</v-card-title>
                      <v-chip-group class="mt-2">
                        <v-chip color="blue-lighten-1" prepend-icon="mdi-fire">
                          {{ dailyTotals[day.toLowerCase()].calories }} Calories
                        </v-chip>
                        <v-chip
                          color="green-lighten-1"
                          prepend-icon="mdi-food-drumstick"
                        >
                          {{ dailyTotals[day.toLowerCase()].protein }}g Protein
                        </v-chip>
                        <v-chip
                          color="orange-lighten-1"
                          prepend-icon="mdi-bread-slice"
                        >
                          {{ dailyTotals[day.toLowerCase()].carbs }}g Carbs
                        </v-chip>
                        <v-chip
                          color="red-lighten-1"
                          prepend-icon="mdi-cupcake"
                        >
                          {{ dailyTotals[day.toLowerCase()].fat }}g Fat
                        </v-chip>
                      </v-chip-group>
                    </v-card-item>
                  </v-card>
                  <div v-for="mealTime in mealTimes" :key="mealTime">
                    <div
                      v-if="
                        getRecipesForMealTime(day.toLowerCase(), mealTime)
                          .length > 0
                      "
                    >
                      <h3 class="text-h6 mb-2">{{ mealTime }}</h3>
                      <v-list lines="two">
                        <v-list-item
                          v-for="recipe in getRecipesForMealTime(
                            day.toLowerCase(),
                            mealTime
                          )"
                          :key="recipe.id"
                          :title="recipe.name"
                          :subtitle="`${recipe.calories} kcal | P:${recipe.protein}g | C:${recipe.carbs}g | F:${recipe.fat}g`"
                          :prepend-avatar="recipe.imageUrl"
                        >
                          <template v-slot:append>
                            <v-btn
                              color="grey-lighten-1"
                              icon="mdi-close"
                              variant="text"
                              @click="
                                removeRecipeFromPlan(
                                  day.toLowerCase(),
                                  recipe.id,
                                  mealTime
                                )
                              "
                            ></v-btn>
                          </template>
                        </v-list-item>
                      </v-list>
                    </div>
                  </div>
                  <v-btn
                    class="mt-4"
                    color="primary"
                    size="small"
                    @click="openAddRecipeDialog(day.toLowerCase())"
                  >
                    Add Recipe
                  </v-btn>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Select a Recipe to Add</v-card-title>
        <v-card-text>
          <v-select
            v-model="mealTimeToAddTo"
            :items="mealTimes"
            label="Select Mealtime"
            class="mb-4"
          ></v-select>
          <v-list>
            <v-list-item
              v-for="recipe in recipes"
              :key="recipe.id"
              :title="recipe.name"
              @click="addRecipeToPlan(recipe.id)"
            >
              <template v-slot:prepend>
                <v-avatar :image="recipe.imageUrl"></v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="dialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
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
const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const dialog = ref(false);
const dayToAddRecipe = ref(null);
const mealTimeToAddTo = ref(null);
const client = computed(() => {
  const clientId = Number(route.params.id);
  return clients.value.find((c) => c.id === clientId);
});
const dailyTotals = computed(() => {
  if (!client.value) return {};
  const totals = {};
  days.forEach((day) => {
    const dayKey = day.toLowerCase();
    const recipeIds = client.value.mealPlan[dayKey].map(
      (meal) => meal.recipeId
    );
    const dayRecipes = recipeIds
      .map((id) => recipes.value.find((r) => r.id === id))
      .filter(Boolean);

    totals[dayKey] = dayRecipes.reduce(
      (acc, recipe) => {
        acc.calories += recipe.calories || 0;
        acc.protein += recipe.protein || 0;
        acc.carbs += recipe.carbs || 0;
        acc.fat += recipe.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  });
  return totals;
});
function getRecipesForMealTime(day, mealTime) {
  if (!client.value || !client.value.mealPlan[day]) return [];

  const mealItems = client.value.mealPlan[day].filter(
    (meal) => meal.mealTime === mealTime
  );
  return mealItems
    .map((meal) => recipes.value.find((r) => r.id === meal.recipeId))
    .filter(Boolean);
}
function openAddRecipeDialog(day) {
  dayToAddRecipe.value = day;
  mealTimeToAddTo.value = null;
  dialog.value = true;
}
function addRecipeToPlan(recipeId) {
  const day = dayToAddRecipe.value;
  const mealTime = mealTimeToAddTo.value;
  if (day && mealTime && client.value) {
    client.value.mealPlan[day].push({ mealTime, recipeId });
  }
  dialog.value = false;
}
function removeRecipeFromPlan(day, recipeId, mealTime) {
  if (client.value) {
    const dayPlan = client.value.mealPlan[day];
    const mealIndex = dayPlan.findIndex(
      (meal) => meal.recipeId === recipeId && meal.mealTime === mealTime
    );
    if (mealIndex > -1) {
      dayPlan.splice(mealIndex, 1);
    }
  }
}
</script>

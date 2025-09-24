<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client plan...</p>
    </div>
    <div v-else>
      <!-- Page Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn
              :to="`/clients/${client.id}`"
              icon="mdi-arrow-left"
              variant="text"
              class="mr-2"
            ></v-btn>
            <div>
              <h1 class="text-h4">Meal Plan Summary</h1>
              <div class="text-h6 font-weight-light">{{ client.name }}</div>
            </div>
            <v-spacer></v-spacer>
            <v-btn
              @click="printPlan"
              prepend-icon="mdi-printer"
              color="secondary"
            >
              Print
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Shopping List Card -->
      <v-row>
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-cart"></v-icon>
              Weekly Shopping List
            </v-card-title>
            <v-divider></v-divider>
            <v-list>
              <v-list-item v-for="[name, amounts] in shoppingList" :key="name">
                <v-list-item-title class="font-weight-bold">
                  {{ name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ amounts.join(", ") }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Daily Meal Plan Breakdown -->
      <v-row v-for="day in weeklyPlan" :key="day.name">
        <v-col cols="12" md="8" offset-md="2">
          <h2 class="text-h5 mb-2">{{ day.name }}</h2>
          <v-card class="mb-4" v-for="meal in day.meals" :key="meal.mealTime">
            <v-card-title class="d-flex justify-space-between">
              <span>{{ meal.mealTime }}</span>
              <span class="text-subtitle-1 font-weight-light">
                {{ meal.totals.calories }} kcal | P:{{ meal.totals.protein }}g |
                C:{{ meal.totals.carbs }}g | F:{{ meal.totals.fat }}g
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-list lines="one">
              <v-list-item
                v-for="recipe in meal.recipes"
                :key="recipe.id"
                :title="recipe.name"
                :prepend-avatar="recipe.imageUrl"
              ></v-list-item>
            </v-list>
          </v-card>
          <v-card variant="tonal" color="primary" class="mb-6 pa-2">
            <div class="d-flex justify-space-around text-center">
              <div>
                <div class="text-caption">Total Calories</div>
                <div class="font-weight-bold">{{ day.dayTotals.calories }}</div>
              </div>
              <div>
                <div class="text-caption">Total Protein</div>
                <div class="font-weight-bold">{{ day.dayTotals.protein }}g</div>
              </div>
              <div>
                <div class="text-caption">Total Carbs</div>
                <div class="font-weight-bold">{{ day.dayTotals.carbs }}g</div>
              </div>
              <div>
                <div class="text-caption">Total Fat</div>
                <div class="font-weight-bold">{{ day.dayTotals.fat }}g</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";

const route = useRoute();
const { clients, recipes } = useDataStore();

const client = computed(() => {
  const clientId = Number(route.params.id);
  return clients.value.find((c) => c.id === clientId);
});

// New computed property to structure the entire weekly plan for easy display
const weeklyPlan = computed(() => {
  if (!client.value) return [];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  return daysOfWeek.map((dayName) => {
    const dayKey = dayName.toLowerCase();
    const dayMeals = client.value.mealPlan[dayKey] || [];

    const meals = mealTimes
      .map((mealTime) => {
        const mealRecipes = dayMeals
          .filter((meal) => meal.mealTime === mealTime)
          .map((meal) => recipes.value.find((r) => r.id === meal.recipeId))
          .filter(Boolean);

        const mealTotals = mealRecipes.reduce(
          (acc, recipe) => {
            acc.calories += recipe.calories || 0;
            acc.protein += recipe.protein || 0;
            acc.carbs += recipe.carbs || 0;
            acc.fat += recipe.fat || 0;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        return { mealTime, recipes: mealRecipes, totals: mealTotals };
      })
      .filter((meal) => meal.recipes.length > 0); // Only show mealtimes that have recipes

    const dayTotals = meals.reduce(
      (acc, meal) => {
        acc.calories += meal.totals.calories;
        acc.protein += meal.totals.protein;
        acc.carbs += meal.totals.carbs;
        acc.fat += meal.totals.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return { name: dayName, meals, dayTotals };
  });
});

const shoppingList = computed(() => {
  if (!client.value) return new Map();
  // ... (shopping list logic is unchanged)
  const ingredientMap = new Map();
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  for (const day of days) {
    const meals = client.value.mealPlan[day] || [];
    for (const meal of meals) {
      const recipe = recipes.value.find((r) => r.id === meal.recipeId);
      if (!recipe || !recipe.ingredients) continue;
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLowerCase();
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, { name: ingredient.name, amounts: [] });
        }
        ingredientMap.get(key).amounts.push(ingredient.amount);
      }
    }
  }
  const aggregatedList = new Map();
  for (const item of ingredientMap.values()) {
    aggregatedList.set(item.name, item.amounts);
  }
  return aggregatedList;
});

// Function to trigger the browser's print dialog
function printPlan() {
  window.print();
}
</script>

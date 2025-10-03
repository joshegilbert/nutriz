<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client plan...</p>
    </div>
    <div v-else>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn :to="`/clients/${client.id}`" icon="mdi-arrow-left" variant="text" class="mr-2"></v-btn>
            <div>
              <h1 class="text-h4">Meal Plan Summary</h1>
              <div class="text-h6 font-weight-light">{{ client.name }}</div>
            </div>
            <v-spacer></v-spacer>
            <v-btn @click="printPlan" prepend-icon="mdi-printer" color="secondary">Print</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-cart"></v-icon>
              Weekly Shopping List
            </v-card-title>
            <v-divider></v-divider>
            <v-list>
              <v-list-item v-for="item in shoppingList" :key="item.id">
                <v-list-item-title class="font-weight-bold">{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.amount }} {{ item.unit }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>

          <v-card class="mb-6" v-if="client.additionalOptions && client.additionalOptions.length > 0">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-plus-circle-outline"></v-icon>
              Additional Options
            </v-card-title>
            <v-divider></v-divider>
            <v-list dense>
              <v-list-item v-for="(option, index) in client.additionalOptions" :key="index">
                <v-list-item-title>{{ option }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
      

      <v-row v-for="day in weeklyPlan" :key="day.name">
        <v-col cols="12" md="8" offset-md="2">
          <h2 class="text-h5 mb-2">{{ day.name }}</h2>
          <v-card class="mb-4" v-for="meal in day.meals" :key="meal.mealTime">
            <v-card-title class="d-flex justify-space-between flex-wrap">
              <span>{{ meal.mealTime }}</span>
              <span class="text-subtitle-2 font-weight-light">
                {{ meal.totals.calories.toFixed(0) }} kcal | P:{{ meal.totals.protein.toFixed(0) }}g | C:{{ meal.totals.carbs.toFixed(0) }}g | F:{{ meal.totals.fat.toFixed(0) }}g
              </span>
            </v-card-title>
            <v-divider></v-divider>
            <v-list lines="one">
              <v-list-item
                v-for="(item, index) in meal.items"
                :key="index"
                :title="item.details.name"
                :subtitle="item.notes"
              ></v-list-item>
            </v-list>
          </v-card>
          <v-card variant="tonal" color="primary" class="mb-6 pa-2">
            Water Intake Goal: {{ client.waterIntakeGoal || 0 }} ml
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
import { storeToRefs } from "pinia";

const route = useRoute();
const dataStore = useDataStore();

// Correctly get data and functions from the Pinia store
const { getItemDetails, calculateItemMacros } = dataStore;
const { clients, foods } = storeToRefs(dataStore);

const client = computed(() => {
  const clientId = Number(route.params.id);
  // Assuming client object might now have waterIntakeGoal and additionalOptions
  const foundClient = clients.value.find((c) => c.id === clientId);
  // Provide default values if not present to avoid errors
  if (foundClient) {
    if (!foundClient.waterIntakeGoal) foundClient.waterIntakeGoal = 2000; // Default to 2000ml
    if (!foundClient.additionalOptions) foundClient.additionalOptions = [];
  }
  return foundClient;
});

// NEW: Fully implemented weeklyPlan computed property
const weeklyPlan = computed(() => {
  if (!client.value?.mealPlan) return [];

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  return daysOfWeek.map(dayKey => {
    const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    const planForDay = client.value.mealPlan[dayKey] || [];

    const meals = mealTimes.map(mealTime => {
      const itemsForMealtime = planForDay.filter(item => item.mealTime === mealTime);
      
      const itemsWithDetails = itemsForMealtime.map(item => ({
        ...item,
        details: getItemDetails(item.type, item.id)
      }));

      const totals = itemsWithDetails.reduce((acc, item) => {
        const itemMacros = calculateItemMacros(item.type, item.id, item.amount);
        acc.calories += itemMacros.calories;
        acc.protein += itemMacros.protein;
        acc.carbs += itemMacros.carbs;
        acc.fat += itemMacros.fat;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return { mealTime, items: itemsWithDetails, totals };
    }).filter(meal => meal.items.length > 0);

    return { name: dayName, meals };
  });
});

// NEW: Fully implemented shoppingList computed property
const shoppingList = computed(() => {
    if (!client.value?.mealPlan) return [];
    
    const ingredientsMap = new Map();

    // Helper function to break down any meal plan item into its base foods
    function addComponentsToMap(type, id, quantity = 1) {
        const item = getItemDetails(type, id);
        if (!item) return;

        if (type === 'food') {
            const key = `${item.id}-${item.unit}`;
            if (!ingredientsMap.has(key)) {
                ingredientsMap.set(key, { ...item, amount: 0 });
            }
            ingredientsMap.get(key).amount += quantity;
        } else if (item.ingredients) { // For meals and recipes
            item.ingredients.forEach(ingredient => {
              // Recursively add components, scaling by the parent item's quantity
              addComponentsToMap('food', ingredient.foodId, ingredient.quantity * quantity);
            });
        } else if (item.components) { // For recipes that might directly list components (foods/meals)
           item.components.forEach(component => {
              addComponentsToMap(component.type, component.id, component.amount * quantity);
           });
        }
    }

    // Iterate over the entire weekly plan
    Object.values(client.value.mealPlan).flat().forEach(planItem => {
        addComponentsToMap(planItem.type, planItem.id, planItem.amount);
    });

    return Array.from(ingredientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});


function printPlan() {
  window.print();
}
</script>
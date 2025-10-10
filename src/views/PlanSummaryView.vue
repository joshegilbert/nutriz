<template>
  <v-container>
    <div v-if="isLoading" class="py-10 text-center text-grey">
      Loading client plan…
    </div>

    <div v-else-if="!program">
      <v-alert type="info" variant="tonal">
        No plan found for this client yet.
      </v-alert>
    </div>

    <div v-else>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4 flex-wrap gap-3">
            <v-btn
              :to="`/clients/${client?.id}`"
              icon="mdi-arrow-left"
              variant="text"
            />
            <div>
              <h1 class="text-h4 mb-1">Meal Plan Summary</h1>
              <div class="text-h6 font-weight-light">
                {{ client?.name }}
              </div>
            </div>
            <v-spacer />
            <v-btn prepend-icon="mdi-printer" color="secondary" @click="printPlan">
              Print
            </v-btn>
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
            <v-divider />
            <v-card-text>
              <div v-if="!shoppingList.length" class="text-grey text-body-2">
                Add foods, recipes, or meals to generate a shopping list.
              </div>
              <v-list v-else density="comfortable">
                <v-list-item v-for="item in shoppingList" :key="item.key">
                  <v-list-item-title class="font-weight-medium">
                    {{ item.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ item.amount.toFixed(2) }} {{ item.unit }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row
        v-for="day in weeklyPlan"
        :key="day.date"
      >
        <v-col cols="12" md="8" offset-md="2">
          <h2 class="text-h5 mb-2">
            {{ day.label }}
          </h2>
          <v-card
            v-for="meal in day.meals"
            :key="meal.id"
            class="mb-4"
          >
            <v-card-title class="d-flex justify-space-between align-center flex-wrap">
              <div>
                <span class="text-subtitle-1 font-weight-medium">
                  {{ meal.name }}
                </span>
                <span v-if="meal.time" class="text-caption text-grey ml-2">
                  {{ meal.time }}
                </span>
              </div>
              <span class="text-caption text-grey">
                {{ meal.totals.calories }} kcal ·
                {{ meal.totals.protein }}P /
                {{ meal.totals.carbs }}C /
                {{ meal.totals.fat }}F
              </span>
            </v-card-title>
            <v-divider />
            <v-list v-if="meal.items.length" lines="one">
              <v-list-item
                v-for="item in meal.items"
                :key="item.id"
                :title="item.displayName"
                :subtitle="item.notes"
              >
                <template #append>
                  <div class="text-caption text-grey">
                    {{ item.amount }} {{ item.unit }}
                    · {{ item.macros.calories }} kcal
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="py-2 px-4 text-body-2 text-grey">
              No items recorded.
            </div>
          </v-card>
          <v-card variant="tonal" color="primary" class="mb-8 pa-3">
            Daily total:
            {{ day.totals.calories }} kcal ·
            {{ day.totals.protein }}P /
            {{ day.totals.carbs }}C /
            {{ day.totals.fat }}F
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";
import { format, parseISO } from "date-fns";

const route = useRoute();
const dataStore = useDataStore();
const { clients, foods, meals, recipes } = storeToRefs(dataStore);

const clientId = computed(() => Number(route.params.id));
const client = computed(() =>
  clients.value.find((entry) => entry.id === clientId.value) || null
);

const program = ref(null);
const isLoading = ref(true);

onMounted(async () => {
  program.value = await dataStore.getProgramByClientId(clientId.value);
  isLoading.value = false;
});

const weeklyPlan = computed(() => {
  if (!program.value) return [];
  return (program.value.days || []).map((day) => {
    const dayDate = parseISO(day.date);
    const mealsForDay = (day.meals || []).map((meal) => {
      const totals = dataStore.calcMealTotals(meal);
      const items = (meal.items || []).map((item) => {
        const detail = dataStore.getItemDetails(item.type, item.sourceId);
        return {
          ...item,
          displayName:
            item.name ||
            detail?.name ||
            (item.type === "custom" ? "Custom item" : "Unnamed item"),
          macros:
            item.macrosSource === "overridden"
              ? item.macros
              : dataStore.calculateItemMacros(
                  item.type,
                  item.sourceId,
                  item.amount || 1
                ),
        };
      });
      return {
        ...meal,
        name: meal.name || meal.mealTime,
        totals,
        items,
      };
    });

    const totals =
      day.macrosSource === "overridden"
        ? day.macros
        : mealsForDay.reduce(
            (acc, meal) => {
              acc.calories += meal.totals.calories;
              acc.protein += meal.totals.protein;
              acc.carbs += meal.totals.carbs;
              acc.fat += meal.totals.fat;
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

    return {
      date: day.date,
      label: format(dayDate, "EEEE, MMM d"),
      meals: mealsForDay,
      totals,
    };
  });
});

const shoppingList = computed(() => {
  if (!program.value) return [];
  const accumulator = new Map();

  const addFood = (food, amount) => {
    if (!food || !amount) return;
    const key = `food-${food.id}-${food.servingUnit}`;
    if (!accumulator.has(key)) {
      accumulator.set(key, {
        key,
        name: `${food.brand ? `${food.brand} · ` : ""}${food.name}`,
        amount: 0,
        unit: food.servingUnit || "serving",
      });
    }
    accumulator.get(key).amount += amount;
  };

  const expandItem = (item, multiplier = 1) => {
    if (!item) return;
    if (item.type === "food") {
      const food = foods.value.find((f) => f.id === item.sourceId);
      addFood(food, multiplier * (item.amount || 1));
      return;
    }
    if (item.type === "meal") {
      const template = meals.value.find((m) => m.id === item.sourceId);
      (template?.components || []).forEach((component) => {
        const factor = multiplier * (item.amount || 1) * (component.amount || 1);
        const food = foods.value.find((f) => f.id === component.foodId);
        addFood(food, factor);
      });
      return;
    }
    if (item.type === "recipe") {
      const recipe = recipes.value.find((r) => r.id === item.sourceId);
      (recipe?.components || recipe?.ingredients || []).forEach((component) => {
        if (component.foodId) {
          const food = foods.value.find((f) => f.id === component.foodId);
          const factor = multiplier * (item.amount || 1) * (component.amount || 1);
          addFood(food, factor);
        } else if (component.type && component.id) {
          expandItem(
            {
              type: component.type,
              sourceId: component.id,
              amount: (component.amount || 1) * (item.amount || 1),
            },
            multiplier
          );
        }
      });
      return;
    }
    if (item.type === "custom") {
      const key = `custom-${item.name}`;
      if (!accumulator.has(key)) {
        accumulator.set(key, {
          key,
          name: item.name || "Custom item",
          amount: multiplier * (item.amount || 1),
          unit: item.unit || "serving",
        });
      } else {
        accumulator.get(key).amount += multiplier * (item.amount || 1);
      }
    }
  };

  (program.value.days || []).forEach((day) => {
    (day.meals || []).forEach((meal) => {
      (meal.items || []).forEach((item) => expandItem(item, 1));
    });
  });

  return Array.from(accumulator.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});

function printPlan() {
  window.print();
}
</script>

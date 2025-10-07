import { defineStore } from "pinia";
import { ref } from "vue";

export const MEAL_TIMES = Object.freeze([
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
]);

export const useDataStore = defineStore("data", () => {
  // --- DATABASE TIER 1: FOODS ---
  const foods = ref([
    {
      id: 101, brand: "Fage", name: "Total 2% Greek Yogurt",
      servingSize: 1, servingUnit: "170g container",
      macrosPerServing: { calories: 150, protein: 20, carbs: 7, fat: 4, fiber: 0 }
    },
    {
      id: 102, brand: "Kirkland Signature", name: "Organic Berries",
      servingSize: 1, servingUnit: "cup",
      macrosPerServing: { calories: 70, protein: 1, carbs: 17, fat: 0.5, fiber: 4 }
    },
    {
      id: 103, brand: "Nature Valley", name: "Protein Chewy Bars",
      servingSize: 1, servingUnit: "bar",
      macrosPerServing: { calories: 190, protein: 10, carbs: 14, fat: 12, fiber: 5 }
    },
    {
      id: 104, brand: "Generic", name: "Chicken Breast",
      servingSize: 100, servingUnit: "g",
      macrosPerServing: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }
    }
  ]);

  // --- DATABASE TIER 2: MEALS ---
  const meals = ref([
    {
      id: 201,
      name: "Yogurt Bowl",
      components: [
        { foodId: 101, amount: 1 },
        { foodId: 102, amount: 0.5 }
      ]
    }
  ]);

  // --- DATABASE TIER 3: RECIPES ---
  const recipes = ref([
    {
      id: 301,
      name: "Simple Grilled Chicken",
      instructions: "1. Season chicken breast. 2. Grill until cooked through.",
      components: [
        { type: "food", foodId: 104, amount: 1.5 } // 150g
      ]
    }
  ]);

  // --- CLIENT DATA ---
  const clients = ref([
    {
      id: 1,
      name: "John Doe",
      status: "Active",
      programs: [
        {
          id: 1,
          clientId: 1,
          startDate: "2025-10-02",
          length: 14,
          days: [
            {
              date: "2025-10-02",
              meals: [
                {
                  mealTime: "Breakfast",
                  items: [
                    {
                      id: 1,
                      type: "food",       // could also be "meal" or "recipe"
                      sourceId: 201,      // links to meals DB
                      amount: 1,
                      macros: {
                        calories: 300,
                        protein: 20,
                        carbs: 40,
                        fat: 10
                      }
                    }
                  ]
                },
                { mealTime: "Lunch", items: [] }
              ]
            },
            {
              date: "2025-10-03",
              meals: [
                { mealTime: "Breakfast", items: [] },
                { mealTime: "Lunch", items: [] },
                { mealTime: "Dinner", items: [] },
                { mealTime: "Snacks", items: [] }
              ]
            }
          ]
        }
      ]
    }
  ]);

  // --- RETURN REACTIVE DATA ---
  function getClientById(clientId) {
    return clients.value.find((client) => client.id === clientId);
  }

  function getProgramById(clientId, programId) {
    const client = getClientById(clientId);
    if (!client) return undefined;
    return client.programs?.find((program) => program.id === programId);
  }

  function ensureMealsForDay(day) {
    if (!day) return undefined;

    if (!Array.isArray(day.meals)) {
      day.meals = [];
    }

    MEAL_TIMES.forEach((mealTime) => {
      if (!day.meals.some((meal) => meal.mealTime === mealTime)) {
        day.meals.push({ mealTime, items: [] });
      }
    });

    day.meals.sort(
      (a, b) => MEAL_TIMES.indexOf(a.mealTime) - MEAL_TIMES.indexOf(b.mealTime)
    );

    return day;
  }

  function removeProgramItem({ clientId, programId, dayIso, mealTime, itemId }) {
    const program = getProgramById(clientId, programId);
    if (!program) return false;

    const day = program.days?.find((entry) => entry.date === dayIso);
    if (!day) return false;

    ensureMealsForDay(day);
    const meal = day.meals.find((entry) => entry.mealTime === mealTime);
    if (!meal) return false;

    const index = meal.items?.findIndex((item) => item.id === itemId) ?? -1;
    if (index === -1) return false;

    meal.items.splice(index, 1);
    return true;
  }

  return {
    foods,
    meals,
    recipes,
    clients,
    getClientById,
    getProgramById,
    ensureMealsForDay,
    removeProgramItem,
  };
});

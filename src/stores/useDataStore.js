import { defineStore } from "pinia";
import { ref } from "vue";

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
                      type: "food",      // could also be "meal" or "recipe"
                      sourceId: 201,     // links to meals DB
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

  // --- HELPER: ensure macros + macrosSource exist everywhere ---
  function initializeProgramData(clients) {
    for (const client of clients) {
      if (!client.programs) continue;

      for (const program of client.programs) {
        if (!program.days) continue;

        for (const day of program.days) {
          // Ensure day-level macros
          if (!day.macros) {
            day.macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
          }
          if (!day.macrosSource) {
            day.macrosSource = "auto";
          }

          for (const meal of day.meals || []) {
            // Ensure meal-level macros
            if (!meal.macros) {
              meal.macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            }
            if (!meal.macrosSource) {
              meal.macrosSource = "auto";
            }

            for (const item of meal.items || []) {
              // Ensure item-level macros + macrosSource
              if (!item.macros) {
                item.macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
              }
              if (!item.macrosSource) {
                item.macrosSource = "auto";
              }
            }
          }
        }
      }
    }
  }

  // --- RUN INITIALIZER ONCE ---
  initializeProgramData(clients.value);

  // --- RETURN REACTIVE DATA ---
  return { foods, meals, recipes, clients };
});

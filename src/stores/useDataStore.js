import { defineStore } from "pinia";
import { ref } from "vue";
import { toRaw } from "vue";

export const MEAL_TIMES = Object.freeze([
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
]);

export const useDataStore = defineStore("data", () => {
  // ---------------------------------------------------------------------------
  //  DATA
  // ---------------------------------------------------------------------------
  const foods = ref([
    {
      id: 101,
      brand: "Fage",
      name: "Total 2% Greek Yogurt",
      servingSize: 1,
      servingUnit: "170g container",
      macrosPerServing: { calories: 150, protein: 20, carbs: 7, fat: 4, fiber: 0 },
    },
    {
      id: 102,
      brand: "Kirkland Signature",
      name: "Organic Berries",
      servingSize: 1,
      servingUnit: "cup",
      macrosPerServing: { calories: 70, protein: 1, carbs: 17, fat: 0.5, fiber: 4 },
    },
    {
      id: 103,
      brand: "Nature Valley",
      name: "Protein Chewy Bars",
      servingSize: 1,
      servingUnit: "bar",
      macrosPerServing: { calories: 190, protein: 10, carbs: 14, fat: 12, fiber: 5 },
    },
    {
      id: 104,
      brand: "Generic",
      name: "Chicken Breast",
      servingSize: 100,
      servingUnit: "g",
      macrosPerServing: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    },
  ]);

  const meals = ref([
    {
      id: 201,
      name: "Yogurt Bowl",
      components: [
        { foodId: 101, amount: 1 },
        { foodId: 102, amount: 0.5 },
      ],
    },
  ]);

  const recipes = ref([
    {
      id: 301,
      name: "Simple Grilled Chicken",
      instructions: "1. Season chicken breast. 2. Grill until cooked through.",
      components: [{ type: "food", foodId: 104, amount: 1.5 }],
    },
  ]);

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
          length: 7,
          days: [],
        },
      ],
    },
  ]);

  // ---------------------------------------------------------------------------
  //  HELPERS
  // ---------------------------------------------------------------------------
  function findProgram(programId) {
    for (const client of clients.value) {
      const program = client.programs.find((p) => p.id === programId);
      if (program) return program;
    }
    return null;
  }

  function recalcMealTotals(meal) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const item of meal.items) {
      totals.calories += item.macros?.calories || 0;
      totals.protein += item.macros?.protein || 0;
      totals.carbs += item.macros?.carbs || 0;
      totals.fat += item.macros?.fat || 0;
    }
    meal.macros = totals;
  }

  function recalcDayTotals(day) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const meal of day.meals) {
      recalcMealTotals(meal);
      totals.calories += meal.macros.calories;
      totals.protein += meal.macros.protein;
      totals.carbs += meal.macros.carbs;
      totals.fat += meal.macros.fat;
    }
    day.macros = totals;
  }

  function initializeProgramData() {
    for (const client of clients.value) {
      for (const program of client.programs) {
        const start = new Date(program.startDate);
        program.days = [];

        for (let i = 0; i < program.length; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const isoDate = date.toISOString().split("T")[0];

          program.days.push({
            date: isoDate,
            meals: [
              { mealTime: "Breakfast", items: [] },
              { mealTime: "Lunch", items: [] },
              { mealTime: "Dinner", items: [] },
              { mealTime: "Snacks", items: [] },
            ],
            macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            macrosSource: "auto",
          });
        }
      }
    }
  }

  initializeProgramData();

  // ---------------------------------------------------------------------------
  //  ACTIONS
  // ---------------------------------------------------------------------------
  async function getProgramByClientId(clientId) {
    const client = clients.value.find((c) => c.id === clientId);
    return client ? client.programs[0] : null;
  }

  function updateProgram(updatedProgram) {
    const client = clients.value.find((c) => c.id === updatedProgram.clientId);
    if (!client) return;
  
    const index = client.programs.findIndex((p) => p.id === updatedProgram.id);
    if (index !== -1) {
      // Fix: convert from reactive proxy → plain object
      client.programs[index] = JSON.parse(
        JSON.stringify(toRaw(updatedProgram))
      );
    }
  }

  function calcMealTotals(meal) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!meal || !meal.items) return totals;
  
    for (const item of meal.items) {
      totals.calories += item.macros?.calories || 0;
      totals.protein += item.macros?.protein || 0;
      totals.carbs += item.macros?.carbs || 0;
      totals.fat += item.macros?.fat || 0;
    }
  
    totals.calories = Math.round(totals.calories);
    totals.protein = +totals.protein.toFixed(1);
    totals.carbs = +totals.carbs.toFixed(1);
    totals.fat = +totals.fat.toFixed(1);
  
    return totals;
  }
  

  // ---------------------------------------------------------------------------
  //  RETURN
  // ---------------------------------------------------------------------------
  return {
    foods,
    meals,
    recipes,
    clients,
    getProgramByClientId,
    updateProgram,
    recalcDayTotals,
    calcMealTotals,
    recalcMealTotals,
  };
});

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
      id: 201, name: "Yogurt Bowl",
      components: [
        { foodId: 101, amount: 1 },
        { foodId: 102, amount: 0.5 },
      ]
    }
  ]);

  // --- DATABASE TIER 3: RECIPES ---
  const recipes = ref([
    {
      id: 301, name: "Simple Grilled Chicken", instructions: "1. Season chicken breast. 2. Grill until cooked through.",
      components: [
        {
          type: 'food',
          foodId: 104,
          amount: 1.5, // Represents 150g
        }
      ]
    }
  ]);

  // --- CLIENT DATA ---
  const clients = ref([
    {
      id: 1,
      name: "Jane Doe",
      email: "jane.doe@example.com",
      status: "Active",
      program: [
        { // Week 1
          weekNumber: 1,
          waterTargetMl: 2500,
          days: {
            monday: [
              { 
                id: Date.now() + 1, type: "meal", sourceId: 201, mealTime: "Breakfast", time: "8:00 AM", amount: 1, notes: "Add cinnamon if desired.",
                components: [
                  { id: Date.now() + 11, type: 'food', sourceId: 101, amount: 1.25, macros: { calories: 187.5, protein: 25, carbs: 8.75, fat: 5, fiber: 0 }, expanded: false },
                  { id: Date.now() + 12, type: 'food', sourceId: 102, amount: 0.5, macros: { calories: 35, protein: 0.5, carbs: 8.5, fat: 0.25, fiber: 2 }, expanded: false },
                ],
                expanded: false
              },
              {
                id: Date.now() + 2, type: "food", sourceId: 103, mealTime: "Snacks", time: "3:00 PM", amount: 1, notes: "Pre-workout snack.",
                macros: { calories: 190, protein: 10, carbs: 14, fat: 12, fiber: 5 },
                expanded: false
              }
            ],
            tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
          }
        },
      ]
    }
  ]);

  return { foods, meals, recipes, clients };
});
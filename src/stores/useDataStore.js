import { ref } from "vue";

const clients = ref([
  {
    id: 1,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    status: "Active",
    last_active: "2025-09-21",
    mealPlan: {
      monday: [
        { mealTime: "Breakfast", recipeId: 4 },
        { mealTime: "Lunch", recipeId: 3 },
        { mealTime: "Dinner", recipeId: 1 },
      ],
      tuesday: [{ mealTime: "Dinner", recipeId: 2 }],
      wednesday: [],
      thursday: [{ mealTime: "Breakfast", recipeId: 4 }],
      friday: [{ mealTime: "Dinner", recipeId: 1 }],
      saturday: [],
      sunday: [],
    },
  },

  {
    id: 2,
    name: "John Smith",
    email: "john.smith@example.com",
    status: "Active",
    last_active: "2025-09-20",
    mealPlan: {
      monday: [4],
      tuesday: [],
      wednesday: [2, 3],
      thursday: [],
      friday: [],
      saturday: [1],
      sunday: [],
    },
  },
  {
    id: 3,
    name: "Peter Jones",
    email: "peter.jones@example.com",
    status: "Pending",
    last_active: "2025-09-15",
    mealPlan: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  },
]);

const recipes = ref([
  {
    id: 1,
    name: "Chicken and Broccoli Stir-fry",
    description: "A classic healthy meal, perfect for weeknights.",
    calories: 450,
    protein: 50,
    carbs: 15,
    fat: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1580959375944-abd7d992f9da?q=80&w=800",
    ingredients: [
      { amount: "150g", name: "Chicken Breast" },
      { amount: "1 cup", name: "Broccoli Florets" },
      { amount: "1 tbsp", name: "Soy Sauce" },
    ],
    instructions:
      "1. Cook chicken in a hot pan.\n2. Add broccoli and stir-fry until tender.\n3. Add soy sauce and serve.",
    tags: ["High Protein", "Quick Meal", "Dinner"],
  },
  {
    id: 2,
    name: "Salmon with Asparagus",
    description: "Rich in omega-3s and packed with flavor.",
    calories: 550,
    protein: 45,
    carbs: 10,
    fat: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800",
    ingredients: [
      { amount: "200g", name: "Salmon Fillet" },
      { amount: "1 bunch", name: "Asparagus" },
      { amount: "1 tbsp", name: "Olive Oil" },
      { amount: "1", name: "Lemon" },
    ],
    instructions:
      "1. Toss asparagus with olive oil.\n2. Season salmon with salt and pepper.\n3. Bake at 400°F (200°C) for 12-15 minutes.\n4. Squeeze lemon over the top before serving.",
    tags: ["High Protein", "Keto Friendly"],
  },
]);

export function useDataStore() {
  return { clients, recipes };
}

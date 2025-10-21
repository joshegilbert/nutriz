const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
const Recipe = require("../models/Recipe");
const Client = require("../models/Client");

const seedUserEmail = process.env.SEED_EMAIL || "coach@nutriz.com";
const seedUserPassword = process.env.SEED_PASSWORD || "DemoPass123!";

const sampleFoods = [
  {
    name: "Grilled Chicken Breast",
    category: "Protein",
    defaultServingSize: "120g",
    caloriesPerServing: 198,
    proteinPerServing: 37,
    carbsPerServing: 0,
    fatPerServing: 5,
  },
  {
    name: "Quinoa",
    category: "Grain",
    defaultServingSize: "140g cooked",
    caloriesPerServing: 222,
    proteinPerServing: 8,
    carbsPerServing: 39,
    fatPerServing: 4,
  },
  {
    name: "Roasted Sweet Potato",
    category: "Vegetable",
    defaultServingSize: "150g",
    caloriesPerServing: 135,
    proteinPerServing: 3,
    carbsPerServing: 32,
    fatPerServing: 0.2,
  },
  {
    name: "Avocado",
    category: "Fat",
    defaultServingSize: "1/2 medium",
    caloriesPerServing: 120,
    proteinPerServing: 1.5,
    carbsPerServing: 6,
    fatPerServing: 10,
  },
  {
    name: "Baby Spinach",
    category: "Vegetable",
    defaultServingSize: "2 cups",
    caloriesPerServing: 14,
    proteinPerServing: 2,
    carbsPerServing: 2,
    fatPerServing: 0.2,
  },
  {
    name: "Toasted Almonds",
    category: "Fat",
    defaultServingSize: "28g",
    caloriesPerServing: 164,
    proteinPerServing: 6,
    carbsPerServing: 6,
    fatPerServing: 14,
  },
];

const sampleRecipes = [
  {
    name: "Mediterranean Power Bowl",
    description:
      "Colourful bowl with lean protein, whole grains, and healthy fats.",
    instructions:
      "Layer quinoa, chicken, and vegetables in a bowl. Top with avocado slices and a squeeze of lemon.",
    tags: ["Lunch", "Balanced"],
    ingredients: [
      {
        foodName: "Grilled Chicken Breast",
        quantity: 1,
        amount: "1 serving",
        notes: "Sliced",
      },
      { foodName: "Quinoa", quantity: 1, amount: "1 cup", notes: "Cooked" },
      {
        foodName: "Baby Spinach",
        quantity: 1,
        amount: "2 cups",
        notes: "Fresh",
      },
      {
        foodName: "Roasted Sweet Potato",
        quantity: 1,
        amount: "1 cup",
        notes: "Cubed",
      },
      {
        foodName: "Avocado",
        quantity: 1,
        amount: "1/2 medium",
        notes: "Diced",
      },
    ],
  },
  {
    name: "Recovery Greens Smoothie",
    description:
      "Post-training smoothie rich in micronutrients and healthy fats.",
    instructions:
      "Blend spinach with avocado, almond milk, and ice until silky smooth. Garnish with crushed almonds.",
    tags: ["Snack", "Recovery"],
    ingredients: [
      {
        foodName: "Baby Spinach",
        quantity: 1.5,
        amount: "3 cups",
        notes: "Packed",
      },
      { foodName: "Avocado", quantity: 1, amount: "1/2 medium", notes: "Ripe" },
      {
        foodName: "Toasted Almonds",
        quantity: 0.5,
        amount: "2 tbsp",
        notes: "Crushed",
      },
    ],
  },
];

const sampleClients = [
  {
    name: "Jordan Miles",
    dob: "1988-09-14",
    contact: { email: "jordan.miles@example.com" },
    goals: ["Improve post-training recovery", "Dial in race-week nutrition"],
    notes:
      "Masters triathlete training for a 70.3 event. Prefers plant-forward dinners.",
  },
  {
    name: "Sofia Bennett",
    dob: "1995-02-03",
    contact: { email: "sofia.bennett@example.com", phone: "555-201-8844" },
    goals: ["Build lean mass", "Increase daily protein intake"],
    notes:
      "Works rotating shifts. Needs portable breakfast options and batch-friendly lunches.",
  },
];

async function ensureSeedUser() {
  let user = await User.findOne({ email: seedUserEmail });
  let created = false;

  if (!user) {
    user = await User.create({
      email: seedUserEmail,
      password: seedUserPassword,
      role: "nutritionist",
    });
    created = true;
  }

  return { user, created };
}

async function upsertFoods(nutritionistId) {
  const results = {};

  for (const item of sampleFoods) {
    const doc = await FoodItem.findOneAndUpdate(
      { nutritionist: nutritionistId, name: item.name },
      { $set: { ...item, nutritionist: nutritionistId } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    results[item.name] = doc;
  }

  return results;
}

async function upsertRecipes(nutritionistId, foodsByName) {
  const created = [];

  for (const recipe of sampleRecipes) {
    const ingredients = recipe.ingredients
      .map((ingredient) => {
        const food = foodsByName[ingredient.foodName];
        if (!food) return null;
        return {
          foodItem: food._id,
          amount: ingredient.amount,
          quantity: ingredient.quantity,
          notes: ingredient.notes,
        };
      })
      .filter(Boolean);

    const doc = await Recipe.findOneAndUpdate(
      { nutritionist: nutritionistId, name: recipe.name },
      {
        $set: {
          nutritionist: nutritionistId,
          description: recipe.description,
          instructions: recipe.instructions,
          ingredients,
          tags: recipe.tags,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    created.push(doc);
  }

  return created;
}

async function upsertClients(nutritionistId) {
  const created = [];

  for (const client of sampleClients) {
    const doc = await Client.findOneAndUpdate(
      { nutritionist: nutritionistId, name: client.name },
      {
        $set: {
          nutritionist: nutritionistId,
          dob: client.dob,
          contact: client.contact,
          goals: client.goals,
          notes: client.notes,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    created.push(doc);
  }

  return created;
}

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    const { user, created } = await ensureSeedUser();
    console.log(
      created
        ? `Created demo nutritionist account: ${user.email}`
        : `Using existing nutritionist account: ${user.email}`
    );

    const foodsByName = await upsertFoods(user._id);
    console.log(`Ensured ${Object.keys(foodsByName).length} food items.`);

    const recipes = await upsertRecipes(user._id, foodsByName);
    console.log(`Ensured ${recipes.length} recipes.`);

    const clients = await upsertClients(user._id);
    console.log(`Ensured ${clients.length} clients.`);

    console.log("\nSample data ready!");
    console.log("Login with:");
    console.log(`  email:    ${seedUserEmail}`);
    console.log(`  password: ${seedUserPassword}`);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();

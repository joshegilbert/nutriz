// controllers/recipeController.js
const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const FoodItem = require('../models/FoodItem'); // Needed to populate and calculate nutrition

// Helper function to calculate total nutrition for a recipe
const calculateRecipeNutrition = async (ingredients) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const item of ingredients) {
        const foodItem = await FoodItem.findById(item.foodItem);
        if (foodItem) {
            // Simple parsing for amount - this is a simplification.
            // A more robust solution would involve a dedicated unit parsing library.
            // For now, let's assume 'amount' is a number followed by a unit (e.g., "100g", "2 cups")
            // Or, more simply, we can ask the user to input a multiplier.
            // For this example, let's assume 'amount' is a string like "100g" and we need to match it to foodItem.defaultServingSize
            // THIS IS A CRITICAL AREA FOR FURTHER REFINEMENT BASED ON UX
            // For demonstration, let's just assume 1 serving of each ingredient
            // A proper implementation would need to parse 'amount' (e.g., "200g")
            // and foodItem.defaultServingSize (e.g., "100g") to get a multiplier.

            // Simplistic approach for now: assume 'amount' implies a multiplier relative to defaultServingSize
            // E.g., if defaultServingSize is "100g" and amount is "200g", multiplier is 2.
            // This is a placeholder and needs robust unit parsing for a real app.

            // If we decide 'amount' is a simple multiplier (e.g., 1, 0.5, 2), then it's easier.
            // Let's assume 'amount' is just a descriptive string and we'll calculate based on defaultServingSize
            // or we ask for a numeric multiplier for each ingredient in the request body.

            // For now, let's just use the food item's per-serving nutrition,
            // or multiply by a predefined number (e.g., 1 serving per ingredient)
            // This will need to be refined based on how you want to handle "amount" in recipes.

            // For a basic MVP, let's consider the 'amount' field to be purely descriptive,
            // and for nutritional calculation, we either:
            // 1. Assume one default serving of the food item is used (simplest)
            // 2. Or, for each ingredient, the client sends a `multiplier` field (e.g., "2" for 2 servings)

            // Let's go with the simpler approach for now:
            // The `ingredients` array in the request body will include `multiplier`
            // Example: ingredients: [{ foodItem: 'id', amount: '200g', multiplier: 2 }]

            // Since our schema for `ingredients` only has `foodItem`, `amount`, `notes`,
            // let's adjust the frontend to send `multiplier` or we parse `amount` here.
            // Parsing `amount` like "200g" into a multiplier relative to "100g" default serving is complex.
            // Let's adjust the Recipe model to include a `quantity` field for each ingredient which is a number.

            // Temporarily, for this helper function, let's assume 'item' has a `quantity` property
            // that represents how many default servings of that foodItem are used.
            const quantity = item.quantity || 1; // Default to 1 if not provided

            totalCalories += foodItem.caloriesPerServing * quantity;
            totalProtein += foodItem.proteinPerServing * quantity;
            totalCarbs += foodItem.carbsPerServing * quantity;
            totalFat += foodItem.fatPerServing * quantity;
        }
    }

    return { totalCalories, totalProtein, totalCarbs, totalFat };
};

// @desc    Create new recipe
// @route   POST /api/recipes
// @access  Private/Nutritionist
const createRecipe = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, ingredients, instructions, tags } = req.body;

    // Validate if all foodItem IDs in ingredients exist
    for (const item of ingredients) {
        const foodItemExists = await FoodItem.findById(item.foodItem);
        if (!foodItemExists) {
            res.status(400);
            throw new Error(`Food item with ID ${item.foodItem} not found`);
        }
    }

    const recipe = await Recipe.create({
        nutritionist: req.user.id,
        name,
        description,
        imageUrl,
        ingredients, // This will store the foodItem references and amounts
        instructions,
        tags
    });

    // Populate food items and calculate nutrition for the response
    const populatedRecipe = await Recipe.findById(recipe._id)
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    // We can calculate and add total nutrition to the response here
    const { totalCalories, totalProtein, totalCarbs, totalFat } = await calculateRecipeNutrition(populatedRecipe.ingredients);

    res.status(201).json({
        ...populatedRecipe.toObject(), // Convert mongoose doc to plain object
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
    });
});

// @desc    Get all recipes for the authenticated nutritionist
// @route   GET /api/recipes
// @access  Private/Nutritionist
const getRecipes = asyncHandler(async (req, res) => {
    const recipes = await Recipe.find({ nutritionist: req.user.id })
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    // Calculate nutrition for each recipe
    const recipesWithNutrition = await Promise.all(recipes.map(async (recipe) => {
        const { totalCalories, totalProtein, totalCarbs, totalFat } = await calculateRecipeNutrition(recipe.ingredients);
        return {
            ...recipe.toObject(),
            totalCalories,
            totalProtein,
            totalCarbs,
            totalFat
        };
    }));

    res.status(200).json(recipesWithNutrition);
});

// @desc    Get single recipe by ID
// @route   GET /api/recipes/:id
// @access  Private/Nutritionist
const getRecipeById = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id })
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    // Calculate nutrition for the single recipe
    const { totalCalories, totalProtein, totalCarbs, totalFat } = await calculateRecipeNutrition(recipe.ingredients);

    res.status(200).json({
        ...recipe.toObject(),
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
    });
});

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private/Nutritionist
const updateRecipe = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, ingredients, instructions, tags } = req.body;

    let recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    // Validate if all foodItem IDs in ingredients exist for update
    if (ingredients) {
        for (const item of ingredients) {
            const foodItemExists = await FoodItem.findById(item.foodItem);
            if (!foodItemExists) {
                res.status(400);
                throw new Error(`Food item with ID ${item.foodItem} not found`);
            }
        }
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    // Recalculate nutrition for the updated recipe
    const { totalCalories, totalProtein, totalCarbs, totalFat } = await calculateRecipeNutrition(updatedRecipe.ingredients);


    res.status(200).json({
        ...updatedRecipe.toObject(),
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
    });
});

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private/Nutritionist
const deleteRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    await Recipe.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Recipe removed' });
});

module.exports = {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
};

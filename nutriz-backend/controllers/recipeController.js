// controllers/recipeController.js
const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const FoodItem = require('../models/FoodItem'); // Needed to populate and calculate nutrition
const { calculateRecipeNutrition } = require('../utils/macroCalculator');

// @desc    Create new recipe
// @route   POST /api/recipes
// @access  Private/Nutritionist
const createRecipe = asyncHandler(async (req, res) => {
    const { name, description, imageUrl, ingredients = [], instructions, tags } = req.body;

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
    const nutritionTotals = await calculateRecipeNutrition(populatedRecipe.ingredients);

    res.status(201).json({
        ...populatedRecipe.toObject(), // Convert mongoose doc to plain object
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
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
        const nutritionTotals = await calculateRecipeNutrition(recipe.ingredients);
        return {
            ...recipe.toObject(),
            totalCalories: nutritionTotals.calories,
            totalProtein: nutritionTotals.protein,
            totalCarbs: nutritionTotals.carbs,
            totalFat: nutritionTotals.fat
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
    const nutritionTotals = await calculateRecipeNutrition(recipe.ingredients);

    res.status(200).json({
        ...recipe.toObject(),
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
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
    const nutritionTotals = await calculateRecipeNutrition(updatedRecipe.ingredients);


    res.status(200).json({
        ...updatedRecipe.toObject(),
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
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

// @desc    Add ingredient to recipe
// @route   POST /api/recipes/:id/ingredients
// @access  Private/Nutritionist
const addRecipeIngredient = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    const ingredientPayload = req.body || {};

    const foodItemExists = await FoodItem.findById(ingredientPayload.foodItem);
    if (!foodItemExists) {
        res.status(400);
        throw new Error('Food item not found for ingredient');
    }

    recipe.ingredients.push({
        foodItem: ingredientPayload.foodItem,
        amount: ingredientPayload.amount,
        quantity: ingredientPayload.quantity,
        notes: ingredientPayload.notes
    });

    recipe.markModified('ingredients');
    await recipe.save();

    const populatedRecipe = await Recipe.findById(recipe._id)
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    const nutritionTotals = await calculateRecipeNutrition(populatedRecipe.ingredients);

    res.status(201).json({
        ...populatedRecipe.toObject(),
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
    });
});

// @desc    Update ingredient within recipe
// @route   PATCH /api/recipes/:id/ingredients/:ingredientId
// @access  Private/Nutritionist
const updateRecipeIngredient = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    const ingredient = recipe.ingredients.id(req.params.ingredientId);

    if (!ingredient) {
        res.status(404);
        throw new Error('Ingredient not found');
    }

    if (req.body.foodItem && req.body.foodItem.toString() !== ingredient.foodItem.toString()) {
        const foodItemExists = await FoodItem.findById(req.body.foodItem);
        if (!foodItemExists) {
            res.status(400);
            throw new Error('Food item not found for ingredient');
        }
        ingredient.foodItem = req.body.foodItem;
    }

    if (req.body.amount !== undefined) {
        ingredient.amount = req.body.amount;
    }

    if (req.body.quantity !== undefined) {
        ingredient.quantity = req.body.quantity;
    }

    if (req.body.notes !== undefined) {
        ingredient.notes = req.body.notes;
    }

    recipe.markModified('ingredients');
    await recipe.save();

    const populatedRecipe = await Recipe.findById(recipe._id)
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    const nutritionTotals = await calculateRecipeNutrition(populatedRecipe.ingredients);

    res.status(200).json({
        ...populatedRecipe.toObject(),
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
    });
});

// @desc    Delete ingredient within recipe
// @route   DELETE /api/recipes/:id/ingredients/:ingredientId
// @access  Private/Nutritionist
const deleteRecipeIngredient = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    const ingredient = recipe.ingredients.id(req.params.ingredientId);

    if (!ingredient) {
        res.status(404);
        throw new Error('Ingredient not found');
    }

    ingredient.deleteOne();
    recipe.markModified('ingredients');
    await recipe.save();

    const populatedRecipe = await Recipe.findById(recipe._id)
        .populate({
            path: 'ingredients.foodItem',
            select: 'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing'
        });

    const nutritionTotals = await calculateRecipeNutrition(populatedRecipe.ingredients);

    res.status(200).json({
        ...populatedRecipe.toObject(),
        totalCalories: nutritionTotals.calories,
        totalProtein: nutritionTotals.protein,
        totalCarbs: nutritionTotals.carbs,
        totalFat: nutritionTotals.fat
    });
});

module.exports = {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    addRecipeIngredient,
    updateRecipeIngredient,
    deleteRecipeIngredient
};

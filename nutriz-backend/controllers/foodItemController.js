// controllers/foodItemController.js
const asyncHandler = require('express-async-handler');
const FoodItem = require('../models/FoodItem');

// @desc    Create new food item
// @route   POST /api/fooditems
// @access  Private/Nutritionist
const createFoodItem = asyncHandler(async (req, res) => {
    const { name, category, defaultServingSize, gramsPerServing, caloriesPerServing, proteinPerServing, carbsPerServing, fatPerServing, servings } = req.body;

    // Check if food item already exists for this nutritionist (optional, but good for custom items)
    const foodItemExists = await FoodItem.findOne({ name, nutritionist: req.user.id });

    if (foodItemExists) {
        res.status(400);
        throw new Error('Food item with this name already exists for this nutritionist');
    }

    const foodItem = await FoodItem.create({
        nutritionist: req.user.id,
        name,
        category,
        defaultServingSize,
        gramsPerServing,
        caloriesPerServing,
        proteinPerServing,
        carbsPerServing,
        fatPerServing,
        servings: Array.isArray(servings) ? servings : []
    });

    res.status(201).json(foodItem);
});

// @desc    Get all food items (only those created by the nutritionist or public ones)
// @route   GET /api/fooditems
// @access  Private/Nutritionist
const getFoodItems = asyncHandler(async (req, res) => {
    // For now, let's just get all food items.
    // In a more complex scenario, you might have "public" food items and user-specific ones.
    const foodItems = await FoodItem.find({ nutritionist: req.user.id }); // Only get food items created by the current nutritionist
    res.status(200).json(foodItems);
});

// @desc    Get single food item by ID
// @route   GET /api/fooditems/:id
// @access  Private/Nutritionist
const getFoodItemById = asyncHandler(async (req, res) => {
    const foodItem = await FoodItem.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!foodItem) {
        res.status(404);
        throw new Error('Food item not found');
    }

    res.status(200).json(foodItem);
});

// @desc    Update food item
// @route   PUT /api/fooditems/:id
// @access  Private/Nutritionist
const updateFoodItem = asyncHandler(async (req, res) => {
    let foodItem = await FoodItem.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!foodItem) {
        res.status(404);
        throw new Error('Food item not found');
    }

    const updatedFoodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the updated document
        runValidators: true // Run Mongoose validators
    });

    res.status(200).json(updatedFoodItem);
});

// @desc    Delete food item
// @route   DELETE /api/fooditems/:id
// @access  Private/Nutritionist
const deleteFoodItem = asyncHandler(async (req, res) => {
    const foodItem = await FoodItem.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!foodItem) {
        res.status(404);
        throw new Error('Food item not found');
    }

    await FoodItem.deleteOne({ _id: req.params.id }); // Use deleteOne on the model

    res.status(200).json({ message: 'Food item removed' });
});

module.exports = {
    createFoodItem,
    getFoodItems,
    getFoodItemById,
    updateFoodItem,
    deleteFoodItem
};

// models/Recipe.js
const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    nutritionist: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to the User (Nutritionist) model
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a recipe name'],
        trim: true,
        maxlength: [100, 'Recipe name can not be more than 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    imageUrl: String,
    ingredients: [
        {
            foodItem: { // Reference to the FoodItem model
                type: mongoose.Schema.ObjectId,
                ref: 'FoodItem',
                required: true
            },
            amount: { // Descriptive string for amount (e.g., "200g", "1 cup")
                type: String,
                required: [true, 'Please specify the amount for this ingredient']
            },
            quantity: { // Numeric quantity representing how many *default servings* of the FoodItem are used
                type: Number,
                required: [true, 'Please specify the numeric quantity for this ingredient'],
                min: [0.1, 'Quantity must be at least 0.1'], // Prevent zero quantity
                default: 1
            },
            notes: String // Optional notes for this specific ingredient in the recipe
        }
    ],
    instructions: {
        type: String,
        required: [true, 'Please add instructions for the recipe']
    },
    tags: [String], // Array of strings for tags
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);

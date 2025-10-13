// models/FoodItem.js
const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema({
    nutritionist: { // Food items can also be owned by a nutritionist for custom entries
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a food item name'],
        unique: true, // Food item names should be unique for easy reference
        trim: true
    },
    category: {
        type: String,
        enum: ['Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat', 'Other'], // Define common categories
        default: 'Other'
    },
    defaultServingSize: { // e.g., "100g", "1 cup", "1 medium"
        type: String,
        required: [true, 'Please add a default serving size']
    },
    caloriesPerServing: {
        type: Number,
        required: [true, 'Please add calories per serving']
    },
    proteinPerServing: Number,
    carbsPerServing: Number,
    fatPerServing: Number,
    // You can add more nutritional info here as needed (e.g., fiber, sugar, sodium)
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.FoodItem || mongoose.model('FoodItem', FoodItemSchema);

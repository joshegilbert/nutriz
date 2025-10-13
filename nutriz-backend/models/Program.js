const mongoose = require('mongoose');

const MacroSchema = new mongoose.Schema({
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
}, { _id: false });

const MealComponentSchema = new mongoose.Schema({
    sourceType: {
        type: String,
        enum: ['food', 'recipe'],
        default: 'food'
    },
    sourceId: {
        type: mongoose.Schema.ObjectId
    },
    amount: {
        type: Number,
        default: 1,
        min: [0, 'Amount must be positive']
    }
}, { _id: false });

const MealItemSchema = new mongoose.Schema({
    name: String,
    sourceType: {
        type: String,
        enum: ['food', 'recipe', 'meal', 'custom'],
        required: true,
        default: 'food'
    },
    sourceId: mongoose.Schema.ObjectId,
    amount: {
        type: Number,
        default: 1,
        min: [0, 'Amount must be positive']
    },
    notes: String,
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
        type: String,
        enum: ['auto', 'overridden'],
        default: 'auto'
    },
    components: { type: [MealComponentSchema], default: [] }
}, { timestamps: true });

const MealSchema = new mongoose.Schema({
    mealTime: {
        type: String,
        required: true
    },
    items: { type: [MealItemSchema], default: [] },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
        type: String,
        enum: ['auto', 'overridden'],
        default: 'auto'
    }
}, { timestamps: true });

const ProgramDaySchema = new mongoose.Schema({
    date: {
        type: String,
        required: true
    },
    meals: { type: [MealSchema], default: [] },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
        type: String,
        enum: ['auto', 'overridden'],
        default: 'auto'
    }
}, { timestamps: true });

const ProgramSchema = new mongoose.Schema({
    nutritionist: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'Client',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    startDate: {
        type: Date,
        required: true
    },
    length: {
        type: Number,
        min: [1, 'Program length must be at least one day'],
        required: true
    },
    notes: String,
    days: { type: [ProgramDaySchema], default: [] }
}, { timestamps: true });

ProgramSchema.index({ nutritionist: 1, client: 1 });

module.exports = mongoose.models.Program || mongoose.model('Program', ProgramSchema);

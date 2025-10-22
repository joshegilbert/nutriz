const mongoose = require('mongoose');

const macroTotalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  { _id: false }
);

const mealComponentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['food', 'custom'],
      default: 'food',
    },
    foodItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
    },
    customName: { type: String, default: '' },
    serving: { type: String, default: '' },
    amount: { type: Number, default: 1 },
    notes: { type: String, default: '' },
    macros: { type: macroTotalsSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ['auto', 'overridden'],
      default: 'auto',
    },
  },
  { timestamps: false }
);

const mealSchema = new mongoose.Schema(
  {
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    components: {
      type: [mealComponentSchema],
      default: [],
    },
    macros: {
      type: macroTotalsSchema,
      default: () => ({})
    },
    macrosSource: {
      type: String,
      enum: ['auto', 'overridden'],
      default: 'auto',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meal', mealSchema);

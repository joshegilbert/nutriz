const mongoose = require("mongoose");

const MacroSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  { _id: false }
);

const MealTemplateItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["food", "meal", "recipe", "custom"],
      default: "custom",
    },
    sourceId: { type: String, default: null },
    name: { type: String, default: "" },
    amount: { type: Number, default: 1 },
    unit: { type: String, default: "" },
    notes: { type: String, default: "" },
    time: { type: String, default: "" },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ["auto", "overridden"],
      default: "auto",
    },
  },
  { _id: false }
);

const MealTemplateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    tags: [String],
    meal: {
      name: { type: String, default: "" },
      time: { type: String, default: "" },
      items: { type: [MealTemplateItemSchema], default: () => [] },
      macros: { type: MacroSchema, default: () => ({}) },
      macrosSource: {
        type: String,
        enum: ["auto", "overridden"],
        default: "auto",
      },
    },
    totalMacros: { type: MacroSchema, default: () => ({}) },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Calculate total macros and item count before saving
MealTemplateSchema.pre("save", function (next) {
  if (this.meal && this.meal.items) {
    this.itemCount = this.meal.items.length;

    // Calculate total macros
    this.totalMacros = this.meal.items.reduce(
      (totals, item) => {
        totals.calories += item.macros?.calories || 0;
        totals.protein += item.macros?.protein || 0;
        totals.carbs += item.macros?.carbs || 0;
        totals.fat += item.macros?.fat || 0;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }
  next();
});

module.exports = mongoose.model("MealTemplate", MealTemplateSchema);

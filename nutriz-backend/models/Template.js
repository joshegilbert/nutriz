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

const TemplateItemSchema = new mongoose.Schema(
  {
    id: { type: String },
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

const TemplateMealSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, default: "" },
    mealTime: { type: String, default: "" },
    time: { type: String, default: "" },
    items: { type: [TemplateItemSchema], default: () => [] },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ["auto", "overridden"],
      default: "auto",
    },
  },
  { _id: false }
);

const TemplateSchema = new mongoose.Schema(
  {
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["layout", "day"], required: true },
    name: { type: String, required: true },
    tags: { type: [String], default: () => [] },
    // For 'day' templates, we store full meals
    meals: { type: [TemplateMealSchema], default: undefined },
    // For 'layout' templates, store only name/time for meals
    layoutMeals: {
      type: [
        new mongoose.Schema({ name: String, time: String }, { _id: false }),
      ],
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", TemplateSchema);

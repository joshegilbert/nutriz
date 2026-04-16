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

const ProgramItemSchema = new mongoose.Schema(
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

const ProgramMealSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: "" },
    mealTime: { type: String, default: "" },
    time: { type: String, default: "" },
    items: { type: [ProgramItemSchema], default: () => [] },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ["auto", "overridden"],
      default: "auto",
    },
  },
  { _id: false }
);

const ProgramDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    notes: { type: String, default: "" },
    notesUpdatedAt: { type: Date },
    meals: { type: [ProgramMealSchema], default: () => [] },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ["auto", "overridden"],
      default: "auto",
    },
    // Variants support (A/B day options)
    activeVariant: { type: String, default: "A" },
    variants: {
      type: [
        new mongoose.Schema(
          {
            key: { type: String, required: true },
            label: { type: String, default: "" },
            meals: { type: [ProgramMealSchema], default: () => [] },
            macros: { type: MacroSchema, default: () => ({}) },
            macrosSource: {
              type: String,
              enum: ["auto", "overridden"],
              default: "auto",
            },
          },
          { _id: false }
        ),
      ],
      default: () => [],
    },
  },
  { _id: false }
);

const ProgramSchema = new mongoose.Schema(
  {
    nutritionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    name: { type: String, default: "" },
    startDate: { type: String, default: "" },
    length: { type: Number, default: 0 },
    macros: { type: MacroSchema, default: () => ({}) },
    macrosSource: {
      type: String,
      enum: ["auto", "overridden"],
      default: "auto",
    },
    days: { type: [ProgramDaySchema], default: () => [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", ProgramSchema);

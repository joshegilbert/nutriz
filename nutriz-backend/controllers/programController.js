const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Program = require('../models/Program');
const Client = require('../models/Client');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normaliseMacros = (macros = {}) => ({
  calories: toNumber(macros.calories),
  protein: toNumber(macros.protein),
  carbs: toNumber(macros.carbs),
  fat: toNumber(macros.fat),
});

const normaliseItem = (item = {}) => ({
  id: item.id || new mongoose.Types.ObjectId().toString(),
  type: item.type || (item.sourceId ? 'food' : 'custom'),
  sourceId:
    item.sourceId !== undefined && item.sourceId !== null
      ? String(item.sourceId)
      : null,
  name: item.name || '',
  amount: Math.max(0, toNumber(item.amount, 1)),
  unit: item.unit || '',
  notes: item.notes || '',
  time: item.time || '',
  macros: normaliseMacros(item.macros),
  macrosSource: item.macrosSource === 'overridden' ? 'overridden' : 'auto',
});

const normaliseMeal = (meal = {}) => ({
  id: meal.id || new mongoose.Types.ObjectId().toString(),
  name: meal.name || meal.mealTime || 'Meal',
  mealTime: meal.mealTime || meal.name || 'Meal',
  time: meal.time || '',
  items: Array.isArray(meal.items) ? meal.items.map(normaliseItem) : [],
  macros: normaliseMacros(meal.macros),
  macrosSource: meal.macrosSource === 'overridden' ? 'overridden' : 'auto',
});

const normaliseVariant = (variant = {}) => ({
  key: String(variant.key || 'A'),
  label: variant.label || '',
  meals: Array.isArray(variant.meals) ? variant.meals.map(normaliseMeal) : [],
  macros: normaliseMacros(variant.macros),
  macrosSource: variant.macrosSource === 'overridden' ? 'overridden' : 'auto',
});

const normaliseDay = (day = {}) => {
  const out = {
    date: day.date || '',
    meals: Array.isArray(day.meals) ? day.meals.map(normaliseMeal) : [],
    macros: normaliseMacros(day.macros),
    macrosSource: day.macrosSource === 'overridden' ? 'overridden' : 'auto',
    activeVariant: day.activeVariant || 'A',
    variants: Array.isArray(day.variants) ? day.variants.map(normaliseVariant) : [],
  };

  // If variants provided, keep meals in sync with active variant for convenience
  if (out.variants.length) {
    const active = out.variants.find(v => v.key === out.activeVariant) || out.variants[0];
    out.activeVariant = active.key;
    out.meals = active.meals;
  }
  // If no variants and meals exist, create a default A variant for storage consistency
  else if (out.meals.length) {
    out.variants = [
      {
        key: 'A',
        label: 'Option A',
        meals: out.meals,
        macros: out.macros,
        macrosSource: out.macrosSource,
      },
    ];
    out.activeVariant = 'A';
  }

  return out;
};

const buildProgramPayload = (body = {}) => {
  const startDate = body.startDate || (body.days?.[0]?.date ?? '');
  const days = Array.isArray(body.days) ? body.days.map(normaliseDay) : [];
  return {
    name: body.name || '',
    client: body.clientId,
    startDate,
    length: toNumber(body.length, days.length || 0),
    macros: normaliseMacros(body.macros),
    macrosSource: body.macrosSource === 'overridden' ? 'overridden' : 'auto',
    days,
  };
};

// @desc    Get all programs for the authenticated nutritionist
// @route   GET /api/programs
// @access  Private/Nutritionist
const getPrograms = asyncHandler(async (req, res) => {
  const filter = { nutritionist: req.user.id };
  if (req.query.clientId) {
    filter.client = req.query.clientId;
  }
  const programs = await Program.find(filter).sort({ createdAt: -1 });
  res.status(200).json(programs);
});

// @desc    Get program by ID
// @route   GET /api/programs/:id
// @access  Private/Nutritionist
const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    nutritionist: req.user.id,
  });

  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }

  res.status(200).json(program);
});

// @desc    Create a program for a client
// @route   POST /api/programs
// @access  Private/Nutritionist
const createProgram = asyncHandler(async (req, res) => {
  const { clientId } = req.body;
  if (!clientId) {
    res.status(400);
    throw new Error('Client ID is required');
  }

  const client = await Client.findOne({
    _id: clientId,
    nutritionist: req.user.id,
  });

  if (!client) {
    res.status(404);
    throw new Error('Client not found');
  }

  const payload = buildProgramPayload(req.body);
  payload.nutritionist = req.user.id;
  payload.client = clientId;
  payload.length = payload.length || payload.days.length || 0;

  const program = await Program.create(payload);
  res.status(201).json(program);
});

// @desc    Update a program
// @route   PUT /api/programs/:id
// @access  Private/Nutritionist
const updateProgram = asyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    nutritionist: req.user.id,
  });

  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }

  if (req.body.clientId && String(req.body.clientId) !== String(program.client)) {
    const client = await Client.findOne({
      _id: req.body.clientId,
      nutritionist: req.user.id,
    });

    if (!client) {
      res.status(404);
      throw new Error('Client not found');
    }

    program.client = client._id;
  }

  const payload = buildProgramPayload({ ...req.body, clientId: program.client });

  program.name = payload.name;
  program.startDate = payload.startDate;
  program.length = payload.length || payload.days.length || 0;
  program.macros = payload.macros;
  program.macrosSource = payload.macrosSource;
  program.days = payload.days;

  await program.save();

  res.status(200).json(program);
});

// @desc    Delete a program
// @route   DELETE /api/programs/:id
// @access  Private/Nutritionist
const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    nutritionist: req.user.id,
  });

  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }

  await program.deleteOne();
  res.status(200).json({ message: 'Program removed' });
});

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
};

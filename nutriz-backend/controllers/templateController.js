const asyncHandler = require('express-async-handler');
const Template = require('../models/Template');

// GET /api/templates
const listTemplates = asyncHandler(async (req, res) => {
  const templates = await Template.find({ nutritionist: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(templates);
});

// POST /api/templates
const createTemplate = asyncHandler(async (req, res) => {
  const { type, name, tags, meals, layoutMeals } = req.body;
  if (!type || !name) {
    res.status(400);
    throw new Error('type and name are required');
  }
  const payload = {
    nutritionist: req.user.id,
    type,
    name,
    tags: Array.isArray(tags) ? tags : [],
  };
  if (type === 'day') payload.meals = Array.isArray(meals) ? meals : [];
  if (type === 'layout') payload.layoutMeals = Array.isArray(layoutMeals) ? layoutMeals : [];
  const tpl = await Template.create(payload);
  res.status(201).json(tpl);
});

// PUT /api/templates/:id
const updateTemplate = asyncHandler(async (req, res) => {
  const tpl = await Template.findOne({ _id: req.params.id, nutritionist: req.user.id });
  if (!tpl) {
    res.status(404);
    throw new Error('Template not found');
  }
  const { name, tags, meals, layoutMeals } = req.body;
  if (name !== undefined) tpl.name = name;
  if (tags !== undefined) tpl.tags = Array.isArray(tags) ? tags : [];
  if (meals !== undefined) tpl.meals = meals;
  if (layoutMeals !== undefined) tpl.layoutMeals = layoutMeals;
  await tpl.save();
  res.status(200).json(tpl);
});

// DELETE /api/templates/:id
const deleteTemplate = asyncHandler(async (req, res) => {
  const tpl = await Template.findOne({ _id: req.params.id, nutritionist: req.user.id });
  if (!tpl) {
    res.status(404);
    throw new Error('Template not found');
  }
  await tpl.deleteOne();
  res.status(200).json({ message: 'Template removed' });
});

module.exports = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};


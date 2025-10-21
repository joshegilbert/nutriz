const asyncHandler = require('express-async-handler');
const Meal = require('../models/Meal');
const FoodItem = require('../models/FoodItem');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normaliseAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 1;
  if (num < 0) return 0;
  return num;
};

const normaliseMacros = (macros = {}) => ({
  calories: toNumber(macros.calories),
  protein: toNumber(macros.protein),
  carbs: toNumber(macros.carbs),
  fat: toNumber(macros.fat),
});

const sumMacros = (components = []) =>
  components.reduce(
    (acc, component) => {
      acc.calories += component.macros?.calories || 0;
      acc.protein += component.macros?.protein || 0;
      acc.carbs += component.macros?.carbs || 0;
      acc.fat += component.macros?.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

const buildComponentPayload = async (component = {}, userId) => {
  const type = component.type || (component.foodId ? 'food' : 'custom');
  const amount = normaliseAmount(component.amount);
  const notes = component.notes || '';

  if (type === 'food') {
    const foodId = component.foodId || component.foodItem || component.sourceId;
    if (!foodId) {
      throw new Error('Food component requires a foodId');
    }

    const foodItem = await FoodItem.findOne({
      _id: foodId,
      nutritionist: userId,
    });

    if (!foodItem) {
      throw new Error(`Food item with ID ${foodId} not found`);
    }

    const macrosSource = component.macrosSource === 'overridden' ? 'overridden' : 'auto';
    const macros =
      macrosSource === 'overridden'
        ? normaliseMacros(component.macros)
        : {
            calories: (foodItem.caloriesPerServing || 0) * amount,
            protein: (foodItem.proteinPerServing || 0) * amount,
            carbs: (foodItem.carbsPerServing || 0) * amount,
            fat: (foodItem.fatPerServing || 0) * amount,
          };

    return {
      type: 'food',
      foodItem: foodItem._id,
      amount,
      notes,
      macros,
      macrosSource,
    };
  }

  return {
    type: 'custom',
    customName: component.customName || '',
    serving: component.serving || '',
    amount,
    notes,
    macros: normaliseMacros(component.macros),
    macrosSource: 'overridden',
  };
};

const populateMeal = async (meal) =>
  meal.populate({
    path: 'components.foodItem',
    select:
      'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing',
  });

// @desc    Get all meals for the authenticated nutritionist
// @route   GET /api/meals
// @access  Private/Nutritionist
const getMeals = asyncHandler(async (req, res) => {
  const meals = await Meal.find({ nutritionist: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'components.foodItem',
      select:
        'name defaultServingSize caloriesPerServing proteinPerServing carbsPerServing fatPerServing',
    });

  res.status(200).json(meals);
});

// @desc    Create a new meal template
// @route   POST /api/meals
// @access  Private/Nutritionist
const createMeal = asyncHandler(async (req, res) => {
  const { name, description = '', components = [], macrosSource } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Meal name is required');
  }

  const mappedComponents = [];
  for (const component of components) {
    try {
      const payload = await buildComponentPayload(component, req.user.id);
      mappedComponents.push(payload);
    } catch (error) {
      const notFound = /not found/i.test(error.message || "");
      res.status(notFound ? 404 : 400);
      throw new Error(error.message);
    }
  }

  const totals = sumMacros(mappedComponents);

  const meal = await Meal.create({
    nutritionist: req.user.id,
    name,
    description,
    components: mappedComponents,
    macros: totals,
    macrosSource: macrosSource === 'overridden' ? 'overridden' : 'auto',
  });

  await populateMeal(meal);

  res.status(201).json(meal);
});

// @desc    Update an existing meal template
// @route   PUT /api/meals/:id
// @access  Private/Nutritionist
const updateMeal = asyncHandler(async (req, res) => {
  const meal = await Meal.findOne({
    _id: req.params.id,
    nutritionist: req.user.id,
  });

  if (!meal) {
    res.status(404);
    throw new Error('Meal not found');
  }

  const { name, description = '', components = [], macrosSource } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Meal name is required');
  }

  const mappedComponents = [];
  for (const component of components) {
    try {
      const payload = await buildComponentPayload(component, req.user.id);
      mappedComponents.push(payload);
    } catch (error) {
      const notFound = /not found/i.test(error.message || "");
      res.status(notFound ? 404 : 400);
      throw new Error(error.message);
    }
  }

  const totals = sumMacros(mappedComponents);

  meal.name = name;
  meal.description = description;
  meal.components = mappedComponents;
  meal.macros = totals;
  meal.macrosSource = macrosSource === 'overridden' ? 'overridden' : 'auto';

  await meal.save();
  await populateMeal(meal);

  res.status(200).json(meal);
});

// @desc    Delete a meal template
// @route   DELETE /api/meals/:id
// @access  Private/Nutritionist
const deleteMeal = asyncHandler(async (req, res) => {
  const meal = await Meal.findOne({
    _id: req.params.id,
    nutritionist: req.user.id,
  });

  if (!meal) {
    res.status(404);
    throw new Error('Meal not found');
  }

  await meal.deleteOne();

  res.status(200).json({ message: 'Meal removed' });
});

module.exports = {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
};

const asyncHandler = require('express-async-handler');
const Program = require('../models/Program');
const Client = require('../models/Client');
const { recalculateProgramDocument } = require('../utils/macroCalculator');

const ensureClientOwnership = async (clientId, nutritionistId) => {
    const client = await Client.findById(clientId);

    if (!client) {
        return false;
    }

    if (!client.nutritionist) {
        return false;
    }

    return client.nutritionist.toString() === nutritionistId.toString();
};

const buildProgramResponse = async (programDoc) => {
    if (!programDoc) {
        return null;
    }

    await recalculateProgramDocument(programDoc);
    const programObject = programDoc.toObject();

    return programObject;
};

// @desc    Create a new program for a client
// @route   POST /api/programs
// @access  Private/Nutritionist
const createProgram = asyncHandler(async (req, res) => {
    const { client: clientId } = req.body;

    if (!clientId) {
        res.status(400);
        throw new Error('Client is required for program creation');
    }

    const hasOwnership = await ensureClientOwnership(clientId, req.user.id);
    if (!hasOwnership) {
        res.status(404);
        throw new Error('Client not found');
    }

    const payload = {
        ...req.body,
        nutritionist: req.user.id
    };

    const program = await Program.create(payload);
    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(201).json(await buildProgramResponse(program));
});

// @desc    Get programs for nutritionist (optionally by client)
// @route   GET /api/programs
// @access  Private/Nutritionist
const getPrograms = asyncHandler(async (req, res) => {
    const filter = { nutritionist: req.user.id };

    if (req.query.clientId) {
        filter.client = req.query.clientId;
    }

    const programs = await Program.find(filter).sort({ createdAt: -1 });
    const payload = [];

    for (const program of programs) {
        payload.push(await buildProgramResponse(program));
    }

    res.status(200).json(payload);
});

// @desc    Get a single program by id
// @route   GET /api/programs/:id
// @access  Private/Nutritionist
const getProgramById = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Update program root fields or replace days
// @route   PUT /api/programs/:id
// @access  Private/Nutritionist
const updateProgram = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    if (req.body.client && req.body.client.toString() !== program.client.toString()) {
        const hasOwnership = await ensureClientOwnership(req.body.client, req.user.id);
        if (!hasOwnership) {
            res.status(404);
            throw new Error('Client not found');
        }
        program.client = req.body.client;
    }

    const updatableFields = ['name', 'startDate', 'length', 'notes', 'days'];

    updatableFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
            program[field] = req.body[field];
        }
    });

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Delete program
// @route   DELETE /api/programs/:id
// @access  Private/Nutritionist
const deleteProgram = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    await program.deleteOne();
    res.status(200).json({ message: 'Program removed' });
});

// @desc    Add a day to a program
// @route   POST /api/programs/:id/days
// @access  Private/Nutritionist
const addProgramDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    program.days.push(req.body);
    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(201).json(await buildProgramResponse(program));
});

// @desc    Update a day in a program
// @route   PATCH /api/programs/:id/days/:dayId
// @access  Private/Nutritionist
const updateProgramDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    Object.assign(day, req.body);

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Delete a day from program
// @route   DELETE /api/programs/:id/days/:dayId
// @access  Private/Nutritionist
const deleteProgramDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    day.deleteOne();
    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Add meal to program day
// @route   POST /api/programs/:id/days/:dayId/meals
// @access  Private/Nutritionist
const addMealToDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    day.meals.push(req.body);

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(201).json(await buildProgramResponse(program));
});

// @desc    Update meal in program day
// @route   PATCH /api/programs/:id/days/:dayId/meals/:mealId
// @access  Private/Nutritionist
const updateMealInDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    const meal = day.meals.id(req.params.mealId);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    Object.assign(meal, req.body);

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Delete meal from program day
// @route   DELETE /api/programs/:id/days/:dayId/meals/:mealId
// @access  Private/Nutritionist
const deleteMealFromDay = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    const meal = day.meals.id(req.params.mealId);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    meal.deleteOne();
    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Add item to meal
// @route   POST /api/programs/:id/days/:dayId/meals/:mealId/items
// @access  Private/Nutritionist
const addItemToMeal = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    const meal = day.meals.id(req.params.mealId);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    meal.items.push(req.body);

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(201).json(await buildProgramResponse(program));
});

// @desc    Update item in meal
// @route   PATCH /api/programs/:id/days/:dayId/meals/:mealId/items/:itemId
// @access  Private/Nutritionist
const updateItemInMeal = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    const meal = day.meals.id(req.params.mealId);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    const item = meal.items.id(req.params.itemId);

    if (!item) {
        res.status(404);
        throw new Error('Meal item not found');
    }

    Object.assign(item, req.body);

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

// @desc    Delete item in meal
// @route   DELETE /api/programs/:id/days/:dayId/meals/:mealId/items/:itemId
// @access  Private/Nutritionist
const deleteItemFromMeal = asyncHandler(async (req, res) => {
    const program = await Program.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!program) {
        res.status(404);
        throw new Error('Program not found');
    }

    const day = program.days.id(req.params.dayId);

    if (!day) {
        res.status(404);
        throw new Error('Day not found');
    }

    const meal = day.meals.id(req.params.mealId);

    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }

    const item = meal.items.id(req.params.itemId);

    if (!item) {
        res.status(404);
        throw new Error('Meal item not found');
    }

    item.deleteOne();

    program.markModified('days');
    await recalculateProgramDocument(program);
    await program.save();

    res.status(200).json(await buildProgramResponse(program));
});

module.exports = {
    createProgram,
    getPrograms,
    getProgramById,
    updateProgram,
    deleteProgram,
    addProgramDay,
    updateProgramDay,
    deleteProgramDay,
    addMealToDay,
    updateMealInDay,
    deleteMealFromDay,
    addItemToMeal,
    updateItemInMeal,
    deleteItemFromMeal
};

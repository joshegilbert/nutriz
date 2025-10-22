const FoodItem = require('../models/FoodItem');
const Recipe = require('../models/Recipe');

const createEmptyMacros = () => ({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
});

const addMacros = (target, addition = {}) => ({
    calories: (target.calories || 0) + (addition.calories || 0),
    protein: (target.protein || 0) + (addition.protein || 0),
    carbs: (target.carbs || 0) + (addition.carbs || 0),
    fat: (target.fat || 0) + (addition.fat || 0)
});

const multiplyMacros = (macros = {}, multiplier = 1) => ({
    calories: (macros.calories || 0) * multiplier,
    protein: (macros.protein || 0) * multiplier,
    carbs: (macros.carbs || 0) * multiplier,
    fat: (macros.fat || 0) * multiplier
});

const normalizeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return fallback;
    }

    return Number(value);
};

const ensureMacroObject = (macros) => ({
    calories: normalizeNumber(macros?.calories),
    protein: normalizeNumber(macros?.protein),
    carbs: normalizeNumber(macros?.carbs),
    fat: normalizeNumber(macros?.fat)
});

const fetchFoodItemMacros = async (foodItemId, multiplier = 1) => {
    if (!foodItemId) {
        return createEmptyMacros();
    }

    const foodItem = await FoodItem.findById(foodItemId).lean();

    if (!foodItem) {
        return createEmptyMacros();
    }

    const macros = {
        calories: foodItem.caloriesPerServing,
        protein: foodItem.proteinPerServing,
        carbs: foodItem.carbsPerServing,
        fat: foodItem.fatPerServing
    };

    return multiplyMacros(macros, multiplier || 1);
};

const calculateRecipeNutrition = async (ingredients = []) => {
    let totals = createEmptyMacros();

    for (const ingredient of ingredients) {
        const quantity = normalizeNumber(ingredient.quantity, 1);
        const macros = await fetchFoodItemMacros(ingredient.foodItem, quantity);
        totals = addMacros(totals, macros);
    }

    return totals;
};

const fetchRecipeMacros = async (recipeIdOrDoc, multiplier = 1) => {
    let recipeDoc = recipeIdOrDoc;

    if (!recipeDoc) {
        return createEmptyMacros();
    }

    if (!recipeDoc.ingredients) {
        recipeDoc = await Recipe.findById(recipeIdOrDoc).lean();
    }

    if (!recipeDoc || !recipeDoc.ingredients) {
        return createEmptyMacros();
    }

    const macros = await calculateRecipeNutrition(recipeDoc.ingredients);

    return multiplyMacros(macros, multiplier || 1);
};

const calculateMealComponentMacros = async (component = {}) => {
    const multiplier = normalizeNumber(component.amount, 1);
    const sourceType = component.sourceType || component.type;

    if (sourceType === 'food') {
        return fetchFoodItemMacros(component.sourceId || component.foodItem, multiplier);
    }

    if (sourceType === 'recipe') {
        return fetchRecipeMacros(component.sourceId || component.recipe, multiplier);
    }

    return createEmptyMacros();
};

const calculateMealItemMacros = async (item = {}) => {
    if (item.macrosSource === 'overridden' && item.macros) {
        return ensureMacroObject(item.macros);
    }

    const multiplier = normalizeNumber(item.amount || item.servings, 1);
    const sourceType = item.sourceType || item.type;

    if (sourceType === 'food') {
        return fetchFoodItemMacros(item.sourceId || item.foodItem, multiplier);
    }

    if (sourceType === 'recipe') {
        return fetchRecipeMacros(item.sourceId || item.recipe, multiplier);
    }

    if (sourceType === 'meal') {
        let totals = createEmptyMacros();
        for (const component of item.components || []) {
            const macros = await calculateMealComponentMacros(component);
            totals = addMacros(totals, macros);
        }
        return multiplyMacros(totals, multiplier);
    }

    if (item.macros) {
        return ensureMacroObject(item.macros);
    }

    return createEmptyMacros();
};

const calculateMealTotals = async (meal = {}) => {
    let totals = createEmptyMacros();

    for (const item of meal.items || []) {
        const itemMacros = await calculateMealItemMacros(item);
        if (!item.macros || item.macrosSource !== 'overridden') {
            item.macros = ensureMacroObject(itemMacros);
            item.macrosSource = 'auto';
        }
        totals = addMacros(totals, item.macros);
    }

    if (meal.macrosSource === 'overridden' && meal.macros) {
        meal.macros = ensureMacroObject(meal.macros);
        return meal.macros;
    }

    meal.macros = ensureMacroObject(totals);
    meal.macrosSource = 'auto';

    return meal.macros;
};

const calculateProgramDayTotals = async (day = {}) => {
    let totals = createEmptyMacros();

    for (const meal of day.meals || []) {
        const mealTotals = await calculateMealTotals(meal);
        totals = addMacros(totals, mealTotals);
    }

    if (day.macrosSource === 'overridden' && day.macros) {
        day.macros = ensureMacroObject(day.macros);
        return day.macros;
    }

    day.macros = ensureMacroObject(totals);
    day.macrosSource = 'auto';

    return day.macros;
};

const recalculateProgramDocument = async (programDoc) => {
    if (!programDoc || !programDoc.days) {
        return programDoc;
    }

    for (const day of programDoc.days) {
        await calculateProgramDayTotals(day);
    }

    return programDoc;
};

module.exports = {
    addMacros,
    calculateMealItemMacros,
    calculateMealTotals,
    calculateProgramDayTotals,
    calculateRecipeNutrition,
    createEmptyMacros,
    ensureMacroObject,
    fetchFoodItemMacros,
    fetchRecipeMacros,
    multiplyMacros,
    normalizeNumber,
    recalculateProgramDocument
};

// routes/recipeRoutes.js
const express = require('express');
const {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    addRecipeIngredient,
    updateRecipeIngredient,
    deleteRecipeIngredient
} = require('../controllers/recipeController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('nutritionist', 'admin'), createRecipe)
    .get(protect, authorizeRoles('nutritionist', 'admin'), getRecipes);

router.route('/:id')
    .get(protect, authorizeRoles('nutritionist', 'admin'), getRecipeById)
    .put(protect, authorizeRoles('nutritionist', 'admin'), updateRecipe)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteRecipe);

router.route('/:id/ingredients')
    .post(protect, authorizeRoles('nutritionist', 'admin'), addRecipeIngredient);

router.route('/:id/ingredients/:ingredientId')
    .patch(protect, authorizeRoles('nutritionist', 'admin'), updateRecipeIngredient)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteRecipeIngredient);

module.exports = router;

// routes/recipeRoutes.js
const express = require('express');
const {
    createRecipe,
    getRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe
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

module.exports = router;

const express = require('express');
const {
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
} = require('../controllers/programController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('nutritionist', 'admin'), createProgram)
    .get(protect, authorizeRoles('nutritionist', 'admin'), getPrograms);

router.route('/:id')
    .get(protect, authorizeRoles('nutritionist', 'admin'), getProgramById)
    .put(protect, authorizeRoles('nutritionist', 'admin'), updateProgram)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteProgram);

router.route('/:id/days')
    .post(protect, authorizeRoles('nutritionist', 'admin'), addProgramDay);

router.route('/:id/days/:dayId')
    .patch(protect, authorizeRoles('nutritionist', 'admin'), updateProgramDay)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteProgramDay);

router.route('/:id/days/:dayId/meals')
    .post(protect, authorizeRoles('nutritionist', 'admin'), addMealToDay);

router.route('/:id/days/:dayId/meals/:mealId')
    .patch(protect, authorizeRoles('nutritionist', 'admin'), updateMealInDay)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteMealFromDay);

router.route('/:id/days/:dayId/meals/:mealId/items')
    .post(protect, authorizeRoles('nutritionist', 'admin'), addItemToMeal);

router.route('/:id/days/:dayId/meals/:mealId/items/:itemId')
    .patch(protect, authorizeRoles('nutritionist', 'admin'), updateItemInMeal)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteItemFromMeal);

module.exports = router;

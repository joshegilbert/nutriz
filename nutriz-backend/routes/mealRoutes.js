const express = require('express');
const {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
} = require('../controllers/mealController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(protect, authorizeRoles('nutritionist', 'admin'), getMeals)
  .post(protect, authorizeRoles('nutritionist', 'admin'), createMeal);

router
  .route('/:id')
  .put(protect, authorizeRoles('nutritionist', 'admin'), updateMeal)
  .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteMeal);

module.exports = router;

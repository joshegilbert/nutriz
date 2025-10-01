// routes/foodItemRoutes.js
const express = require('express');
const {
    createFoodItem,
    getFoodItems,
    getFoodItemById,
    updateFoodItem,
    deleteFoodItem
} = require('../controllers/foodItemController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('nutritionist', 'admin'), createFoodItem)
    .get(protect, authorizeRoles('nutritionist', 'admin'), getFoodItems);

router.route('/:id')
    .get(protect, authorizeRoles('nutritionist', 'admin'), getFoodItemById)
    .put(protect, authorizeRoles('nutritionist', 'admin'), updateFoodItem)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteFoodItem);

module.exports = router;

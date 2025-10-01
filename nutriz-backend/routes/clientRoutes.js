// routes/clientRoutes.js
const express = require('express');
const {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient
} = require('../controllers/clientController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('nutritionist', 'admin'), createClient)
    .get(protect, authorizeRoles('nutritionist', 'admin'), getClients);

router.route('/:id')
    .get(protect, authorizeRoles('nutritionist', 'admin'), getClientById)
    .put(protect, authorizeRoles('nutritionist', 'admin'), updateClient)
    .delete(protect, authorizeRoles('nutritionist', 'admin'), deleteClient);

module.exports = router;

// controllers/clientController.js
const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');

// @desc    Create new client
// @route   POST /api/clients
// @access  Private/Nutritionist
const createClient = asyncHandler(async (req, res) => {
    const { name, dob, contact, goals, notes } = req.body;

    const client = await Client.create({
        nutritionist: req.user.id,
        name,
        dob,
        contact,
        goals,
        notes
    });

    res.status(201).json(client);
});

// @desc    Get all clients for the authenticated nutritionist
// @route   GET /api/clients
// @access  Private/Nutritionist
const getClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({ nutritionist: req.user.id });
    res.status(200).json(clients);
});

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private/Nutritionist
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    res.status(200).json(client);
});

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private/Nutritionist
const updateClient = asyncHandler(async (req, res) => {
    let client = await Client.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(updatedClient);
});

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private/Nutritionist
const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findOne({ _id: req.params.id, nutritionist: req.user.id });

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    await Client.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Client removed' });
});

module.exports = {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient
};

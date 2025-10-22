// models/Client.js
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    nutritionist: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to the User (Nutritionist) model
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please add a client name'],
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    dob: {
        type: Date,
        required: [true, 'Please add a date of birth']
    },
    status: {
        type: String,
        enum: ['Active', 'Pending', 'On Hold', 'Inactive'],
        default: 'Active'
    },
    gender: { type: String },
    weight: { type: Number },
    state: { type: String },
    lastActive: { type: Date },
    contact: {
        email: {
            type: String,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        phone: String
    },
    goals: {
        type: [String], // Array of strings for client goals
        default: []
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Client || mongoose.model('Client', ClientSchema);

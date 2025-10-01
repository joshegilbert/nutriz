// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // A simple middleware for handling exceptions inside of async express routes

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
        email,
        password, // Password will be hashed by pre-save hook in User model
        role
    });

    if (user) {
        // Generate JWT
        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    // .select('+password') is used because 'password' field has select: false in model
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        // Generate JWT
        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            email: user.email,
            role: user.role,
            token,
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    res.status(200).json(user);
});


// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

module.exports = {
    register,
    login,
    getMe,
};

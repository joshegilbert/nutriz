// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const foodItemRoutes = require('./routes/foodItemRoutes'); // Import food item routes
const clientRoutes = require('./routes/clientRoutes');     // Import client routes
const recipeRoutes = require('./routes/recipeRoutes');     // Import recipe routes
const { errorHandler } = require('./middleware/errorMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080' // Allow requests from our frontend
})); // Enable CORS

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/fooditems', foodItemRoutes); // Food Item routes
app.use('/api/clients', clientRoutes);     // Client routes
app.use('/api/recipes', recipeRoutes);     // Recipe routes

// Basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware (should be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

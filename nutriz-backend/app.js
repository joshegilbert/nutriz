const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const foodItemRoutes = require('./routes/foodItemRoutes');
const clientRoutes = require('./routes/clientRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const programRoutes = require('./routes/programRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080'
}));

app.use('/api/auth', authRoutes);
app.use('/api/fooditems', foodItemRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/programs', programRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use(errorHandler);

module.exports = app;

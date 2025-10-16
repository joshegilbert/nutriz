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

// CORS configuration with allowlist for local dev and production
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://nutriz.vercel.app',
];

const parseCsv = (val) =>
  (val || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const envAllowed = [
  process.env.FRONTEND_URL,
  ...parseCsv(process.env.ALLOWED_ORIGINS),
].filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowed]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
); // Enable CORS

// Ensure OPTIONS short-circuits with 204 if reached
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

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

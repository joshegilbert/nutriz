# Nutriz Backend API Documentation

This document provides a comprehensive overview of the Nutriz backend API, built with Node.js, Express, and MongoDB (Mongoose). It covers the project structure, data models, API routes, authentication, and authorization mechanisms.

## Table of Contents

1.  [Project Setup](#1-project-setup)
2.  [Folder Structure](#2-folder-structure)
3.  [Data Models](#3-data-models)
    *   [User](#user-model)
    *   [Client](#client-model)
    *   [FoodItem](#fooditem-model)
    *   [Recipe](#recipe-model)
4.  [API Routes](#4-api-routes)
    *   [Authentication Routes (`/api/auth`)](#authentication-routes-apiauth)
    *   [Food Item Routes (`/api/fooditems`)](#food-item-routes-apifooditems)
    *   [Client Routes (`/api/clients`)](#client-routes-apiclients)
    *   [Recipe Routes (`/api/recipes`)](#recipe-routes-apirecipes)
5.  [Authentication & Authorization](#5-authentication--authorization)
6.  [Important Notes](#6-important-notes)

---

## 1. Project Setup

To get the backend running locally:

1.  **Navigate to the backend directory:**
    ```bash
    cd nutriz-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file** in the `nutriz-backend` directory and add the following environment variables. Replace placeholders with your actual values:

    ```env
    MONGO_URI=mongodb+srv://josh:4FYaThIJlmWj1oQO@cluster0.yohnw.mongodb.net/nutriz?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=playerPipelineSecretKey123 # IMPORTANT: Change this to a strong, random key for production
    PORT=5000
    FRONTEND_URL=http://localhost:8080 # Your frontend's development URL
    BASE_URL=https://your-public-url.com # Update this when you deploy your backend
    ```
    *   **`MONGO_URI`**: Your MongoDB connection string. The database name (`nutriz`) is embedded in this string.
    *   **`JWT_SECRET`**: A secret key used to sign and verify JSON Web Tokens. Crucial for security.
    *   **`PORT`**: The port on which the Express server will run.
    *   **`FRONTEND_URL`**: Used for CORS configuration to allow requests from your frontend.

4.  **Start the server:**
    ```bash
    node server.js
    ```
    You should see messages indicating successful MongoDB connection and server startup.

---

## 2. Folder Structure

```
/nutriz-backend
├── node_modules/
├── .env                  # Environment variables
├── package.json
├── server.js             # Main application entry point
├── config/
│   └── db.js             # Database connection setup
├── models/
│   ├── User.js           # Mongoose schema for Nutritionist users
│   ├── Client.js         # Mongoose schema for Client data
│   ├── FoodItem.js       # Mongoose schema for individual Food Items
│   └── Recipe.js         # Mongoose schema for Recipe data, referencing FoodItems
├── routes/
│   ├── authRoutes.js     # API routes for authentication (register, login)
│   ├── clientRoutes.js   # API routes for client management (CRUD)
│   ├── foodItemRoutes.js # API routes for food item management (CRUD)
│   └── recipeRoutes.js   # API routes for recipe management (CRUD)
├── controllers/
│   ├── authController.js     # Logic for authentication routes
│   ├── clientController.js   # Logic for client routes
│   ├── foodItemController.js # Logic for food item routes
│   └── recipeController.js   # Logic for recipe routes
└── middleware/
    ├── authMiddleware.js     # Middleware for verifying JWT tokens
    └── errorMiddleware.js    # Global error handling middleware
```

---

## 3. Data Models

### User Model

Represents a nutritionist user with authentication credentials and a role.

*   `email` (String, unique, required)
*   `password` (String, required, hashed with `bcrypt.js`)
*   `role` (String, enum: \`['nutritionist', 'admin']\`, default: `'nutritionist'`)
*   `createdAt` (Date)

**Methods:**
*   `pre('save')` hook: Hashes password before saving.
*   `matchPassword(enteredPassword)`: Compares entered password with stored hash.

### Client Model

Represents a client managed by a nutritionist.

*   `nutritionist` (ObjectId, ref: `'User'`, required) - Links client to their nutritionist.
*   `name` (String, required)
*   `dob` (Date, required)
*   `contact` (Object: `{ email: String, phone: String }`)
*   `goals` (Array of Strings)
*   `notes` (String)
*   `createdAt` (Date)

### FoodItem Model

Represents an individual food item with nutritional information. Can be created by nutritionists for custom items.

*   `nutritionist` (ObjectId, ref: `'User'`, required) - Links to the creator nutritionist.
*   `name` (String, unique, required)
*   `category` (String, enum: \`['Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy', 'Fat', 'Other']\`)
*   `defaultServingSize` (String, required) - e.g., "100g", "1 cup"
*   `caloriesPerServing` (Number, required)
*   `proteinPerServing` (Number)
*   `carbsPerServing` (Number)
*   `fatPerServing` (Number)
*   `createdAt` (Date)

### Recipe Model

Represents a complete recipe, composed of referenced `FoodItem`s.

*   `nutritionist` (ObjectId, ref: `'User'`, required) - Links recipe to its nutritionist.
*   `name` (String, required)
*   `description` (String)
*   `imageUrl` (String)
*   `ingredients` (Array of Objects):
    *   `foodItem` (ObjectId, ref: `'FoodItem'`, required) - Reference to a specific food item.
    *   `amount` (String, required) - Descriptive amount (e.g., "200g", "1 cup").
    *   `quantity` (Number, required) - Numeric quantity representing how many *default servings* of the `FoodItem` are used in *this* recipe. Used for nutrition calculation.
    *   `notes` (String)
*   `instructions` (String, required)
*   `tags` (Array of Strings)
*   `createdAt` (Date)

---

## 4. API Routes

All routes are prefixed with `/api`. Authentication is handled via JSON Web Tokens (JWT) in the `Authorization: Bearer <token>` header.

### Authentication Routes (`/api/auth`)

| Method | Route          | Description                     | Access                      |
| :----- | :------------- | :------------------------------ | :-------------------------- |
| `POST` | `/api/auth/register` | Register a new nutritionist user | Public                      |
| `POST` | `/api/auth/login`    | Authenticate user and get JWT   | Public                      |
| `GET`  | `/api/auth/me`       | Get current authenticated user's profile | Private (Nutritionist/Admin) |

### Food Item Routes (`/api/fooditems`)

Manage individual food items.

| Method | Route               | Description                               | Access                      |
| :----- | :------------------ | :---------------------------------------- | :-------------------------- |
| `POST` | `/api/fooditems`    | Create a new food item                    | Private (Nutritionist/Admin) |
| `GET`  | `/api/fooditems`    | Get all food items for the nutritionist   | Private (Nutritionist/Admin) |
| `GET`  | `/api/fooditems/:id`| Get a single food item by ID              | Private (Nutritionist/Admin) |
| `PUT`  | `/api/fooditems/:id`| Update a food item                        | Private (Nutritionist/Admin) |
| `DELETE`| `/api/fooditems/:id`| Delete a food item                        | Private (Nutritionist/Admin) |

### Client Routes (`/api/clients`)

Manage client information for the authenticated nutritionist.

| Method | Route             | Description                               | Access                      |
| :----- | :---------------- | :---------------------------------------- | :-------------------------- |
| `POST` | `/api/clients`    | Create a new client                       | Private (Nutritionist/Admin) |
| `GET`  | `/api/clients`    | Get all clients for the nutritionist      | Private (Nutritionist/Admin) |
| `GET`  | `/api/clients/:id`| Get a single client by ID                 | Private (Nutritionist/Admin) |
| `PUT`  | `/api/clients/:id`| Update a client                           | Private (Nutritionist/Admin) |
| `DELETE`| `/api/clients/:id`| Delete a client                           | Private (Nutritionist/Admin) |

### Recipe Routes (`/api/recipes`)

Manage recipes, which reference `FoodItem`s. Nutrition totals are calculated on retrieval.

| Method | Route             | Description                               | Access                      |
| :----- | :---------------- | :---------------------------------------- | :-------------------------- |
| `POST` | `/api/recipes`    | Create a new recipe                       | Private (Nutritionist/Admin) |
| `GET`  | `/api/recipes`    | Get all recipes for the nutritionist      | Private (Nutritionist/Admin) |
| `GET`  | `/api/recipes/:id`| Get a single recipe by ID (with populated FoodItems and calculated nutrition) | Private (Nutritionist/Admin) |
| `PUT`  | `/api/recipes/:id`| Update a recipe                           | Private (Nutritionist/Admin) |
| `DELETE`| `/api/recipes/:id`| Delete a recipe                           | Private (Nutritionist/Admin) |

---

## 5. Authentication & Authorization

The backend uses **JSON Web Tokens (JWTs)** for stateless authentication.

*   **Registration/Login**: Upon successful login or registration, a JWT is issued to the client. This token contains the user's ID and is signed with `JWT_SECRET`.
*   **`authMiddleware.js` (`protect` function)**: This middleware verifies the JWT sent in the `Authorization: Bearer <token>` header for protected routes. If valid, it attaches the authenticated `User` object (excluding password) to `req.user`.
*   **`authMiddleware.js` (`authorizeRoles` function)**: This middleware is used after `protect` to restrict access to routes based on the authenticated user's `role` (e.g., only 'nutritionist' or 'admin' can access certain routes).
*   **Ownership Checks**: For `FoodItem`, `Client`, and `Recipe` routes, the controllers perform additional checks to ensure that the authenticated user (`req.user.id`) is the `nutritionist` associated with the data being accessed or modified. This prevents users from interacting with data they don't own.

---

## 6. Important Notes

*   **`.env` Security**: Never commit your `.env` file to version control (it's already in `.gitignore`). Ensure `JWT_SECRET` is a strong, randomly generated string.
*   **Recipe Nutrition Calculation**: The `Recipe` endpoints calculate total nutritional values (calories, protein, etc.) dynamically by populating the referenced `FoodItem`s and using the `quantity` field within each ingredient.
*   **Frontend Integration**: The next major step is to refactor the frontend to consume these API endpoints, handle authentication (storing and sending JWTs), and manage data flow between the UI and the backend.
*   **Error Handling**: A global `errorMiddleware.js` catches unhandled errors and returns consistent JSON error responses.

---

This README should provide your team with a clear understanding of the Nutriz backend.

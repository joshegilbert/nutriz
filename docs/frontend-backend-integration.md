# Frontend ↔ Backend Integration Plan

## Current Implementation Snapshot (February 2025)

- The Vue 3 + Pinia frontend now authenticates against the Express API via the new `useAuthStore` and Axios client interceptors. Login sessions persist in `localStorage` and protected routes are guarded in the router.
- CRUD views for **Clients**, **Foods**, **Recipes**, and **Programs** have been refactored to call the live REST endpoints. Dialogs reuse the existing Vuetify UX while performing real HTTP mutations.
- Program summaries (`PlanSummaryView`) pull nested days/meals from the backend and display macro totals alongside lookups from the food/recipe catalogues.
- All API calls honor the `VITE_API_BASE_URL` environment variable so the SPA can target different deployments without code changes.

The remaining sections outline the architectural plan that guided this implementation and highlight future enhancements.

## Current Frontend State
- `useDataStore` now wraps Axios calls for clients, foods, recipes, and programs, exposing loading/error state so Vuetify tables can react to API status.【F:src/stores/useDataStore.js†L1-L221】
- Feature views (`ClientsView`, `FoodsView`, `RecipesView`, `MealsView`) persist through the backend, using create/update/delete helpers rather than mutating local arrays.【F:src/views/ClientsView.vue†L1-L210】【F:src/views/FoodsView.vue†L1-L208】【F:src/views/RecipesView.vue†L1-L238】【F:src/views/MealsView.vue†L1-L170】
- Authentication flows live in `useAuthStore` and the router guard, which hydrate sessions from storage and push unauthorized users back to `/login`.【F:src/stores/useAuthStore.js†L1-L73】【F:src/router/index.js†L1-L56】

## Confirmed Scope Decisions

- Meal programs, calendar days, and individual meals must persist in MongoDB rather than remaining client-generated structures.【F:src/stores/useDataStore.js†L41-L80】【F:nutriz-backend/models/Client.js†L5-L35】
- Recipes and foods need full CRUD coverage for their nested servings/components so the UI can continue editing ingredients with override macros.【F:src/views/RecipesView.vue†L12-L126】【F:nutriz-backend/controllers/recipeController.js†L7-L118】
- No additional domain entities (progress logs, messaging, etc.) are required in this phase.
- Follow the existing Vuetify dialog-driven CRUD patterns already present in the views when introducing API-backed workflows.【F:src/views/MealsView.vue†L8-L93】【F:src/views/RecipesView.vue†L8-L125】
- Frontend and backend will deploy on separate origins, so CORS must stay configurable per environment.【F:nutriz-backend/server.js†L1-L52】

## Required Implementation Work

### 1. API Foundation
1. Create an API client module (e.g., `src/utils/api.js`) that wraps `fetch` or `axios`, sets the `baseURL` from environment variables, attaches the JWT bearer token from Pinia/localStorage, and normalizes error responses.
2. Expose helper methods for each backend resource: `auth`, `clients`, `foodItems`, `recipes`, and the new program planner endpoints once added. Map to backend routes (`/api/auth/login`, `/api/clients`, etc.) defined in the Express app.【F:nutriz-backend/routes/clientRoutes.js†L1-L28】【F:nutriz-backend/routes/foodItemRoutes.js†L1-L27】【F:nutriz-backend/routes/recipeRoutes.js†L1-L30】

### 2. Authentication Flow
1. Replace the mock login handling in `LoginView` with form submission that calls the backend `POST /api/auth/login` and stores the returned JWT + user profile.【F:nutriz-backend/controllers/authController.js†L42-L77】
2. Persist the token (e.g., localStorage) and hydrate the Pinia auth store on app bootstrap so sessions survive refreshes.
3. Apply route guards in `src/router/index.js` to block protected views when not authenticated, redirecting to `/login` on 401 responses.

### 3. Pinia Store Refactor
1. Convert the static refs in `useDataStore` into state populated via async actions that call the backend (e.g., `fetchClients`, `fetchFoods`).【F:src/stores/useDataStore.js†L1-L158】
2. Implement create/update/delete actions that hit the corresponding REST endpoints, update state optimistically, and handle rollback on failure.
3. Add loading/error state to surface request status in the UI.
4. Move program/day/meal scaffolding (currently generated in Pinia) into backend services so the frontend simply consumes server-provided structures and recalculated macros.【F:src/stores/useDataStore.js†L69-L147】

### 4. View Wiring & CRUD UX
1. `ClientsView` / `ClientDetailView`
   - Replace local mutations with calls to `clients` endpoints (`GET`, `POST`, `PATCH`, `DELETE`).【F:nutriz-backend/controllers/clientController.js†L6-L105】
   - Ensure client-specific programs are fetched (`GET /api/clients/:id`) and displayed with real data.
2. `FoodsView`
   - Hook listing, creation, editing, and deletion into food item endpoints.【F:nutriz-backend/controllers/foodItemController.js†L7-L93】
   - Update UI forms to reflect server validation errors.
3. `RecipesView`
   - Fetch recipe lists and populate ingredient data via backend populations (`GET /api/recipes`).【F:nutriz-backend/controllers/recipeController.js†L7-L118】
   - Wire create/update/delete operations and ensure macros aggregate matches backend calculations.
4. Meal planning views (`MealsView`, `PlanSummaryView`)
   - Read/write meals against the new meal planner API so dialog actions (`saveMeal`, `deleteMeal`, etc.) execute server mutations.【F:src/views/MealsView.vue†L8-L189】
   - Ensure day-level program updates reflect server-calculated macros and sync edits such as meal duplication or macro overrides.【F:src/stores/useDataStore.js†L94-L146】【F:src/views/PlanSummaryView.vue†L1-L72】

### 5. Error, Loading, and Feedback Patterns
- Introduce global toast/snackbar feedback to surface success/failure states.
- Show loading spinners while awaiting API responses in each view.
- Handle 401/403 globally by logging out and redirecting to login.

### 6. Configuration & Tooling
- Add environment variables (e.g., `VITE_API_BASE_URL`) and document them in the README.
- Surface a CORS origin list for each environment so deployments on separate domains continue to work without manual server edits.【F:nutriz-backend/server.js†L13-L44】
- Optionally add a typed API client interface (TypeScript or JSDoc) for maintainability.
- Set up E2E or component-level tests once CRUD flows stabilize.

## Backend Extensions Required

1. **Program & Meal Models** – Introduce Mongoose schemas for programs, days, meals, and meal items that reference the owning client and any associated recipes/foods. Persist macro overrides so the existing UI can keep sending custom values.【F:src/stores/useDataStore.js†L69-L147】【F:src/views/MealsView.vue†L24-L154】
2. **Program Controllers/Routes** – Build REST endpoints for listing programs per client, creating/updating/deleting programs, and mutating nested days/meals/items. Ensure authorization mirrors the existing controllers (scope to the authenticated nutritionist).【F:nutriz-backend/controllers/clientController.js†L6-L105】
3. **Meal Item CRUD** – Extend recipe and food item controllers (or add nested controllers) so ingredient servings can be created, updated, or removed individually rather than replacing the entire document. Provide bulk upsert helpers to match the dialog UX for editing multiple components at once.【F:src/views/RecipesView.vue†L82-L180】【F:nutriz-backend/controllers/recipeController.js†L7-L118】
4. **Macro Aggregation Service** – Extract macro-calculation utilities shared by recipes, meals, and program days so totals stay consistent between backend responses and frontend expectations.【F:src/stores/useDataStore.js†L100-L147】【F:nutriz-backend/controllers/recipeController.js†L82-L118】
5. **Data Migration/Seeding** – Provide scripts or admin endpoints to seed base foods/meals for onboarding since the frontend previously relied on static arrays.【F:src/stores/useDataStore.js†L9-L53】

With these decisions locked, the frontend tasks above can be scheduled in parallel with the required backend additions to deliver a fully persistent, end-to-end CRUD experience.

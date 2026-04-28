# Nutriz

**Nutriz** is a web app for nutrition professionals to manage clients, build meal programs, and track macros. The UI is a Vue single-page app; data is persisted through a Node.js API backed by MongoDB.

**Live demo (portfolio):** [nutriz.vercel.app](https://nutriz.vercel.app)

---

## Features

- **Authentication** — Register and sign in as a nutritionist; JWT-protected routes.
- **Clients** — Client profiles with contact info, goals, and notes.
- **Foods & recipes** — Custom food items with per-serving macros; recipes built from food items with aggregated nutrition.
- **Meal programs** — Multi-day plans with meals, drag-and-drop style scheduling, and macro totals (with optional overrides).
- **Templates & reports** — Reusable templates and reporting views for plan workflows.

---

## Tech stack

| Layer | Technologies |
| ----- | ------------ |
| **Frontend** | [Vue 3](https://vuejs.org/), [Vite](https://vitejs.dev/), [Vuetify 3](https://vuetifyjs.com/), [Pinia](https://pinia.vuejs.org/), [Vue Router](https://router.vuejs.org/), [Axios](https://axios-http.com/), [date-fns](https://date-fns.org/), [jsPDF](https://github.com/parallax/jsPDF) |
| **Backend** | [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/), JWT auth |
| **Hosting** | Frontend on [Vercel](https://vercel.com/) |

---

## Repository layout

```
nutriz/                 # Vue frontend (this package)
├── src/
│   ├── components/     # UI including meal calendar and planners
│   ├── views/          # Route-level pages
│   ├── services/       # API client (Axios)
│   └── stores/         # Pinia stores
├── tests/              # Frontend tests (e.g. meal helpers)
└── nutriz-backend/     # Express API — see nutriz-backend/README.md
```

---

## Prerequisites

- **Node.js** (LTS recommended)
- **MongoDB** — local instance or [Atlas](https://www.mongodb.com/cloud/atlas) connection string for the API

---

## Frontend — local development

From the repository root:

```bash
npm install
npm run dev
```

Vite serves the app (default [http://localhost:5173](http://localhost:5173)).

### Environment variables

Create a `.env` file in the project root if the API is not at the default URL:

| Variable | Description |
| -------- | ----------- |
| `VITE_API_URL` | Base URL for the REST API, including the `/api` path if your server mounts routes there. Example: `http://localhost:5000/api` |

If unset, the client falls back to `http://localhost:5001/api`. **Align this with your backend port** (the API defaults to port `5000` in `nutriz-backend` unless `PORT` is set).

Optional:

| Variable | Description |
| -------- | ----------- |
| `VITE_ENABLE_MEAL_TEMPLATE_API` | Set to `"true"` when using meal template API integration (see `useDataStore`). |

### Build & preview

```bash
npm run build
npm run preview
```

---

## Backend — local development

The API lives in `nutriz-backend/`. Full setup, environment variables, routes, and deployment notes are documented there:

**[nutriz-backend/README.md](nutriz-backend/README.md)**

Quick start:

```bash
cd nutriz-backend
npm install
# configure .env — see backend README
npm start
```

### Run frontend and backend together

From the repository root (requires `concurrently`):

```bash
npm run dev:full
```

Adjust `VITE_API_URL` so the frontend targets whichever port the API uses.

---

## Testing

```bash
npm test
```

Runs the Node-based tests under `tests/` (for example, meal helper logic).

---

<img width="1512" height="735" alt="Screenshot 2026-04-27 at 10 21 06 PM" src="https://github.com/user-attachments/assets/b00719e8-df9b-47f3-b294-4b1986bcb91f" />


<img width="1501" height="708" alt="Screenshot 2026-04-27 at 10 21 33 PM" src="https://github.com/user-attachments/assets/ac1871d1-638b-49cc-acaa-6175cbaceb9b" />




## License

ISC (see `package.json` files in this repo).

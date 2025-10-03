// src/router/index.js (Original Version)

import { createRouter, createWebHistory } from "vue-router";
import DefaultLayout from "../layouts/DefaultLayout.vue";

const routes = [
  // Routes that use the DefaultLayout
  {
    path: "/",
    component: DefaultLayout,
    children: [
      {
        path: "",
        redirect: "/clients",
      },
      {
        path: "clients",
        name: "Clients",
        component: () => import("../views/ClientsView.vue"),
      },
      {
        path: "clients/:id",
        name: "ClientDetail",
        component: () => import("../views/ClientDetailView.vue"),
      },
      {
        path: "clients/:id/plan",
        name: "PlanSummary",
        component: () => import("../views/PlanSummaryView.vue"),
      },
      {
        path: "recipes",
        name: "Recipes",
        component: () => import("../views/RecipesView.vue"),
      },
      {
        path: "foods",
        name: "Foods",
        component: () => import("../views/FoodsView.vue"),
      },
      {
        path: "meals",
        name: "Meals",
        component: () => import("../views/MealsView.vue"),
      },
    ],
  },
  // Route that does NOT use the DefaultLayout
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/LoginView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
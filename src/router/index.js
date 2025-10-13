import { createRouter, createWebHistory } from "vue-router";
import DefaultLayout from "../layouts/DefaultLayout.vue";
import { useAuthStore } from "@/stores/useAuthStore";

const routes = [
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        redirect: "/clients",
      },
      {
        path: "clients",
        name: "Clients",
        component: () => import("../views/ClientsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "clients/:id",
        name: "ClientDetail",
        component: () => import("../views/ClientDetailView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "clients/:clientId/plan",
        name: "PlanSummary",
        component: () => import("../views/PlanSummaryView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "recipes",
        name: "Recipes",
        component: () => import("../views/RecipesView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "foods",
        name: "Foods",
        component: () => import("../views/FoodsView.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "meals",
        name: "Programs",
        component: () => import("../views/MealsView.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login", query: { redirect: to.fullPath } });
    return;
  }

  if (to.name === "Login" && authStore.isAuthenticated) {
    next({ name: "Clients" });
    return;
  }

  next();
});

export default router;

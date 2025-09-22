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
        redirect: "/dashboard",
      },
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("../views/DashboardView.vue"),
      },
      {
        path: "clients",
        name: "Clients",
        component: () => import("../views/ClientsView.vue"),
      },
      // 👇 This is the correct placement for the new route
      {
        path: "clients/:id",
        name: "ClientDetail",
        component: () => import("../views/ClientDetailView.vue"),
      },
      {
        path: "recipes",
        name: "Recipes",
        component: () => import("../views/RecipesView.vue"),
      },
      {
        path: "about",
        name: "About",
        component: () => import("../views/AboutView.vue"),
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

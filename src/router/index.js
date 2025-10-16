import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import pinia from '@/stores';
import { useAuthStore } from '@/stores/authStore';

const routes = [
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/HomeView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('../views/ClientsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'clients/:id',
        name: 'ClientDetail',
        component: () => import('../views/ClientDetailView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'clients/:id/plan',
        name: 'PlanSummary',
        component: () => import('../views/PlanSummaryView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'recipes',
        name: 'Recipes',
        component: () => import('../views/RecipesView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'foods',
        name: 'Foods',
        component: () => import('../views/FoodsView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'meals',
        name: 'Meals',
        component: () => import('../views/MealsView.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore(pinia);

  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      // Token invalid or expired, clear session
      authStore.logout();
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return next({ path: '/' });
  }

  next();
});

export default router;

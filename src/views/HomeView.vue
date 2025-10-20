<template>
  <v-container class="home-container py-12" fluid>
    <v-row class="align-center hero-row" no-gutters>
      <v-col cols="12" md="7" class="pe-md-10 pb-8 pb-md-0">
        <v-chip class="mb-4" color="primary" prepend-icon="mdi-chart-donut" size="large" variant="tonal">
          Nutritionist control centre
        </v-chip>
        <h1 class="hero-title mb-4">
          Welcome back, {{ welcomeName }}
        </h1>
        <p class="hero-subtitle mb-6">
          Track every client, tune macros in seconds, and launch polished meal plans with confidence.
          Your key workflows are just a click away.
        </p>
        <div class="hero-actions">
          <v-btn color="primary" size="large" class="me-3 mb-3" prepend-icon="mdi-account-multiple" @click="goTo('/clients')">
            Manage clients
          </v-btn>
          <v-btn color="secondary" variant="tonal" size="large" class="mb-3" prepend-icon="mdi-playlist-star" @click="goTo('/recipes')">
            Build recipes
          </v-btn>
        </div>
        <ul class="hero-highlights mt-6">
          <li v-for="item in heroHighlights" :key="item.title">
            <v-icon :icon="item.icon" size="24" class="me-3" />
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </div>
          </li>
        </ul>
      </v-col>
      <v-col cols="12" md="5">
        <v-sheet class="summary-card" elevation="8">
          <v-skeleton-loader
            v-if="isLoading"
            type="heading, list-item-two-line, list-item-two-line, list-item-two-line"
            class="mb-4"
          />
          <div v-else>
            <h2 class="text-h5 mb-4">Today’s snapshot</h2>
            <v-row dense>
              <v-col
                v-for="stat in statCards"
                :key="stat.key"
                cols="12"
                sm="6"
                class="pb-4"
              >
                <v-card variant="outlined" class="pa-4 h-100 d-flex flex-column justify-space-between">
                  <div class="d-flex align-center mb-4">
                    <v-icon :icon="stat.icon" size="26" class="me-3 text-primary" />
                    <span class="text-subtitle-1 font-weight-medium">{{ stat.label }}</span>
                  </div>
                  <div class="stat-value mb-2">{{ stat.value }}</div>
                  <v-btn
                    :color="stat.ctaColor"
                    variant="text"
                    size="small"
                    class="px-0 align-self-start"
                    @click="goTo(stat.route)"
                  >
                    {{ stat.ctaLabel }}
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
            <v-divider class="my-4" />
            <h3 class="text-subtitle-1 mb-3">Recent recipes</h3>
            <div v-if="recentRecipes.length === 0" class="text-body-2 text-medium-emphasis">
              Create your first recipe to see it here.
            </div>
            <v-list v-else density="comfortable" lines="two">
              <v-list-item
                v-for="recipe in recentRecipes"
                :key="recipe.id"
                :title="recipe.name"
                :subtitle="recipeSubtitle(recipe)"
                prepend-icon="mdi-receipt"
              >
                <template #append>
                  <v-btn icon="mdi-chevron-right" variant="text" @click="goTo('/recipes')" />
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mt-8"
      border="start"
      density="comfortable"
    >
      {{ errorMessage }}
    </v-alert>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/useDataStore';

const router = useRouter();
const authStore = useAuthStore();
const dataStore = useDataStore();

const { clients, foods, recipes, isLoadingClients, isLoadingFoods, isLoadingRecipes, lastError } =
  storeToRefs(dataStore);

const errorMessage = ref('');
const welcomeName = computed(() => authStore.user?.email?.split('@')[0] || 'coach');

const isLoading = computed(
  () => isLoadingClients.value || isLoadingFoods.value || isLoadingRecipes.value
);

const heroHighlights = [
  {
    title: 'Stay ahead of prep',
    copy: 'Quickly review today\'s clients, macro targets, and outstanding plan edits.',
    icon: 'mdi-clock-check-outline',
  },
  {
    title: 'Library at your fingertips',
    copy: 'Reuse saved foods and recipes or spin up new ones without leaving the dashboard.',
    icon: 'mdi-folder-heart-outline',
  },
  {
    title: 'Instant plan delivery',
    copy: 'Share polished client-ready plans and shopping lists in a couple of clicks.',
    icon: 'mdi-send-check-outline',
  },
];

const readyProgramCount = computed(() =>
  clients.value.reduce((count, client) => count + (client.programs?.length ? 1 : 0), 0)
);

const statCards = computed(() => [
  {
    key: 'clients',
    label: 'Active clients',
    value: clients.value.length,
    icon: 'mdi-account-heart',
    route: '/clients',
    ctaLabel: 'View roster',
    ctaColor: 'primary',
  },
  {
    key: 'recipes',
    label: 'Recipes crafted',
    value: recipes.value.length,
    icon: 'mdi-silverware-fork-knife',
    route: '/recipes',
    ctaLabel: 'Open library',
    ctaColor: 'secondary',
  },
  {
    key: 'foods',
    label: 'Foods tracked',
    value: foods.value.length,
    icon: 'mdi-food-apple-outline',
    route: '/foods',
    ctaLabel: 'Review foods',
    ctaColor: 'primary',
  },
  {
    key: 'programs',
    label: 'Programs ready',
    value: readyProgramCount.value,
    icon: 'mdi-calendar-check-outline',
    route: '/clients',
    ctaLabel: 'Open planner',
    ctaColor: 'secondary',
  },
]);

const recentRecipes = computed(() => recipes.value.slice(0, 4));

const recipeSubtitle = (recipe) => {
  const macros = recipe.totalMacros || {};
  const calories = macros.calories ? `${Math.round(macros.calories)} kcal` : 'No macros yet';
  return calories;
};

onMounted(async () => {
  errorMessage.value = '';
  try {
    await Promise.all([
      dataStore.fetchClients(),
      dataStore.fetchFoods(),
      dataStore.fetchMeals(),
      dataStore.fetchRecipes(),
    ]);
  } catch (error) {
    errorMessage.value = lastError.value || error.message || 'Unable to load dashboard data.';
  }
});

function goTo(route) {
  router.push(route);
}
</script>

<style scoped>
.home-container {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%);
  min-height: 100vh;
}

.hero-title {
  font-size: clamp(2.4rem, 2.1rem + 1vw, 3.2rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.hero-subtitle {
  font-size: 1.1rem;
  color: rgba(15, 23, 42, 0.75);
  max-width: 520px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
}

.hero-highlights {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 16px;
}

.hero-highlights li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.72);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.hero-highlights h3 {
  margin: 0 0 4px;
  font-size: 1.05rem;
}

.hero-highlights p {
  margin: 0;
  color: rgba(15, 23, 42, 0.65);
  line-height: 1.45;
}

.summary-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  padding: 32px 28px;
  backdrop-filter: blur(8px);
}

.stat-value {
  font-size: 2.2rem;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 959px) {
  .home-container {
    padding-top: 96px;
  }

  .summary-card {
    margin-top: 32px;
  }
}
</style>

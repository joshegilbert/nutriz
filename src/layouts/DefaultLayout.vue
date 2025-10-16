<template>
  <v-app>
    <v-app-bar app color="primary" density="comfortable">
      <v-app-bar-nav-icon v-if="!isDesktop" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-semibold">Nutriz</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="d-flex align-center">
        <span class="mr-4 text-body-2" v-if="userEmail">{{ userEmail }}</span>
        <v-btn icon @click="handleLogout">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :permanent="isDesktop"
      expand-on-hover
    >
      <v-list>
        <v-list-item
          prepend-icon="mdi-account-circle"
          :title="userEmail || 'Nutritionist'"
          :subtitle="authStore.user?.role"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dashboard" value="home" to="/" />
        <v-list-item prepend-icon="mdi-account-group" title="Clients" value="clients" to="/clients" />
        <v-list-item prepend-icon="mdi-food-apple" title="Foods" value="foods" to="/foods" />
        <v-list-item prepend-icon="mdi-silverware" title="Meals" value="meals" to="/meals" />
        <v-list-item prepend-icon="mdi-receipt-text" title="Recipes" value="recipes" to="/recipes" />
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-4" style="min-height: 100vh">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const { mdAndUp } = useDisplay();
const isDesktop = computed(() => mdAndUp.value);

const drawer = ref(isDesktop.value);
const rail = ref(isDesktop.value);

watch(isDesktop, (value) => {
  drawer.value = value;
  rail.value = value;
});

const authStore = useAuthStore();
const router = useRouter();

const userEmail = computed(() => authStore.user?.email || '');

function handleLogout() {
  authStore.logout();
  router.replace({ name: 'Login' });
}
</script>

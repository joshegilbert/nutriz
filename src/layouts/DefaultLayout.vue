// src/layouts/DefaultLayout.vue (Original Version)

<template>
  <v-app>
    <v-app-bar app color="primary" density="compact">
      <v-app-bar-nav-icon
        v-if="!display.mdAndUp.value"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>Nutriz</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="mr-4" v-if="userEmail">{{ userEmail }}</span>
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      :permanent="display.mdAndUp.value"
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
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Clients"
          value="clients"
          to="/clients"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-food-apple"
          title="Foods"
          value="foods"
          to="/foods"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-silverware"
          title="Meals"
          value="meals"
          to="/meals"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-receipt-text"
          title="Recipes"
          value="recipes"
          to="/recipes"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main style="min-height: 100vh" class="bg-grey-lighten-4">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const drawer = ref(true);
const rail = ref(true); // Start as a rail on desktop
const display = useDisplay();

const authStore = useAuthStore();
const router = useRouter();

const userEmail = computed(() => authStore.user?.email || "");

async function handleLogout() {
  authStore.logout();
  await router.replace({ name: "Login" });
}
</script>
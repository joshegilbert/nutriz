<template>
  <v-app>
    <v-app-bar app color="primary" density="comfortable">
      <v-app-bar-nav-icon v-if="!isDesktop" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-semibold">Nutriz</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="mr-4" v-if="userEmail">{{ userEmail }}</span>
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
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
        <v-list-item prepend-icon="mdi-file-chart" title="Reports" value="reports" to="/reports" />
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-grey-lighten-4" style="min-height: 100vh">
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
const rail = ref(true);
const display = useDisplay();

const authStore = useAuthStore();
const router = useRouter();

const userEmail = computed(() => authStore.user?.email || "");
// Define isDesktop using Vuetify's display breakpoints
const isDesktop = computed(() => display.mdAndUp.value);

async function handleLogout() {
  authStore.logout();
  await router.replace({ name: "Login" });
}
</script>

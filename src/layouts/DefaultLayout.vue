<template>
  <v-app>
    <v-app-bar app color="primary" density="compact">
      <v-app-bar-nav-icon v-if="!display.mdAndUp.value" @click="drawer = !drawer" />
      <v-toolbar-title>Nutriz</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon title="Logout" @click="logout">
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
          v-if="user"
          :title="user.name || user.email"
          :subtitle="user.email"
          prepend-avatar="https://ui-avatars.com/api/?name=Nutriz&background=1976d2&color=fff"
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
          prepend-icon="mdi-calendar"
          title="Programs"
          value="programs"
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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/useAuthStore";

const drawer = ref(true);
const rail = ref(true);
const display = useDisplay();

const authStore = useAuthStore();
const user = authStore.user;
const router = useRouter();

function logout() {
  authStore.logout();
  router.push({ name: "Login" });
}
</script>

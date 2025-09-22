<template>
  <v-app>
    <v-app-bar app color="primary" density="compact">
      <v-app-bar-nav-icon
        v-if="!display.mdAndUp.value"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-toolbar-title>Nutriz</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/login" icon>
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
          prepend-avatar="https://preview.redd.it/can-yall-help-me-find-goofy-batman-profile-pictures-v0-e2lwqqtr5osc1.jpeg?width=1080&crop=smart&auto=webp&s=49b22bb79d72b5aa9093bfbfc4e9613db69f8ec7"
          title="Bat Man"
          subtitle="nutritionist@nutriz.app"
        ></v-list-item>
      </v-list>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          to="/dashboard"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-group"
          title="Clients"
          value="clients"
          to="/clients"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-food-apple"
          title="Recipes"
          value="recipes"
          to="/recipes"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-information"
          title="About"
          value="about"
          to="/about"
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
import { useDisplay } from "vuetify";

const drawer = ref(true);
const rail = ref(true); // Start as a rail on desktop
const display = useDisplay();
</script>

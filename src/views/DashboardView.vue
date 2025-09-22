<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4">Welcome Back!</h1>
        <p>Here's a quick summary of your workspace.</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-icon color="blue" size="x-large" class="mr-4">
              mdi-account-group
            </v-icon>
            <div>
              <div class="text-h4 font-weight-bold">{{ totalClients }}</div>
              <div class="text-subtitle-1">Total Clients</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4" elevation="2">
          <div class="d-flex align-center">
            <v-icon color="green" size="x-large" class="mr-4">
              mdi-food-apple
            </v-icon>
            <div>
              <div class="text-h4 font-weight-bold">{{ totalRecipes }}</div>
              <div class="text-subtitle-1">Total Recipes</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mt-4">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-btn to="/clients" color="primary" class="mr-2">
              Manage Clients
            </v-btn>
            <v-btn to="/recipes" color="primary">Manage Recipes</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from "vue";
import { useDataStore } from "@/stores/useDataStore";

// Get the shared data from our store
const { clients, recipes } = useDataStore();

// Create computed properties that will automatically update
const totalClients = computed(() => clients.value.length);
const totalRecipes = computed(() => recipes.value.length);
</script>

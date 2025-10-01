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

    <!-- Client Notifications -->
    <v-row>
      <v-col cols="12">
        <v-card class="mt-4">
          <v-card-title>
            <v-icon start icon="mdi-bell-ring"></v-icon>
            Client Notifications
          </v-card-title>
          <v-divider></v-divider>
          <v-list lines="two">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :to="`/clients/${notification.clientId}/plan`"
              link
            >
              <template v-slot:prepend>
                <v-avatar color="primary">
                  <span class="text-h6">{{ notification.clientName.charAt(0) }}</span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">{{ notification.clientName }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>

              <template v-slot:append>
                <span class="text-caption text-grey-darken-1">{{ notification.timestamp }}</span>
              </template>
            </v-list-item>
          </v-list>
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
import { computed, ref } from "vue";
import { useDataStore } from "@/stores/useDataStore";

// Get the shared data from our store
const { clients, recipes } = useDataStore();

// Create computed properties that will automatically update
const totalClients = computed(() => clients.value.length);
const totalRecipes = computed(() => recipes.value.length);

// Mock data for notifications. In a real app, this would come from a backend.
const notifications = ref([
  {
    id: 1,
    clientId: 1,
    clientName: "John Doe",
    message: "I have a question about my Tuesday lunch.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    clientId: 3,
    clientName: "Jane Smith",
    message: "Can I substitute chicken for fish in the plan?",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    clientId: 2,
    clientName: "Peter Jones",
    message: "Feeling great this week! The new plan is working wonders.",
    timestamp: "1 day ago",
  },
]);
</script>

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
      <!-- Client Notifications -->
      <v-col cols="12" md="6">
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

      <!-- Weight Check-ins -->
      <v-col cols="12" md="6">
        <v-card class="mt-4">
          <v-card-title>
            <v-icon start icon="mdi-weight-lifter"></v-icon>
            Weight Check-ins
          </v-card-title>
          <v-divider></v-divider>
          <v-list>
            <v-list-item
              v-for="checkIn in weightCheckIns"
              :key="checkIn.id"
              class="py-3"
            >
              <div>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <v-list-item-title class="font-weight-bold">{{ checkIn.clientName }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-icon small :color="checkIn.change > 0 ? 'red' : 'green'">{{ checkIn.change > 0 ? "mdi-arrow-up" : "mdi-arrow-down" }}</v-icon>
                      {{ Math.abs(checkIn.change) }} lbs | Current: {{ checkIn.currentWeight }} lbs
                    </v-list-item-subtitle>
                  </div>

                  <v-sparkline
                    :model-value="checkIn.history"
                    :color="checkIn.isConcerning ? 'orange' : 'green'"
                    line-width="2"
                    padding="8"
                    auto-draw
                    style="width: 100px; height: 40px"
                  ></v-sparkline>
                </div>

                <div class="mt-2">
                  <v-btn
                    size="small"
                    color="success"
                    class="mr-2"
                    @click="quickMessage(checkIn.clientId, 'good_job')"
                  >
                    Good Job!
                  </v-btn>
                  <v-btn
                    size="small"
                    @click="quickMessage(checkIn.clientId, 'personal')"
                  >
                    Message
                  </v-btn>
                  <v-chip
                    v-if="checkIn.isConcerning"
                    size="small"
                    color="orange"
                    variant="tonal"
                    class="ml-2"
                  >
                    Follow Up
                  </v-chip>
                </div>
              </div>
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

const { clients, recipes } = useDataStore();

const totalClients = computed(() => clients.value.length);
const totalRecipes = computed(() => recipes.value.length);

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

const weightCheckIns = ref([
  {
    id: 1,
    clientId: 1,
    clientName: "John Doe",
    change: -2,
    currentWeight: 188,
    isConcerning: false,
    history: [192, 191, 190, 188],
  },
  {
    id: 2,
    clientId: 2,
    clientName: "Peter Jones",
    change: 1,
    currentWeight: 205,
    isConcerning: true,
    history: [202, 203, 204, 205],
  },
  {
    id: 3,
    clientId: 3,
    clientName: "Jane Smith",
    change: -1.5,
    currentWeight: 140,
    isConcerning: false,
    history: [145, 143, 141.5, 140],
  },
]);

function quickMessage(clientId, type) {
  const client = clients.value.find((c) => c.id === clientId);
  if (!client) return;

  if (type === "good_job") {
    console.log(`Sending 'Good Job!' to ${client.name}`);
    alert(`Message sent to ${client.name}: Good job on your progress!`);
  } else {
    console.log(`Opening personal message for ${client.name}`);
    const message = prompt(`Enter personal message for ${client.name}:`);
    if (message) {
      alert(`Message sent to ${client.name}: ${message}`);
    }
  }
}
</script>

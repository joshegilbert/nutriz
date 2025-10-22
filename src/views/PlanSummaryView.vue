<template>
  <v-container>
    <div v-if="loading" class="py-10 text-center text-grey">Loading…</div>
    <div v-else-if="!program">
      <v-alert type="info" variant="tonal">No plan found for this client yet.</v-alert>
    </div>
    <div v-else>
      <div class="d-flex align-center mb-4">
        <v-btn :to="`/clients/${client?.id}`" icon="mdi-arrow-left" variant="text" />
        <div class="ml-2">
          <h1 class="text-h5 mb-1">Plan Summary</h1>
          <div class="text-subtitle-2">{{ client?.name }}</div>
        </div>
      </div>

      <v-card class="mb-6">
        <v-card-title>Schedule</v-card-title>
        <v-divider />
        <v-card-text>
          <div v-for="day in program.days" :key="day.date" class="mb-4">
            <h3 class="text-subtitle-1 mb-2">{{ day.date }}</h3>
            <div v-if="!day.meals.length" class="text-caption text-grey">No meals</div>
            <v-list v-else density="compact">
              <v-list-item v-for="meal in day.meals" :key="meal.id">
                <v-list-item-title>{{ meal.mealTime || meal.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  <span v-for="item in meal.items" :key="item.id">
                    {{ item.name || lookupName(item) }} (x{{ item.amount || 1 }}) ·
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '@/stores/useDataStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const store = useDataStore();
const { clients } = storeToRefs(store);

const loading = ref(true);
const program = ref(null);

const clientId = computed(() => String(route.params.clientId || route.params.id || ''));
const client = computed(() => clients.value.find((c) => String(c.id) === clientId.value) || null);

onMounted(async () => {
  try {
    if (!clients.value.length) {
      await store.fetchClients().catch(() => {});
    }
    program.value = await store.getProgramByClientId(clientId.value);
  } finally {
    loading.value = false;
  }
});

function lookupName(item) {
  const type = item.type || (item.sourceId ? 'food' : null);
  if (!type) return 'Item';
  const details = store.getItemDetails(type, item.sourceId);
  return details?.name || 'Item';
}
</script>

<style scoped>
</style>


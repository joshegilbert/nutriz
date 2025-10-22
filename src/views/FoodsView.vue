<template>
  <v-container class="py-6">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Foods</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog" :loading="isLoadingFoods">
          Add Food
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="lastError" type="error" class="mb-4" border="start" variant="tonal" :text="lastError" />

    <v-card>
      <v-progress-linear v-if="isLoadingFoods" indeterminate color="primary" />
      <v-card-text>
        <v-row class="mb-4" align="center">
          <v-col cols="12" md="8">
            <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" clearable hide-details />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="selectedCategory" :items="categories" label="Filter category" clearable />
          </v-col>
        </v-row>

        <v-data-table :headers="headers" :items="filteredFoods" item-key="id" density="comfortable">
          <template #item.macros="{ item }">
            Cal: {{ item.caloriesPerServing }} / Prot: {{ item.proteinPerServing }}g / Carb: {{ item.carbsPerServing }}g / Fat: {{ item.fatPerServing }}g
          </template>
          <template #item.actions="{ item }">
            <v-icon size="small" class="mr-2" @click="editFood(item)">mdi-pencil</v-icon>
            <v-icon size="small" @click="removeFood(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5">{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="editedItem.name" label="Food Name*" :rules="[rules.required]" />
            <v-select v-model="editedItem.category" :items="categories" label="Category*" :rules="[rules.required]" />
            <v-text-field v-model="editedItem.defaultServingSize" label="Default Serving Size*" :rules="[rules.required]" />
            <v-row>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.caloriesPerServing" label="Calories*" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.proteinPerServing" label="Protein*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.carbsPerServing" label="Carbs*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.fatPerServing" label="Fat*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog" :disabled="isLoadingFoods">Cancel</v-btn>
          <v-btn variant="text" color="primary" @click="saveFood" :loading="isLoadingFoods">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useDataStore } from '@/stores/useDataStore';
import { storeToRefs } from 'pinia';

const dataStore = useDataStore();
const { foods, isLoadingFoods, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedItem = ref(null);
const search = ref('');
const selectedCategory = ref('');

const categories = [
  'Protein',
  'Vegetable',
  'Fruit',
  'Grain',
  'Dairy',
  'Fat',
  'Other',
];

const headers = ref([
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Default Serving', key: 'defaultServingSize' },
  { title: 'Macros', key: 'macros', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]);

const formTitle = computed(() => (editedItem.value?.id ? 'Edit Food' : 'Add New Food'));
const rules = { required: (v) => (!!v || v === 0) || 'Required.' };

const filteredFoods = computed(() => {
  const q = (search.value || '').toLowerCase();
  const cat = (selectedCategory.value || '').toLowerCase();
  return foods.value.filter((f) => {
    const matchesQ = !q || f.name.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q);
    const matchesCat = !cat || (f.category || '').toLowerCase() === cat;
    return matchesQ && matchesCat;
  });
});

onMounted(async () => {
  try {
    await dataStore.fetchFoods();
  } catch {}
});

function openAddDialog() {
  editedItem.value = {
    id: null,
    name: '',
    category: 'Other',
    defaultServingSize: '',
    caloriesPerServing: 0,
    proteinPerServing: 0,
    carbsPerServing: 0,
    fatPerServing: 0,
  };
  dialog.value = true;
}

function editFood(item) {
  editedItem.value = JSON.parse(JSON.stringify(item));
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = null;
}

async function saveFood() {
  const { valid } = await form.value.validate();
  if (!valid || !editedItem.value) return;
  try {
    if (editedItem.value.id) {
      await dataStore.updateFood(editedItem.value.id, editedItem.value);
    } else {
      await dataStore.createFood(editedItem.value);
    }
    closeDialog();
  } catch {}
}

async function removeFood(item) {
  if (!confirm('Delete this food item?')) return;
  try {
    await dataStore.deleteFood(item.id);
  } catch {}
}
</script>

<style scoped>
</style>


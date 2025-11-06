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

        <v-data-table 
          :headers="headers" 
          :items="filteredFoods" 
          item-key="id" 
          density="comfortable"
          :items-per-page="25"
          :items-per-page-options="[10, 25, 50, 100]"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <v-chip 
                v-if="item.brand" 
                size="x-small" 
                variant="tonal" 
                color="primary" 
                class="mr-2"
              >
                {{ item.brand }}
              </v-chip>
              <span class="font-weight-medium">{{ item.name }}</span>
            </div>
          </template>
          <template #item.category="{ item }">
            <v-chip 
              size="small" 
              :color="getCategoryColor(item.category)" 
              variant="tonal"
            >
              {{ item.category }}
            </v-chip>
          </template>
          <template #item.defaultServing="{ item }">
            <div>
              <span class="font-weight-medium">{{ item.defaultServingSize }}</span>
              <span v-if="item.gramsPerServing" class="text-caption text-grey ml-1">
                ({{ item.gramsPerServing }}g)
              </span>
            </div>
          </template>
          <template #item.macros="{ item }">
            <div class="macro-display">
              <span class="macro-item">
                <strong>{{ item.caloriesPerServing || 0 }}</strong> cal
              </span>
              <span class="macro-sep">·</span>
              <span class="macro-item">
                <strong>{{ item.proteinPerServing || 0 }}</strong>g P
              </span>
              <span class="macro-sep">·</span>
              <span class="macro-item">
                <strong>{{ item.carbsPerServing || 0 }}</strong>g C
              </span>
              <span class="macro-sep">·</span>
              <span class="macro-item">
                <strong>{{ item.fatPerServing || 0 }}</strong>g F
              </span>
            </div>
          </template>
          <template #item.servings="{ item }">
            <v-chip 
              v-if="item.servings && item.servings.length > 0"
              size="x-small" 
              variant="outlined"
            >
              {{ item.servings.length }} serving{{ item.servings.length !== 1 ? 's' : '' }}
            </v-chip>
            <span v-else class="text-grey text-caption">None</span>
          </template>
          <template #item.actions="{ item }">
            <div class="d-flex align-center" style="gap: 4px;">
              <v-tooltip text="Edit food">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    density="compact"
                    @click="editFood(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip text="Duplicate food">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-content-copy"
                    size="small"
                    variant="text"
                    density="compact"
                    @click="duplicateFood(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip text="Delete food">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    density="compact"
                    color="error"
                    @click="removeFood(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" :key="dialogKey" max-width="620px" @keydown.esc="onCancel">
      <v-card>
        <v-card-title class="text-h5">{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field 
                  v-model="editedItem.brand" 
                  label="Brand (optional)" 
                  hint="e.g., Generic, Organic Valley, etc."
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field 
                  v-model="editedItem.name" 
                  label="Food Name*" 
                  :rules="[rules.required]"
                  hint="e.g., Chicken Breast, Brown Rice, etc."
                  persistent-hint
                />
              </v-col>
            </v-row>
            <v-select 
              v-model="editedItem.category" 
              :items="categories" 
              label="Category*" 
              :rules="[rules.required]"
              hint="Select the primary food category"
              persistent-hint
            />
            <v-row>
              <v-col cols="12" md="7">
                <v-text-field v-model="editedItem.defaultServingSize" :disabled="per100g" label="Default Serving Size*" :rules="[rules.required]" />
              </v-col>
              <v-col cols="12" md="5">
                <v-text-field v-model.number="editedItem.gramsPerServing" :disabled="per100g" label="Grams per Default Serving" type="number" hint="Used to convert to other serving units" persistent-hint />
              </v-col>
            </v-row>
            <v-switch v-model="per100g" inset label="Define macros per 100 g" hide-details density="comfortable" />
            <v-row>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.caloriesPerServing" label="Calories*" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.proteinPerServing" label="Protein*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.carbsPerServing" label="Carbs*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
              <v-col cols="6" sm="3"><v-text-field v-model.number="editedItem.fatPerServing" label="Fat*" suffix="g" type="number" :rules="[rules.required]" /></v-col>
            </v-row>
            <v-divider class="my-4" />
            <div class="d-flex align-center justify-space-between mb-2">
              <p class="text-subtitle-2 mb-0">Additional Serving Sizes</p>
              <v-chip size="x-small" variant="tonal" color="info">
                {{ editedItem.servings?.length || 0 }} serving{{ (editedItem.servings?.length || 0) !== 1 ? 's' : '' }} added
              </v-chip>
            </div>
            <v-alert 
              type="info" 
              variant="tonal" 
              density="compact" 
              class="mb-3"
            >
              Add alternative serving sizes (e.g., 1 cup, 1 oz) to make it easier for clients to measure foods.
            </v-alert>
            <v-card variant="outlined" class="pa-3 mb-3">
              <v-row v-for="(s, i) in editedItem.servings" :key="`serv-${i}`" align="center" class="mb-2">
                <v-col cols="12" md="6">
                  <v-text-field 
                    v-model="editedItem.servings[i].label" 
                    label="Serving Label" 
                    placeholder="e.g., 1 cup, 1 oz, 1 piece"
                    density="compact" 
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="5">
                  <v-text-field 
                    v-model.number="editedItem.servings[i].grams" 
                    label="Grams" 
                    type="number" 
                    density="compact" 
                    hide-details
                    hint="Weight in grams for this serving size"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="1" class="text-right">
                  <v-btn 
                    icon="mdi-delete" 
                    variant="text" 
                    size="small"
                    color="error"
                    @click="removeServing(i)" 
                  />
                </v-col>
              </v-row>
              <div v-if="!editedItem.servings || editedItem.servings.length === 0" class="text-center text-grey py-4">
                <v-icon size="large" class="mb-2">mdi-food</v-icon>
                <div class="text-caption">No additional serving sizes yet</div>
              </div>
            </v-card>
            <div class="d-flex align-center flex-wrap" style="gap:8px;">
              <v-btn 
                size="small" 
                variant="tonal" 
                color="primary" 
                prepend-icon="mdi-plus" 
                @click="addServing"
              >
                Add Custom Serving
              </v-btn>
              <v-divider vertical class="mx-2" />
              <span class="text-caption text-grey mr-1">Quick add:</span>
              <v-btn size="x-small" variant="outlined" @click="addCommonServing('1 oz', 28.35)">
                + 1 oz
              </v-btn>
              <v-btn size="x-small" variant="outlined" @click="addCommonServing('1 cup', 240)">
                + 1 cup
              </v-btn>
              <v-btn size="x-small" variant="outlined" @click="addCommonServing('100 g', 100)">
                + 100 g
              </v-btn>
              <v-btn size="x-small" variant="outlined" @click="addCommonServing('1 tbsp', 15)">
                + 1 tbsp
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="onCancel">Cancel</v-btn>
          <v-btn variant="text" color="primary" @click="saveFood" :loading="isLoadingFoods">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useDataStore } from '@/stores/useDataStore';
import { storeToRefs } from 'pinia';

const dataStore = useDataStore();
const { foods, isLoadingFoods, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const dialogKey = ref(0);
const form = ref(null);
const editedItem = ref(null);
const per100g = ref(false);
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
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Default Serving', key: 'defaultServing', sortable: true },
  { title: 'Macros', key: 'macros', sortable: false },
  { title: 'Additional Servings', key: 'servings', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' },
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
    brand: '',
    name: '',
    category: 'Other',
    defaultServingSize: '',
    gramsPerServing: 0,
    caloriesPerServing: 0,
    proteinPerServing: 0,
    carbsPerServing: 0,
    fatPerServing: 0,
    servings: [],
  };
  per100g.value = false;
  dialog.value = true;
}

function editFood(item) {
  const copy = JSON.parse(JSON.stringify(item));
  copy.gramsPerServing = copy.gramsPerServing || 0;
  copy.servings = Array.isArray(copy.servings) ? copy.servings : [];
  editedItem.value = copy;
  per100g.value = (copy.defaultServingSize || '').toLowerCase().includes('100') && Number(copy.gramsPerServing) === 100;
  dialog.value = true;
}

function onCancel() {
  dialog.value = false;
  nextTick(() => {
    form.value?.resetValidation?.();
    editedItem.value = null;
    dialogKey.value++;
  });
}

async function saveFood() {
  const { valid } = await form.value.validate();
  if (!valid || !editedItem.value) return;
  try {
    if (per100g.value) {
      editedItem.value.defaultServingSize = '100 g';
      editedItem.value.gramsPerServing = 100;
    }
    if (editedItem.value.id) {
      await dataStore.updateFood(editedItem.value.id, editedItem.value);
    } else {
      await dataStore.createFood(editedItem.value);
    }
    onCancel();
  } catch {}
}

async function removeFood(item) {
  if (!confirm('Delete this food item?')) return;
  try {
    await dataStore.deleteFood(item.id);
  } catch {}
}

function addServing() {
  if (!Array.isArray(editedItem.value.servings)) editedItem.value.servings = [];
  editedItem.value.servings.push({ label: '', grams: 0 });
}
function removeServing(index) {
  if (!Array.isArray(editedItem.value.servings)) return;
  editedItem.value.servings.splice(index, 1);
}

function addCommonServing(label, grams) {
  if (!Array.isArray(editedItem.value.servings)) editedItem.value.servings = [];
  if (!editedItem.value.servings.some(s => (s.label || '').toLowerCase() === label.toLowerCase())) {
    editedItem.value.servings.push({ label, grams });
  }
}

function duplicateFood(item) {
  const copy = JSON.parse(JSON.stringify(item));
  copy.id = null;
  copy.name = `${copy.name} (Copy)`;
  editedItem.value = copy;
  per100g.value = (copy.defaultServingSize || '').toLowerCase().includes('100') && Number(copy.gramsPerServing) === 100;
  dialog.value = true;
}

function getCategoryColor(category) {
  const colors = {
    'Protein': 'red',
    'Vegetable': 'green',
    'Fruit': 'orange',
    'Grain': 'amber',
    'Dairy': 'blue',
    'Fat': 'purple',
    'Other': 'grey',
  };
  return colors[category] || 'grey';
}

watch(per100g, (val) => {
  if (val) {
    editedItem.value.defaultServingSize = '100 g';
    editedItem.value.gramsPerServing = 100;
  }
});
</script>

<style scoped>
.macro-display {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.macro-item {
  font-size: 0.875rem;
}

.macro-sep {
  color: #9e9e9e;
  font-size: 0.75rem;
}

.macro-item strong {
  color: #1976d2;
  font-weight: 600;
}
</style>

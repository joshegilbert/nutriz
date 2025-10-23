<template>
  <v-container class="py-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5">Templates</h1>
      <div class="d-flex align-center" style="gap:8px;">
        <v-btn variant="tonal" color="primary" size="small" @click="refresh" :loading="loading">Refresh</v-btn>
        <v-btn to="/" variant="text" size="small">Back</v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card>
      <v-tabs v-model="tab" bg-color="transparent">
        <v-tab value="layout">Day Layouts</v-tab>
        <v-tab value="day">Full Days</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="layout">
            <v-data-table
              :headers="layoutHeaders"
              :items="layoutTemplates"
              item-key="id"
              density="compact"
            >
              <template #item.name="{ item }">
                <v-text-field
                  v-model="nameEdits[item.id]"
                  variant="plain"
                  hide-details
                  density="compact"
                  @blur="saveName('layout', item)"
                />
              </template>
              <template #item.tags="{ item }">
                <v-combobox
                  v-model="tagEdits[item.id]"
                  multiple
                  chips
                  hide-details
                  density="compact"
                  @blur="saveTags('layout', item)"
                />
              </template>
              <template #item.details="{ item }">
                {{ (item.meals || []).length }} meal slots
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete('layout', item)" />
              </template>
            </v-data-table>
          </v-window-item>

          <v-window-item value="day">
            <v-data-table
              :headers="dayHeaders"
              :items="dayTemplatesList"
              item-key="id"
              density="compact"
            >
              <template #item.name="{ item }">
                <v-text-field
                  v-model="nameEdits[item.id]"
                  variant="plain"
                  hide-details
                  density="compact"
                  @blur="saveName('day', item)"
                />
              </template>
              <template #item.tags="{ item }">
                <v-combobox
                  v-model="tagEdits[item.id]"
                  multiple
                  chips
                  hide-details
                  density="compact"
                  @blur="saveTags('day', item)"
                />
              </template>
              <template #item.details="{ item }">
                {{ countItems(item) }} items across {{ (item.meals || []).length }} meals
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete('day', item)" />
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-dialog v-model="deleteDialog.open" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Delete template?</v-card-title>
        <v-card-text>Are you sure you want to delete "{{ deleteDialog.item?.name }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.open = false">Cancel</v-btn>
          <v-btn color="error" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useDataStore } from '@/stores/useDataStore';
import { storeToRefs } from 'pinia';

const store = useDataStore();
const { dayTemplates, dayLayoutTemplates } = storeToRefs(store);

const tab = ref('layout');
const loading = ref(false);
const error = ref('');

const nameEdits = reactive({});
const tagEdits = reactive({});

const layoutTemplates = computed(() => dayLayoutTemplates.value || []);
const dayTemplatesList = computed(() => dayTemplates.value || []);

const layoutHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Tags', key: 'tags' },
  { title: 'Details', key: 'details' },
  { title: 'Actions', key: 'actions', sortable: false },
];
const dayHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Tags', key: 'tags' },
  { title: 'Details', key: 'details' },
  { title: 'Actions', key: 'actions', sortable: false },
];

onMounted(async () => {
  error.value = '';
  try {
    loading.value = true;
    await store.fetchTemplates();
    seedEdits();
  } catch (e) {
    error.value = store.lastError || e.message || 'Unable to load templates.';
  } finally {
    loading.value = false;
  }
});

function seedEdits() {
  (layoutTemplates.value || []).forEach((t) => {
    nameEdits[t.id] = t.name;
    tagEdits[t.id] = [...(t.tags || [])];
  });
  (dayTemplatesList.value || []).forEach((t) => {
    nameEdits[t.id] = t.name;
    tagEdits[t.id] = [...(t.tags || [])];
  });
}

async function refresh() {
  loading.value = true;
  await store.fetchTemplates();
  seedEdits();
  loading.value = false;
}

async function saveName(type, item) {
  const next = (nameEdits[item.id] || '').trim();
  if (!next || next === item.name) return;
  await store.renameTemplate(type, item.id, next);
  await refresh();
}

async function saveTags(type, item) {
  const next = Array.isArray(tagEdits[item.id]) ? tagEdits[item.id] : [];
  if (JSON.stringify(next) === JSON.stringify(item.tags || [])) return;
  await store.setTemplateTags(type, item.id, next);
  await refresh();
}

function countItems(dayTpl) {
  return (dayTpl.meals || []).reduce((acc, m) => acc + (m.items || []).length, 0);
}

const deleteDialog = reactive({ open: false, type: 'layout', item: null });
function confirmDelete(type, item) {
  deleteDialog.open = true;
  deleteDialog.type = type;
  deleteDialog.item = item;
}
async function doDelete() {
  await store.deleteTemplate(deleteDialog.type, deleteDialog.item.id);
  deleteDialog.open = false;
  await refresh();
}
</script>

<style scoped>
</style>

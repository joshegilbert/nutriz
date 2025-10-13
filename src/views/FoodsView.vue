<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Food Database</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Food</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="dataStore.errors.foods" type="error" class="mb-4">
      {{ dataStore.errors.foods }}
    </v-alert>

    <v-card>
      <v-progress-linear v-if="dataStore.loading.foods" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table :headers="headers" :items="foods" item-key="id">
          <template v-slot:item.defaultServingSize="{ item }">
            {{ item.defaultServingSize }}
          </template>
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.caloriesPerServing }} / Prot: {{ item.proteinPerServing }}g / Carb: {{ item.carbsPerServing }}g / Fat: {{ item.fatPerServing }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editFood(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteFood(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field v-model="editedItem.name" label="Food Name*" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.category"
                    :items="categories"
                    label="Category"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.defaultServingSize" label="Default Serving Size*" :rules="[rules.required]"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <p class="text-subtitle-1 mb-2">Macros Per Serving</p>

              <v-row>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.caloriesPerServing" label="Calories*" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.proteinPerServing" label="Protein*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.carbsPerServing" label="Carbs*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.fatPerServing" label="Fat*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
              </v-row>
            </v-container>
            <small class="pa-4">*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" :loading="saving" @click="saveFood">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">
          Are you sure you want to delete this food item?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" :loading="saving" @click="deleteFoodConfirm">OK</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const dataStore = useDataStore();
const { foods } = storeToRefs(dataStore);

const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const saving = ref(false);

const clone = (value) => JSON.parse(JSON.stringify(value));

const categories = ["Protein", "Vegetable", "Fruit", "Grain", "Dairy", "Fat", "Other"];

const defaultItem = {
  id: null,
  name: "",
  category: "Other",
  defaultServingSize: "",
  caloriesPerServing: 0,
  proteinPerServing: 0,
  carbsPerServing: 0,
  fatPerServing: 0,
};
const editedItem = ref(clone(defaultItem));

const formTitle = computed(() => (editedIndex.value === -1 ? "Add New Food" : "Edit Food"));
const rules = { required: (value) => !!value || "Required." };

const headers = ref([
  { title: "Food Item", key: "name", align: "start" },
  { title: "Category", key: "category" },
  { title: "Serving", key: "defaultServingSize", sortable: false },
  { title: "Macros (per Serving)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

onMounted(() => {
  dataStore.fetchFoods().catch(() => {});
});

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = clone(defaultItem);
  dialog.value = true;
}

function editFood(item) {
  editedIndex.value = foods.value.findIndex((f) => f.id === item.id);
  editedItem.value = clone(item);
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = clone(defaultItem);
  editedIndex.value = -1;
}

function closeDelete() {
  dialogDelete.value = false;
  editedItem.value = clone(defaultItem);
  editedIndex.value = -1;
}

async function saveFood() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      name: editedItem.value.name,
      category: editedItem.value.category,
      defaultServingSize: editedItem.value.defaultServingSize,
      caloriesPerServing: Number(editedItem.value.caloriesPerServing) || 0,
      proteinPerServing: Number(editedItem.value.proteinPerServing) || 0,
      carbsPerServing: Number(editedItem.value.carbsPerServing) || 0,
      fatPerServing: Number(editedItem.value.fatPerServing) || 0,
    };
    if (editedIndex.value > -1 && editedItem.value.id) {
      await dataStore.updateFood(editedItem.value.id, payload);
    } else {
      await dataStore.createFood(payload);
    }
    closeDialog();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

function deleteFood(item) {
  editedIndex.value = foods.value.findIndex((f) => f.id === item.id);
  editedItem.value = clone(item);
  dialogDelete.value = true;
}

async function deleteFoodConfirm() {
  if (!editedItem.value?.id) return;
  saving.value = true;
  try {
    await dataStore.deleteFood(editedItem.value.id);
    closeDelete();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}
</script>

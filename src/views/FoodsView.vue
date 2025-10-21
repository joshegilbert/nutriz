<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Food Database</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          :loading="isLoadingFoods"
        >
          Add Food
        </v-btn>
      </v-col>
    </v-row>

    <v-alert
      v-if="lastError"
      type="error"
      class="mb-4"
      border="start"
      variant="tonal"
      :text="lastError"
    />

    <v-card>
      <v-progress-linear v-if="dataStore.loading.foods" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="search"
              label="Search foods"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
        </v-row>

        <v-data-table :headers="headers" :items="filteredFoods" item-key="id">
          <template v-slot:item.serving="{ item }">
            {{ item.servingSize }} {{ item.servingUnit }} ({{ item.gramsPerServing }}g)
          </template>
          
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.caloriesPerServing }} / Prot: {{ item.proteinPerServing }}g /
            Carb: {{ item.carbsPerServing }}g / Fat: {{ item.fatPerServing }}g
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
                <v-col cols="12" sm="8">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Food Name*"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="editedItem.category"
                    :items="categories"
                    label="Category"
                  ></v-select>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <p class="text-subtitle-1 mb-2">Serving Information</p>

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="editedItem.defaultServingSize"
                      label="Default Serving Size*"
                      hint="e.g., 100g, 1 cup"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </v-col>
                </v-row>

              <v-divider class="my-4"></v-divider>
              <p class="text-subtitle-1 mb-2">Macros Per Serving</p>

                <v-row>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model.number="editedItem.caloriesPerServing"
                      label="Calories*"
                      type="number"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model.number="editedItem.proteinPerServing"
                      label="Protein*"
                      suffix="g"
                      type="number"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model.number="editedItem.carbsPerServing"
                      label="Carbs*"
                      suffix="g"
                      type="number"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-text-field
                      v-model.number="editedItem.fatPerServing"
                      label="Fat*"
                      suffix="g"
                      type="number"
                      :rules="[rules.required]"
                    ></v-text-field>
                  </v-col>
                </v-row>
            </v-container>
            <small class="pa-4">*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closeDialog"
            :disabled="isLoadingFoods"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveFood"
            :loading="isLoadingFoods"
          >
            Save
          </v-btn>
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
const { foods, isLoadingFoods, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const search = ref("");

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

const categories = [
  "Protein",
  "Vegetable",
  "Fruit",
  "Grain",
  "Dairy",
  "Fat",
  "Other",
];

const formTitle = computed(() =>
  editedItem.value?.id ? "Edit Food" : "Add New Food"
);

const rules = { required: (value) => !!value || "Required." };

const headers = ref([
  { title: "Food Item", key: "name", align: "start" },
  { title: "Brand", key: "brand" },
  { title: "Serving", key: "serving", sortable: false },
  { title: "Macros (per Serving)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

const filteredFoods = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return foods.value;
  return foods.value.filter((item) => {
    const name = item.name?.toLowerCase() ?? "";
    const brand = item.brand?.toLowerCase() ?? "";
    return name.includes(term) || brand.includes(term);
  });
});

function openAddDialog() {
  editedItem.value = { ...defaultItem };
  dialog.value = true;
}

function editFood(item) {
  editedItem.value = { ...item };
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
  } catch (error) {
    console.error("Unable to save food", error);
  }
}

async function deleteFood(item) {
  if (!item?.id) return;
  if (!confirm("Are you sure you want to delete this food item?")) return;
  try {
    await dataStore.deleteFood(item.id);
  } catch (error) {
    console.error("Unable to delete food", error);
  }
}
</script>

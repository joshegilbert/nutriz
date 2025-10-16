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

    <v-card>
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
            Cal: {{ item.macrosPerServing.calories }} / Prot: {{ item.macrosPerServing.protein }}g / Carb: {{ item.macrosPerServing.carbs }}g / Fat: {{ item.macrosPerServing.fat }}g
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editFood(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteFood(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="800px">
     <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-container>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.brand" label="Brand (e.g., Fage)"></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="editedItem.name" label="Food Name*" :rules="[rules.required]"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <p class="text-subtitle-1 mb-2">Serving Information</p>

              <v-row>
                <v-col cols="12" sm="4">
                  <v-text-field v-model.number="editedItem.servingSize" label="Serving Size*" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="editedItem.servingUnit" label="Serving Unit*" hint="e.g., g, cup, scoop, 1 large egg" :rules="[rules.required]"></v-text-field>
                </v-col>
                 <v-col cols="12" sm="4">
                  <v-text-field v-model.number="editedItem.gramsPerServing" label="Grams Per Serving*" type="number" suffix="g" :rules="[rules.required]"></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <p class="text-subtitle-1 mb-2">Macros Per Serving</p>

              <v-row>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.macrosPerServing.calories" label="Calories*" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.macrosPerServing.protein" label="Protein*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.macrosPerServing.carbs" label="Carbs*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.macrosPerServing.fat" label="Fat*" suffix="g" type="number" :rules="[rules.required]"></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field v-model.number="editedItem.macrosPerServing.fiber" label="Fiber" suffix="g" type="number"></v-text-field>
                </v-col>
              </v-row>
            </v-container>
            <small class="pa-4">*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveFood">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
// The script setup remains the same
import { ref, computed } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const dataStore = useDataStore();
const { foods } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const search = ref("");

const defaultItem = {
    id: null,
    brand: "",
    name: "",
    servingSize: 0,
    servingUnit: "",
    gramsPerServing: 0,
    macrosPerServing: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
};
const editedItem = ref(JSON.parse(JSON.stringify(defaultItem)));

const formTitle = computed(() => (editedIndex.value === -1 ? "Add New Food" : "Edit Food"));
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
  editedIndex.value = -1;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  editedItem.value.id = Date.now();
  dialog.value = true;
}

function editFood(item) {
  editedIndex.value = foods.value.findIndex(f => f.id === item.id);
  editedItem.value = JSON.parse(JSON.stringify(item));
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

async function saveFood() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (editedIndex.value > -1) {
    Object.assign(foods.value[editedIndex.value], editedItem.value);
  } else {
    foods.value.unshift(editedItem.value);
  }
  closeDialog();
}

function deleteFood(item) {
    const index = foods.value.findIndex(f => f.id === item.id);
    if(confirm('Are you sure you want to delete this food item?')){
        foods.value.splice(index, 1);
    }
}
</script>

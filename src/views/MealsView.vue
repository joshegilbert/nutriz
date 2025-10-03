<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Meals Database</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Add Meal</v-btn>
      </v-col>
    </v-row>

    <v-card>
      <v-card-text>
        <v-data-table :headers="headers" :items="mealsWithMacros" item-key="id">
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.totalMacros.calories.toFixed(0) }} / Prot: {{ item.totalMacros.protein.toFixed(0) }}g / Carb: {{ item.totalMacros.carbs.toFixed(0) }}g / Fat: {{ item.totalMacros.fat.toFixed(0) }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editMeal(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteMeal(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="900px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ formTitle }}</span>
          <div class="text-subtitle-2">
            Totals:
            <span class="ml-2">Cal: <b>{{ mealTotalMacros.calories.toFixed(0) }}</b></span>
            <span class="ml-3">Prot: <b>{{ mealTotalMacros.protein.toFixed(0) }}g</b></span>
            <span class="ml-3">Carb: <b>{{ mealTotalMacros.carbs.toFixed(0) }}g</b></span>
            <span class="ml-3">Fat: <b>{{ mealTotalMacros.fat.toFixed(0) }}g</b></span>
          </div>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="editedItem.name" label="Meal Name*" :rules="[rules.required]" class="mb-4"></v-text-field>
            
            <div v-for="(component, index) in editedItem.components" :key="index">
              <v-card class="mb-3" variant="outlined">
                <v-card-text>
                  <v-row align="center" dense>
                    <v-col cols="12" sm="6">
                      <v-autocomplete
                        v-if="!('customName' in component)"
                        :model-value="component.foodId"
                        @update:model-value="updateComponent(index, $event)"
                        :items="foods"
                        :item-title="item => `${item.brand} ${item.name}`"
                        item-value="id"
                        label="Select Food"
                        density="compact"
                        hide-details
                      ></v-autocomplete>
                      <v-text-field
                        v-else
                        v-model="component.customName"
                        label="Custom Item Name"
                        density="compact"
                        hide-details
                      ></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="2">
                       <v-text-field v-model.number="component.amount" label="Amount" type="number" density="compact" hide-details @update:model-value="recalculateMacros(component, true)"></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="2">
                       <v-text-field
                          v-if="'customName' in component"
                          v-model="component.serving"
                          label="Serving"
                          placeholder="e.g. cup"
                          density="compact"
                          hide-details
                        ></v-text-field>
                       <v-text-field
                          v-else
                          :model-value="getServing(component)"
                          label="Serving"
                          density="compact"
                          hide-details
                          readonly
                          variant="underlined"
                        ></v-text-field>
                    </v-col>
                     <v-col cols="4" sm="2" class="text-right">
                        <v-btn :icon="component.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" @click="component.expanded = !component.expanded"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" color="grey" @click="removeComponent(index)"></v-btn>
                    </v-col>
                  </v-row>
                  
                  <v-expand-transition>
                    <div v-if="component.expanded">
                      <v-divider class="my-3"></v-divider>
                      <p class="text-caption">Override Macros for this Component</p>
                      <v-row dense>
                        <v-col><v-text-field v-model.number="component.macros.calories" label="Calories" density="compact" type="number"></v-text-field></v-col>
                        <v-col><v-text-field v-model.number="component.macros.protein" label="Protein" density="compact" type="number" suffix="g"></v-text-field></v-col>
                        <v-col><v-text-field v-model.number="component.macros.carbs" label="Carbs" density="compact" type="number" suffix="g"></v-text-field></v-col>
                        <v-col><v-text-field v-model.number="component.macros.fat" label="Fat" density="compact" type="number" suffix="g"></v-text-field></v-col>
                      </v-row>
                    </div>
                  </v-expand-transition>
                </v-card-text>
              </v-card>
            </div>

            <v-btn @click="addComponent('food')" prepend-icon="mdi-plus" class="mr-2">Add Ingredient</v-btn>
            <v-btn @click="addComponent('custom')" prepend-icon="mdi-plus">Add Custom Item</v-btn>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveMeal">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const dataStore = useDataStore();
const { meals, foods } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedIndex = ref(-1);

const defaultItem = { id: null, name: "", components: [] };
const editedItem = ref(JSON.parse(JSON.stringify(defaultItem)));

const formTitle = computed(() => (editedIndex.value === -1 ? "Add New Meal" : "Edit Meal"));
const rules = { required: (value) => !!value || "Required." };

// --- HELPER FUNCTION ---
function getMacros(component, forceRecalc = false) {
  const emptyMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!component) return emptyMacros;

  if (component.expanded && !forceRecalc) {
      return component.macros || emptyMacros;
  }
  
  if ('customName' in component) {
      return component.macros || emptyMacros;
  }

  const food = foods.value.find(f => f.id === component.foodId);
  if (!food) return emptyMacros;
  
  const multiplier = component.amount || 0;
  return {
    calories: (food.macrosPerServing.calories || 0) * multiplier,
    protein: (food.macrosPerServing.protein || 0) * multiplier,
    carbs: (food.macrosPerServing.carbs || 0) * multiplier,
    fat: (food.macrosPerServing.fat || 0) * multiplier,
  };
}

// --- COMPUTED PROPERTIES ---
const mealsWithMacros = computed(() => {
  return meals.value.map(meal => {
    const totalMacros = (meal.components || []).reduce((totals, component) => {
      const macros = getMacros(component, true); // Always force recalc for the list view
      totals.calories += macros.calories;
      totals.protein += macros.protein;
      totals.carbs += macros.carbs;
      totals.fat += macros.fat;
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return { ...meal, totalMacros };
  });
});

const mealTotalMacros = computed(() => {
  if (!editedItem.value.components) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return editedItem.value.components.reduce((totals, component) => {
    const macros = getMacros(component);
    totals.calories += Number(macros.calories) || 0;
    totals.protein += Number(macros.protein) || 0;
    totals.carbs += Number(macros.carbs) || 0;
    totals.fat += Number(macros.fat) || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
});

const headers = ref([
  { title: "Meal Name", key: "name", align: "start" },
  { title: "Macros (1 Serving)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

// --- COMPONENT LOGIC ---
function addComponent(type) {
  const newComponent = { amount: 1, macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, expanded: false };
  if (type === 'food') {
    newComponent.foodId = null;
  } else if (type === 'custom') {
    newComponent.customName = "";
    newComponent.serving = "";
    newComponent.expanded = true; // Custom items start expanded to enter macros
  }
  editedItem.value.components.push(newComponent);
}

function removeComponent(index) {
  editedItem.value.components.splice(index, 1);
}

function getServing(component) {
  if ('customName' in component) return component.serving || "unit";
  const food = foods.value.find(f => f.id === component.foodId);
  return food ? food.servingUnit : "";
}

function updateComponent(index, foodId) {
  const component = editedItem.value.components[index];
  component.foodId = foodId;
  recalculateMacros(component, true); // Force recalculation
}

function recalculateMacros(component, force = false) {
    if (component.expanded && !force) return; // Respect manual overrides unless forced
    component.macros = getMacros(component, true);
}

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  editedItem.value.id = Date.now();
  dialog.value = true;
}

function editMeal(item) {
  editedIndex.value = meals.value.findIndex(m => m.id === item.id);
  // Find the original item from the base `meals` ref to edit
  const originalMeal = meals.value[editedIndex.value];
  const mealToEdit = JSON.parse(JSON.stringify(originalMeal));
  // Initialize UI state properties
  (mealToEdit.components || []).forEach(c => {
      c.expanded = false;
      // Pre-calculate macros for editing
      c.macros = getMacros(c, true);
  });
  editedItem.value = mealToEdit;
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

async function saveMeal() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  const mealToSave = JSON.parse(JSON.stringify(editedItem.value));
  (mealToSave.components || []).forEach(c => delete c.expanded);


  if (editedIndex.value > -1) {
    meals.value[editedIndex.value] = mealToSave;
  } else {
    meals.value.unshift(mealToSave);
  }
  closeDialog();
}

function deleteMeal(item) {
  const index = meals.value.findIndex(m => m.id === item.id);
  if (confirm('Are you sure you want to delete this meal?')) {
    if (index > -1) meals.value.splice(index, 1);
  }
}
</script>
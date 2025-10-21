<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Meal Programs</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          :loading="isLoadingMeals || isSubmitting"
        >
          Add Meal
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
      <v-progress-linear v-if="isLoadingMeals" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="mealsWithMacros"
          item-key="id"
          :loading="isLoadingMeals"
          loading-text="Loading meals..."
        >
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.totalMacros.calories.toFixed(0) }} /
            Prot: {{ item.totalMacros.protein.toFixed(0) }}g /
            Carb: {{ item.totalMacros.carbs.toFixed(0) }}g /
            Fat: {{ item.totalMacros.fat.toFixed(0) }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" :to="{ name: 'PlanSummary', params: { clientId: item.clientId }, query: { programId: item.id } }">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="grey" @click="deleteProgram(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Create Program</span>
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
                        v-if="component.type === 'food'"
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
                       <v-text-field
                         v-model.number="component.amount"
                         label="Amount"
                         type="number"
                         density="compact"
                         hide-details
                         @update:model-value="() => handleAmountChange(component)"
                       ></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="2">
                       <v-text-field
                          v-if="component.type === 'custom'"
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
                        <v-col>
                          <v-text-field
                            v-model.number="component.macros.calories"
                            label="Calories"
                            density="compact"
                            type="number"
                            @update:model-value="() => markManual(component)"
                          ></v-text-field>
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model.number="component.macros.protein"
                            label="Protein"
                            density="compact"
                            type="number"
                            suffix="g"
                            @update:model-value="() => markManual(component)"
                          ></v-text-field>
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model.number="component.macros.carbs"
                            label="Carbs"
                            density="compact"
                            type="number"
                            suffix="g"
                            @update:model-value="() => markManual(component)"
                          ></v-text-field>
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model.number="component.macros.fat"
                            label="Fat"
                            density="compact"
                            type="number"
                            suffix="g"
                            @update:model-value="() => markManual(component)"
                          ></v-text-field>
                        </v-col>
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
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog" :disabled="isSubmitting">Cancel</v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveMeal"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const dataStore = useDataStore();
const { meals, foods, isLoadingMeals, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const isSubmitting = ref(false);

const defaultItem = { id: null, name: "", description: "", components: [], macrosSource: "auto" };
const editedItem = ref(JSON.parse(JSON.stringify(defaultItem)));

const formTitle = computed(() => (editedIndex.value === -1 ? "Add New Meal" : "Edit Meal"));
const rules = { required: (value) => !!value || "Required." };

onMounted(async () => {
  try {
    if (!foods.value.length) {
      await dataStore.fetchFoods().catch(() => {});
    }
    await dataStore.fetchMeals().catch(() => {});
  } catch (error) {
    // Errors are surfaced via lastError from the store
  }
});

function ensureComponentMeta(component) {
  if (!component) return;
  component.type = component.type || (component.customName != null ? "custom" : "food");
  if (!component.macros) {
    component.macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  if (!component.macrosSource) {
    component.macrosSource = component.type === "custom" ? "overridden" : "auto";
  }
  if (component.expanded === undefined) {
    component.expanded = component.type === "custom";
  }
}

function createComponent(type) {
  if (type === "custom") {
    return {
      type: "custom",
      customName: "",
      serving: "",
      amount: 1,
      notes: "",
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      macrosSource: "overridden",
      expanded: true,
    };
  }

  return {
    type: "food",
    foodId: null,
    amount: 1,
    notes: "",
    macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    macrosSource: "auto",
    expanded: false,
  };
}

function getMacros(component, forceRecalc = false) {
  const emptyMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!component) return emptyMacros;

  ensureComponentMeta(component);

  if (component.macrosSource === "overridden" && !forceRecalc) {
    return component.macros || emptyMacros;
  }

  if (component.type === "custom") {
    return component.macros || emptyMacros;
  }

  const food = foods.value.find((f) => f.id === component.foodId);
  if (!food) return emptyMacros;

  const multiplier = Number(component.amount) || 0;
  return {
    calories: (food.macrosPerServing.calories || 0) * multiplier,
    protein: (food.macrosPerServing.protein || 0) * multiplier,
    carbs: (food.macrosPerServing.carbs || 0) * multiplier,
    fat: (food.macrosPerServing.fat || 0) * multiplier,
  };
}

const mealsWithMacros = computed(() => {
  return meals.value.map((meal) => {
    const totals = meal.macros
      ? {
          calories: Number(meal.macros.calories) || 0,
          protein: Number(meal.macros.protein) || 0,
          carbs: Number(meal.macros.carbs) || 0,
          fat: Number(meal.macros.fat) || 0,
        }
      : (meal.components || []).reduce(
          (acc, component) => {
            const macros = getMacros(component, component.macrosSource !== "overridden");
            acc.calories += Number(macros.calories) || 0;
            acc.protein += Number(macros.protein) || 0;
            acc.carbs += Number(macros.carbs) || 0;
            acc.fat += Number(macros.fat) || 0;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

    return { ...meal, totalMacros: totals };
  });
});

const mealTotalMacros = computed(() => {
  if (!editedItem.value.components) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return editedItem.value.components.reduce(
    (totals, component) => {
      const macros = getMacros(component);
      totals.calories += Number(macros.calories) || 0;
      totals.protein += Number(macros.protein) || 0;
      totals.carbs += Number(macros.carbs) || 0;
      totals.fat += Number(macros.fat) || 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
});

const headers = ref([
  { title: "Program", key: "name", align: "start" },
  { title: "Client", key: "clientName" },
  { title: "Start", key: "startDate" },
  { title: "Length", key: "length" },
  { title: "Macros", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

function addComponent(type) {
  if (!editedItem.value.components) {
    editedItem.value.components = [];
  }
  editedItem.value.components.push(createComponent(type));
}


function getServing(component) {
  if (!component || component.type === "custom") return component?.serving || "unit";
  const food = foods.value.find((f) => f.id === component.foodId);
  return food ? food.servingUnit : "";
}

function updateComponent(index, foodId) {
  const component = editedItem.value.components[index];
  if (!component) return;
  component.type = "food";
  component.foodId = foodId || null;
  component.macrosSource = "auto";
  recalculateMacros(component, true);
}

function markManual(component) {
  if (!component) return;
  ensureComponentMeta(component);
  component.macrosSource = "overridden";
}

function handleAmountChange(component) {
  if (!component) return;
  if (component.type === "food") {
    component.macrosSource = "auto";
    recalculateMacros(component, true);
  } else {
    markManual(component);
  }
}

function recalculateMacros(component, force = false) {
  if (!component) return;
  if (component.macrosSource === "overridden" && !force) return;
  const macros = getMacros(component, true);
  component.macros = {
    calories: Number(macros.calories) || 0,
    protein: Number(macros.protein) || 0,
    carbs: Number(macros.carbs) || 0,
    fat: Number(macros.fat) || 0,
  };
  component.macrosSource = "auto";
}

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  dialog.value = true;
}

function editMeal(item) {
  editedIndex.value = meals.value.findIndex((m) => m.id === item.id);
  const originalMeal = meals.value[editedIndex.value];
  const mealToEdit = JSON.parse(JSON.stringify(originalMeal));
  (mealToEdit.components || []).forEach((component) => {
    ensureComponentMeta(component);
    component.expanded = false;
    if (component.macrosSource !== "overridden") {
      recalculateMacros(component, true);
    } else {
      component.macros = {
        calories: Number(component.macros?.calories) || 0,
        protein: Number(component.macros?.protein) || 0,
        carbs: Number(component.macros?.carbs) || 0,
        fat: Number(component.macros?.fat) || 0,
      };
    }
  });
  editedItem.value = mealToEdit;
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  isSubmitting.value = false;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  editedIndex.value = -1;
}

function prepareMealForSave(meal) {
  const clone = JSON.parse(JSON.stringify(meal));
  clone.components = (clone.components || []).map((component) => {
    ensureComponentMeta(component);
    component.macros = {
      calories: Number(component.macros?.calories) || 0,
      protein: Number(component.macros?.protein) || 0,
      carbs: Number(component.macros?.carbs) || 0,
      fat: Number(component.macros?.fat) || 0,
    };
    delete component.expanded;
    return component;
  });
  return clone;
}

async function saveMeal() {
  if (!form.value) return;
  const { valid } = await form.value.validate();
  if (!valid) return;

  isSubmitting.value = true;
  const payload = prepareMealForSave(editedItem.value);

  try {
    if (editedIndex.value > -1) {
      await dataStore.updateMealTemplate(payload.id, payload);
    } else {
      await dataStore.createMealTemplate(payload);
    }
    closeDialog();
  } catch (error) {
    isSubmitting.value = false;
    // Keep the dialog open for corrections; error message shown via lastError
  }
}

async function deleteMeal(item) {
  if (!item?.id) return;
  if (!confirm("Are you sure you want to delete this meal?")) return;
  try {
    await dataStore.deleteMealTemplate(item.id);
  } catch (error) {
    // Error surfaced via lastError
  }
}
</script>

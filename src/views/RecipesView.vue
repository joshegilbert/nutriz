<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4 d-inline-block mr-4">Recipe Library 🍳</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          @click="openAddDialog"
          :loading="isLoadingRecipes"
        >
          Add Recipe
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
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="recipesWithMacros"
          item-key="id"
          :loading="isLoadingRecipes"
          loading-text="Loading recipes..."
        >
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.totalMacros.calories.toFixed(0) }} / Prot: {{ item.totalMacros.protein.toFixed(0) }}g / Carb: {{ item.totalMacros.carbs.toFixed(0) }}g / Fat: {{ item.totalMacros.fat.toFixed(0) }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editRecipe(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteRecipe(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="1000px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h5">{{ formTitle }}</span>
          <div class="text-subtitle-2">
            Totals:
            <span class="ml-2">Cal: <b>{{ recipeTotalMacros.calories.toFixed(0) }}</b></span>
            <span class="ml-3">Prot: <b>{{ recipeTotalMacros.protein.toFixed(0) }}g</b></span>
            <span class="ml-3">Carb: <b>{{ recipeTotalMacros.carbs.toFixed(0) }}g</b></span>
            <span class="ml-3">Fat: <b>{{ recipeTotalMacros.fat.toFixed(0) }}g</b></span>
          </div>
        </v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="form">
            <v-text-field v-model="editedItem.name" label="Recipe Name*" :rules="[rules.required]" class="mb-4"></v-text-field>
            <v-textarea v-model="editedItem.instructions" label="Instructions" auto-grow rows="4" class="mb-4" hint="Describe the cooking process step-by-step."></v-textarea>
            
            <h3 class="text-h6 mb-2">Components</h3>
            
            <div v-for="(component, index) in editedItem.components" :key="index">
              <v-card v-if="component.type === 'meal'" class="mb-3" variant="outlined" style="background-color: #fafafa;">
                 <v-card-item>
                   <div class="d-flex align-center">
                      <v-icon class="mr-2">mdi-folder-outline</v-icon>
                      <v-autocomplete
                        :model-value="component.mealId"
                        @update:model-value="updateMealComponent(index, $event)"
                        :items="meals"
                        item-title="name"
                        item-value="id"
                        label="Select Meal"
                        density="compact"
                        hide-details
                        variant="underlined"
                      ></v-autocomplete>
                      <v-spacer></v-spacer>
                      <v-btn :icon="component.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" @click="component.expanded = !component.expanded" title="Edit Contents"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" color="grey" @click="removeComponent(index)"></v-btn>
                   </div>
                 </v-card-item>
                 <v-expand-transition>
                   <div v-if="component.expanded">
                     <v-divider></v-divider>
                     <div v-for="(foodComp, foodIndex) in component.components" :key="foodIndex" class="pa-3">
                        <v-card variant="outlined">
                          <v-card-text>
                            <v-row dense align="center">
                              <v-col cols="12" sm="6">{{ getFoodName(foodComp.foodId) }}</v-col>
                              <v-col cols="4" sm="2"><v-text-field v-model.number="foodComp.amount" label="Amount" density="compact" hide-details type="number" @update:model-value="recalculateMacros(foodComp, true)"></v-text-field></v-col>
                              <v-col cols="4" sm="2"><v-text-field :model-value="getFoodServing(foodComp.foodId)" label="Serving" density="compact" hide-details readonly variant="underlined"></v-text-field></v-col>
                              <v-col cols="4" sm="2" class="text-right"><v-btn :icon="foodComp.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" @click="foodComp.expanded = !foodComp.expanded" title="Override Macros"></v-btn></v-col>
                            </v-row>
                            <v-expand-transition>
                               <div v-if="foodComp.expanded">
                                  <v-divider class="my-3"></v-divider>
                                  <p class="text-caption">Override Macros</p>
                                  <v-row dense>
                                    <v-col><v-text-field v-model.number="foodComp.macros.calories" label="Calories" density="compact" type="number"></v-text-field></v-col>
                                    <v-col><v-text-field v-model.number="foodComp.macros.protein" label="Protein" density="compact" type="number" suffix="g"></v-text-field></v-col>
                                    <v-col><v-text-field v-model.number="foodComp.macros.carbs" label="Carbs" density="compact" type="number" suffix="g"></v-text-field></v-col>
                                    <v-col><v-text-field v-model.number="foodComp.macros.fat" label="Fat" density="compact" type="number" suffix="g"></v-text-field></v-col>
                                  </v-row>
                               </div>
                            </v-expand-transition>
                          </v-card-text>
                        </v-card>
                     </div>
                   </div>
                 </v-expand-transition>
              </v-card>

              <v-card v-else class="mb-3" variant="outlined">
                <v-card-text>
                    <v-row dense align="center">
                      <v-col cols="12" sm="6">
                          <v-autocomplete v-if="component.type === 'food'" :model-value="component.foodId" @update:model-value="updateFoodComponent(index, $event)" :items="foods" :item-title="item => `${item.brand} ${item.name}`" item-value="id" label="Select Food" density="compact" hide-details></v-autocomplete>
                          <v-text-field v-if="component.type === 'custom'" v-model="component.customName" label="Custom Item Name" density="compact" hide-details></v-text-field>
                      </v-col>
                      <v-col cols="4" sm="2"><v-text-field v-model.number="component.amount" label="Amount" density="compact" type="number" hide-details @update:model-value="recalculateMacros(component, true)"></v-text-field></v-col>
                      <v-col cols="4" sm="2">
                          <v-text-field v-if="component.type === 'custom'" v-model="component.serving" label="Serving" placeholder="e.g. cup" density="compact" hide-details></v-text-field>
                          <v-text-field v-else :model-value="getFoodServing(component.foodId)" label="Serving" readonly variant="underlined" density="compact" hide-details></v-text-field>
                      </v-col>
                      <v-col cols="4" sm="2" class="text-right">
                        <v-btn :icon="component.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" variant="text" @click="component.expanded = !component.expanded" title="Override Macros"></v-btn>
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

            <v-btn @click="addComponent('food')" prepend-icon="mdi-plus" class="mr-2">Add Food</v-btn>
            <v-btn @click="addComponent('meal')" prepend-icon="mdi-plus" class="mr-2">Add Meal</v-btn>
            <v-btn @click="addComponent('custom')" prepend-icon="mdi-plus">Add Custom Item</v-btn>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closeDialog"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveRecipe"
            :loading="isSubmitting"
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
const { recipes, foods, meals, isLoadingRecipes, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedItem = ref(null);
const isSubmitting = ref(false);
const defaultItem = { id: null, name: "", instructions: "", components: [] };

const formTitle = computed(() =>
  editedItem.value?.id ? "Edit Recipe" : "Add New Recipe"
);
const rules = { required: (value) => !!value || "Required." };

onMounted(async () => {
  if (!foods.value.length) {
    await dataStore.fetchFoods().catch(() => {});
  }
  await dataStore.fetchRecipes().catch(() => {});
});

// --- HELPER FUNCTIONS ---
function getMacros(component, forceRecalc = false) {
  const emptyMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (!component) return emptyMacros;

  if (component.expanded && !forceRecalc) {
      return component.macros || emptyMacros;
  }
  
  if (component.type === 'custom') {
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
const recipeTotalMacros = computed(() => {
  if (!editedItem.value?.components) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  return editedItem.value.components.reduce((totals, component) => {
    let componentMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (component.type === 'food' || component.type === 'custom') {
        componentMacros = getMacros(component);
    } else if (component.type === 'meal' && component.components) {
      component.components.forEach(foodComp => {
        const foodMacros = getMacros(foodComp);
        componentMacros.calories += foodMacros.calories;
        componentMacros.protein += foodMacros.protein;
        componentMacros.carbs += foodMacros.carbs;
        componentMacros.fat += foodMacros.fat;
      });
    }
    totals.calories += Number(componentMacros.calories) || 0;
    totals.protein += Number(componentMacros.protein) || 0;
    totals.carbs += Number(componentMacros.carbs) || 0;
    totals.fat += Number(componentMacros.fat) || 0;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
});

const recipesWithMacros = computed(() => {
  return recipes.value.map((recipe) => {
    if (recipe.totalMacros) {
      return recipe;
    }
    const totalMacros = (recipe.components || []).reduce(
      (totals, component) => {
        let compMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        if (component.type === 'food' || component.type === 'custom') {
          compMacros = getMacros(component);
        } else if (component.type === 'meal' && component.components) {
          component.components.forEach((foodComp) => {
            const foodMacros = getMacros(foodComp);
            compMacros.calories += foodMacros.calories;
            compMacros.protein += foodMacros.protein;
            compMacros.carbs += foodMacros.carbs;
            compMacros.fat += foodMacros.fat;
          });
        }
        totals.calories += compMacros.calories;
        totals.protein += compMacros.protein;
        totals.carbs += compMacros.carbs;
        totals.fat += compMacros.fat;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return { ...recipe, totalMacros };
  });
});

const headers = ref([
  { title: "Recipe Name", key: "name", align: "start" },
  { title: "Macros (1 Serving)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

// --- COMPONENT LOGIC ---
function addComponent(type) {
  if (!editedItem.value) return;
  const newComponent = { type, amount: 1, macros: { calories: 0, protein: 0, carbs: 0, fat: 0 }, expanded: false };
  if (type === 'food') newComponent.foodId = null;
  if (type === 'meal') {
    newComponent.mealId = null;
    newComponent.components = [];
  }
  if (type === 'custom') {
    newComponent.customName = "";
    newComponent.serving = "";
    newComponent.expanded = true;
  }
  editedItem.value.components.push(newComponent);
}

function removeComponent(index) {
  editedItem.value?.components.splice(index, 1);
}

function updateFoodComponent(index, foodId) {
    const component = editedItem.value?.components[index];
    if (!component) return;
    component.foodId = foodId;
    recalculateMacros(component, true);
}

function recalculateMacros(component, force = false) {
    if (component.expanded && !force) return;
    component.macros = getMacros(component, true);
}

function updateMealComponent(componentIndex, mealId) {
    const component = editedItem.value?.components[componentIndex];
    if (!component) return;
    component.mealId = mealId;
    const mealTemplate = meals.value.find(m => m.id === mealId);
    if (mealTemplate) {
        component.components = JSON.parse(JSON.stringify(mealTemplate.components)).map(c => ({
            ...c,
            macros: getMacros(c, true),
            expanded: false,
        }));
    }
}

// --- UI HELPERS ---
function getMealName(mealId) {
  return meals.value.find(m => m.id === mealId)?.name || 'Select a Meal';
}
function getFoodName(foodId) {
  const food = foods.value.find(f => f.id === foodId);
  return food ? food.name : 'Unknown Food';
}
function getFoodServing(foodId) {
  return foods.value.find(f => f.id === foodId)?.defaultServingSize || '';
}

// --- DIALOG AND SAVE LOGIC ---
function openAddDialog() {
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  dialog.value = true;
}

function editRecipe(item) {
  const recipeToEdit = JSON.parse(JSON.stringify(item));
  (recipeToEdit.components || []).forEach(c => {
      c.expanded = false;
      if (c.type === 'meal' && c.components) {
          c.components.forEach(sc => {
              sc.expanded = false;
              if (!sc.macros) sc.macros = getMacros(sc, true);
          });
      } else {
          if (!c.macros) c.macros = getMacros(c, true);
      }
  });
  editedItem.value = recipeToEdit;
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = null;
}

async function saveRecipe() {
  const { valid } = await form.value.validate();
  if (!valid || !editedItem.value) return;
  isSubmitting.value = true;
  const recipeToSave = JSON.parse(JSON.stringify(editedItem.value));
  (recipeToSave.components || []).forEach(c => {
      delete c.expanded;
      if (c.components) {
          c.components.forEach(sc => delete sc.expanded);
      }
  });
  try {
    if (recipeToSave.id) {
      await dataStore.updateRecipe(recipeToSave.id, recipeToSave);
    } else {
      await dataStore.createRecipe(recipeToSave);
    }
    closeDialog();
  } catch (error) {
    console.error('Unable to save recipe', error);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteRecipe(item) {
  if (!item?.id) return;
  if (!confirm('Are you sure you want to delete this recipe?')) return;
  try {
    await dataStore.deleteRecipe(item.id);
  } catch (error) {
    console.error('Unable to delete recipe', error);
  }
}
</script>
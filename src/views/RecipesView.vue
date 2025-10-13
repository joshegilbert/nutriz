<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4 d-inline-block mr-4">Recipe Library 🍳</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" @click="openAddDialog">Add Recipe</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="dataStore.errors.recipes" type="error" class="mb-4">
      {{ dataStore.errors.recipes }}
    </v-alert>

    <v-card>
      <v-progress-linear v-if="dataStore.loading.recipes" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table :headers="headers" :items="recipesWithMacros" item-key="id">
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.totalMacros.calories.toFixed(0) }} /
            Prot: {{ item.totalMacros.protein.toFixed(0) }}g /
            Carb: {{ item.totalMacros.carbs.toFixed(0) }}g /
            Fat: {{ item.totalMacros.fat.toFixed(0) }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editRecipe(item)">mdi-pencil</v-icon>
            <v-icon small @click="deleteRecipe(item)">mdi-delete</v-icon>
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
            <span class="ml-2">Cal: <b>{{ recipeTotalMacros.calories.toFixed(0) }}</b></span>
            <span class="ml-3">Prot: <b>{{ recipeTotalMacros.protein.toFixed(0) }}g</b></span>
            <span class="ml-3">Carb: <b>{{ recipeTotalMacros.carbs.toFixed(0) }}g</b></span>
            <span class="ml-3">Fat: <b>{{ recipeTotalMacros.fat.toFixed(0) }}g</b></span>
          </div>
        </v-card-title>
        <v-card-text style="max-height: 70vh; overflow-y: auto;">
          <v-form ref="form">
            <v-text-field v-model="editedItem.name" label="Recipe Name*" :rules="[rules.required]" class="mb-4"></v-text-field>
            <v-textarea v-model="editedItem.description" label="Description" auto-grow rows="2" class="mb-4"></v-textarea>
            <v-textarea v-model="editedItem.instructions" label="Instructions" auto-grow rows="4" class="mb-4"></v-textarea>

            <h3 class="text-h6 mb-2">Ingredients</h3>

            <div v-for="(ingredient, index) in editedItem.ingredients" :key="ingredient.id || index">
              <v-card class="mb-3" variant="outlined">
                <v-card-text>
                  <v-row dense align="center">
                    <v-col cols="12" md="5">
                      <v-select
                        v-model="ingredient.foodItem"
                        :items="foodOptions"
                        item-title="label"
                        item-value="id"
                        label="Food"
                        density="compact"
                        hide-details
                      ></v-select>
                    </v-col>
                    <v-col cols="6" md="3">
                      <v-text-field
                        v-model="ingredient.amount"
                        label="Amount"
                        placeholder="e.g. 1 cup"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" md="2">
                      <v-text-field
                        v-model.number="ingredient.quantity"
                        label="Servings"
                        type="number"
                        min="0"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="2" class="text-right">
                      <v-btn icon="mdi-delete" variant="text" color="grey" @click="removeIngredient(index)"></v-btn>
                    </v-col>
                  </v-row>
                  <v-textarea v-model="ingredient.notes" label="Notes" rows="2" auto-grow density="compact"></v-textarea>
                </v-card-text>
              </v-card>
            </div>

            <v-btn @click="addIngredient" prepend-icon="mdi-plus">Add Ingredient</v-btn>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" :loading="saving" @click="saveRecipe">Save</v-btn>
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
const { recipes, foods } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const saving = ref(false);

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultItem = { id: null, name: "", description: "", instructions: "", ingredients: [] };
const editedItem = ref(clone(defaultItem));

const rules = { required: (value) => !!value || "Required." };

const headers = ref([
  { title: "Recipe", key: "name", align: "start" },
  { title: "Description", key: "description" },
  { title: "Macros (per Recipe)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

const foodOptions = computed(() =>
  foods.value.map((food) => ({
    id: food.id,
    label: `${food.name} (${food.defaultServingSize})`,
  }))
);

const recipesWithMacros = computed(() =>
  recipes.value.map((recipe) => ({
    ...recipe,
    totalMacros: recipe.totals || sumRecipeMacros(recipe.ingredients || []),
  }))
);

const recipeTotalMacros = computed(() => sumRecipeMacros(editedItem.value.ingredients || []));

function sumRecipeMacros(ingredients) {
  return ingredients.reduce(
    (totals, ingredient) => {
      const food = foods.value.find((f) => f.id === ingredient.foodItem);
      if (!food) return totals;
      const quantity = Number(ingredient.quantity) || 0;
      totals.calories += (food.caloriesPerServing || 0) * quantity;
      totals.protein += (food.proteinPerServing || 0) * quantity;
      totals.carbs += (food.carbsPerServing || 0) * quantity;
      totals.fat += (food.fatPerServing || 0) * quantity;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

onMounted(() => {
  Promise.all([dataStore.fetchFoods(), dataStore.fetchRecipes()]).catch(() => {});
});

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = clone(defaultItem);
  dialog.value = true;
}

function editRecipe(item) {
  editedIndex.value = recipes.value.findIndex((r) => r.id === item.id);
  editedItem.value = {
    id: item.id,
    name: item.name,
    description: item.description || "",
    instructions: item.instructions || "",
    ingredients: (item.ingredients || []).map((ingredient) => ({
      id: ingredient.id,
      foodItem: ingredient.foodItem,
      amount: ingredient.amount,
      quantity: ingredient.quantity,
      notes: ingredient.notes || "",
    })),
  };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = clone(defaultItem);
  editedIndex.value = -1;
}

function addIngredient() {
  editedItem.value.ingredients.push({
    id: Date.now().toString(),
    foodItem: null,
    amount: "",
    quantity: 1,
    notes: "",
  });
}

function removeIngredient(index) {
  editedItem.value.ingredients.splice(index, 1);
}

async function saveRecipe() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      name: editedItem.value.name,
      description: editedItem.value.description,
      instructions: editedItem.value.instructions,
      ingredients: editedItem.value.ingredients
        .filter((ingredient) => ingredient.foodItem)
        .map((ingredient) => ({
          foodItem: ingredient.foodItem,
          amount: ingredient.amount || "",
          quantity: Number(ingredient.quantity) || 0,
          notes: ingredient.notes || "",
        })),
    };
    if (editedIndex.value > -1 && editedItem.value.id) {
      await dataStore.updateRecipe(editedItem.value.id, payload);
    } else {
      await dataStore.createRecipe(payload);
    }
    closeDialog();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function deleteRecipe(item) {
  if (!item?.id) return;
  if (!window.confirm("Delete this recipe?")) return;
  saving.value = true;
  try {
    await dataStore.deleteRecipe(item.id);
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}
</script>

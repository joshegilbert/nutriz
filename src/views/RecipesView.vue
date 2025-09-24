<template>
  <v-container>
    <v-row align="start" class="mb-2">
      <v-col cols="12">
        <h1 class="text-h4 d-inline-block mr-4">Recipe Library 🍳</h1>
        <v-btn color="primary" @click="openAddDialog">Add Recipe</v-btn>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          label="Search by Name or Ingredient"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel title="Advanced Macro & Tag Filters">
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="filters.tags"
                    :items="allTags"
                    label="Filter by Tags"
                    multiple
                    chips
                    closable-chips
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.calories.min"
                    label="Min Calories"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.calories.max"
                    label="Max Calories"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.protein.min"
                    label="Min Protein (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.protein.max"
                    label="Max Protein (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.carbs.min"
                    label="Min Carbs (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.carbs.max"
                    label="Max Carbs (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.fat.min"
                    label="Min Fat (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model.number="filters.fat.max"
                    label="Max Fat (g)"
                    type="number"
                    density="compact"
                    clearable
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-btn
                class="mt-2"
                variant="text"
                size="small"
                @click="resetFilters"
              >
                Reset Filters
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredRecipes"
        density="compact"
        item-key="id"
      >
        <template v-slot:item.tags="{ item }">
          <div v-if="item.tags && item.tags.length">
            <v-chip
              v-for="(tag, i) in item.tags"
              :key="i"
              color="blue-grey"
              size="small"
              class="mr-1 mb-1"
            >
              {{ tag }}
            </v-chip>
          </div>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="editRecipe(item)">
            mdi-pencil
          </v-icon>
          <v-icon small class="mr-2" @click="deleteRecipe(item)">
            mdi-delete
          </v-icon>
          <v-icon small @click="openAddToPlanDialog(item)">
            mdi-calendar-plus
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer v-model="drawer" location="end" temporary width="600">
      <v-card class="d-flex flex-column h-100" flat>
        <v-card-title class="pa-4">
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text class="flex-grow-1" style="overflow-y: auto">
          <v-form ref="form">
            <v-container>
              <v-row>
                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Recipe Name*"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="editedItem.imageUrl"
                    label="Image URL"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="editedItem.tags"
                    :items="allTags"
                    label="Tags"
                    multiple
                    chips
                    closable-chips
                  ></v-combobox>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="editedItem.calories"
                    label="Calories*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="editedItem.protein"
                    label="Protein (g)*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="editedItem.carbs"
                    label="Carbs (g)"
                    type="number"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                    v-model.number="editedItem.fat"
                    label="Fat (g)"
                    type="number"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <h3 class="text-h6 mb-2">Ingredients</h3>
                  <v-row
                    v-for="(ingredient, index) in editedItem.ingredients"
                    :key="index"
                    dense
                  >
                    <v-col cols="5">
                      <v-text-field
                        v-model="ingredient.amount"
                        label="Amount"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        v-model="ingredient.name"
                        label="Ingredient Name"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="1" class="d-flex align-center">
                      <v-icon color="error" @click="removeIngredient(index)">
                        mdi-delete
                      </v-icon>
                    </v-col>
                  </v-row>
                  <v-btn size="small" @click="addIngredient">
                    Add Ingredient
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <h3 class="text-h6 mb-2">Instructions</h3>
                  <v-textarea
                    v-model="editedItem.instructions"
                    label="Instructions"
                    auto-grow
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDrawer">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveRecipe">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">
          Are you sure you want to delete this recipe?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="deleteRecipeConfirm"
          >
            OK
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addToPlanDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Add "{{ selectedRecipe?.name }}" to Plan</span>
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedClient"
            :items="clients"
            item-title="name"
            item-value="id"
            label="Select Client"
            class="mb-4"
          ></v-select>
          <v-select
            v-model="selectedDay"
            :items="days"
            label="Select Day"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="closeAddToPlanDialog"
          >
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="addToPlan">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="3000" color="success">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";

const { recipes, clients } = useDataStore();

const search = ref("");
const drawer = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);

const addToPlanDialog = ref(false);
const snackbar = ref(false);
const snackbarText = ref("");
const selectedRecipe = ref(null);
const selectedClient = ref(null);
const selectedDay = ref(null);
const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const filters = ref({
  calories: { min: null, max: null },
  protein: { min: null, max: null },
  carbs: { min: null, max: null },
  fat: { min: null, max: null },
  tags: [],
});

const defaultFilters = JSON.parse(JSON.stringify(filters.value));

const headers = ref([
  { title: "Recipe Name", key: "name", align: "start", width: "30%" },
  { title: "Tags", key: "tags", sortable: false },
  { title: "Calories", key: "calories" },
  { title: "Protein (g)", key: "protein" },
  { title: "Carbs (g)", key: "carbs" },
  { title: "Fat (g)", key: "fat" },
  { title: "Actions", key: "actions", sortable: false },
]);

const allTags = computed(() => {
  const tags = new Set();
  recipes.value.forEach((recipe) => {
    if (recipe.tags) {
      recipe.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags);
});

const filteredRecipes = computed(() => {
  return recipes.value.filter((recipe) => {
    const s = search.value?.toLowerCase() || "";
    const f = filters.value;
    const searchTextMatch =
      s === "" ||
      recipe.name.toLowerCase().includes(s) ||
      (recipe.ingredients &&
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(s)));
    const caloriesMatch =
      (!f.calories.min || recipe.calories >= f.calories.min) &&
      (!f.calories.max || recipe.calories <= f.calories.max);
    const proteinMatch =
      (!f.protein.min || recipe.protein >= f.protein.min) &&
      (!f.protein.max || recipe.protein <= f.protein.max);
    const carbsMatch =
      (!f.carbs.min || recipe.carbs >= f.carbs.min) &&
      (!f.carbs.max || recipe.carbs <= f.carbs.max);
    const fatMatch =
      (!f.fat.min || recipe.fat >= f.fat.min) &&
      (!f.fat.max || recipe.fat <= f.fat.max);
    const tagsMatch =
      f.tags.length === 0 ||
      f.tags.every((tag) => recipe.tags && recipe.tags.includes(tag));
    return (
      searchTextMatch &&
      caloriesMatch &&
      proteinMatch &&
      carbsMatch &&
      fatMatch &&
      tagsMatch
    );
  });
});

const defaultItem = {
  id: null,
  name: "",
  description: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  imageUrl:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800",
  ingredients: [{ amount: "", name: "" }],
  instructions: "",
  tags: [],
};
const editedItem = ref({ ...defaultItem });

const formTitle = computed(() =>
  editedIndex.value === -1 ? "Add New Recipe" : "Edit Recipe"
);

const rules = { required: (value) => !!value || "Required." };

function resetFilters() {
  search.value = "";
  filters.value = JSON.parse(JSON.stringify(defaultFilters));
}

function addIngredient() {
  if (!editedItem.value.ingredients) editedItem.value.ingredients = [];
  editedItem.value.ingredients.push({ amount: "", name: "" });
}

function removeIngredient(index) {
  editedItem.value.ingredients.splice(index, 1);
}

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  editedItem.value.id = Date.now();
  drawer.value = true;
}

function editRecipe(item) {
  editedIndex.value = recipes.value.findIndex((r) => r.id === item.id);
  editedItem.value = JSON.parse(JSON.stringify(item));
  if (!editedItem.value.ingredients) editedItem.value.ingredients = [];
  drawer.value = true;
}

function deleteRecipe(item) {
  editedIndex.value = recipes.value.findIndex((r) => r.id === item.id);
  editedItem.value = { ...item };
  dialogDelete.value = true;
}

function closeDrawer() {
  drawer.value = false;
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedIndex.value = -1;
  });
}

async function saveRecipe() {
  const { valid } = await form.value.validate();
  if (!valid) return;
  if (editedIndex.value > -1) {
    Object.assign(recipes.value[editedIndex.value], editedItem.value);
  } else {
    recipes.value.unshift(editedItem.value);
  }
  closeDrawer();
}

function deleteRecipeConfirm() {
  if (editedIndex.value > -1) {
    recipes.value.splice(editedIndex.value, 1);
  }
  closeDelete();
}

function openAddToPlanDialog(recipe) {
  selectedRecipe.value = recipe;
  addToPlanDialog.value = true;
}

function closeAddToPlanDialog() {
  addToPlanDialog.value = false;
  selectedRecipe.value = null;
  selectedClient.value = null;
  selectedDay.value = null;
}

function addToPlan() {
  if (!selectedRecipe.value || !selectedClient.value || !selectedDay.value) {
    snackbarText.value = "Please select a client and a day.";
    snackbar.value = true;
    return;
  }
  const client = clients.value.find((c) => c.id === selectedClient.value);
  if (client) {
    if (!client.mealPlan[selectedDay.value].includes(selectedRecipe.value.id)) {
      client.mealPlan[selectedDay.value].push(selectedRecipe.value.id);
      snackbarText.value = `${selectedRecipe.value.name} added to ${client.name}'s plan for ${selectedDay.value}.`;
      snackbar.value = true;
    } else {
      snackbarText.value = "This recipe is already on the plan for that day.";
      snackbar.value = true;
    }
  }
  closeAddToPlanDialog();
}
</script>

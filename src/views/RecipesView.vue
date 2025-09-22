<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Recipe Library 🍳</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Recipe
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card>
          <v-img :src="recipe.imageUrl" height="200px" cover></v-img>
          <v-card-title>{{ recipe.name }}</v-card-title>
          <v-card-text>
            <div>{{ recipe.description }}</div>
            <div class="mt-2 text-subtitle-2">
              <strong>Calories:</strong>
              {{ recipe.calories }} |
              <strong>Protein:</strong>
              {{ recipe.protein }}g
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              size="small"
              color="surface-variant"
              variant="text"
              icon="mdi-pencil"
              @click="editRecipe(recipe)"
            ></v-btn>
            <v-btn
              size="small"
              color="surface-variant"
              variant="text"
              icon="mdi-delete"
              @click="deleteRecipe(recipe)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

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
                  <v-text-field
                    v-model="editedItem.name"
                    label="Recipe Name*"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.description"
                    label="Description"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.calories"
                    label="Calories*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.protein"
                    label="Protein (g)*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.imageUrl"
                    label="Image URL"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-container>
            <small>*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveRecipe">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  </v-container>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";

// --- Get Data from the Store ---
const { recipes } = useDataStore();

// --- State Management ---
const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);

const defaultItem = {
  id: null,
  name: "",
  description: "",
  calories: 0,
  protein: 0,
  imageUrl:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800",
};
const editedItem = ref({ ...defaultItem });

const formTitle = computed(() => {
  return editedIndex.value === -1 ? "Add New Recipe" : "Edit Recipe";
});

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || "Required.",
};

// --- Component Methods ---
function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = { ...defaultItem, id: Date.now() };
  dialog.value = true;
}

function editRecipe(item) {
  editedIndex.value = recipes.value.indexOf(item);
  editedItem.value = { ...item };
  dialog.value = true;
}

function deleteRecipe(item) {
  editedIndex.value = recipes.value.indexOf(item);
  editedItem.value = { ...item };
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = { ...defaultItem };
    editedIndex.value = -1;
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = { ...defaultItem };
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
  closeDialog();
}

function deleteRecipeConfirm() {
  recipes.value.splice(editedIndex.value, 1);
  closeDelete();
}
</script>

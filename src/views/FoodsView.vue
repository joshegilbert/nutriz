<template>
  <v-container class="py-6">
    <v-row align="center" class="mb-4">
      <v-col cols="12" md="6">
        <h1 class="text-h4">Food Database</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Organize staples by category so coaches can grab the right items fast.
        </p>
      </v-col>
      <v-col
        cols="12"
        md="6"
        class="text-md-right text-start mt-3 mt-md-0"
      >
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
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

    <v-row>
      <v-col cols="12" md="3" class="mb-4 mb-md-0">
        <v-card elevation="2">
          <v-card-title class="text-subtitle-1 font-weight-medium">
            Browse by category
          </v-card-title>
          <v-card-subtitle>
            Jump into a macro focus or food type without scrolling the full list.
          </v-card-subtitle>
          <v-divider class="my-2"></v-divider>
          <v-card-text class="py-0">
            <v-list density="comfortable" nav>
              <v-list-item
                v-for="cat in categoryMenuItems"
                :key="cat.value"
                @click="selectCategory(cat.value)"
                :active="selectedCategory === cat.value"
                rounded="lg"
              >
                <v-list-item-title>
                  {{ cat.label }}
                </v-list-item-title>
                <template #append>
                  <v-chip size="x-small" color="primary" variant="tonal">
                    {{ cat.count }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="9">
        <v-card elevation="2">
          <v-card-text>
            <v-row class="mb-4" align="center">
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="search"
                  label="Search by name, brand, or category"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="4" class="text-md-right">
                <div class="text-caption text-medium-emphasis">
                  Showing
                  <span class="font-weight-medium">
                    {{ filteredFoods.length }}
                  </span>
                  of
                  <span class="font-weight-medium">{{ foods.length }}</span>
                  saved items
                </div>
              </v-col>
            </v-row>

            <v-alert
              v-if="!filteredFoods.length"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <template v-if="!foods.length">
                Your food database is empty. Add your first item to get started.
              </template>
              <template v-else-if="search">
                No foods match "{{ search }}" in
                {{
                  selectedCategoryLabel
                }}.
              </template>
              <template v-else-if="selectedCategory !== ALL_CATEGORY">
                No foods saved in {{ selectedCategoryLabel }} yet. Try another
                category or add one now.
              </template>
              <template v-else>
                No foods to show yet. Add items to start building your library.
              </template>
            </v-alert>

            <v-data-table
              v-else
              :headers="headers"
              :items="filteredFoods"
              item-key="id"
              density="comfortable"
              hover
            >
              <template #item.macros="{ item }">
                Cal: {{ item.macrosPerServing.calories }} /
                Prot: {{ item.macrosPerServing.protein }}g /
                Carb: {{ item.macrosPerServing.carbs }}g /
                Fat: {{ item.macrosPerServing.fat }}g
              </template>

              <template #item.actions="{ item }">
                <v-icon size="small" class="mr-2" @click="editFood(item)">
                  mdi-pencil
                </v-icon>
                <v-icon size="small" @click="deleteFood(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="800px">
    <v-alert
      v-if="lastError"
      type="error"
      class="mb-4"
      border="start"
      variant="tonal"
      :text="lastError"
    />

    <v-card>
      <v-progress-linear v-if="isLoadingFoods" indeterminate color="primary"></v-progress-linear>
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
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.brand"
                    label="Brand (e.g., Fage)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Food Name*"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-combobox
                    v-model="editedItem.category"
                    :items="categoryChoices"
                    label="Category*"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    hide-details="auto"
                    new-value-mode="add"
                  ></v-combobox>
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
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="editedItem.servingSize"
                    label="Serving Size*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="editedItem.servingUnit"
                    label="Serving Unit*"
                    hint="e.g., g, cup, scoop, 1 large egg"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="editedItem.gramsPerServing"
                    label="Grams Per Serving"
                    type="number"
                    suffix="g"
                  ></v-text-field>
                </v-col>
              </v-row>
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
                    v-model.number="editedItem.macrosPerServing.calories"
                    label="Calories*"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model.number="editedItem.macrosPerServing.protein"
                    label="Protein*"
                    suffix="g"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model.number="editedItem.macrosPerServing.carbs"
                    label="Carbs*"
                    suffix="g"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model.number="editedItem.macrosPerServing.fat"
                    label="Fat*"
                    suffix="g"
                    type="number"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model.number="editedItem.macrosPerServing.fiber"
                    label="Fiber"
                    suffix="g"
                    type="number"
                  ></v-text-field>
                </v-col>
              </v-row>
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
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveFood">
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
import { ref, computed, watch } from "vue";
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
const ALL_CATEGORY = "all";
const SIMPLE_CATEGORIES = [
  "Proteins",
  "Plant Proteins",
  "Carbohydrates",
  "Produce",
  "Healthy Fats",
  "Snacks",
  "Supplements",
  "Drinks",
  "Other",
];
const DEFAULT_CATEGORY = "Other";
const selectedCategory = ref(ALL_CATEGORY);

const defaultItem = {
    id: null,
    brand: "",
    name: "",
    category: "",
    servingSize: 0,
    servingUnit: "",
    gramsPerServing: null,
    macrosPerServing: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  id: null,
  name: "",
  category: "Other",
  defaultServingSize: "",
  caloriesPerServing: 0,
  proteinPerServing: 0,
  carbsPerServing: 0,
  fatPerServing: 0,
};

const formTitle = computed(() => (editedIndex.value === -1 ? "Add New Food" : "Edit Food"));
const rules = {
  required: (value) =>
    !!(value !== null && value !== undefined && String(value).trim()) ||
    "Required.",
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
  { title: "Macros (per Serving)", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

const toCategoryLabel = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return DEFAULT_CATEGORY;
  }

  const normalized = SIMPLE_CATEGORIES.find(
    (category) => category.toLowerCase() === raw.toLowerCase(),
  );

  return normalized ?? raw;
};

const selectedCategoryLabel = computed(() =>
  selectedCategory.value === ALL_CATEGORY
    ? "all categories"
    : toCategoryLabel(selectedCategory.value),
);

const categorySummary = computed(() => {
  const counts = new Map();
  foods.value.forEach((food) => {
    const label = toCategoryLabel(food.category);
    if (!counts.has(label)) {
      counts.set(label, { value: label, label, count: 0 });
    }
    counts.get(label).count += 1;
  });
  return Array.from(counts.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
});

const categoryMenuItems = computed(() => [
  {
    value: ALL_CATEGORY,
    label: "All foods",
    count: foods.value.length,
  },
  ...categorySummary.value.map((cat) => ({
    value: cat.value,
    label: cat.label,
    count: cat.count,
  })),
]);

const categoryChoices = computed(() => {
  const extraCategories = categorySummary.value
    .map((cat) => cat.label)
    .filter(
      (label) =>
        !SIMPLE_CATEGORIES.some(
          (simple) => simple.toLowerCase() === label.toLowerCase(),
        ),
    );

  const sortedExtras = Array.from(new Set(extraCategories)).sort((a, b) =>
    a.localeCompare(b),
  );

  return [...SIMPLE_CATEGORIES, ...sortedExtras];
});

watch(categoryMenuItems, (items) => {
  if (selectedCategory.value === ALL_CATEGORY) {
    return;
  }

  const hasMatch = items.some(
    (item) =>
      item.value === selectedCategory.value &&
      (item.value === ALL_CATEGORY || item.count > 0),
  );

  if (!hasMatch) {
    selectedCategory.value = ALL_CATEGORY;
  }
});

const MIN_FUZZY_LENGTH = 2;

const filteredFoods = computed(() => {
  const term = search.value.trim().toLowerCase();

  return foods.value
    .filter((item) => {
      const label = toCategoryLabel(item.category);
      if (
        selectedCategory.value !== ALL_CATEGORY &&
        label !== selectedCategory.value
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const name = item.name?.toLowerCase() ?? "";
      const brand = item.brand?.toLowerCase() ?? "";
      const category = label.toLowerCase();

      if (
        name.includes(term) ||
        brand.includes(term) ||
        category.includes(term)
      ) {
        return true;
      }

      if (term.length < MIN_FUZZY_LENGTH) {
        return false;
      }

      return [name, brand, category].some((field) =>
        isFuzzyMatch(field, term),
      );
    })
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
});

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = JSON.parse(JSON.stringify(defaultItem));
  editedItem.value.id = Date.now();
  editedItem.value.category =
    selectedCategory.value !== ALL_CATEGORY
      ? selectedCategory.value
      : DEFAULT_CATEGORY;
  editedItem.value = { ...defaultItem };
  dialog.value = true;
}

function editFood(item) {
  editedIndex.value = foods.value.findIndex(f => f.id === item.id);
  editedItem.value = JSON.parse(JSON.stringify(item));
  editedItem.value.category = toCategoryLabel(editedItem.value.category);
  editedItem.value = { ...item };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  form.value?.resetValidation();
  editedItem.value = null;
}

async function saveFood() {
  const { valid } = await form.value.validate();
  if (!valid || !editedItem.value) return;

  editedItem.value.category = toCategoryLabel(editedItem.value.category);

  if (editedIndex.value > -1) {
    Object.assign(foods.value[editedIndex.value], editedItem.value);
  } else {
    foods.value.unshift(editedItem.value);
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

function selectCategory(value) {
  selectedCategory.value = value ?? ALL_CATEGORY;
}

function isFuzzyMatch(text, query) {
  if (!text) return false;

  const distance = levenshteinDistance(text, query);

  if (query.length <= 3) {
    return distance <= 1;
  }

  if (query.length <= 6) {
    return distance <= 2;
  }

  return distance <= 3;
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;

  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    dp[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[rows - 1][cols - 1];
}
</script>

<template>
  <v-card class="meal-card rounded-lg elevation-1">
    <v-card-title class="py-3 px-4">
      <v-row align="center" no-gutters class="flex-wrap">
        <v-col cols="12" md="5" class="pr-md-3">
          <v-text-field
            v-model="mealDraft.name"
            label="Meal name"
            variant="underlined"
            density="compact"
            hide-details
            @blur="commitMeta"
            @keyup.enter="commitMeta"
          />
        </v-col>
        <v-col cols="6" md="3" class="pr-2">
          <v-text-field
            v-model="mealDraft.time"
            label="Start time"
            type="time"
            density="compact"
            hide-details
            variant="underlined"
            @change="commitMeta"
          />
        </v-col>
        <v-col cols="6" md="4" class="d-flex justify-end">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-plus"
            class="mr-2"
            @click="showAddDialog = true"
          >
            Add item
          </v-btn>
          <v-btn
            size="small"
            variant="text"
            color="primary"
            icon="mdi-content-duplicate"
            title="Duplicate all items in this meal"
            @click="handleDuplicate"
          />
          <v-btn
            size="small"
            variant="text"
            color="primary"
            icon="mdi-content-copy"
            class="ml-1"
            title="Copy meal to clipboard"
            @click="copyMealToClipboard"
          />
          <v-btn
            size="small"
            variant="text"
            color="error"
            icon="mdi-delete-outline"
            @click="$emit('removeMeal', meal.id)"
          />
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <v-card-text class="pt-4">
      <div v-if="!meal.items.length" class="text-grey text-center pa-4">
        No items yet — press <strong>Add item</strong> to start planning.
      </div>

      <div
        v-for="item in meal.items"
        :key="item.id"
        class="meal-item mb-3"
      >
        <div class="d-flex justify-space-between align-center mb-2">
          <div>
            <div class="text-subtitle-2 font-weight-medium">
              {{ item.name || fallbackName(item) }}
            </div>
            <div class="text-caption text-grey">
              {{ readableSource(item) }}
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="grey"
            size="x-small"
            @click="removeItem(item.id)"
          />
        </div>

        <v-row dense>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="item.amount"
              label="Amount"
              type="number"
              min="0"
              density="compact"
              hide-details
              variant="outlined"
              @change="onAmountChange(item)"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="item.unit"
              label="Unit"
              density="compact"
              hide-details
              variant="outlined"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="item.macros.calories"
              label="Calories"
              density="compact"
              hide-details
              variant="outlined"
              @change="markManual(item)"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="item.macros.protein"
              label="Protein (g)"
              density="compact"
              hide-details
              variant="outlined"
              @change="markManual(item)"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="item.macros.carbs"
              label="Carbs (g)"
              density="compact"
              hide-details
              variant="outlined"
              @change="markManual(item)"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model.number="item.macros.fat"
              label="Fat (g)"
              density="compact"
              hide-details
              variant="outlined"
              @change="markManual(item)"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="item.notes"
              label="Notes"
              density="compact"
              hide-details
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-divider class="mt-3" />
      </div>
    </v-card-text>

    <v-card-actions class="px-4 pb-4 pt-0 justify-end">
      <div class="text-subtitle-2 font-weight-medium">
        {{ mealTotals.calories }} kcal •
        {{ mealTotals.protein }}P /
        {{ mealTotals.carbs }}C /
        {{ mealTotals.fat }}F
      </div>
    </v-card-actions>

    <AddItemDialog
      v-model="showAddDialog"
      :meal-time="mealDraft.name"
      :foods="foods"
      :recipes="recipes"
      :meals="libraryMeals"
      @add="addItem"
    />
  </v-card>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import AddItemDialog from "./AddItemDialog.vue";

const props = defineProps({
  meal: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const emit = defineEmits(["updateMeal", "removeMeal"]);
const store = useDataStore();

const showAddDialog = ref(false);
const mealDraft = reactive({
  id: props.meal.id,
  name: props.meal.name || props.meal.mealTime,
  time: props.meal.time || "",
});

const meal = computed(() => props.meal);
const libraryMeals = computed(() => props.meals);

const mealTotals = computed(() => store.calcMealTotals(meal.value));

watch(
  () => props.meal,
  (next) => {
    mealDraft.id = next.id;
    mealDraft.name = next.name || next.mealTime;
    mealDraft.time = next.time || "";
  },
  { deep: true }
);

function commitMeta() {
  if (!meal.value) return;
  meal.value.name = mealDraft.name.trim() || "Meal";
  meal.value.mealTime = meal.value.name;
  meal.value.time = mealDraft.time;
  syncMeal();
}

function addItem(payload) {
  store.attachItemToMeal(meal.value, payload);
  syncMeal();
}

function removeItem(itemId) {
  store.removeItemFromMeal(meal.value, itemId);
  syncMeal();
}

function onAmountChange(item) {
  if (item.macrosSource === "overridden") return;
  item.macros = store.calculateItemMacros(
    item.type,
    item.sourceId,
    item.amount || 1
  );
  syncMeal();
}

function markManual(item) {
  item.macrosSource = "overridden";
  syncMeal();
}

function handleDuplicate() {
  store.duplicateMealItems(meal.value);
  syncMeal();
}

function copyMealToClipboard() {
  store.setMealClipboard(meal.value);
}

function fallbackName(item) {
  const details = store.getItemDetails(item.type, item.sourceId);
  return details?.name || "Item";
}

function readableSource(item) {
  const details = store.getItemDetails(item.type, item.sourceId);
  if (!details) return item.type === "custom" ? "Custom item" : "Unknown";
  if (item.type === "food") {
    return `${details.brand ? `${details.brand} • ` : ""}${details.name}`;
  }
  return details.name;
}

function syncMeal() {
  store.recalcMealTotals(meal.value);
  emit("updateMeal", JSON.parse(JSON.stringify(meal.value)));
}
</script>

<style scoped>
.meal-card {
  overflow: hidden;
}

.meal-item {
  background-color: #f8f9fb;
  border: 1px solid #e0e4ef;
  border-radius: 8px;
  padding: 12px;
}
</style>

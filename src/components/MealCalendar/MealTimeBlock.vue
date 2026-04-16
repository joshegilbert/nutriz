<template>
  <v-card class="meal-card rounded-lg elevation-1">
    <v-card-title class="py-3 px-4">
      <v-row align="center" no-gutters class="flex-wrap">
        <v-col cols="12" md="5" class="pr-md-3">
          <v-text-field
            ref="nameField"
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
            @click="focusQuickAdd"
          >
            Add item
          </v-btn>
          <v-btn-group density="compact" variant="text">
            <v-btn
              icon="mdi-content-copy"
              @click="copyMealToClipboard"
              title="Copy meal"
            />
            <v-btn
              icon="mdi-calendar-multiple"
              @click="showCopyToDaysDialog = true"
              title="Copy to other days"
            />
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" />
              </template>
              <v-list density="compact">
                <v-list-item @click="saveMealAsTemplate">
                  <v-list-item-title>Save as template</v-list-item-title>
                </v-list-item>
                <v-list-item @click="handleDuplicate">
                  <v-list-item-title>Duplicate meal</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="moveMealUp" :disabled="isFirstMeal">
                  <v-list-item-title>Move up</v-list-item-title>
                </v-list-item>
                <v-list-item @click="moveMealDown" :disabled="isLastMeal">
                  <v-list-item-title>Move down</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item @click="deleteMeal" class="text-error">
                  <v-list-item-title>Delete meal</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-btn-group>
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <!-- Quick Add Form - Sticky at top -->
    <div class="quick-add-sticky">
      <QuickAddForm
        ref="quickAddForm"
        :foods="foods"
        :recipes="recipes"
        :meals="libraryMeals"
        :meal-time="mealDraft.name"
        @add="addItem"
      />
    </div>

    <v-card-text class="pt-4">
      <div v-if="!meal.items.length" class="text-grey text-center pa-4">
        No items yet — use the search bar above to add items.
      </div>

      <div v-for="item in meal.items" :key="item.id" class="meal-item mb-3">
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
            <v-select
              v-if="item.type === 'food'"
              v-model="item.unit"
              :items="getServingOptions(item)"
              label="Serving"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="onServingChange(item)"
            />
            <v-text-field
              v-else
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
        {{ mealTotals.calories }} kcal • {{ mealTotals.protein }}P /
        {{ mealTotals.carbs }}C / {{ mealTotals.fat }}F
      </div>
    </v-card-actions>

    <!-- Copy to Days Dialog -->
    <v-dialog v-model="showCopyToDaysDialog" max-width="500">
      <v-card>
        <v-card-title>Copy "{{ mealDraft.name }}" to other days</v-card-title>
        <v-card-text>
          <v-checkbox
            v-for="day in otherDaysInProgram"
            :key="day.date"
            v-model="selectedDays"
            :value="day.date"
            :label="formatDate(day.date)"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCopyToDaysDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="copyMealToDays">
            Copy to {{ selectedDays.length }} days
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save as Template Dialog -->
    <v-dialog v-model="showSaveTemplateDialog" max-width="400">
      <v-card>
        <v-card-title>Save Meal as Template</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="templateName"
            label="Template name"
            placeholder="e.g. High Protein Breakfast"
            required
          />
          <v-text-field
            v-model="templateTags"
            label="Tags (optional)"
            placeholder="high-protein, breakfast"
            hint="Separate tags with commas"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showSaveTemplateDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="saveMealAsTemplateConfirm"
            :disabled="!templateName.trim()"
          >
            Save Template
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { computed, reactive, ref, watch, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import QuickAddForm from "./QuickAddForm.vue";

const props = defineProps({
  meal: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
  focusTarget: { type: [String, Number, null], default: null },
});

const emit = defineEmits(["updateMeal", "removeMeal"]);
const store = useDataStore();

const quickAddForm = ref(null);
const nameField = ref(null);
const showCopyToDaysDialog = ref(false);
const showSaveTemplateDialog = ref(false);
const selectedDays = ref([]);
const templateName = ref("");
const templateTags = ref("");
const mealDraft = reactive({
  id: props.meal.id,
  name: props.meal.name || props.meal.mealTime,
  time: props.meal.time || "",
});

const meal = computed(() => props.meal);
const libraryMeals = computed(() => props.meals);

const mealTotals = computed(() => store.calcMealTotals(meal.value));

// Computed properties for meal controls
const otherDaysInProgram = computed(() => {
  // This would need to be passed from parent or computed from program data
  // For now, return empty array - this would be implemented based on program structure
  return [];
});

const isFirstMeal = computed(() => {
  // This would need to be passed from parent
  return false;
});

const isLastMeal = computed(() => {
  // This would need to be passed from parent
  return false;
});

watch(
  () => props.meal,
  (next) => {
    mealDraft.id = next.id;
    mealDraft.name = next.name || next.mealTime;
    mealDraft.time = next.time || "";
  },
  { deep: true }
);

watch(
  () => props.focusTarget,
  (target) => {
    if (target === mealDraft.id) {
      focusMealName();
    }
  }
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
  if (item.type === "food") {
    const food = store.getItemDetails("food", item.sourceId);
    if (food) {
      const unit = item.unit || null;
      const amount = item.amount || 1;
      if (unit && food.gramsPerServing > 0) {
        const perGram = {
          calories:
            (food.macrosPerServing.calories || 0) / food.gramsPerServing,
          protein: (food.macrosPerServing.protein || 0) / food.gramsPerServing,
          carbs: (food.macrosPerServing.carbs || 0) / food.gramsPerServing,
          fat: (food.macrosPerServing.fat || 0) / food.gramsPerServing,
        };
        const found = (food.servings || []).find((s) => s.label === unit);
        if (found && found.grams > 0) {
          const gramsTotal = found.grams * amount;
          item.macros = {
            calories: perGram.calories * gramsTotal,
            protein: perGram.protein * gramsTotal,
            carbs: perGram.carbs * gramsTotal,
            fat: perGram.fat * gramsTotal,
          };
        } else {
          item.macros = store.calculateItemMacros(
            "food",
            item.sourceId,
            amount
          );
        }
      } else {
        item.macros = store.calculateItemMacros("food", item.sourceId, amount);
      }
    }
  } else {
    item.macros = store.calculateItemMacros(
      item.type,
      item.sourceId,
      item.amount || 1
    );
  }
  syncMeal();
}

function onServingChange(item) {
  if (item.macrosSource === "overridden") return;
  if (item.type === "food") {
    const food = store.getItemDetails("food", item.sourceId);
    if (food) {
      const unit = item.unit || null;
      const amount = item.amount || 1;
      if (unit && food.gramsPerServing > 0) {
        const perGram = {
          calories:
            (food.macrosPerServing.calories || 0) / food.gramsPerServing,
          protein: (food.macrosPerServing.protein || 0) / food.gramsPerServing,
          carbs: (food.macrosPerServing.carbs || 0) / food.gramsPerServing,
          fat: (food.macrosPerServing.fat || 0) / food.gramsPerServing,
        };
        const found = (food.servings || []).find((s) => s.label === unit);
        if (found && found.grams > 0) {
          const gramsTotal = found.grams * amount;
          item.macros = {
            calories: perGram.calories * gramsTotal,
            protein: perGram.protein * gramsTotal,
            carbs: perGram.carbs * gramsTotal,
            fat: perGram.fat * gramsTotal,
          };
        } else if (unit === food.defaultServingSize) {
          // Use default serving calculation
          item.macros = store.calculateItemMacros(
            "food",
            item.sourceId,
            amount
          );
        } else {
          item.macros = store.calculateItemMacros(
            "food",
            item.sourceId,
            amount
          );
        }
      } else {
        item.macros = store.calculateItemMacros("food", item.sourceId, amount);
      }
    }
  }
  syncMeal();
}

function getServingOptions(item) {
  if (item.type !== "food") return [];
  const food = store.getItemDetails("food", item.sourceId);
  if (!food) return [];

  const options = [];
  // Add default serving
  if (food.defaultServingSize) {
    options.push({
      title: food.defaultServingSize,
      value: food.defaultServingSize,
    });
  }
  // Add additional servings
  if (Array.isArray(food.servings)) {
    food.servings.forEach((s) => {
      if (s.label && !options.find((o) => o.value === s.label)) {
        options.push({
          title: s.label,
          value: s.label,
        });
      }
    });
  }
  return options;
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

function focusQuickAdd() {
  nextTick(() => {
    quickAddForm.value?.focus();
  });
}

function focusMealName() {
  nextTick(() => {
    const component = nameField.value;
    if (component?.focus) {
      component.focus();
      return;
    }
    const inputEl = component?.$el?.querySelector("input");
    inputEl?.focus();
  });
}

function copyMealToDays() {
  // Implementation would copy meal to selected days
  console.log("Copy meal to days:", selectedDays.value);
  showCopyToDaysDialog.value = false;
  selectedDays.value = [];
}

function saveMealAsTemplate() {
  templateName.value = mealDraft.name || "Meal Template";
  templateTags.value = "";
  showSaveTemplateDialog.value = true;
}

async function saveMealAsTemplateConfirm() {
  try {
    const tags = templateTags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    await store.createMealTemplate({
      name: templateName.value,
      tags,
      meal: meal.value,
    });
    showSaveTemplateDialog.value = false;
    templateName.value = "";
    templateTags.value = "";
  } catch (error) {
    console.error("Failed to save meal template:", error);
  }
}

function moveMealUp() {
  // Implementation would move meal up in the day's meal list
  console.log("Move meal up");
}

function moveMealDown() {
  // Implementation would move meal down in the day's meal list
  console.log("Move meal down");
}

function deleteMeal() {
  emit("removeMeal", meal.value.id);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
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

.quick-add-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.meal-item {
  background-color: #f8f9fb;
  border: 1px solid #e0e4ef;
  border-radius: 8px;
  padding: 12px;
}
</style>

<template>
  <div class="day-editor-container pa-4">
    <v-card class="elevation-2 rounded-lg" height="100%">
      <v-card-title class="day-header pb-3">
        <v-row align="center" no-gutters class="w-100">
          <v-col cols="auto">
            <h2 class="text-h5 font-weight-bold text-grey-darken-3">
              {{ dayLabel }}
            </h2>
            <p class="text-subtitle-2 text-grey-lighten-1 font-weight-regular">
              {{ formattedDate }}
            </p>
            <!-- Variant switcher -->
            <div class="variant-row d-flex align-center" style="gap: 8px;">
              <v-btn-toggle
                v-model="activeVariantKey"
                density="compact"
                variant="outlined"
                color="primary"
                mandatory
                class="variant-toggle"
              >
                <v-btn
                  v-for="v in variantKeys"
                  :key="v"
                  :value="v"
                  size="x-small"
                >
                  {{ v }}
                </v-btn>
              </v-btn-toggle>
              <v-btn
                v-if="variantKeys.length < 2"
                size="x-small"
                variant="text"
                prepend-icon="mdi-plus"
                @click="addVariantB"
              >
                Add option
              </v-btn>
            </div>
          </v-col>
          <v-spacer />
          <v-col cols="12" md="auto" class="d-none d-md-flex justify-end">
            <div class="totals-grid mr-4">
              <div
                v-for="(value, key) in day.macros"
                :key="key"
                class="macro-item"
              >
                <span class="macro-label">{{ key }}</span>
                <v-chip color="primary" size="small" text-color="white">
                  {{ value }}
                </v-chip>
              </div>
            </div>
            <div class="header-actions d-flex align-center" style="gap: 8px;">
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="flat"
                @click="openCreateMealDialog"
              >
                Add meal
              </v-btn>
              <v-btn
                color="secondary"
                prepend-icon="mdi-content-paste"
                variant="tonal"
                :disabled="!store.mealClipboard"
                @click="pasteMealFromClipboard"
              >
                Paste meal
              </v-btn>
            </div>
          </v-col>
          <!-- Mobile actions -->
          <v-col cols="12" class="d-flex d-md-none justify-end mt-2" style="gap:8px;">
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              variant="flat"
              @click="openCreateMealDialog"
            >
              Add meal
            </v-btn>
            <v-btn
              color="secondary"
              prepend-icon="mdi-content-paste"
              variant="tonal"
              :disabled="!store.mealClipboard"
              @click="pasteMealFromClipboard"
            >
              Paste meal
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-divider />

      <v-card-text class="meal-blocks pa-4">
        <MealTimeBlock
          v-for="meal in sortedMeals"
          :key="meal.id"
          :meal="meal"
          :foods="foods"
          :meals="mealsLibrary"
          :recipes="recipes"
          @updateMeal="handleMealUpdate"
          @removeMeal="removeMeal"
        />
      </v-card-text>

      
    </v-card>

    <v-dialog v-model="showCreateMeal" max-width="420">
      <v-card>
        <v-card-title class="pb-0">Create meal</v-card-title>
        <v-card-text>
          <v-form ref="createMealForm">
            <v-text-field
              v-model="mealDraft.name"
              label="Meal name"
              placeholder="e.g. Pre-workout smoothie"
              variant="underlined"
              required
            />
            <v-text-field
              v-model="mealDraft.time"
              label="Start time"
              type="time"
              variant="underlined"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeCreateMealDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="createMeal">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { format } from "date-fns";
import { useDataStore } from "@/stores/useDataStore";
import MealTimeBlock from "./MealTimeBlock.vue";
// DailySummary removed; totals are shown in header

const props = defineProps({
  day: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const emit = defineEmits(["updateDay"]);
const store = useDataStore();

const showCreateMeal = ref(false);
const mealDraft = reactive({
  name: "",
  time: "",
});

function localDateFromISO(iso) {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const dayLabel = computed(() => format(localDateFromISO(props.day.date), "EEEE"));
const formattedDate = computed(() =>
  format(localDateFromISO(props.day.date), "MMMM d, yyyy")
);

const mealsLibrary = computed(() => props.meals);

// Variants (A/B) support
const variantKeys = computed(() => {
  const vs = Array.isArray(props.day.variants) ? props.day.variants : [];
  return vs.map((v) => v.key || "A");
});

const activeVariantKey = computed({
  get() {
    return props.day.activeVariant || variantKeys.value[0] || "A";
  },
  set(val) {
    const updated = cloneDay(props.day);
    store.setActiveVariant(updated, val);
    emit("updateDay", updated);
  },
});

function addVariantB() {
  const updated = cloneDay(props.day);
  store.ensureVariant(updated, "B", { duplicateFrom: "A" });
  store.setActiveVariant(updated, "B");
  emit("updateDay", updated);
}

const sortedMeals = computed(() => {
  return [...(props.day.meals || [])].sort((a, b) => {
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    if (a.time) return -1;
    if (b.time) return 1;
    return a.name.localeCompare(b.name);
  });
});

function openCreateMealDialog() {
  mealDraft.name = "";
  mealDraft.time = "";
  showCreateMeal.value = true;
}

function closeCreateMealDialog() {
  showCreateMeal.value = false;
}

function createMeal() {
  const name = mealDraft.name.trim() || "Meal";
  const newMeal = store.createMeal({
    name,
    time: mealDraft.time,
  });
  const updatedDay = cloneDay(props.day);
  updatedDay.meals.push(newMeal);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);
  closeCreateMealDialog();
}

function pasteMealFromClipboard() {
  if (!store.mealClipboard) return;
  const cloned = store.cloneMeal(store.mealClipboard);
  const updatedDay = cloneDay(props.day);
  updatedDay.meals.push(cloned);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);
}

function removeMeal(mealId) {
  const updatedDay = cloneDay(props.day);
  updatedDay.meals = updatedDay.meals.filter((meal) => meal.id !== mealId);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);
}

function handleMealUpdate(updatedMeal) {
  const updatedDay = cloneDay(props.day);
  const idx = updatedDay.meals.findIndex((m) => m.id === updatedMeal.id);
  if (idx !== -1) {
    updatedDay.meals.splice(idx, 1, updatedMeal);
  }
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);
}

// summary handler no longer needed (card removed)

function cloneDay(day) {
  return JSON.parse(JSON.stringify(day));
}
</script>

<style scoped>
.day-editor-container {
  background-color: #f7f8fc;
  height: 100%;
  overflow-y: auto;
}

.day-header {
  border-bottom: 1px solid #e0e0e0;
}

.totals-grid {
  display: flex;
  gap: 16px;
  align-items: center;
  text-transform: capitalize;
}

.macro-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.macro-label {
  font-size: 0.7rem;
  color: #555;
  font-weight: 500;
}

.meal-blocks {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

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
            <!-- Variant tabs (pages) -->
            <div class="variant-row d-flex align-center" style="gap: 8px;">
              <v-tabs
                v-model="activeVariantKey"
                density="compact"
                class="variant-tabs"
                show-arrows
              >
                <v-tab
                  v-for="v in variantKeys"
                  :key="v"
                  :value="v"
                  density="compact"
                >
                  {{ labelFor(v) || v }}
                </v-tab>
              </v-tabs>
              <v-btn icon="mdi-plus" size="x-small" variant="text" @click="addVariant()" />
              <v-menu>
                <template #activator="{ props: m }">
                  <v-btn icon="mdi-dots-vertical" size="x-small" variant="text" v-bind="m" />
                </template>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-pencil" title="Rename" @click="openRenameVariant" />
                  <v-list-item prepend-icon="mdi-content-duplicate" title="Duplicate to new page" @click="duplicateActiveVariant" />
                  <v-list-item prepend-icon="mdi-delete" title="Delete page" @click="deleteActiveVariant" />
                </v-list>
              </v-menu>
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
                <v-chip color="primary" size="x-small" density="compact" text-color="white">
                  {{ value }}
                </v-chip>
              </div>
            </div>
            <div class="header-actions d-flex align-center" style="gap: 8px;">
              <v-btn color="primary" prepend-icon="mdi-application-import" size="small" @click="openApplyTemplate">Apply</v-btn>
              <v-menu>
                <template #activator="{ props: sp }">
                  <v-btn v-bind="sp" color="primary" variant="tonal" size="small" append-icon="mdi-menu-down">Save as</v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="openSaveTemplate('layout')" prepend-icon="mdi-content-save-outline" title="Save day layout" />
                  <v-list-item @click="openSaveTemplate('day')" prepend-icon="mdi-content-save" title="Save full day" />
                </v-list>
              </v-menu>
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

    <!-- Rename Variant Dialog -->
    <v-dialog v-model="renameDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Rename option {{ activeVariantKey }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="renameModel" label="Label (optional)" clearable />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="renameDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveRenameVariant">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save Template Dialog -->
    <v-dialog v-model="saveTplDialog" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Save {{ saveTplType === 'layout' ? 'Day Layout' : 'Full Day' }} as Template</v-card-title>
        <v-card-text>
          <v-text-field v-model="saveTplName" label="Template name" placeholder="e.g. Low-carb workday" />
          <v-combobox v-model="saveTplTags" multiple chips clearable label="Tags" placeholder="kid-friendly, budget, vegan" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="saveTplDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmSaveTemplate">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Apply Template Dialog -->
    <v-dialog v-model="applyTplDialog" max-width="720">
      <v-card>
        <v-card-title class="text-h6">Apply Template</v-card-title>
        <v-card-text>
          <v-tabs v-model="applyTplTab">
            <v-tab value="layout">Day Layouts</v-tab>
            <v-tab value="day">Full Days</v-tab>
          </v-tabs>
          <v-text-field v-model="templateSearch" label="Search templates" prepend-inner-icon="mdi-magnify" class="mt-2" />
          <div class="d-flex align-center mb-2" style="gap: 12px;">
            <v-switch v-model="applyReplace" label="Replace current day" hide-details density="compact" />
          </div>
          <v-window v-model="applyTplTab">
            <v-window-item value="layout">
              <v-list density="comfortable">
                <v-list-item
                  v-for="tpl in filteredLayoutTemplates"
                  :key="tpl.id"
                  @click="applyTemplate(tpl)"
                  :title="tpl.name"
                  prepend-icon="mdi-view-day"
                >
                  <template #subtitle>
                    <div class="d-flex flex-wrap" style="gap:6px;">
                      <v-chip v-for="tag in tpl.tags" :key="tag" size="x-small" variant="tonal">{{ tag }}</v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>
            <v-window-item value="day">
              <v-list density="comfortable">
                <v-list-item
                  v-for="tpl in filteredDayTemplates"
                  :key="tpl.id"
                  @click="applyTemplate(tpl)"
                  :title="tpl.name"
                  prepend-icon="mdi-calendar-check"
                >
                  <template #subtitle>
                    <div class="d-flex flex-wrap" style="gap:6px;">
                      <v-chip v-for="tag in tpl.tags" :key="tag" size="x-small" variant="tonal">{{ tag }}</v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="primary" @click="$router.push('/templates')">Manage Templates</v-btn>
          <v-btn text @click="applyTplDialog = false">Close</v-btn>
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

// Variant label rename dialog
const renameDialog = ref(false);
const renameModel = ref("");
function openRenameVariant() {
  renameModel.value = currentVariantLabel.value;
  renameDialog.value = true;
}
function saveRenameVariant() {
  const updated = cloneDay(props.day);
  store.renameVariant(updated, activeVariantKey.value, (renameModel.value || '').trim());
  emit("updateDay", updated);
  renameDialog.value = false;
}
const currentVariantLabel = computed(() => {
  const v = (props.day.variants || []).find((x) => x.key === activeVariantKey.value);
  return v?.label || '';
});

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

function labelFor(key) {
  const v = (props.day.variants || []).find((x) => x.key === key);
  return v?.label || '';
}

function addVariant() {
  const updated = cloneDay(props.day);
  const newVar = store.duplicateVariant(updated, activeVariantKey.value);
  if (newVar) emit('updateDay', updated);
}

function duplicateActiveVariant() {
  addVariant();
}

function deleteActiveVariant() {
  const updated = cloneDay(props.day);
  store.deleteVariant(updated, activeVariantKey.value);
  emit('updateDay', updated);
}

// Templates dialogs
const saveTplDialog = ref(false);
const saveTplType = ref('layout');
const saveTplName = ref('');
const saveTplTags = ref([]);

function openSaveTemplate(type) {
  saveTplType.value = type;
  saveTplName.value = '';
  saveTplTags.value = [];
  saveTplDialog.value = true;
}

function confirmSaveTemplate() {
  const meta = { name: saveTplName.value.trim(), tags: saveTplTags.value };
  if (saveTplType.value === 'layout') {
    store.saveDayLayoutTemplateFromDay(props.day, meta);
  } else {
    store.saveDayTemplateFromDay(props.day, meta);
  }
  saveTplDialog.value = false;
}

const applyTplDialog = ref(false);
const applyTplTab = ref('layout');
const applyReplace = ref(true);
const templateSearch = ref('');

function openApplyTemplate() {
  applyTplTab.value = 'layout';
  templateSearch.value = '';
  applyReplace.value = true;
  // ensure templates loaded from backend
  store.fetchTemplates?.().finally(() => {
    applyTplDialog.value = true;
  });
}

const filteredLayoutTemplates = computed(() => {
  const q = templateSearch.value.toLowerCase().trim();
  const list = store.dayLayoutTemplates || [];
  if (!q) return list;
  return list.filter((t) => t.name.toLowerCase().includes(q) || (t.tags || []).some((tag) => tag.toLowerCase().includes(q)));
});
const filteredDayTemplates = computed(() => {
  const q = templateSearch.value.toLowerCase().trim();
  const list = store.dayTemplates || [];
  if (!q) return list;
  return list.filter((t) => t.name.toLowerCase().includes(q) || (t.tags || []).some((tag) => tag.toLowerCase().includes(q)));
});

function applyTemplate(tpl) {
  const updated = cloneDay(props.day);
  if (applyTplTab.value === 'layout') {
    store.applyDayLayoutTemplate({ days: [updated] }, props.day.date, tpl, { replace: applyReplace.value });
  } else {
    store.applyDayTemplate({ days: [updated] }, props.day.date, tpl, { replace: applyReplace.value });
  }
  emit('updateDay', updated);
  applyTplDialog.value = false;
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

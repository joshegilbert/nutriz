<template>
  <div class="day-editor-container pa-4">
    <v-card class="elevation-2 rounded-lg" height="100%">
      <v-card-title class="day-header pb-3">
        <div class="day-header-content">
          <div class="day-header-primary">
            <h2 class="text-h5 font-weight-bold text-grey-darken-3">
              {{ dayLabel }}
            </h2>
            <p class="text-subtitle-2 text-grey-lighten-1 font-weight-regular">
              {{ formattedDate }}
            </p>
            <!-- Variant tabs (pages) -->
            <div class="variant-row d-flex align-center">
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
          </div>
          <div class="day-header-actions d-none d-md-flex">
            <div class="header-actions">
              <div class="header-actions__group">
                <v-btn color="primary" prepend-icon="mdi-application-import" size="small" @click="openApplyTemplate">
                  Apply
                </v-btn>
                <v-menu>
                  <template #activator="{ props: sp }">
                    <v-btn v-bind="sp" color="primary" variant="tonal" size="small" append-icon="mdi-menu-down">
                      Save as
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="openSaveTemplate('layout')" prepend-icon="mdi-content-save-outline" title="Save day layout" />
                    <v-list-item @click="openSaveTemplate('day')" prepend-icon="mdi-content-save" title="Save full day" />
                  </v-list>
                </v-menu>
              </div>
              <div class="header-actions__group">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  variant="flat"
                  size="small"
                  @click="addBlankMeal"
                >
                  Add meal
                </v-btn>
                <v-menu>
                  <template #activator="{ props: sp }">
                    <v-btn v-bind="sp" color="primary" variant="tonal" size="small" append-icon="mdi-menu-down">
                      From Template
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="addBlankMeal">
                      <v-list-item-title>Blank Meal</v-list-item-title>
                      <v-list-item-subtitle>Start from scratch</v-list-item-subtitle>
                    </v-list-item>
                    <v-divider />
                    <v-list-item 
                      v-for="tpl in mealTemplates" 
                      :key="tpl.id"
                      @click="addFromTemplate(tpl)"
                    >
                      <v-list-item-title>{{ tpl.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ tpl.itemCount }} items • {{ tpl.totalMacros?.calories || 0 }} cal
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="!mealTemplates.length" disabled>
                      <v-list-item-title class="text-grey">No templates yet</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-btn
                  color="secondary"
                  prepend-icon="mdi-content-paste"
                  variant="tonal"
                  size="small"
                  :disabled="!store.mealClipboard"
                  @click="pasteMealFromClipboard"
                >
                  Paste meal
                </v-btn>
              </div>
            </div>
          </div>
        </div>
        <!-- Mobile actions -->
        <div class="header-actions-mobile d-flex d-md-none">
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            variant="flat"
            size="small"
            @click="addBlankMeal"
          >
            Add meal
          </v-btn>
          <v-btn
            color="secondary"
            prepend-icon="mdi-content-paste"
            variant="tonal"
            size="small"
            :disabled="!store.mealClipboard"
            @click="pasteMealFromClipboard"
          >
            Paste meal
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <section class="macro-bar" :class="{ 'macro-bar--empty': !macroEntries.length }">
          <div class="macro-bar__header">
            <div class="macro-bar__title">
              <v-icon size="18" color="primary">mdi-scale-balance</v-icon>
              <span>Daily Macros</span>
            </div>
            <v-chip v-if="macroEntries.length" size="x-small" variant="flat" color="primary">
              Targets
            </v-chip>
          </div>
          <div class="macro-bar__content">
            <template v-if="macroEntries.length">
              <div
                v-for="macro in macroEntries"
                :key="macro.key"
                class="macro-pill"
              >
                <span class="macro-pill__label">{{ macro.label }}</span>
                <span class="macro-pill__value">{{ formatMacroValue(macro.key, macro.value) }}</span>
              </div>
            </template>
            <div v-else class="macro-bar__empty text-body-2">
              No macro targets added yet.
            </div>
          </div>
        </section>

        <div class="day-secondary-nav">
          <button
            type="button"
            class="secondary-tab"
            :class="{
              'secondary-tab--active': secondaryPanel === 'notes',
              'secondary-tab--has-content': (day.notes || '').trim().length
            }"
            @click="toggleSecondaryPanel('notes')"
          >
            <v-icon :color="secondaryPanel === 'notes' ? 'primary' : 'grey'">
              mdi-note-text-outline
            </v-icon>
            <span>Daily Notes</span>
            <v-icon
              size="16"
              class="secondary-tab__chevron"
              :icon="secondaryPanel === 'notes' ? 'mdi-chevron-up' : 'mdi-chevron-down'"
            />
          </button>
        </div>

        <v-expand-transition>
          <section
            v-if="secondaryPanel === 'notes'"
            class="day-secondary-panel"
          >
            <DayNotes
              :day="day"
              :recipes="recipes"
              :default-open="true"
              @updateDay="handleNotesUpdate"
            />
          </section>
        </v-expand-transition>

        <!-- Meals Section -->
        <div class="meal-blocks">
          <MealTimeBlock
            v-for="meal in sortedMeals"
            :key="meal.id"
            :meal="meal"
            :foods="foods"
            :meals="mealsLibrary"
            :recipes="recipes"
            :focus-target="mealFocusTarget"
            @updateMeal="handleMealUpdate"
            @removeMeal="removeMeal"
          />
        </div>
      </v-card-text>

      
    </v-card>

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
import { computed, reactive, ref, nextTick, onMounted, watch } from "vue";
import { format } from "date-fns";
import { useDataStore } from "@/stores/useDataStore";
import MealTimeBlock from "./MealTimeBlock.vue";
import DayNotes from "./DayNotes.vue";
// DailySummary removed; totals are shown in the day meta block

const props = defineProps({
  day: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
});

const emit = defineEmits(["updateDay"]);
const store = useDataStore();

// Templates state
const mealTemplates = computed(() => store.mealTemplates);
const mealFocusTarget = ref(null);
const secondaryPanel = ref(null);

// Load meal templates on mount
onMounted(async () => {
  try {
    await store.fetchMealTemplates();
  } catch (error) {
    console.error('Failed to load meal templates:', error);
  }
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
const macroEntries = computed(() => {
  const macros = props.day?.macros || {};
  return Object.entries(macros).map(([key, value]) => ({
    key,
    label: formatMacroLabel(key),
    value,
  }));
});

watch(
  () => props.day?.date,
  () => {
    secondaryPanel.value = null;
  }
);

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

function addBlankMeal() {
  const newMeal = store.createMeal({
    name: "", // Empty, user fills in
    time: "",
  });
  const updatedDay = cloneDay(props.day);
  updatedDay.meals.push(newMeal);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);
  
  // Auto-focus name field after render
  nextTick(() => {
    focusNewMealName(newMeal.id);
  });
}

function addFromTemplate(template) {
  const newMeal = store.createMealFromTemplate(template);
  const updatedDay = cloneDay(props.day);
  updatedDay.meals.push(newMeal);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);

  nextTick(() => {
    focusNewMealName(newMeal.id);
  });
}

function focusNewMealName(mealId) {
  if (!mealId) return;
  mealFocusTarget.value = mealId;
  nextTick(() => {
    // reset after focus to avoid re-triggering existing meals
    mealFocusTarget.value = null;
  });
}

function pasteMealFromClipboard() {
  if (!store.mealClipboard) return;
  const cloned = store.cloneMeal(store.mealClipboard);
  const updatedDay = cloneDay(props.day);
  updatedDay.meals.push(cloned);
  store.recalcDayTotals(updatedDay);
  emit("updateDay", updatedDay);

  nextTick(() => {
    focusNewMealName(cloned.id);
  });
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

function handleNotesUpdate(updatedDay) {
  emit("updateDay", updatedDay);
}

// summary handler no longer needed (card removed)

function cloneDay(day) {
  return JSON.parse(JSON.stringify(day));
}

function toggleSecondaryPanel(panel) {
  secondaryPanel.value = secondaryPanel.value === panel ? null : panel;
}

function formatMacroLabel(key = "") {
  return key
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMacroValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  const lowerKey = (key || "").toLowerCase();
  if (typeof value === "number") {
    const unit = lowerKey.includes("cal")
      ? "cal"
      : lowerKey.includes("percent")
      ? "%"
      : "g";
    if (unit === "%") return `${value}%`;
    return `${value} ${unit}`.trim();
  }
  return value;
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

.day-header-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.day-header-primary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
}

.variant-row {
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.day-header-actions {
  flex: 1 1 320px;
  display: flex;
  justify-content: flex-end;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  width: 100%;
  gap: 12px;
}

.header-actions__group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.header-actions-mobile {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.macro-bar {
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid rgba(120, 130, 160, 0.12);
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.macro-bar--empty {
  background: #f6f7fb;
}

.macro-bar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.macro-bar__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2a3c;
}

.macro-bar__content {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  row-gap: 10px;
  overflow-x: auto;
}

.macro-bar__empty {
  color: #6f7b96;
}

.macro-pill {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 110px;
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px rgba(44, 62, 80, 0.06);
}

.macro-pill__label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5f718b;
}

.macro-pill__value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1c2734;
}

.day-secondary-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.secondary-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(120, 130, 160, 0.2);
  background: #fff;
  cursor: pointer;
  transition: all 0.18s ease;
  font-weight: 600;
  color: #3c4a6c;
}

.secondary-tab:hover {
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(59, 130, 246, 0.08);
}

.secondary-tab--has-content:not(.secondary-tab--active) {
  border-color: rgba(59, 130, 246, 0.28);
  color: #2a4fa0;
}

.secondary-tab--active {
  border-color: rgba(59, 130, 246, 0.55);
  background: rgba(59, 130, 246, 0.12);
  color: #1b4aa7;
}

.secondary-tab__chevron {
  margin-left: 4px;
  color: currentColor;
}

.day-secondary-panel {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(120, 130, 160, 0.12);
  padding: 0;
  margin-bottom: 16px;
  overflow: hidden;
}

@media (max-width: 1263px) {
  .day-header-actions {
    flex: 1 1 100%;
  }

  .header-actions {
    justify-content: flex-start;
  }
}

.meal-blocks {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}
</style>

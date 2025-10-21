<template>
  <v-container>
    <div v-if="isLoading" class="py-10 text-center text-grey">
      Loading client plan…
    </div>

    <div v-else-if="!program">
      <v-alert type="info" variant="tonal">
        No plan found for this client yet.
      </v-alert>
    </div>

    <div v-else>
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center mb-4 flex-wrap gap-3 no-print">
            <v-btn
              :to="`/clients/${client?.id}`"
              icon="mdi-arrow-left"
              variant="text"
            />
            <div>
              <h1 class="text-h4 mb-1">Meal Plan Summary</h1>
              <div class="text-h6 font-weight-light">
                {{ client?.name }}
              </div>
            </div>
            <v-spacer />
            <v-btn
              class="mr-2"
              prepend-icon="mdi-download"
              color="primary"
              @click="downloadPdf"
            >
              Download PDF
            </v-btn>
            <v-btn
              prepend-icon="mdi-printer"
              color="secondary"
              @click="printPlan"
            >
              Print / Save as PDF
            </v-btn>
            <v-btn
              class="ml-2"
              prepend-icon="mdi-email"
              variant="tonal"
              color="primary"
              @click="composeEmail"
            >
              Compose Email
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Optional coach note (included in PDF) -->
      <v-row class="no-print">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-note-text-outline"></v-icon>
              Coach Note (included in PDF)
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-textarea
                v-model="planNote"
                auto-grow
                rows="2"
                placeholder="Add any guidance or notes you want your client to see in the PDF"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters and quick nav (screen only) -->
      <v-row class="no-print">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-filter-variant"></v-icon>
              View Options
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="d-flex flex-wrap gap-3 align-center">
                <v-text-field
                  v-model="filterRangeStart"
                  label="Start date"
                  type="date"
                  density="compact"
                  style="max-width: 220px"
                />
                <v-text-field
                  v-model="filterRangeEnd"
                  label="End date"
                  type="date"
                  density="compact"
                  style="max-width: 220px"
                />
                <v-switch
                  v-model="hideEmptyDays"
                  color="primary"
                  density="compact"
                  inset
                  label="Hide empty days"
                />
              </div>
              <div class="mt-2 d-flex flex-wrap gap-2">
                <v-chip
                  size="small"
                  variant="outlined"
                  @click="applyQuickRange('content')"
                >
                  With Meals
                </v-chip>
                <v-chip
                  size="small"
                  variant="outlined"
                  @click="applyQuickRange('program')"
                >
                  Full Program
                </v-chip>
                <v-chip
                  size="small"
                  variant="outlined"
                  @click="applyQuickRange('7')"
                >
                  Next 7 Days
                </v-chip>
              </div>
              <div class="mt-3 d-flex flex-wrap gap-2">
                <v-chip size="small" @click="scrollTo('overview')">
                  Overview
                </v-chip>
                <v-chip size="small" @click="scrollTo('schedule')">
                  Schedule
                </v-chip>
                <v-chip size="small" @click="scrollTo('shopping')">
                  Shopping List
                </v-chip>
                <v-chip size="small" @click="scrollTo('recipes')">
                  Recipes
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Simple send panel (mailto; attach PDF manually) -->
      <v-row class="no-print">
        <v-col cols="12" md="8" offset-md="2">
          <v-card class="mb-6">
            <v-card-title class="d-flex align-center">
              <v-icon start icon="mdi-send"></v-icon>
              Send To Client
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-text-field
                v-model="emailTo"
                label="To"
                type="email"
                :placeholder="clientEmailPlaceholder"
              />
              <v-text-field v-model="emailSubject" label="Subject" />
              <v-textarea
                v-model="emailBody"
                label="Message (email body)"
                auto-grow
                rows="2"
              />
              <div class="text-caption text-grey mt-1">
                PDF attachments can’t be added via mailto. Download the PDF
                above, then attach it in your email client.
              </div>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                prepend-icon="mdi-email"
                @click="composeEmail"
              >
                Compose Email
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Printable content starts here -->
      <div ref="printArea">
        <v-row>
          <v-col cols="12" md="8" offset-md="2">
            <!-- Cover / header in PDF -->
            <v-card class="mb-6" :id="'overview'">
              <v-card-text>
                <div class="d-flex align-start justify-space-between flex-wrap">
                  <div>
                    <div class="text-h5 font-weight-medium">Meal Plan</div>
                    <div class="text-subtitle-1">{{ client?.name }}</div>
                    <div class="text-body-2 text-grey">{{ planDateRange }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-body-2">Generated: {{ generatedOn }}</div>
                  </div>
                </div>
                <div v-if="planNote" class="mt-4">
                  <v-alert type="info" variant="tonal">{{ planNote }}</v-alert>
                </div>
              </v-card-text>
            </v-card>

            <v-card class="mb-6" :id="'shopping'">
              <v-card-title class="d-flex align-center">
                <v-icon start icon="mdi-cart"></v-icon>
                Shopping List
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div
                  v-if="!shoppingListFiltered.length"
                  class="text-grey text-body-2"
                >
                  Add foods, recipes, or meals to generate a shopping list.
                </div>
                <v-list v-else density="comfortable">
                  <v-list-item
                    v-for="item in shoppingListFiltered"
                    :key="item.key"
                  >
                    <v-list-item-title class="font-weight-medium">
                      {{ item.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ item.amount.toFixed(2) }} {{ item.unit }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row
          :id="'schedule'"
          v-for="(day, di) in filteredWeeklyPlan"
          :key="day.date"
        >
          <v-col cols="12" md="8" offset-md="2">
            <h2 class="text-h5 mb-2">
              {{ day.label }}
            </h2>
            <v-card v-for="meal in day.meals" :key="meal.id" class="mb-4">
              <v-card-title
                class="d-flex justify-space-between align-center flex-wrap"
              >
                <div>
                  <span class="text-subtitle-1 font-weight-medium">
                    {{ meal.name }}
                  </span>
                  <span v-if="meal.time" class="text-caption text-grey ml-2">
                    {{ meal.time }}
                  </span>
                </div>
                <span class="text-caption text-grey">
                  {{ meal.totals.calories }} kcal · {{ meal.totals.protein }}P /
                  {{ meal.totals.carbs }}C / {{ meal.totals.fat }}F
                </span>
              </v-card-title>
              <v-divider />
              <v-list v-if="meal.items.length" lines="one">
                <v-list-item
                  v-for="item in meal.items"
                  :key="item.id"
                  :title="item.displayName"
                  :subtitle="item.notes"
                >
                  <template #append>
                    <div class="text-caption text-grey">
                      {{ item.amount }} {{ item.unit }} ·
                      {{ item.macros.calories }} kcal
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="py-2 px-4 text-body-2 text-grey">
                No items recorded.
              </div>
            </v-card>
            <v-card variant="tonal" color="primary" class="mb-8 pa-3">
              Daily total:
              {{ day.totals.calories }} kcal · {{ day.totals.protein }}P /
              {{ day.totals.carbs }}C / {{ day.totals.fat }}F
            </v-card>
            <div
              v-if="di < filteredWeeklyPlan.length - 1"
              class="page-break"
            ></div>
          </v-col>
        </v-row>

        <!-- Recipes section -->
        <v-row>
          <v-col cols="12" md="8" offset-md="2">
            <v-card class="mb-6" :id="'recipes'">
              <v-card-title class="d-flex align-center">
                <v-icon start icon="mdi-book-open-page-variant"></v-icon>
                Recipes in this plan
              </v-card-title>
              <v-divider />
              <v-card-text>
                <div v-if="!recipesInPlan.length" class="text-grey text-body-2">
                  No recipes included in the selected period.
                </div>
                <div v-else>
                  <div
                    v-for="recipe in recipesInPlan"
                    :key="recipe.id"
                    class="mb-5"
                  >
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                      {{ recipe.name }}
                    </div>
                    <div class="text-body-2 mb-2">Ingredients:</div>
                    <v-list density="comfortable">
                      <v-list-item
                        v-for="(ing, idx) in recipeIngredients(recipe)"
                        :key="idx"
                      >
                        <v-list-item-title>
                          {{ ing.name }} — {{ ing.amount }} {{ ing.unit }}
                        </v-list-item-title>
                      </v-list-item>
                    </v-list>
                    <div v-if="recipe.instructions" class="mt-2">
                      <div class="text-body-2 mb-1">Instructions:</div>
                      <div class="text-body-2">{{ recipe.instructions }}</div>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { format, parseISO } from "date-fns";

const route = useRoute();
const dataStore = useDataStore();
const { clients, foods, meals, recipes } = storeToRefs(dataStore);

const clientId = computed(() => route.params.id);
const client = computed(
  () =>
    clients.value.find((entry) => String(entry.id) === clientId.value) || null
);

// Access store helpers for lookups and macro calculations
const { getItemDetails, calculateItemMacros } = dataStore;
const { clients } = storeToRefs(dataStore);

const client = computed(() => {
  const clientId = Number(route.params.id);
  // Assuming client object might now have waterIntakeGoal and additionalOptions
  const foundClient = clients.value.find((c) => c.id === clientId);
  // Provide default values if not present to avoid errors
  if (foundClient) {
    if (!foundClient.waterIntakeGoal) foundClient.waterIntakeGoal = 2000; // Default to 2000ml
    if (!foundClient.additionalOptions) foundClient.additionalOptions = [];
  }
  program.value = await dataStore.getProgramByClientId(clientId.value);
  isLoading.value = false;
  // Prefill email fields once client/program available
  emailTo.value = defaultClientEmail.value || "";
  emailSubject.value = defaultEmailSubject.value;
  emailBody.value = defaultEmailBody.value;
  // Initialize filters to content range if available
  applyQuickRange("content");
});

const weeklyPlan = computed(() => {
  if (!client.value?.mealPlan) return [];

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  return daysOfWeek.map(dayKey => {
    const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
    const planForDay = client.value.mealPlan[dayKey] || [];

    const meals = mealTimes.map(mealTime => {
      const itemsForMealtime = planForDay.filter(item => item.mealTime === mealTime);
      
      const itemsWithDetails = itemsForMealtime.map(item => {
        const details = getItemDetails(item.type, item.sourceId);
        return {
          ...item,
          details: details || { name: "Unknown Item" },
        };
      });

      const totals = itemsWithDetails.reduce((acc, item) => {
        const itemMacros = calculateItemMacros(item.type, item.sourceId, item.amount ?? 1);
        acc.calories += itemMacros.calories;
        acc.protein += itemMacros.protein;
        acc.carbs += itemMacros.carbs;
        acc.fat += itemMacros.fat;
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      return { mealTime, items: itemsWithDetails, totals };
    }).filter(meal => meal.items.length > 0);

    return { name: dayName, meals };
  });
});

const shoppingList = computed(() => {
  if (!client.value?.mealPlan) return [];

  const ingredientsMap = new Map();

  function addFoodToMap(food, quantity) {
    if (!food) return;
    const safeQuantity = Number(quantity);
    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) return;
    const key = `${food.id}-${food.servingUnit || "unit"}`;
    if (!ingredientsMap.has(key)) {
      ingredientsMap.set(key, {
        id: food.id,
        name: food.name,
        amount: 0,
        unit: food.servingUnit || "unit",
      });
    }
    const entry = ingredientsMap.get(key);
    entry.amount += safeQuantity;
  }

  function addComponentsToMap(type, id, quantity = 1) {
    const safeQuantity = Number(quantity);
    if (!type || id == null || !Number.isFinite(safeQuantity) || safeQuantity <= 0) return;

    if (type === "food") {
      const food = getItemDetails("food", id);
      addFoodToMap(food, safeQuantity);
      return;
    }

    const item = getItemDetails(type, id);
    if (!item) return;

    const components = item.components || item.ingredients || [];
    components.forEach((component) => {
      const baseQuantity = Number(component.amount ?? component.quantity ?? 1);
      const normalisedBase = Number.isFinite(baseQuantity) && baseQuantity > 0 ? baseQuantity : 0;
      const componentQuantity = normalisedBase > 0 ? normalisedBase * safeQuantity : safeQuantity;

      if (componentQuantity <= 0) {
        return;
      }

      if (component.customName) {
        return;
      }

      if (component.type && component.sourceId != null) {
        addComponentsToMap(component.type, component.sourceId, componentQuantity);
        return;
      }

      const foodId = component.foodId ?? component.sourceId ?? component.id;
      if (foodId != null) {
        addComponentsToMap("food", foodId, componentQuantity);
      }
    });
  }

  Object.values(client.value.mealPlan).flat().forEach((planItem) => {
    const amount = Number(planItem.amount ?? 1);
    const normalisedAmount = Number.isFinite(amount) ? amount : 1;
    addComponentsToMap(planItem.type, planItem.sourceId, normalisedAmount);
  });

  return Array.from(ingredientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
});

function printPlan() {
  window.print();
}

// Derived info for header/email
const generatedOn = computed(() => format(new Date(), "MMM d, yyyy"));

const defaultClientEmail = computed(
  () => client.value?.contact?.email || client.value?.email || ""
);
const clientEmailPlaceholder = computed(
  () => defaultClientEmail.value || "client@example.com"
);
const defaultEmailSubject = computed(() => {
  const name = client.value?.name || "Your Meal Plan";
  const range = planDateRange.value ? ` (${planDateRange.value})` : "";
  return `${name} – Your Meal Plan${range}`;
});
const defaultEmailBody = computed(() => {
  const greeting = client.value?.name ? `Hi ${client.value.name},` : "Hi,";
  const note = planNote.value ? `\n\nCoach note:\n${planNote.value}` : "";
  return `${greeting}\n\nPlease find your meal plan attached.${note}\n\nBest,`;
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function downloadPdf() {
  try {
    // Try app dependency first (avoid Vite static resolution)
    const moduleName = "html2pdf.js";
    let mod = null;
    try {
      // @vite-ignore prevents pre-bundling; variable avoids static analysis
      mod = await import(/* @vite-ignore */ moduleName);
    } catch (_) {
      mod = null;
    }

    let html2pdf = mod?.default || mod || (window && window.html2pdf) || null;

    // If not installed, try CDN fallback
    if (!html2pdf) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"
      );
      html2pdf = window.html2pdf || null;
    }

    if (!html2pdf) throw new Error("html2pdf unavailable");

    const opt = {
      margin: 10,
      filename: `${client.value?.name || "Meal-Plan"}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    await html2pdf().set(opt).from(printArea.value).save();
  } catch (e) {
    // Graceful fallback: use print dialog
    console.warn("PDF generation unavailable. Falling back to print.", e);
    window.print();
  }
}

function composeEmail() {
  const to = emailTo.value || defaultClientEmail.value || "";
  const subject = encodeURIComponent(
    emailSubject.value || defaultEmailSubject.value || "Meal Plan"
  );
  const body = encodeURIComponent(
    emailBody.value || defaultEmailBody.value || ""
  );
  if (!to) {
    // If no email, still open composer without recipient
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    return;
  }
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

// Filters
const hideEmptyDays = ref(true);
const filterRangeStart = ref("");
const filterRangeEnd = ref("");

function hasMealItems(day) {
  return (day.meals || []).some((m) => (m.items || []).length > 0);
}

// Use weeklyPlan computed above; no alias to avoid redeclaration

const filteredWeeklyPlan = computed(() => {
  const days = weeklyPlan.value || [];
  const start = filterRangeStart.value
    ? parseISO(filterRangeStart.value)
    : null;
  const end = filterRangeEnd.value ? parseISO(filterRangeEnd.value) : null;
  return days.filter((d) => {
    const date = parseISO(d.date);
    const inRange = (!start || date >= start) && (!end || date <= end);
    const notEmpty = !hideEmptyDays.value || hasMealItems(d);
    return inRange && notEmpty;
  });
});

function deriveContentRange() {
  const days = weeklyPlan.value || [];
  const withContent = days.filter((d) => hasMealItems(d));
  if (!withContent.length) return null;
  const sorted = withContent.map((d) => parseISO(d.date)).sort((a, b) => a - b);
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

function applyQuickRange(preset) {
  const days = weeklyPlan.value || [];
  if (!days.length) return;
  if (preset === "program") {
    filterRangeStart.value = days[0].date;
    filterRangeEnd.value = days[days.length - 1].date;
    return;
  }
  if (preset === "content") {
    const span = deriveContentRange();
    if (span) {
      filterRangeStart.value = format(span.start, "yyyy-MM-dd");
      filterRangeEnd.value = format(span.end, "yyyy-MM-dd");
    } else {
      filterRangeStart.value = days[0].date;
      filterRangeEnd.value = days[days.length - 1].date;
    }
    return;
  }
  if (preset === "7") {
    const today = new Date();
    const start = today;
    const end = new Date(today);
    end.setDate(today.getDate() + 6);
    filterRangeStart.value = format(start, "yyyy-MM-dd");
    filterRangeEnd.value = format(end, "yyyy-MM-dd");
    return;
  }
}

// Adjusted date range label to filtered view
const planDateRange = computed(() => {
  const days = filteredWeeklyPlan.value || [];
  if (!days.length) return "";
  const dates = days.map((d) => parseISO(d.date)).sort((a, b) => a - b);
  const start = dates[0];
  const end = dates[dates.length - 1];
  if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return format(start, "EEEE, MMM d");
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
});

// Shopping list limited to filtered period
const shoppingListFiltered = computed(() => {
  const days = filteredWeeklyPlan.value || [];
  if (!days.length) return [];
  const accumulator = new Map();

  const addFood = (food, amount) => {
    if (!food || !amount) return;
    const key = `food-${food.id}-${food.servingUnit}`;
    if (!accumulator.has(key)) {
      accumulator.set(key, {
        key,
        name: `${food.brand ? `${food.brand} · ` : ""}${food.name}`,
        amount: 0,
        unit: food.servingUnit || "serving",
      });
    }
    accumulator.get(key).amount += amount;
  };

  const expandItem = (item, multiplier = 1) => {
    if (!item) return;
    if (item.type === "food") {
      const food = foods.value.find((f) => f.id === item.sourceId);
      addFood(food, multiplier * (item.amount || 1));
      return;
    }
    if (item.type === "meal") {
      const template = meals.value.find((m) => m.id === item.sourceId);
      (template?.components || []).forEach((component) => {
        const factor =
          multiplier * (item.amount || 1) * (component.amount || 1);
        const food = foods.value.find((f) => f.id === component.foodId);
        addFood(food, factor);
      });
      return;
    }
    if (item.type === "recipe") {
      const recipe = recipes.value.find((r) => r.id === item.sourceId);
      (recipe?.components || recipe?.ingredients || []).forEach((component) => {
        if (component.foodId) {
          const food = foods.value.find((f) => f.id === component.foodId);
          const factor =
            multiplier * (item.amount || 1) * (component.amount || 1);
          addFood(food, factor);
        } else if (component.type && component.id) {
          expandItem(
            {
              type: component.type,
              sourceId: component.id,
              amount: (component.amount || 1) * (item.amount || 1),
            },
            multiplier
          );
        }
      });
      return;
    }
    if (item.type === "custom") {
      const key = `custom-${item.name}`;
      if (!accumulator.has(key)) {
        accumulator.set(key, {
          key,
          name: item.name || "Custom item",
          amount: multiplier * (item.amount || 1),
          unit: item.unit || "serving",
        });
      } else {
        accumulator.get(key).amount += multiplier * (item.amount || 1);
      }
    }
  };

  days.forEach((day) => {
    (day.meals || []).forEach((meal) => {
      (meal.items || []).forEach((item) => expandItem(item, 1));
    });
  });

  return Array.from(accumulator.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
});

// Recipes included in the filtered period
const recipesInPlan = computed(() => {
  const ids = new Set();
  const days = filteredWeeklyPlan.value || [];
  const addRecipeFromItem = (item) => {
    if (item.type === "recipe") ids.add(item.sourceId);
    if (item.type === "meal") {
      const mealT = meals.value.find((m) => m.id === item.sourceId);
      (mealT?.components || []).forEach((c) => {
        if (c.type === "recipe" && c.id) ids.add(c.id);
      });
    }
  };
  days.forEach((d) =>
    (d.meals || []).forEach((m) => (m.items || []).forEach(addRecipeFromItem))
  );
  return recipes.value.filter((r) => ids.has(r.id));
});

function recipeIngredients(recipe) {
  const out = [];
  const comps = recipe?.components || recipe?.ingredients || [];
  comps.forEach((c) => {
    if (c.foodId) {
      const food = foods.value.find((f) => f.id === c.foodId);
      if (food)
        out.push({
          name: `${food.brand ? food.brand + " · " : ""}${food.name}`,
          amount: c.amount ?? c.quantity ?? 1,
          unit: food.servingUnit || "serving",
        });
    } else if (c.type === "food" && c.id) {
      const food = foods.value.find((f) => f.id === c.id);
      if (food)
        out.push({
          name: `${food.brand ? food.brand + " · " : ""}${food.name}`,
          amount: c.amount ?? 1,
          unit: food.servingUnit || "serving",
        });
    }
  });
  return out;
}

function scrollTo(anchor) {
  const el = document.getElementById(anchor);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<style>
/* Print helpers */
@media print {
  .no-print {
    display: none !important;
  }
  .page-break {
    page-break-before: always;
  }
}
</style>

<template>
  <v-container>
    <div v-if="loading" class="py-10 text-center text-grey">Loading…</div>
    <div v-else-if="!program">
      <v-alert type="info" variant="tonal">
        No plan found for this client yet.
      </v-alert>
    </div>
    <div v-else>
      <div
        class="d-flex flex-column flex-md-row align-md-center justify-space-between mb-4"
      >
        <div class="d-flex align-center">
          <v-btn
            :to="`/clients/${client?.id}`"
            icon="mdi-arrow-left"
            variant="text"
          />
          <div class="ml-2">
            <h1 class="text-h5 mb-1">Plan Summary</h1>
            <div class="text-subtitle-2">{{ client?.name }}</div>
          </div>
        </div>
        <div class="mt-4 mt-md-0">
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            :loading="exportingPdf"
            :disabled="exportingPdf"
            @click="downloadPdf"
          >
            Download PDF
          </v-btn>
        </div>
      </div>

      <v-alert v-if="pdfError" type="error" class="mb-4" border="start">
        {{ pdfError }}
      </v-alert>

      <v-card class="mb-6">
        <v-card-text>
          <div class="d-flex flex-column flex-md-row justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-medium">
                Plan Overview
              </div>
              <div class="text-body-2 text-grey">
                A quick snapshot of this client&apos;s current plan.
              </div>
            </div>
            <v-chip
              v-if="planSummary?.dateRangeLabel"
              color="primary"
              prepend-icon="mdi-calendar-range"
              variant="flat"
              class="mt-4 mt-md-0"
            >
              {{ planSummary.dateRangeLabel }}
            </v-chip>
          </div>

          <v-divider class="my-4" />

          <v-row>
            <v-col
              v-for="stat in summaryStats"
              :key="stat.label"
              cols="12"
              sm="6"
              md="3"
              class="py-2"
            >
              <div class="d-flex align-start">
                <v-avatar size="32" color="primary" variant="tonal" class="mr-3">
                  <v-icon size="20">{{ stat.icon }}</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-grey">{{ stat.label }}</div>
                  <div class="text-body-1 font-weight-medium">
                    {{ stat.value }}
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-6">
            <v-card-title>Schedule</v-card-title>
            <v-divider />
            <v-card-text>
              <v-expansion-panels
                v-model="expandedDays"
                multiple
                class="plan-days"
              >
                <v-expansion-panel
                  v-for="(day, index) in program.days"
                  :key="day.date"
                  :value="index"
                >
                  <v-expansion-panel-title>
                    <div class="d-flex align-center justify-space-between w-100">
                      <div>
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ formatDayLabel(day.date) }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ pluralize(day.meals.length, 'meal') }}
                          <span
                            v-if="day.macros?.calories"
                          >
                            · {{ formatNumber(day.macros.calories) }} kcal
                          </span>
                        </div>
                      </div>
                      <v-chip
                        v-if="isTodayIso(day.date)"
                        color="primary"
                        size="small"
                        variant="tonal"
                      >
                        Today
                      </v-chip>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-if="!day.meals.length" class="text-caption text-grey">
                      No meals planned for this day.
                    </div>
                    <v-row v-else dense>
                      <v-col
                        v-for="meal in day.meals"
                        :key="meal.id"
                        cols="12"
                        md="6"
                        class="py-2"
                      >
                        <v-sheet class="pa-3 meal-sheet" rounded border>
                          <div class="d-flex justify-space-between align-center">
                            <div class="text-subtitle-2 font-weight-medium">
                              {{ meal.mealTime || meal.name || "Meal" }}
                            </div>
                            <div class="text-caption text-grey">
                              {{ pluralize(meal.items?.length || 0, 'item') }}
                            </div>
                          </div>
                          <div
                            v-if="meal.items?.length"
                            class="d-flex flex-wrap mt-3 meal-items"
                          >
                            <v-chip
                              v-for="item in meal.items"
                              :key="item.id"
                              size="small"
                              variant="tonal"
                              color="primary"
                              class="mr-2 mb-2"
                            >
                              {{ formatMealItemChip(item) }}
                            </v-chip>
                          </div>
                          <div v-else class="text-caption text-grey mt-2">
                            No items recorded for this meal.
                          </div>
                        </v-sheet>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card class="mb-6">
            <v-card-title>Shopping List</v-card-title>
            <v-divider />
            <v-card-text>
              <div v-if="!shoppingListItems.length" class="text-caption text-grey">
                No ingredients added yet.
              </div>
              <v-table v-else density="compact" class="shopping-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th class="text-right">Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in shoppingListItems"
                    :key="`${item.name}-${item.unit || 'unitless'}`"
                  >
                    <td class="font-weight-medium">
                      {{ item.name }}
                    </td>
                    <td class="text-right">
                      {{ formatShoppingAmount(item) }}
                    </td>
                    <td>
                      <div v-if="item.notes.length">
                        {{ item.notes.join("; ") }}
                      </div>
                      <div v-else-if="item.textual.length" class="text-caption">
                        {{ item.textual.join(", ") }}
                      </div>
                      <div v-else class="text-disabled">—</div>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>Notes for the Client</v-card-title>
            <v-divider />
            <v-card-text>
              <div
                v-if="client?.notes"
                class="text-body-2 notes-content"
              >
                {{ client.notes }}
              </div>
              <div v-else class="text-caption text-grey">
                No notes recorded for this client yet.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDataStore } from '@/stores/useDataStore';
import { storeToRefs } from 'pinia';
import { addDays, format, parseISO } from 'date-fns';
import { generateMealPlanPDF } from '@/utils/pdfGenerator';

const route = useRoute();
const store = useDataStore();
const { clients } = storeToRefs(store);

const loading = ref(true);
const program = ref(null);
const exportingPdf = ref(false);
const pdfError = ref('');
const expandedDays = ref([]);

const clientId = computed(() => String(route.params.clientId || route.params.id || ''));
const client = computed(() => clients.value.find((c) => String(c.id) === clientId.value) || null);

onMounted(async () => {
  try {
    if (!clients.value.length) {
      await store.fetchClients().catch(() => {});
    }
    program.value = await store.getProgramByClientId(clientId.value);
  } finally {
    loading.value = false;
  }
});

watch(program, (value) => {
  if (value?.days?.length) {
    expandedDays.value = [0];
  }
});

const planSummary = computed(() => {
  if (!program.value) return null;

  const startIso =
    program.value.startDate ||
    program.value.days?.[0]?.date ||
    '';
  const parsedStart = parseIsoSafe(startIso);

  const daysCount =
    Number(program.value.length) ||
    (Array.isArray(program.value.days) ? program.value.days.length : 0) ||
    0;

  let endDate = null;
  if (parsedStart && daysCount > 0) {
    endDate = addDays(parsedStart, Math.max(daysCount - 1, 0));
  } else if (Array.isArray(program.value.days) && program.value.days.length) {
    endDate = parseIsoSafe(program.value.days[program.value.days.length - 1].date);
  }

  const startLabel = parsedStart ? format(parsedStart, 'MMM d, yyyy') : 'Not set';
  const endLabel = endDate ? format(endDate, 'MMM d, yyyy') : 'Not set';
  const lengthLabel = daysCount ? pluralize(daysCount, 'day') : '—';

  let totalMeals = 0;
  let totalItems = 0;
  for (const day of program.value.days || []) {
    totalMeals += day?.meals?.length || 0;
    for (const meal of day?.meals || []) {
      totalItems += meal?.items?.length || 0;
    }
  }

  const dateRangeLabel =
    parsedStart && endDate
      ? `${format(parsedStart, 'MMM d')} – ${format(endDate, 'MMM d')}`
      : null;

  return {
    startLabel,
    endLabel,
    lengthLabel,
    totalMeals,
    totalItems,
    dateRangeLabel,
  };
});

const summaryStats = computed(() => {
  if (!planSummary.value) return [];
  const stats = [
    {
      icon: 'mdi-calendar-start',
      label: 'Start',
      value: planSummary.value.startLabel,
    },
    {
      icon: 'mdi-calendar-end',
      label: 'End',
      value: planSummary.value.endLabel,
    },
    {
      icon: 'mdi-calendar-range',
      label: 'Length',
      value: planSummary.value.lengthLabel,
    },
    {
      icon: 'mdi-silverware-fork-knife',
      label: 'Meals Planned',
      value: planSummary.value.totalMeals
        ? pluralize(planSummary.value.totalMeals, 'meal')
        : '—',
    },
    {
      icon: 'mdi-basket-outline',
      label: 'Shopping Items',
      value: pluralize(shoppingListItems.value.length, 'item'),
    },
    {
      icon: 'mdi-playlist-check',
      label: 'Total Meal Items',
      value: planSummary.value.totalItems
        ? pluralize(planSummary.value.totalItems, 'item')
        : '—',
    },
  ];

  return stats.filter((stat) => Boolean(stat.value));
});

const shoppingListItems = computed(() => {
  if (!program.value) return [];
  const aggregate = new Map();

  for (const day of program.value.days || []) {
    for (const meal of day?.meals || []) {
      for (const item of meal?.items || []) {
        const itemName = (item?.name || lookupName(item) || 'Item').trim() || 'Item';
        const unit = String(item?.unit || '').trim();
        const key = `${itemName.toLowerCase()}__${unit.toLowerCase() || 'unitless'}`;
        const numericAmount = Number(item?.amount);
        const isNumeric = Number.isFinite(numericAmount);
        const textAmount = !isNumeric && item?.amount != null ? String(item.amount).trim() : '';
        const itemNotes = String(item?.notes || '').trim();

        if (!aggregate.has(key)) {
          aggregate.set(key, {
            name: itemName,
            unit,
            total: 0,
            hasNumeric: false,
            textual: [],
            notes: [],
          });
        }

        const entry = aggregate.get(key);
        if (isNumeric) {
          entry.total += numericAmount;
          entry.hasNumeric = true;
        } else if (textAmount) {
          entry.textual.push(textAmount);
        }

        if (itemNotes) {
          entry.notes.push(itemNotes);
        }
      }
    }
  }

  return Array.from(aggregate.values())
    .map((entry) => ({
      name: entry.name,
      unit: entry.unit,
      total: entry.hasNumeric ? entry.total : null,
      textual: entry.textual,
      notes: entry.notes,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

function lookupName(item) {
  const type = item.type || (item.sourceId ? 'food' : null);
  if (!type) return 'Item';
  const details = store.getItemDetails(type, item.sourceId);
  return details?.name || 'Item';
}

function formatDayLabel(iso) {
  if (!iso) return 'Day';
  try {
    return format(parseISO(iso), 'EEEE, MMM d');
  } catch (error) {
    return iso;
  }
}

function formatMealItem(item) {
  const name = (item?.name || lookupName(item) || 'Item').trim() || 'Item';
  const amountLabel = formatAmountLabel(item);
  const notes = String(item?.notes || '').trim();
  const parts = [name];
  if (amountLabel) parts.push(`(${amountLabel})`);
  if (notes) parts.push(`- ${notes}`);
  return parts.join(' ');
}

function formatMealItemChip(item) {
  const name = (item?.name || lookupName(item) || 'Item').trim() || 'Item';
  const amountLabel = formatAmountLabel(item);
  return amountLabel ? `${name} · ${amountLabel}` : name;
}

function formatAmountLabel(item) {
  const amount = Number(item?.amount);
  const hasNumeric = Number.isFinite(amount);
  const cleanedAmount = hasNumeric ? formatNumber(amount) : String(item?.amount || '').trim();
  const unit = String(item?.unit || '').trim();
  const pieces = [];
  if (cleanedAmount) pieces.push(cleanedAmount);
  if (unit) pieces.push(unit);
  return pieces.join(' ');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

function formatShoppingAmount(item) {
  const parts = [];
  if (item.total !== null) {
    parts.push(
      item.unit ? `${formatNumber(item.total)} ${item.unit}` : formatNumber(item.total)
    );
  }
  if (item.textual.length) {
    parts.push(item.textual.join(', '));
  }
  return parts.length ? parts.join(' · ') : '—';
}

function pluralize(count, noun) {
  const safe = Number.isFinite(count) ? count : 0;
  const suffix = safe === 1 ? noun : `${noun}s`;
  return `${safe} ${suffix}`;
}

function isTodayIso(iso) {
  const target = parseIsoSafe(iso);
  if (!target) return false;
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  return format(target, 'yyyy-MM-dd') === todayIso;
}

async function downloadPdf() {
  if (!program.value) return;
  pdfError.value = '';
  exportingPdf.value = true;

  try {
    const doc = generateMealPlanPDF({
      client: client.value,
      program: program.value,
      planSummary: planSummary.value,
      shoppingListItems: shoppingListItems.value,
      lookupName: lookupName,
    });

    const safeName = (client.value?.name || 'client')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'client';
    
    doc.save(`${safeName}-plan-summary.pdf`);
  } catch (error) {
    pdfError.value = error?.message || 'Failed to generate PDF.';
    console.error('PDF generation error:', error);
  } finally {
    exportingPdf.value = false;
  }
}


function parseIsoSafe(value) {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
}

</script>

<style scoped>
.notes-content {
  white-space: pre-line;
}

.meal-sheet {
  background: rgb(var(--v-theme-surface));
  border-color: rgba(var(--v-theme-primary), 0.12);
}

.meal-items {
  gap: 8px;
}

.shopping-table th {
  font-weight: 600;
}

.shopping-table td,
.shopping-table th {
  padding-block: 10px;
}

.shopping-table tbody tr:not(:last-child) td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.plan-days :deep(.v-expansion-panel-title__overlay) {
  border-radius: 12px;
}

.plan-days :deep(.v-expansion-panel-text__wrapper) {
  padding-top: 16px;
}
</style>

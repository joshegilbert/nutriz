<template>
  <v-container class="py-6">
    <v-row class="mb-6" align="stretch">
      <v-col cols="12" md="6" class="mb-4 mb-md-0">
        <v-card elevation="2" class="mb-4">
          <v-card-title class="text-h6">
            Report library
          </v-card-title>
          <v-card-subtitle>
            Filter by focus area to quickly review the files you and your team have uploaded.
          </v-card-subtitle>
          <v-divider class="my-2"></v-divider>
          <v-card-text>
            <v-select
              v-model="selectedCategory"
              :items="typeFilterItems"
              item-title="label"
              item-value="value"
              label="Filter by report type"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-4"
            ></v-select>

            <v-list v-if="filteredReports.length" density="comfortable">
              <v-list-item
                v-for="report in filteredReports"
                :key="report.id"
                :prepend-icon="report.icon"
              >
                <v-list-item-title class="font-weight-medium">
                  {{ report.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ report.typeLabel }} • {{ formatDate(report.submittedAt) }} • {{ report.fileName }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <div
              v-else
              class="text-center py-8 px-4"
            >
              <v-avatar size="48" color="primary" variant="tonal" class="mb-3">
                <v-icon>mdi-folder-search-outline</v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-medium">
                {{
                  selectedCategory === "all"
                    ? "No reports yet"
                    : `No ${typeLookup[selectedCategory] ?? "custom"} reports yet`
                }}
              </div>
              <div class="text-body-2 mt-1">
                {{
                  selectedCategory === "all"
                    ? "Upload your first check-in, lab review, or session summary to start building your history."
                    : "When you add a report of this type it will appear here for quick access."
                }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <div ref="uploadSectionRef">
          <v-card elevation="2">
            <v-card-title class="text-h6">
              Upload client report
            </v-card-title>
            <v-card-subtitle>
              Centralize check-ins, lab work, and session notes so anyone on the coaching team can review quickly.
            </v-card-subtitle>
            <v-divider class="my-2"></v-divider>
            <v-card-text>
              <v-alert
                v-if="uploadError"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                {{ uploadError }}
              </v-alert>

              <v-form @submit.prevent="handleUpload">
                <v-text-field
                  v-model="newReport.title"
                  label="Report title"
                  placeholder="e.g. April Body Composition Summary"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-text-field>

                <v-select
                  v-model="newReport.type"
                  :items="reportTypes"
                  item-title="label"
                  item-value="value"
                  label="Report type"
                  variant="outlined"
                  density="comfortable"
                  class="mb-3"
                ></v-select>

                <v-file-input
                  v-model="newReport.file"
                  label="Attach file"
                  variant="outlined"
                  density="comfortable"
                  accept=".csv,.xlsx,.xls,.pdf,.docx"
                  show-size
                  prepend-icon="mdi-paperclip"
                  class="mb-3"
                ></v-file-input>

                <v-textarea
                  v-model="newReport.notes"
                  label="Key observations"
                  rows="4"
                  auto-grow
                  placeholder="Highlight trends, client wins, and items that need attention."
                  variant="outlined"
                  density="comfortable"
                  class="mb-4"
                ></v-textarea>

                <div class="d-flex justify-end">
                  <v-btn
                    color="primary"
                    type="submit"
                    prepend-icon="mdi-upload"
                  >
                    Save report
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <v-col cols="12" md="6">
        <template v-if="hasReports">
          <v-row>
            <v-col cols="12" md="6" v-for="metric in keyMetrics" :key="metric.title">
              <v-card :color="metric.color" variant="tonal" class="mb-4">
                <v-card-item>
                  <template #prepend>
                    <v-avatar size="40" :color="metric.color" variant="flat">
                      <v-icon>{{ metric.icon }}</v-icon>
                    </v-avatar>
                  </template>
                  <v-card-title class="text-subtitle-1">
                    {{ metric.title }}
                  </v-card-title>
                  <v-card-subtitle class="text-h6 font-weight-bold">
                    {{ metric.value }}
                  </v-card-subtitle>
                  <div class="text-caption">
                    {{ metric.trend }}
                  </div>
                </v-card-item>
                <v-card-text class="text-body-2">
                  {{ metric.description }}
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card elevation="2" class="mb-4">
            <v-card-title class="text-h6">
              Coach dashboard insight
            </v-card-title>
            <v-card-subtitle>
              Spot clients who need proactive outreach before compliance drops.
            </v-card-subtitle>
            <v-divider class="my-2"></v-divider>
            <v-data-table
              :headers="progressHeaders"
              :items="progressRows"
              density="comfortable"
              hide-default-footer
              class="rounded"
            >
              <template #item.trend="{ item }">
                <v-chip
                  :color="item.trendColor"
                  text-color="white"
                  size="small"
                  class="font-weight-medium"
                >
                  {{ item.trend }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card>

          <v-card elevation="2">
            <v-card-title class="text-h6">
              Recommended reports to run next
            </v-card-title>
            <v-divider class="my-2"></v-divider>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="suggestion in suggestedReports"
                  :key="suggestion.title"
                  cols="12"
                  sm="6"
                >
                  <v-sheet
                    class="pa-3 rounded-lg h-100"
                    color="surface-variant"
                    elevation="1"
                  >
                    <div class="d-flex align-center mb-2">
                      <v-avatar size="36" color="primary" variant="tonal">
                        <v-icon>{{ suggestion.icon }}</v-icon>
                      </v-avatar>
                      <div class="ml-3">
                        <div class="text-subtitle-2 font-weight-medium">
                          {{ suggestion.title }}
                        </div>
                        <div class="text-caption">
                          Ideal cadence: {{ suggestion.cadence }}
                        </div>
                      </div>
                    </div>
                    <div class="text-body-2">
                      {{ suggestion.summary }}
                    </div>
                  </v-sheet>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </template>
        <template v-else>
          <v-card elevation="2" class="pa-8 d-flex flex-column align-center justify-center text-center">
            <v-avatar size="64" color="primary" variant="tonal" class="mb-4">
              <v-icon size="36">mdi-file-document-edit</v-icon>
            </v-avatar>
            <div class="text-h6 font-weight-medium mb-2">
              Your reporting hub is ready
            </div>
            <div class="text-body-1 mb-4">
              Start by uploading client check-ins, biomarker reviews, or session recaps. Insights will unlock as soon as you have data to analyze.
            </div>
            <v-btn color="primary" prepend-icon="mdi-upload" @click="scrollToUpload">
              Add your first report
            </v-btn>
          </v-card>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref } from "vue";

const reportTypes = [
  { label: "Progress summary", value: "progress" },
  { label: "Macronutrient compliance", value: "macros" },
  { label: "Lab and biomarker review", value: "labs" },
  { label: "Session recap", value: "session" },
];

const typeLookup = reportTypes.reduce((map, type) => {
  map[type.value] = type.label;
  return map;
}, {});

const typeFilterItems = [{ label: "All report types", value: "all" }, ...reportTypes];
const selectedCategory = ref("all");

const uploadedReports = ref([]);

const newReport = reactive({
  title: "",
  type: null,
  file: [],
  notes: "",
});

const uploadError = ref("");
const uploadSectionRef = ref(null);

const hasReports = computed(() => uploadedReports.value.length > 0);

const filteredReports = computed(() => {
  if (selectedCategory.value === "all") {
    return uploadedReports.value;
  }

  return uploadedReports.value.filter(
    (report) => report.type === selectedCategory.value,
  );
});

const keyMetrics = [
  {
    title: "Weekly check-in completion",
    value: "88%",
    trend: "↑ 4% vs last month",
    icon: "mdi-checkbox-marked-circle-outline",
    color: "primary",
    description: "Clients submitting check-ins on time; aim for 90% to keep adherence high.",
  },
  {
    title: "Average weight change",
    value: "-1.8 lb",
    trend: "Goal met for 72% of fat loss clients",
    icon: "mdi-scale-bathroom",
    color: "success",
    description: "Trailing 30-day change across clients with weight-loss goals.",
  },
  {
    title: "Macro compliance",
    value: "76%",
    trend: "Most misses occur on Saturdays",
    icon: "mdi-food-apple-outline",
    color: "deep-purple",
    description: "Percentage of logged days within ±10% of prescribed macros.",
  },
  {
    title: "Revenue per client",
    value: "$312",
    trend: "↑ $24 vs previous quarter",
    icon: "mdi-cash-multiple",
    color: "amber-darken-2",
    description: "Average monthly revenue, accounting for active coaching tiers.",
  },
];

const progressHeaders = [
  { title: "Client", key: "name" },
  { title: "Primary focus", key: "focus" },
  { title: "30-day change", key: "change" },
  { title: "Trend", key: "trend", sortable: false },
  { title: "Last touchpoint", key: "lastTouchpoint" },
];

const progressRows = [
  {
    name: "Avery H.",
    focus: "Fat loss",
    change: "-5.4 lb",
    trend: "On track",
    trendColor: "success",
    lastTouchpoint: "3 days ago (video call)",
  },
  {
    name: "Jordan M.",
    focus: "Lean mass gain",
    change: "+1.6 lb",
    trend: "Needs review",
    trendColor: "warning",
    lastTouchpoint: "8 days ago (missed check-in)",
  },
  {
    name: "Priya S.",
    focus: "Gut health reset",
    change: "Symptoms ↓ 40%",
    trend: "Improving",
    trendColor: "info",
    lastTouchpoint: "Yesterday (lab upload)",
  },
  {
    name: "Chris D.",
    focus: "Sports performance",
    change: "VO2 max ↑ 6%",
    trend: "On track",
    trendColor: "success",
    lastTouchpoint: "5 days ago (training log)",
  },
];

const suggestedReports = [
  {
    title: "Quarterly retention audit",
    cadence: "Quarterly",
    summary:
      "Review churn, pause requests, and average client lifespan to spot service gaps before renewal season.",
    icon: "mdi-account-arrow-right-outline",
  },
  {
    title: "Habit compliance snapshot",
    cadence: "Bi-weekly",
    summary:
      "Pull top habits from your app and monitor streaks so coaches can intervene where consistency dips.",
    icon: "mdi-calendar-check",
  },
  {
    title: "Lab trend comparison",
    cadence: "Semi-annual",
    summary:
      "Line up biomarkers across panels to ensure coaching changes are reflected in blood work.",
    icon: "mdi-test-tube",
  },
  {
    title: "Coach utilization & capacity",
    cadence: "Monthly",
    summary:
      "Balance caseloads, time-on-platform, and response times to plan hiring and prevent burnout.",
    icon: "mdi-account-cog-outline",
  },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const handleUpload = () => {
  uploadError.value = "";

  const file = Array.isArray(newReport.file)
    ? newReport.file[0]
    : newReport.file;

  if (!newReport.title || !newReport.type || !file) {
    uploadError.value =
      "Please provide a title, select a report type, and attach at least one file.";
    return;
  }

  const uploadedAt = new Date();
  uploadedReports.value.unshift({
    id: crypto.randomUUID(),
    title: newReport.title,
    type: newReport.type,
    typeLabel: typeLookup[newReport.type] ?? "Custom",
    fileName: file.name ?? "uploaded-report",
    icon: pickIconForType(newReport.type),
    submittedAt: uploadedAt,
  });

  selectedCategory.value = newReport.type;

  // Reset form fields for the next upload.
  newReport.title = "";
  newReport.type = null;
  newReport.file = [];
  newReport.notes = "";
};

const pickIconForType = (type) => {
  switch (type) {
    case "progress":
      return "mdi-chart-line";
    case "macros":
      return "mdi-food-variant";
    case "labs":
      return "mdi-flask-outline";
    case "session":
      return "mdi-account-voice";
    default:
      return "mdi-file-chart";
  }
};

const formatDate = (date) => dateFormatter.format(date);

const scrollToUpload = () => {
  if (!uploadSectionRef.value) {
    return;
  }

  uploadSectionRef.value.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};
</script>

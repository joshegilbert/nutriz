<template>
  <!-- Make the container fluid and give more horizontal padding -->
  <v-container fluid class="client-detail-view px-8 py-4">
    <div v-if="!client">
      <p>Loading client details...</p>
    </div>
    <div v-else>
      <div class="client-header mb-3">
        <div class="client-header-left">
          <v-btn to="/clients" icon="mdi-arrow-left" variant="text" class="client-back-btn"></v-btn>
          <div class="client-left-column">
            <div class="client-photo-row">
              <div class="client-photo-box">
                <span class="client-photo-initials">{{ clientInitials }}</span>
              </div>
              <div class="client-name-info">
                <div class="client-name-row">
                  <h1 class="text-h4 mb-0">{{ client.name }}</h1>
                  <v-chip
                    :color="client.status === 'Active' ? 'green' : 'orange'"
                    size="small"
                    class="client-status-chip"
                  >
                    {{ client.status }}
                  </v-chip>
                </div>
                <v-btn
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-account-box-outline"
                  class="client-about-btn"
                  @click="aboutDialog = true"
                >
                  About
                </v-btn>
              </div>
            </div>
            <div class="client-view-toggle">
              <v-btn-toggle v-model="viewMode" mandatory>
                <v-btn value="week" prepend-icon="mdi-calendar-week">Week View</v-btn>
                <v-btn value="month" prepend-icon="mdi-calendar-month">Month View</v-btn>
              </v-btn-toggle>
            </div>
          </div>
        </div>
        <div class="client-header-actions">
          <v-btn
            :to="`/clients/${client.id}/plan`"
            color="secondary"
            prepend-icon="mdi-printer"
          >
            View Client Plan
          </v-btn>
        </div>
      </div>

      <v-dialog v-model="aboutDialog" max-width="520">
        <v-card>
          <v-card-title class="text-h6">
            About {{ client.name }}
          </v-card-title>
          <v-card-text>
            <div class="mb-4 d-flex align-center">
              <div>
                <h3 class="text-subtitle-1 font-weight-medium mb-1">Status</h3>
                <p class="text-body-2 mb-0">
                  {{ client.status || "Not set" }}
                </p>
              </div>
              <v-spacer />
              <v-btn
                variant="text"
                density="comfortable"
                prepend-icon="mdi-pencil"
                @click.stop="openEditDialog('status')"
              >
                Edit
              </v-btn>
            </div>

            <v-expansion-panels multiple>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  Goals
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-if="goalList.length > 0">
                    <v-list density="compact">
                      <v-list-item v-for="(goal, index) in goalList" :key="`goal-display-${index}`">
                        <v-list-item-title>{{ goal }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </div>
                  <p v-else class="text-body-2 mb-0">
                    No goals recorded.
                  </p>
                  <div class="text-right mt-4">
                    <v-btn
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-pencil"
                      @click.stop="openEditDialog('goals')"
                    >
                      Edit Goals
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Program Details
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Start Day</v-list-item-title>
                      <v-list-item-subtitle>{{ programStartLabel }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Length</v-list-item-title>
                      <v-list-item-subtitle>{{ programLengthLabel }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>End Day</v-list-item-title>
                      <v-list-item-subtitle>{{ programEndLabel }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <p v-if="!primaryProgram" class="text-body-2 mb-0 mt-2">
                    No program has been assigned to this client yet.
                  </p>
                  <div class="text-right mt-4">
                    <v-btn
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-pencil"
                      @click.stop="openEditDialog('program')"
                    >
                      Edit Program
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Personal Information
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Age</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.age }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Gender</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.gender }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Weight</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.weight }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>State</v-list-item-title>
                      <v-list-item-subtitle>{{ personalInfo.state }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <div class="text-right mt-4">
                    <v-btn
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-pencil"
                      @click.stop="openEditDialog('personal')"
                    >
                      Edit Personal Info
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Contact Information
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Email</v-list-item-title>
                      <v-list-item-subtitle>{{ contactInfo.email }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Phone</v-list-item-title>
                      <v-list-item-subtitle>{{ contactInfo.phone }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                  <div class="text-right mt-4">
                    <v-btn
                      variant="text"
                      density="comfortable"
                      prepend-icon="mdi-pencil"
                      @click.stop="openEditDialog('contact')"
                    >
                      Edit Contact
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

            </v-expansion-panels>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="primary" @click="aboutDialog = false">
              Close
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="editDialog" max-width="560">
        <v-card>
          <v-card-title class="text-h6">
            {{ editDialogTitle }}
          </v-card-title>
          <v-card-text>
            <v-form ref="editForm">
              <v-container>
                <template v-if="editSection === 'status'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editModel.status"
                        :items="statusOptions"
                        label="Status"
                        :rules="[formRules.required]"
                        hide-details="auto"
                        clearable
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editModel.lastActive"
                        label="Last Active"
                        type="date"
                        hide-details="auto"
                      />
                    </v-col>
                  </v-row>
                </template>

                <template v-else-if="editSection === 'program'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editModel.startDate"
                        label="Start Day"
                        type="date"
                        :rules="[formRules.required]"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editModel.length"
                        label="Length (days)"
                        type="number"
                        :rules="[formRules.required, formRules.positiveInt]"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        :model-value="editProgramEndPreview"
                        label="End Day (calculated)"
                        readonly
                        hide-details="auto"
                      />
                    </v-col>
                  </v-row>
                </template>

                <template v-else-if="editSection === 'personal'">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editModel.age"
                        label="Age"
                        type="number"
                        :rules="[formRules.numberOptional]"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editModel.gender"
                        :items="genderOptions"
                        label="Gender"
                        hide-details="auto"
                        clearable
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="editModel.weight"
                        label="Weight (lbs)"
                        type="number"
                        :rules="[formRules.numberOptional]"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editModel.state"
                        :items="stateOptions"
                        label="State"
                        hide-details="auto"
                        clearable
                      />
                    </v-col>
                  </v-row>
                </template>

                <template v-else-if="editSection === 'goals'">
                  <v-row>
                    <v-col
                      v-for="(goal, index) in editModel.goals"
                      :key="`edit-goal-${index}`"
                      cols="12"
                    >
                      <v-text-field
                        v-model="editModel.goals[index]"
                        :label="`Goal ${index + 1}`"
                        hide-details="auto"
                        append-inner-icon="mdi-delete"
                        @click:append-inner.stop="removeGoalField(index)"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-btn
                        color="primary"
                        variant="text"
                        prepend-icon="mdi-plus"
                        @click="addGoalField"
                      >
                        Add Goal
                      </v-btn>
                    </v-col>
                  </v-row>
                </template>

                <template v-else-if="editSection === 'contact'">
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editModel.email"
                        label="Email"
                        :rules="[formRules.required, formRules.email]"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editModel.phone"
                        label="Phone Number"
                        hide-details="auto"
                      />
                    </v-col>
                  </v-row>
                </template>
              </v-container>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" color="grey" @click="closeEditDialog">
              Cancel
            </v-btn>
            <v-btn variant="text" color="primary" @click="saveEdit">
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Calendar Rendering -->
      <v-row justify="center">
        <v-col cols="12" xl="10" lg="11" md="12">
          <MealCalendar
            v-if="viewMode === 'week'"
            :client-id="client.id"
            :initial-date="selectedDate"
            @back-to-month="viewMode = 'month'"
          />
          <MealCalendarMonth
            v-else
            :client-id="client.id"
            :program-id="client.programs[0].id"
            @open-week="openWeekView"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>


<script setup>
import { ref, computed, defineAsyncComponent, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const MealCalendar = defineAsyncComponent(() =>
  import("@/components/MealCalendar/index.vue")   
);
const MealCalendarMonth = defineAsyncComponent(() =>
  import("@/components/MealCalendarMonth.vue")
);

const route = useRoute();
const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const viewMode = ref("week");
const aboutDialog = ref(false);
const editDialog = ref(false);
const editSection = ref(null);
const editForm = ref(null);
const editModel = ref({});
const selectedDate = ref(new Date());

const statusOptions = ["Active", "Pending", "On Hold", "Inactive"];
const genderOptions = ["Male", "Female"];
const stateOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const formRules = {
  required: (value) => !!value || "Required",
  positiveInt: (value) => {
    const num = Number(value);
    return (Number.isInteger(num) && num > 0) || "Enter a positive number";
  },
  numberOptional: (value) => {
    if (value === "" || value === null || value === undefined) return true;
    return !Number.isNaN(Number(value)) || "Enter a number";
  },
  email: (value) => {
    if (!value) return "Email is required";
    const pattern = /.+@.+\..+/;
    return pattern.test(value) || "Enter a valid email";
  },
};

const client = computed(() =>
  clients.value.find((c) => c.id === Number(route.params.id))
);

const primaryProgram = computed(() => client.value?.programs?.[0] ?? null);

const programStartLabel = computed(() => {
  const start = primaryProgram.value?.startDate;
  if (!start) return "Not set";
  const parsed = new Date(start);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return start;
  return parsed.toLocaleDateString();
});

const programLengthLabel = computed(() => {
  const length = primaryProgram.value?.length;
  if (!length) return "Not set";
  return `${length} day${length === 1 ? "" : "s"}`;
});

const programEndLabel = computed(() => {
  const start = primaryProgram.value?.startDate;
  const length = primaryProgram.value?.length;
  if (!start || !length) return "Not set";
  const parsed = new Date(start);
  const time = parsed.getTime();
  if (Number.isNaN(time)) return "Not set";
  parsed.setDate(parsed.getDate() + length - 1);
  return parsed.toLocaleDateString();
});

const personalInfo = computed(() => {
  const current = client.value || {};
  const weight = current.weight;
  const formattedWeight =
    typeof weight === "number"
      ? `${weight} lbs`
      : weight || "Not provided";

  return {
    age: current.age ?? "Not provided",
    gender: current.gender ?? "Not provided",
    weight: formattedWeight,
    state: current.state ?? "Not provided",
  };
});

const contactInfo = computed(() => {
  const current = client.value || {};
  return {
    email: current.email || "Not provided",
    phone: current.phone || "Not provided",
  };
});

const clientInitials = computed(() => {
  const name = (client.value?.name || "").trim();
  if (!name) return "N/A";
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return initials || "N/A";
});

const goalList = computed(() => {
  const goals = client.value?.goals;
  if (Array.isArray(goals)) return goals.length ? goals : [];
  if (typeof goals === "string" && goals.trim().length > 0) {
    return goals.split("\n").map((goal) => goal.trim()).filter(Boolean);
  }
  return [];
});

const editDialogTitle = computed(() => {
  switch (editSection.value) {
    case "status":
      return "Edit Status";
    case "program":
      return "Edit Program Details";
    case "personal":
      return "Edit Personal Information";
    case "contact":
      return "Edit Contact Information";
    case "goals":
      return "Edit Goals";
    default:
      return "Edit Client";
  }
});

const editProgramEndPreview = computed(() => {
  if (editSection.value !== "program") return "";
  const start = editModel.value.startDate;
  const length = Number(editModel.value.length);
  if (!start || Number.isNaN(new Date(start).getTime()) || !length) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + (Number.isInteger(length) ? length - 1 : 0));
  return Number.isNaN(end.getTime()) ? "" : toLocalISODate(end);
});

function toLocalISODate(date) {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return "";
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createMacrosTemplate() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function ensureMacros(macros = {}) {
  return {
    calories: Number.isFinite(macros.calories) ? macros.calories : 0,
    protein: Number.isFinite(macros.protein) ? macros.protein : 0,
    carbs: Number.isFinite(macros.carbs) ? macros.carbs : 0,
    fat: Number.isFinite(macros.fat) ? macros.fat : 0,
  };
}

function buildProgramDays(startIso, length, existingDays = []) {
  const startDate = new Date(startIso);
  if (Number.isNaN(startDate.getTime()) || !Number.isInteger(length) || length <= 0) {
    return existingDays.slice();
  }

  const map = new Map(
    existingDays.map((day) => [day.date, day])
  );

  const days = [];
  for (let i = 0; i < length; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const iso = toLocalISODate(current);
    const existing = map.get(iso);
    if (existing) {
      days.push({
        date: iso,
        meals: Array.isArray(existing.meals) ? existing.meals : [],
        macros: ensureMacros(existing.macros),
        macrosSource: existing.macrosSource || "auto",
      });
    } else {
      days.push({
        date: iso,
        meals: [],
        macros: createMacrosTemplate(),
        macrosSource: "auto",
      });
    }
  }
  return days;
}

async function openEditDialog(section) {
  if (!client.value) return;
  editSection.value = section;

  if (section === "status") {
    editModel.value = {
      status: client.value.status || "Pending",
      lastActive: client.value.last_active || toLocalISODate(new Date()),
    };
  } else if (section === "program") {
    editModel.value = {
      startDate: primaryProgram.value?.startDate || toLocalISODate(new Date()),
      length: primaryProgram.value?.length || 28,
    };
  } else if (section === "personal") {
    editModel.value = {
      age: client.value.age ?? "",
      gender: client.value.gender ?? "",
      weight: client.value.weight ?? "",
      state: client.value.state ?? "",
    };
  } else if (section === "contact") {
    editModel.value = {
      email: client.value.email ?? "",
      phone: client.value.phone ?? "",
    };
  } else if (section === "goals") {
    const goals = Array.isArray(client.value.goals)
      ? [...client.value.goals]
      : typeof client.value.goals === "string" && client.value.goals.trim()
      ? client.value.goals.split(/\r?\n/).map((g) => g.trim())
      : [];
    if (!goals.length) goals.push("");
    editModel.value = { goals };
  } else {
    editModel.value = {};
  }

  editDialog.value = true;
  await nextTick();
  editForm.value?.resetValidation?.();
}

function closeEditDialog() {
  editDialog.value = false;
  editSection.value = null;
  editModel.value = {};
}

function addGoalField() {
  if (!Array.isArray(editModel.value.goals)) {
    editModel.value.goals = [""];
  } else {
    editModel.value.goals.push("");
  }
}

function removeGoalField(index) {
  if (!Array.isArray(editModel.value.goals)) return;
  if (editModel.value.goals.length <= 1) {
    editModel.value.goals[0] = "";
    return;
  }
  editModel.value.goals.splice(index, 1);
}

async function saveEdit() {
  const validation = await editForm.value?.validate?.();
  if (validation && !validation.valid) return;
  if (!client.value) return;

  const clientIndex = clients.value.findIndex((c) => c.id === client.value.id);
  if (clientIndex === -1) return;

  const target = clients.value[clientIndex];

  switch (editSection.value) {
    case "status": {
      target.status = editModel.value.status || target.status;
      target.last_active = editModel.value.lastActive || target.last_active || toLocalISODate(new Date());
      break;
    }
    case "program": {
      const startIso = editModel.value.startDate;
      const length = Number(editModel.value.length);
      if (!startIso || !Number.isInteger(length) || length <= 0) break;

      if (!Array.isArray(target.programs)) {
        target.programs = [];
      }
      const existingProgram = target.programs?.[0] || null;
      const days = buildProgramDays(startIso, length, existingProgram?.days || []);

      if (existingProgram) {
        const updatedProgram = {
          ...existingProgram,
          startDate: startIso,
          length,
          days,
        };
        target.programs.splice(0, 1, updatedProgram);
        dataStore.updateProgram?.(updatedProgram);
      } else {
        const newProgram = {
          id: Date.now(),
          clientId: target.id,
          startDate: startIso,
          length,
          days,
        };
        if (target.programs.length) {
          target.programs.splice(0, 1, newProgram);
        } else {
          target.programs.push(newProgram);
        }
      }
      break;
    }
    case "personal": {
      const ageNum = Number(editModel.value.age);
      target.age =
        editModel.value.age === "" || Number.isNaN(ageNum)
          ? null
          : Math.max(0, ageNum);

      const weightNum = Number(editModel.value.weight);
      target.weight =
        editModel.value.weight === "" || Number.isNaN(weightNum)
          ? null
          : Math.max(0, weightNum);

      target.gender = editModel.value.gender || "";
      target.state = editModel.value.state || "";
      break;
    }
    case "contact": {
      target.email = editModel.value.email?.trim() || "";
      target.phone = editModel.value.phone?.trim() || "";
      break;
    }
    case "goals": {
      const goals = Array.isArray(editModel.value.goals)
        ? editModel.value.goals.map((goal) => (goal || "").trim()).filter(Boolean)
        : [];
      target.goals = goals;
      break;
    }
    default:
      break;
  }

  closeEditDialog();
}

function openWeekView(date) {
  selectedDate.value = new Date(date);
  viewMode.value = "week";
}
</script>

<style scoped>
.client-detail-view {
  background-color: #f8f9fb;
  min-height: 100vh;
}

.client-detail-view h1 {
  font-weight: 600;
}

.v-btn-toggle {
  background-color: #f5f5f5;
  border-radius: 8px;
}

.v-btn-toggle .v-btn--active {
  background-color: #1976d2;
  color: white;
}

.client-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  --client-photo-height: 156px;
  --client-photo-width: calc(156px * 2.5 + 24px);
  --client-left-column-width: var(--client-photo-width);
}

.client-header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.client-left-column {
  width: var(--client-left-column-width);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.client-back-btn {
  margin-top: -4px;
}

.client-photo-box {
  width: var(--client-photo-width);
  height: var(--client-photo-height);
  border-radius: 18px;
  background-color: #eef1f5;
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.client-photo-initials {
  font-size: 52px;
  font-weight: 600;
  color: #546e7a;
  letter-spacing: 2px;
}

.client-photo-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.client-name-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
  align-items: flex-start;
}

.client-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.client-status-chip {
  font-weight: 500;
}

.client-about-btn {
  padding-left: 0;
  justify-content: flex-start;
  width: fit-content;
}

.client-header-actions {
  margin-left: auto;
  padding-top: 8px;
}

/* compact week/month toggle */
.client-view-toggle {
  margin-top: 4px;
  width: 240px;
  background: linear-gradient(135deg, #f5f8ff 0%, #eef2fb 100%);
  border-radius: 14px;
  padding: 6px 10px;
  box-shadow: 0 4px 12px rgba(25, 71, 224, 0.1);
}

.client-view-toggle .v-btn-toggle {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 2px;
  width: 100%;
}

.client-view-toggle .v-btn-toggle .v-btn {
  min-width: 0;
  flex: 1 1 50%;
  text-transform: none;
  min-height: 32px;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
}

.client-view-toggle .v-btn-toggle .v-btn--active {
  background-color: #1976d2;
  color: white;
}

@media (max-width: 1100px) {
  .client-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .client-header-actions {
    margin-left: 0;
  }

  .client-view-toggle .v-btn-toggle .v-btn {
    min-width: 0;
  }

  .client-view-toggle {
    margin-left: 0;
    width: 100%;
    max-width: 240px;
  }
}
</style>

<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">My Clients</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddDialog"
          :loading="isLoadingClients"
        >
          Add Client
        </v-btn>
      </v-col>
    </v-row>

    <v-alert
      v-if="lastError"
      type="error"
      class="mb-4"
      border="start"
      variant="tonal"
      :text="lastError"
    />

    <v-card>
      <v-progress-linear v-if="isLoadingClients" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="clients"
          item-key="id"
          class="elevation-1"
          :loading="isLoadingClients"
          loading-text="Loading clients..."
        >
          <template v-slot:item.name="{ item }">
            <router-link
              :to="`/clients/${item.id}`"
              class="text-primary font-weight-bold text-decoration-none"
            >
              {{ item.name }}
            </router-link>
          </template>

          <template v-slot:item.goals="{ item }">
            <span>{{ (item.goals || []).join(", ") }}</span>
          </template>

          <template v-slot:item.dob="{ item }">
            {{ formatDate(item.dob) }}
          </template>

          <template v-slot:item.last_active="{ item }">
            {{ formatDate(item.last_active) }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editClient(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteClient(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogBasic" max-width="540px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formStep1">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Client Name*"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.email"
                    label="Email*"
                    :rules="[rules.required, rules.email]"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.notes"
                    label="Notes"
                    rows="2"
                    auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
            <small>*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog" :disabled="isLoadingClients">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="openDetailsDialog">
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDetails" max-width="620px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }} · About</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formStep2">
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.status"
                    :items="statusOptions"
                    label="Status"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.last_active"
                    label="Last Active"
                    type="date"
                    hide-details="auto"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <p class="text-subtitle-1 font-weight-medium mb-2">
                Program Details
              </p>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.programStart"
                    label="Start Day*"
                    type="date"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.programLength"
                    label="Length (days)*"
                    type="number"
                    :rules="[rules.required, rules.positiveInt]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="programEndPreview"
                    label="End Day"
                    readonly
                    hide-details="auto"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <p class="text-subtitle-1 font-weight-medium mb-2">
                Personal Information
              </p>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.age"
                    label="Age"
                    type="number"
                    :rules="[rules.numberOptional]"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.gender"
                    :items="genderOptions"
                    label="Gender"
                    hide-details="auto"
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.weight"
                    label="Weight (lbs)"
                    type="number"
                    :rules="[rules.numberOptional]"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.state"
                    :items="stateOptions"
                    label="State"
                    hide-details="auto"
                    clearable
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <p class="text-subtitle-1 font-weight-medium mb-2">
                Goals
              </p>
              <v-row>
                <v-col
                  v-for="(goal, index) in editedItem.goals"
                  :key="`goal-${index}`"
                  cols="12"
                >
                  <v-text-field
                    v-model="editedItem.goals[index]"
                    :label="`Goal ${index + 1}`"
                    hide-details="auto"
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
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="backToBasicDialog">
            Back
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="saveClient">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="text-h5">
          Are you sure you want to delete this client?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete" :disabled="isLoadingClients">
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="deleteClientConfirm"
            :loading="isLoadingClients"
          >
            OK
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

// --- Get Data from the Store ---
const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

// --- Helpers ---
function toLocalISODate(date) {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) return "";
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createEmptyMacros() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function createDefaultProgram(clientId, options = {}) {
  const baseDate =
    options.startDate instanceof Date
      ? options.startDate
      : options.startDate
      ? new Date(options.startDate)
      : new Date();

  const start = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const length = Number.isInteger(options.length)
    ? options.length
    : Math.max(1, Number(options.length) || 28);
  const days = [];

  for (let i = 0; i < length; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push({
      date: toLocalISODate(day),
      meals: [],
      macros: createEmptyMacros(),
      macrosSource: "auto",
    });
  }

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    clientId,
    startDate: toLocalISODate(start),
    length,
    days,
  };
}

function generateClientId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function cloneClientForEdit(client) {
  const nowIso = toLocalISODate(new Date());
  const base = client ? JSON.parse(JSON.stringify(client)) : {};
  base.id = base.id ?? generateClientId();
  base.name = base.name ?? "";
  base.email = base.email ?? "";
  base.status = base.status ?? "Pending";
  base.last_active = base.last_active ?? nowIso;
  base.age = base.age ?? null;
  base.gender = base.gender ?? "";
  base.weight = base.weight ?? null;
  base.state = base.state ?? "";
  if (Array.isArray(base.goals)) {
    base.goals = base.goals.map((goal) => String(goal ?? ""));
  } else if (typeof base.goals === "string") {
    base.goals = base.goals
      .split(/\r?\n/)
      .map((goal) => goal.trim())
      .filter(Boolean);
  } else {
    base.goals = [];
  }
  if (!base.goals.length) base.goals = [""];

  const programStart =
    base.programStart ?? base.programs?.[0]?.startDate ?? nowIso;
  const programLength =
    base.programLength ?? base.programs?.[0]?.length ?? 28;

  const primaryProgram =
    base.programs?.[0] && Array.isArray(base.programs[0].days)
      ? base.programs[0]
      : createDefaultProgram(base.id, {
          startDate: programStart,
          length: programLength,
        });

  primaryProgram.clientId = base.id;

  base.programs = [primaryProgram];
  base.programStart = programStart;
  base.programLength = programLength;

  return base;
}

function normalizeClientPayload(editorState, { newClient = false } = {}) {
  const copy = JSON.parse(JSON.stringify(editorState));

  copy.name = (copy.name || "").trim();
  copy.email = (copy.email || "").trim();
  copy.status = copy.status || "Pending";
  copy.last_active = copy.last_active || toLocalISODate(new Date());

  const ageNum = Number(copy.age);
  copy.age =
    copy.age === "" || Number.isNaN(ageNum) ? null : Math.max(0, ageNum);

  const weightNum = Number(copy.weight);
  copy.weight =
    copy.weight === "" || Number.isNaN(weightNum)
      ? null
      : Math.max(0, weightNum);

  copy.goals = Array.isArray(copy.goals)
    ? copy.goals.map((goal) => (goal ?? "").toString().trim()).filter(Boolean)
    : [];

  const start = copy.programStart || toLocalISODate(new Date());
  const lengthRaw = Number(copy.programLength);
  const length = Number.isInteger(lengthRaw) && lengthRaw > 0 ? lengthRaw : 28;
  delete copy.programStart;
  delete copy.programLength;

  let primaryProgram = copy.programs?.[0];
  if (newClient || !primaryProgram) {
    primaryProgram = createDefaultProgram(copy.id, { startDate: start, length });
  } else {
    primaryProgram.startDate = start;
    primaryProgram.length = length;
    primaryProgram.clientId = copy.id;
    if (!Array.isArray(primaryProgram.days) || !primaryProgram.days.length) {
      primaryProgram.days = createDefaultProgram(copy.id, {
        startDate: start,
        length,
      }).days;
    }
  }
  copy.programs = [primaryProgram];

  return copy;
}

// --- State Management ---
const dialogBasic = ref(false);
const dialogDetails = ref(false);
const dialogDelete = ref(false);
const formStep1 = ref(null);
const formStep2 = ref(null);
const editedIndex = ref(-1);

const editedItem = ref(cloneClientForEdit());

const formTitle = computed(() =>
  editedItem.value?.id ? "Edit Client" : "Add New Client"
);

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

const programEndPreview = computed(() => {
  const start = editedItem.value.programStart;
  const length = Number(editedItem.value.programLength);
  if (!start || Number.isNaN(new Date(start).getTime()) || !length) {
    return "Not set";
  }
  const end = new Date(start);
  end.setDate(end.getDate() + (Number.isFinite(length) ? length - 1 : 0));
  return Number.isNaN(end.getTime()) ? "Not set" : toLocalISODate(end);
});

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || "Required.",
  email: (value) => /.+@.+\..+/.test(value) || "Invalid e-mail.",
  positiveInt: (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0 || "Must be a positive number.";
  },
  numberOptional: (value) => {
    if (value === "" || value === null || value === undefined) return true;
    return !Number.isNaN(Number(value)) || "Must be a number.";
  },
};

const headers = ref([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email" },
  { title: "Status", key: "status" },
  { title: "DOB", key: "dob" },
  { title: "Last Active", key: "last_active" },
  { title: "Actions", key: "actions", sortable: false },
]);

// --- Component Methods ---
function resetForms() {
  formStep1.value?.resetValidation();
  formStep2.value?.resetValidation();
}

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = cloneClientForEdit();
  dialogBasic.value = true;
  dialogDetails.value = false;
  nextTick(() => {
    resetForms();
  });
}

function editClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = cloneClientForEdit(item);
  dialogBasic.value = true;
  dialogDetails.value = false;
  nextTick(() => {
    resetForms();
  });
}

function deleteClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = cloneClientForEdit(item);
  dialogDelete.value = true;
}

function closeDialog() {
  dialogBasic.value = false;
  dialogDetails.value = false;
  nextTick(() => {
    resetForms();
    editedItem.value = cloneClientForEdit();
    editedIndex.value = -1;
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = cloneClientForEdit();
    editedIndex.value = -1;
  });
}

async function openDetailsDialog() {
  const result = await formStep1.value?.validate();
  if (result && !result.valid) return;

  dialogBasic.value = false;
  dialogDetails.value = true;
  await nextTick();
  formStep2.value?.resetValidation();
}

function backToBasicDialog() {
  dialogDetails.value = false;
  dialogBasic.value = true;
  nextTick(() => {
    formStep2.value?.resetValidation();
  });
}

function addGoalField() {
  if (!Array.isArray(editedItem.value.goals)) {
    editedItem.value.goals = [""];
  }
  editedItem.value.goals.push("");
}

async function saveClient() {
  const first = await formStep1.value?.validate();
  if (first && !first.valid) {
    dialogDetails.value = false;
    dialogBasic.value = true;
    return;
  }

  const second = await formStep2.value?.validate();
  if (second && !second.valid) {
    dialogBasic.value = false;
    dialogDetails.value = true;
    return;
  }

  const normalized = normalizeClientPayload(editedItem.value, {
    newClient: editedIndex.value === -1,
  });

  if (editedIndex.value > -1) {
    Object.assign(clients.value[editedIndex.value], normalized);
  } else {
    clients.value.unshift(normalized);
  }
}

async function deleteClientConfirm() {
  if (!editedItem.value?.id) return;
  try {
    await dataStore.deleteClient(editedItem.value.id);
  } catch (error) {
    console.error("Unable to delete client", error);
  }
  closeDelete();
}
</script>

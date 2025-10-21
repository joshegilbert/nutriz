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

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Client Name*"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.goals"
                    label="Goals (comma separated)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.phone"
                    label="Phone"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.dob"
                    label="Date of Birth*"
                    type="date"
                    :rules="[rules.required]"
                  ></v-text-field>
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
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="saveClient"
            :loading="isLoadingClients"
          >
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
  const length = options.length ?? 28;
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

function buildNewClient() {
  const id = Date.now();
  const todayIso = toLocalISODate(new Date());
  return {
    id,
    name: "",
    email: "",
    status: "Pending",
    last_active: todayIso,
    age: null,
    gender: "",
    weight: null,
    state: "",
    goals: [],
    programs: [createDefaultProgram(id, { startDate: todayIso })],
  };
}

const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedItem = ref(null);

const editedItem = ref(buildNewClient());

const formTitle = computed(() =>
  editedItem.value?.id ? "Edit Client" : "Add New Client"
);

const rules = {
  required: (value) => !!value || "Required.",
};

const headers = ref([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email" },
  { title: "Status", key: "status" },
  { title: "DOB", key: "dob" },
  { title: "Last Active", key: "last_active" },
  { title: "Actions", key: "actions", sortable: false },
]);

onMounted(() => {
  dataStore.fetchClients().catch(() => {
    /* handled via lastError */
  });
});

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = buildNewClient();
  dialog.value = true;
}

function editClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = JSON.parse(JSON.stringify(item));
  dialog.value = true;
}

function deleteClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = JSON.parse(JSON.stringify(item));
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = buildNewClient();
    editedIndex.value = -1;
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = buildNewClient();
    editedIndex.value = -1;
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

async function saveClient() {
  const { valid } = await form.value.validate();
  if (!valid || !editedItem.value) return;

  if (editedIndex.value > -1) {
    Object.assign(clients.value[editedIndex.value], editedItem.value);
  } else {
    clients.value.unshift(JSON.parse(JSON.stringify(editedItem.value)));
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

<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">My Clients</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Client
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="dataStore.errors.clients" type="error" class="mb-4">
      {{ dataStore.errors.clients }}
    </v-alert>

    <v-card>
      <v-progress-linear v-if="dataStore.loading.clients" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="clients"
          item-key="id"
          class="elevation-1"
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
                    v-model="editedItem.dob"
                    label="Date of Birth"
                    type="date"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.contact.email"
                    label="Email"
                    type="email"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.contact.phone"
                    label="Phone"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.goals"
                    label="Goals (comma separated)"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.notes"
                    label="Notes"
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
            <small>*indicates required field</small>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn color="blue-darken-1" variant="text" :loading="saving" @click="saveClient">
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
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            :loading="saving"
            @click="deleteClientConfirm"
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
import { computed, onMounted, ref } from "vue";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const dataStore = useDataStore();
const { clients } = storeToRefs(dataStore);

const clone = (value) => JSON.parse(JSON.stringify(value));

const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);
const saving = ref(false);

const defaultItem = {
  id: null,
  name: "",
  dob: "",
  contact: { email: "", phone: "" },
  goals: "",
  notes: "",
};
const editedItem = ref(clone(defaultItem));

const formTitle = computed(() => {
  return editedIndex.value === -1 ? "Add New Client" : "Edit Client";
});

const rules = {
  required: (value) => !!value || "Required.",
};

const headers = ref([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "contact.email" },
  { title: "Phone", key: "contact.phone" },
  { title: "Goals", key: "goals", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

onMounted(() => {
  dataStore.fetchClients().catch(() => {});
});

function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = clone(defaultItem);
  dialog.value = true;
}

function editClient(item) {
  editedIndex.value = clients.value.findIndex((c) => c.id === item.id);
  editedItem.value = {
    id: item.id,
    name: item.name,
    dob: item.dob ? item.dob.substring(0, 10) : "",
    contact: {
      email: item.contact?.email || "",
      phone: item.contact?.phone || "",
    },
    goals: (item.goals || []).join(", "),
    notes: item.notes || "",
  };
  dialog.value = true;
}

function deleteClient(item) {
  editedIndex.value = clients.value.findIndex((c) => c.id === item.id);
  editedItem.value = { ...item };
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = clone(defaultItem);
  editedIndex.value = -1;
}

function closeDelete() {
  dialogDelete.value = false;
  editedItem.value = clone(defaultItem);
  editedIndex.value = -1;
}

function toPayload(item) {
  return {
    name: item.name,
    dob: item.dob || undefined,
    contact: {
      email: item.contact.email || undefined,
      phone: item.contact.phone || undefined,
    },
    goals: item.goals
      ? item.goals
          .split(",")
          .map((goal) => goal.trim())
          .filter(Boolean)
      : [],
    notes: item.notes,
  };
}

async function saveClient() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = toPayload(editedItem.value);
    if (editedIndex.value > -1 && editedItem.value.id) {
      await dataStore.updateClient(editedItem.value.id, payload);
    } else {
      await dataStore.createClient(payload);
    }
    closeDialog();
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function deleteClientConfirm() {
  if (editedItem.value?.id) {
    saving.value = true;
    try {
      await dataStore.deleteClient(editedItem.value.id);
      closeDelete();
    } catch (error) {
      console.error(error);
    } finally {
      saving.value = false;
    }
  }
}
</script>

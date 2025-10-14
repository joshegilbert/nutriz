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

          <template v-slot:item.status="{ item }">
            <v-chip :color="item.status === 'Active' ? 'green' : 'orange'" dark>
              {{ item.status }}
            </v-chip>
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

    <v-dialog v-model="dialog" max-width="500px">
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
                    v-model="editedItem.email"
                    label="Email*"
                    :rules="[rules.required, rules.email]"
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

const dataStore = useDataStore();
const { clients, isLoadingClients, lastError } = storeToRefs(dataStore);

const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedItem = ref(null);

const defaultItem = {
  id: null,
  name: "",
  email: "",
  phone: "",
  dob: "",
  notes: "",
  status: "Active",
  last_active: new Date().toISOString().slice(0, 10),
};

const formTitle = computed(() =>
  editedItem.value?.id ? "Edit Client" : "Add New Client"
);

const rules = {
  required: (value) => !!value || "Required.",
  email: (value) => /.+@.+\..+/.test(value) || "Invalid e-mail.",
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
  editedItem.value = { ...defaultItem };
  dialog.value = true;
}

function editClient(item) {
  editedItem.value = { ...item };
  dialog.value = true;
}

function deleteClient(item) {
  editedItem.value = { ...item };
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = null;
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = null;
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

  try {
    if (editedItem.value.id) {
      await dataStore.updateClient(editedItem.value.id, editedItem.value);
    } else {
      await dataStore.createClient(editedItem.value);
    }
    closeDialog();
  } catch (error) {
    console.error("Unable to save client", error);
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
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

    <v-card>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="clients"
          item-key="id"
          class="elevation-1"
        >
          <template v-slot:item.status="{ item }">
            <v-chip :color="item.status === 'Active' ? 'green' : 'orange'" dark>
              {{ item.status }}
            </v-chip>
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
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.email"
                    label="Email*"
                    :rules="[rules.required, rules.email]"
                  ></v-text-field>
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
          <v-btn color="blue-darken-1" variant="text" @click="closeDelete">
            Cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
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
import { ref, computed, nextTick } from "vue";
import { useDataStore } from "@/stores/useDataStore";

// --- Get Data from the Store ---
const { clients } = useDataStore();

// --- State Management ---
const dialog = ref(false);
const dialogDelete = ref(false);
const form = ref(null);
const editedIndex = ref(-1);

const defaultItem = {
  id: null,
  name: "",
  email: "",
  status: "Pending",
  last_active: new Date().toISOString().slice(0, 10),
};
const editedItem = ref({ ...defaultItem });

const formTitle = computed(() => {
  return editedIndex.value === -1 ? "Add New Client" : "Edit Client";
});

// --- Validation Rules ---
const rules = {
  required: (value) => !!value || "Required.",
  email: (value) => /.+@.+\..+/.test(value) || "Invalid e-mail.",
};

// --- Table Headers ---
const headers = ref([
  { title: "Name", key: "name", align: "start" },
  { title: "Email", key: "email" },
  { title: "Status", key: "status" },
  { title: "Last Active", key: "last_active" },
  { title: "Actions", key: "actions", sortable: false },
]);

// --- Component Methods ---
function openAddDialog() {
  editedIndex.value = -1;
  editedItem.value = { ...defaultItem, id: Date.now() };
  dialog.value = true;
}

function editClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = { ...item };
  dialog.value = true;
}

function deleteClient(item) {
  editedIndex.value = clients.value.indexOf(item);
  editedItem.value = { ...item };
  dialogDelete.value = true;
}

function closeDialog() {
  dialog.value = false;
  nextTick(() => {
    editedItem.value = { ...defaultItem };
    editedIndex.value = -1;
  });
}

function closeDelete() {
  dialogDelete.value = false;
  nextTick(() => {
    editedItem.value = { ...defaultItem };
    editedIndex.value = -1;
  });
}

async function saveClient() {
  const { valid } = await form.value.validate();
  if (!valid) return;

  if (editedIndex.value > -1) {
    Object.assign(clients.value[editedIndex.value], editedItem.value);
  } else {
    clients.value.unshift(editedItem.value);
  }
  closeDialog();
}

function deleteClientConfirm() {
  clients.value.splice(editedIndex.value, 1);
  closeDelete();
}
</script>

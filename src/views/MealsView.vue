<template>
  <v-container>
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Meal Programs</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">Create Program</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="dataStore.errors.programs" type="error" class="mb-4">
      {{ dataStore.errors.programs }}
    </v-alert>

    <v-card>
      <v-progress-linear v-if="dataStore.loading.programs" indeterminate color="primary"></v-progress-linear>
      <v-card-text>
        <v-data-table :headers="headers" :items="programRows" item-key="id">
          <template v-slot:item.macros="{ item }">
            Cal: {{ item.totalMacros.calories.toFixed(0) }} /
            Prot: {{ item.totalMacros.protein.toFixed(0) }}g /
            Carb: {{ item.totalMacros.carbs.toFixed(0) }}g /
            Fat: {{ item.totalMacros.fat.toFixed(0) }}g
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon variant="text" :to="{ name: 'PlanSummary', params: { clientId: item.clientId }, query: { programId: item.id } }">
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn icon variant="text" color="grey" @click="deleteProgram(item)">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Create Program</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-select
              v-model="formState.clientId"
              :items="clientOptions"
              item-title="label"
              item-value="id"
              label="Client*"
              :rules="[rules.required]"
            ></v-select>
            <v-text-field v-model="formState.name" label="Program Name*" :rules="[rules.required]"></v-text-field>
            <v-text-field v-model="formState.startDate" type="date" label="Start Date*" :rules="[rules.required]"></v-text-field>
            <v-text-field v-model.number="formState.length" type="number" label="Length (days)*" :rules="[rules.required]"></v-text-field>
            <v-textarea v-model="formState.notes" label="Notes" rows="3"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue-darken-1" variant="text" :loading="saving" @click="createProgram">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/stores/useDataStore";

const dataStore = useDataStore();
const { programs, clients } = storeToRefs(dataStore);

const dialog = ref(false);
const form = ref(null);
const saving = ref(false);

const headers = ref([
  { title: "Program", key: "name", align: "start" },
  { title: "Client", key: "clientName" },
  { title: "Start", key: "startDate" },
  { title: "Length", key: "length" },
  { title: "Macros", key: "macros", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
]);

const formState = ref({
  clientId: null,
  name: "",
  startDate: new Date().toISOString().substring(0, 10),
  length: 7,
  notes: "",
});

const rules = {
  required: (value) => !!value || "Required.",
};

onMounted(() => {
  Promise.all([dataStore.fetchClients(), dataStore.fetchPrograms()]).catch(() => {});
});

const clientOptions = computed(() =>
  clients.value.map((client) => ({ id: client.id, label: client.name }))
);

const clientMap = computed(() => {
  const map = new Map();
  clients.value.forEach((client) => map.set(client.id, client.name));
  return map;
});

const programRows = computed(() =>
  programs.value.map((program) => ({
    ...program,
    clientName: clientMap.value.get(program.clientId) || "Unknown",
    totalMacros: program.days?.reduce(
      (totals, day) => {
        if (!day?.macros) return totals;
        totals.calories += day.macros.calories || 0;
        totals.protein += day.macros.protein || 0;
        totals.carbs += day.macros.carbs || 0;
        totals.fat += day.macros.fat || 0;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  }))
);

function openAddDialog() {
  formState.value = {
    clientId: null,
    name: "",
    startDate: new Date().toISOString().substring(0, 10),
    length: 7,
    notes: "",
  };
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
}

async function createProgram() {
  const { valid } = await form.value.validate();
  if (!valid) return;
  saving.value = true;
  try {
    await dataStore.createProgram({
      clientId: formState.value.clientId,
      name: formState.value.name,
      startDate: formState.value.startDate,
      length: formState.value.length,
      notes: formState.value.notes,
    });
    dialog.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}

async function deleteProgram(program) {
  if (!program?.id) return;
  if (!window.confirm("Delete this program?")) return;
  saving.value = true;
  try {
    await dataStore.deleteProgram(program.id);
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}
</script>

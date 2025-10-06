<template>
  <v-dialog v-model="localModel" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center pa-4">
        <span class="text-h6 font-weight-medium">Edit Item</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="$emit('cancel')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <v-text-field
            v-model="editableItem.name"
            label="Name"
            variant="outlined"
            density="compact"
            class="mb-3"
            readonly
          ></v-text-field>

          <v-text-field
            v-model.number="editableItem.amount"
            label="Amount"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            class="mb-3"
          ></v-text-field>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="editableItem.macros.calories"
                label="Calories"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editableItem.macros.protein"
                label="Protein (g)"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editableItem.macros.carbs"
                label="Carbs (g)"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editableItem.macros.fat"
                label="Fat (g)"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveChanges">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  item: { type: Object, required: true },
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const localModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const editableItem = ref(null);

watch(() => props.item, (newItem) => {
  // Deep copy to prevent modifying the original object directly
  editableItem.value = JSON.parse(JSON.stringify(newItem));
}, { immediate: true });

function saveChanges() {
  emit('save', editableItem.value);
}
</script>

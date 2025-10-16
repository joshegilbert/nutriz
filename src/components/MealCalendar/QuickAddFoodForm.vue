<template>
  <div class="quick-add-form pa-4">
    <h3 class="text-h6 font-weight-medium mb-3">Create New Food</h3>
    <v-form @submit.prevent="submitForm">
      <v-text-field
        v-model="food.name"
        label="Food Name"
        variant="outlined"
        density="compact"
        class="mb-3"
        required
      ></v-text-field>
      <v-row>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="food.macros.calories"
            label="Calories"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="food.macros.protein"
            label="Protein (g)"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="food.macros.carbs"
            label="Carbs (g)"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="food.macros.fat"
            label="Fat (g)"
            type="number"
            min="0"
            variant="outlined"
            density="compact"
            required
          ></v-text-field>
        </v-col>
      </v-row>
      <v-card-actions class="pa-0 mt-3">
        <v-spacer></v-spacer>
        <v-btn text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn color="primary" variant="flat" type="submit">Save Food</v-btn>
      </v-card-actions>
    </v-form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['save', 'cancel']);

const food = ref({
  name: '',
  macros: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
});

const submitForm = () => {
  // Basic validation
  if (food.value.name.trim()) {
    emit('save', { ...food.value, id: Date.now() }); // Add a temporary ID
    // Reset form
    food.value = {
      name: '',
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };
  }
};
</script>

<style scoped>
.quick-add-form {
  background-color: #f7f8fc;
}
</style>

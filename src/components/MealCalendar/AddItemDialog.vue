<template>
  <!-- ✅ Use computed getter/setter for v-model compatibility -->
  <v-dialog v-model="localModel" max-width="500">
    <v-card>
      <v-card-title>
        Add Item — {{ mealTime }}
      </v-card-title>

      <v-card-text>
        <p class="text-caption text-grey">
          (Placeholder dialog for adding items — later we’ll add food search.)
        </p>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="localModel = false">Cancel</v-btn>
        <v-btn color="primary" @click="addFakeItem">Add Sample</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  mealData: { type: Object, required: true },
  foods: { type: Array, required: true },
  meals: { type: Array, required: true },
  recipes: { type: Array, required: true },
  mealTime: { type: String, required: true },
});

const emit = defineEmits(["update:modelValue", "add"]);

// ✅ Computed proxy for v-model (this fixes your error)
const localModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

function addFakeItem() {
  const newItem = {
    id: Date.now(),
    type: "food",
    sourceId: 101,
    amount: 1,
    macros: { calories: 100, protein: 10, carbs: 10, fat: 2 },
    macrosSource: "auto",
  };
  emit("add", newItem);
  emit("update:modelValue", false);
}
</script>

<template>
  <v-card 
    class="mb-3" 
    :variant="isGroup ? 'outlined' : 'flat'" 
    :style="isGroup ? 'background-color: #fafafa;' : ''"
  >
    <v-card-text>
      <v-row dense align="center">
        <!-- Item Name -->
        <v-col cols="12" :sm="isTopLevel ? 4 : 6">
          <p class="font-weight-bold">{{ itemName }}</p>
          <p v-if="item.type && isTopLevel" class="text-caption text-grey">{{ item.type }}</p>
        </v-col>

        <!-- Amount -->
        <v-col cols="4" sm="2">
          <v-text-field 
            v-model.number="item.amount" 
            label="Amount" 
            dense 
            hide-details 
            type="number"
            @update:model-value="recalculateMacros"
          />
        </v-col>

        <!-- Time -->
        <v-col v-if="isTopLevel" cols="4" sm="2">
          <v-text-field v-model="item.time" label="Time" dense hide-details />
        </v-col>

        <!-- Actions + Quick Macros -->
        <v-col :sm="isTopLevel ? 4 : 2" class="text-right" v-if="item.macros">
          <!-- Expand toggle -->
          <v-btn 
            :icon="item.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" 
            variant="text" 
            @click="item.expanded = !item.expanded" 
            :title="isGroup ? 'Edit Contents' : 'Override Macros'"
          />

          <!-- Quick calories override -->
          <v-text-field 
            v-model.number="item.macros.calories" 
            label="Cal" 
            hide-details
            density="compact"
            type="number"
            @change="markOverridden('calories')" 
          />

          <!-- Reset if overridden -->
          <v-btn v-if="item.macrosSource === 'overridden'" @click="$emit('reset')" size="small">
            Reset
          </v-btn>

          <!-- Copy + Delete -->
          <v-btn 
            v-if="isTopLevel" 
            icon="mdi-content-copy" 
            variant="text" 
            @click="emit('copy', item)" 
            title="Copy Item"
            size="small"
          />
          <v-btn 
            icon="mdi-delete" 
            variant="text" 
            color="grey" 
            @click="emit('remove')"
            size="small"
          />
        </v-col>
      </v-row>

      <!-- Notes -->
      <v-text-field 
        v-if="isTopLevel" 
        v-model="item.notes" 
        label="Notes" 
        dense 
        hide-details 
        variant="underlined" 
        class="mt-1"
      />

      <!-- Expanded view: group components -->
      <v-expand-transition>
        <div v-if="item.expanded && isGroup">
          <v-divider class="my-3" />
          <p class="text-caption">Client-Specific Ingredients</p>
          <div v-for="(subComponent, index) in item.components" :key="subComponent.id || index" class="mt-2 ml-2">
            <plan-item-card :item="subComponent" @remove="removeSubComponent(index)" />
          </div>
          <v-card-actions class="pa-0 pt-2">
            <v-btn size="small" prepend-icon="mdi-plus" @click="addSubComponent">Add Ingredient</v-btn>
          </v-card-actions>
        </div>
      </v-expand-transition>

      <!-- Expanded view: food macro overrides -->
      <v-expand-transition>
        <div v-if="item.expanded && item.type === 'food' && item.macros">
          <v-divider class="my-3" />
          <p class="text-caption">Override Macros</p>
          <v-row dense>
            <v-col>
              <v-text-field v-model.number="item.macros.calories" label="Calories" density="compact" type="number" />
            </v-col>
            <v-col>
              <v-text-field v-model.number="item.macros.protein" label="Protein" density="compact" type="number" suffix="g" />
            </v-col>
            <v-col>
              <v-text-field v-model.number="item.macros.carbs" label="Carbs" density="compact" type="number" suffix="g" />
            </v-col>
            <v-col>
              <v-text-field v-model.number="item.macros.fat" label="Fat" density="compact" type="number" suffix="g" />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useDataStore } from '@/stores/useDataStore';

const props = defineProps({
  item: { type: Object, required: true },
  isTopLevel: { type: Boolean, default: false }
});

const emit = defineEmits(['remove', 'copy']);
const dataStore = useDataStore();
const { foods, meals, recipes } = dataStore;

const isGroup = computed(() => props.item.type === 'meal' || props.item.type === 'recipe');

const itemName = computed(() => {
  let sourceDB;
  if (props.item.type === 'food') sourceDB = foods;
  else if (props.item.type === 'meal') sourceDB = meals;
  else if (props.item.type === 'recipe') sourceDB = recipes;
  
  const sourceItem = sourceDB?.find(dbItem => dbItem.id === props.item.sourceId);
  return sourceItem ? sourceItem.name : 'Unknown Item';
});

// ✅ Ensure macros always exists
function ensureMacros() {
  if (!props.item.macros) {
    props.item.macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
}
ensureMacros(); // run immediately
watch(() => props.item, ensureMacros, { deep: true });

function recalculateMacros() {
  if (props.item.expanded) return; 
  
  const food = foods.find(f => f.id === props.item.sourceId);
  if (!food) return;

  const multiplier = props.item.amount || 0;
  props.item.macros.calories = (food.macrosPerServing.calories || 0) * multiplier;
  props.item.macros.protein = (food.macrosPerServing.protein || 0) * multiplier;
  props.item.macros.carbs = (food.macrosPerServing.carbs || 0) * multiplier;
  props.item.macros.fat = (food.macrosPerServing.fat || 0) * multiplier;
}

function removeSubComponent(index) {
  if (props.item.components) {
    props.item.components.splice(index, 1);
  }
}

function markOverridden() {
  props.item.macrosSource = "overridden";
}

function addSubComponent() {
  if (props.item.components) {
    props.item.components.push({
      id: Date.now(),
      type: 'food',
      sourceId: null,
      amount: 1,
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      expanded: true,
    });
  }
}
</script>

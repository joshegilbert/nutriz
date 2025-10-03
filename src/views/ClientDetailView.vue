<template>
  <v-container>
    <div v-if="!client">
      <p>Loading client details...</p>
    </div>
    <div v-else>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-4">
            <v-btn to="/clients" icon="mdi-arrow-left" variant="text" class="mr-2"></v-btn>
            <h1 class="text-h4">{{ client.name }}</h1>
            <v-chip :color="client.status === 'Active' ? 'green' : 'orange'" class="ml-4" size="small">{{ client.status }}</v-chip>
            <v-spacer></v-spacer>
            <v-btn :to="`/clients/${client.id}/plan`" color="secondary" prepend-icon="mdi-printer">View Client Plan</v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-tabs v-model="selectedWeekIndex" bg-color="white" class="mb-4">
            <v-tab v-for="(week, index) in client.program" :key="week.weekNumber" :value="index">
              Week {{ week.weekNumber }}
            </v-tab>
            <v-btn variant="text" @click="addWeek" title="Add New Week"><v-icon>mdi-plus</v-icon></v-btn>
          </v-tabs>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-tabs v-model="selectedDay" bg-color="primary" fixed-tabs>
              <v-tab v-for="day in daysOfWeek" :key="day" :value="day.toLowerCase()">{{ day }}</v-tab>
            </v-tabs>
            <v-window v-model="selectedDay">
              <v-window-item v-for="day in daysOfWeek" :key="day" :value="day.toLowerCase()">
                <v-card-text>
                  <v-card class="mb-6" variant="tonal" color="primary">
                    <v-card-item class="d-flex justify-space-between align-center">
                       <div>
                         <span class="text-h6">Daily Totals</span>
                         <v-chip-group>
                            <v-chip size="small">Cal: {{ dailyTotalMacros.calories.toFixed(0) }}</v-chip>
                            <v-chip size="small">Prot: {{ dailyTotalMacros.protein.toFixed(0) }}g</v-chip>
                            <v-chip size="small">Carb: {{ dailyTotalMacros.carbs.toFixed(0) }}g</v-chip>
                            <v-chip size="small">Fat: {{ dailyTotalMacros.fat.toFixed(0) }}g</v-chip>
                         </v-chip-group>
                       </div>
                       <div>
                          <v-btn @click="copyDay" size="small" variant="text">Copy Day</v-btn>
                          <v-btn @click="pasteDay" size="small" variant="text" :disabled="!clipboard">Paste Day</v-btn>
                       </div>
                    </v-card-item>
                  </v-card>

                  <div v-for="mealTime in mealTimes" :key="mealTime">
                    <div class="d-flex align-center">
                      <h3 class="text-h6">{{ mealTime }}</h3>
                       <div class="text-caption ml-4">
                          (Cal: {{ getMealTimeMacros(mealTime).calories.toFixed(0) }} / 
                          Prot: {{ getMealTimeMacros(mealTime).protein.toFixed(0) }}g)
                       </div>
                      <v-spacer></v-spacer>
                      <v-btn size="small" variant="text" @click="openAddItemDialog(mealTime)">+ Add Item</v-btn>
                    </div>
                    <v-divider class="mb-4"></v-divider>
                    
                    <p v-if="!getItemsForMealTime(mealTime).length" class="text-caption text-center pb-4">No items added.</p>
                    
                    <div v-else>
                        <PlanItemCard 
                          v-for="item in getItemsForMealTime(mealTime)" 
                          :key="item.id" 
                          :item="item" 
                          is-top-level
                          @remove="removeItem(item)"
                          @copy="copyItem"
                        />
                    </div>
                  </div>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="dialog.isOpen" max-width="600px">
        <v-card>
            <v-card-title>Add to {{ dialog.mealTime }}</v-card-title>
            <v-card-text>
                 <v-radio-group v-model="itemToAdd.type" inline>
                    <v-radio label="Food" value="food"></v-radio>
                    <v-radio label="Meal" value="meal"></v-radio>
                    <v-radio label="Recipe" value="recipe"></v-radio>
                </v-radio-group>
                <v-autocomplete
                    v-if="itemToAdd.type === 'food'"
                    v-model="itemToAdd.sourceId"
                    :items="foods"
                    :item-title="item => `${item.brand} ${item.name}`"
                    item-value="id"
                    label="Select a Food"
                ></v-autocomplete>
                <v-autocomplete
                    v-if="itemToAdd.type === 'meal'"
                    v-model="itemToAdd.sourceId"
                    :items="meals"
                    item-title="name"
                    item-value="id"
                    label="Select a Meal"
                ></v-autocomplete>
                 <v-autocomplete
                    v-if="itemToAdd.type === 'recipe'"
                    v-model="itemToAdd.sourceId"
                    :items="recipes"
                    item-title="name"
                    item-value="id"
                    label="Select a Recipe"
                ></v-autocomplete>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="dialog.isOpen = false">Cancel</v-btn>
                <v-btn color="primary" @click="addItemToPlan">Add</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
     <v-snackbar v-model="snackbar.show" :timeout="2000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "@/stores/useDataStore";
import { storeToRefs } from "pinia";

const PlanItemCard = defineAsyncComponent(() => import('@/components/PlanItemCard.vue'));

const route = useRoute();
const dataStore = useDataStore();
const { clients, foods, meals, recipes } = storeToRefs(dataStore);

const selectedWeekIndex = ref(0);
const selectedDay = ref('monday');
const dialog = ref({ isOpen: false, mealTime: '' });
const itemToAdd = ref({ type: 'food', sourceId: null });
const clipboard = ref(null);
const snackbar = ref({ show: false, text: '' });

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snacks"];

const client = computed(() => clients.value.find(c => c.id === Number(route.params.id)));
const currentWeek = computed(() => client.value?.program[selectedWeekIndex.value]);
const currentDayPlan = computed(() => currentWeek.value?.days[selectedDay.value] || []);

function getMacros(item) {
    const emptyMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!item) return emptyMacros;
    if (item.expanded && item.macros) return item.macros;
    if (item.type === 'food') {
        const food = foods.value.find(f => f.id === item.sourceId);
        if (!food) return emptyMacros;
        const multiplier = item.amount || 0;
        return {
            calories: (food.macrosPerServing.calories || 0) * multiplier,
            protein: (food.macrosPerServing.protein || 0) * multiplier,
            carbs: (food.macrosPerServing.carbs || 0) * multiplier,
            fat: (food.macrosPerServing.fat || 0) * multiplier,
        };
    }
    if ((item.type === 'meal' || item.type === 'recipe') && item.components) {
        const baseMacros = item.components.reduce((acc, comp) => {
            const compMacros = getMacros(comp);
            acc.calories += compMacros.calories;
            acc.protein += compMacros.protein;
            acc.carbs += compMacros.carbs;
            acc.fat += compMacros.fat;
            return acc;
        }, { ...emptyMacros });
        const outerMultiplier = item.amount || 1;
        return {
            calories: baseMacros.calories * outerMultiplier,
            protein: baseMacros.protein * outerMultiplier,
            carbs: baseMacros.carbs * outerMultiplier,
            fat: baseMacros.fat * outerMultiplier,
        };
    }
    return emptyMacros;
}

const dailyTotalMacros = computed(() => {
  return currentDayPlan.value.reduce((totals, item) => {
    const itemMacros = getMacros(item);
    totals.calories += itemMacros.calories;
    totals.protein += itemMacros.protein;
    totals.carbs += itemMacros.carbs;
    totals.fat += itemMacros.fat;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
});

function getItemsForMealTime(mealTime) {
    return currentDayPlan.value.filter(item => item.mealTime === mealTime);
}

function getMealTimeMacros(mealTime) {
    return getItemsForMealTime(mealTime).reduce((totals, item) => {
        const itemMacros = getMacros(item);
        totals.calories += itemMacros.calories;
        totals.protein += itemMacros.protein;
        totals.carbs += itemMacros.carbs;
        totals.fat += itemMacros.fat;
        return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function openAddItemDialog(mealTime) {
    itemToAdd.value = { type: 'food', sourceId: null };
    dialog.value = { isOpen: true, mealTime: mealTime };
}

function addItemToPlan() {
    if (!itemToAdd.value.sourceId || !currentWeek.value) return;
    let sourceItem;
    let sourceDB;
    if (itemToAdd.value.type === 'food') sourceDB = foods.value;
    else if (itemToAdd.value.type === 'meal') sourceDB = meals.value;
    else if (itemToAdd.value.type === 'recipe') sourceDB = recipes.value;
    sourceItem = sourceDB.find(i => i.id === itemToAdd.value.sourceId);

    if (!sourceItem) return;

    const newPlanItem = {
        id: Date.now(),
        type: itemToAdd.value.type,
        sourceId: itemToAdd.value.sourceId,
        mealTime: dialog.value.mealTime,
        time: "",
        amount: 1,
        notes: "",
        expanded: false,
    };

    if (itemToAdd.value.type === 'food') {
        newPlanItem.macros = getMacros(newPlanItem);
    }

    if ((itemToAdd.value.type === 'meal' || itemToAdd.value.type === 'recipe') && sourceItem.components) {
        newPlanItem.components = JSON.parse(JSON.stringify(sourceItem.components)).map(c => {
             const foodComp = {
                ...c,
                id: Date.now() + Math.random(),
                type: 'food',
                sourceId: c.foodId,
                expanded: false,
             };
             foodComp.macros = getMacros(foodComp);
             return foodComp;
        });
    }

    currentWeek.value.days[selectedDay.value].push(newPlanItem);
    dialog.value.isOpen = false;
}

function removeItem(itemToRemove) {
    const dayPlan = currentDayPlan.value;
    const index = dayPlan.findIndex(item => item.id === itemToRemove.id);
    if (index > -1) dayPlan.splice(index, 1);
}

function addWeek() {
    if (!client.value?.program) return;
    const nextWeekNumber = client.value.program.length + 1;
    client.value.program.push({
        weekNumber: nextWeekNumber,
        waterTargetMl: 2500,
        days: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
    });
    selectedWeekIndex.value = client.value.program.length - 1;
}

function copyDay() {
    clipboard.value = { type: 'day', data: JSON.parse(JSON.stringify(currentDayPlan.value)) };
    snackbar.value = { show: true, text: 'Day copied!' };
}

function pasteDay() {
    if (!clipboard.value || clipboard.value.type !== 'day') {
        snackbar.value = { show: true, text: 'No day to paste!' };
        return;
    }
    const pastedItems = JSON.parse(JSON.stringify(clipboard.value.data)).map(item => ({
        ...item,
        id: Date.now() + Math.random(),
    }));
    currentWeek.value.days[selectedDay.value] = pastedItems;
    snackbar.value = { show: true, text: 'Day pasted!' };
}

function copyItem(itemToCopy) {
    clipboard.value = { type: 'item', data: JSON.parse(JSON.stringify(itemToCopy)) };
    snackbar.value = { show: true, text: 'Item copied!' };
}
</script>
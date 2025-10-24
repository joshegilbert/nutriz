<template>
  <v-card class="day-notes-card" variant="flat" elevation="0">
    <v-card-title class="day-notes-header py-3 px-4">
      <div class="day-notes-header__content">
        <div class="day-notes-header__title">
          <v-icon class="mr-2" color="primary">mdi-note-text</v-icon>
          <span class="text-subtitle-1 font-weight-medium">
            Daily Notes & Guidelines
          </span>
        </div>
        <div class="day-notes-header__actions">
          <v-btn
            v-if="hasNotes"
            icon="mdi-content-copy"
            size="x-small"
            variant="text"
            title="Copy notes"
            @click="copyNotes"
          />
          <v-btn
            icon="mdi-chevron-up"
            size="x-small"
            variant="text"
            :class="{ 'rotate-180': !isExpanded }"
            @click="toggleExpanded"
          />
        </div>
      </div>
    </v-card-title>

    <v-expand-transition>
      <div v-if="isExpanded">
        <v-divider />
        <v-card-text class="day-notes-body py-3 px-4">
          <v-textarea
            ref="notesTextarea"
            v-model="localNotes"
            placeholder="Add daily guidelines, macro targets, recipe suggestions, or any notes for this day..."
            variant="outlined"
            rows="3"
            auto-grow
            hide-details
            :loading="isSaving"
            @blur="saveNotes"
            @input="scheduleSave"
          />

          <div class="day-notes-meta">
            <div class="text-caption">
              {{ characterCount }}/5000 characters
            </div>
            <div v-if="lastSaved" class="text-caption">
              Saved {{ formatLastSaved(lastSaved) }}
            </div>
          </div>

          <!-- Quick actions -->
          <div class="day-notes-quick-actions">
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-plus"
              @click="insertMacroTemplate"
            >
              Insert macro template
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-link"
              @click="showRecipeLinkDialog = true"
            >
              Link recipe
            </v-btn>
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>

    <!-- Recipe Link Dialog -->
    <v-dialog v-model="showRecipeLinkDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Link Recipe</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedRecipe"
            :items="recipes"
            item-title="name"
            item-value="id"
            label="Select recipe to link"
            clearable
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRecipeLinkDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="insertRecipeLink"
            :disabled="!selectedRecipe"
          >
            Insert Link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { formatDistanceToNow } from "date-fns";

const props = defineProps({
  day: {
    type: Object,
    required: true,
  },
  recipes: {
    type: Array,
    default: () => [],
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["updateDay"]);

// Local state
const localNotes = ref(props.day.notes || "");
const isExpanded = ref(props.defaultOpen || !!props.day.notes); // Auto-expand if has notes or when requested
const isSaving = ref(false);
const lastSaved = ref(null);
const showRecipeLinkDialog = ref(false);
const selectedRecipe = ref(null);
const notesTextarea = ref(null);

// Auto-save timeout
let saveTimeout = null;

// Computed
const hasNotes = computed(() => localNotes.value.trim().length > 0);
const characterCount = computed(() => localNotes.value.length);

// Watch for external changes
watch(
  () => props.day.notes,
  (newNotes) => {
    if (newNotes !== localNotes.value) {
      localNotes.value = newNotes || "";
    }
  }
);

// Methods
function toggleExpanded() {
  isExpanded.value = !isExpanded.value;

  // Auto-focus textarea when expanding
  if (isExpanded.value) {
    nextTick(() => {
      notesTextarea.value?.focus();
    });
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveNotes();
  }, 1000); // Save after 1 second of no typing
}

async function saveNotes() {
  if (isSaving.value) return;

  const notes = localNotes.value.trim();

  // Only save if notes changed
  if (notes === (props.day.notes || "")) return;

  isSaving.value = true;

  try {
    const updatedDay = {
      ...props.day,
      notes,
      notesUpdatedAt: new Date().toISOString(),
    };

    emit("updateDay", updatedDay);
    lastSaved.value = new Date();
  } catch (error) {
    console.error("Failed to save notes:", error);
  } finally {
    isSaving.value = false;
  }
}

function insertMacroTemplate() {
  const template = `Macro Targets:
- Calories: ___ cal
- Protein: ___ g
- Carbs: ___ g  
- Fat: ___ g

Notes:`;

  insertText(template);
}

function insertRecipeLink() {
  if (!selectedRecipe.value) return;

  const recipe = props.recipes.find((r) => r.id === selectedRecipe.value);
  if (!recipe) return;

  const linkText = `- ${recipe.name} (${
    recipe.totalMacros?.calories || 0
  } cal)`;
  insertText(linkText);

  showRecipeLinkDialog.value = false;
  selectedRecipe.value = null;
}

function insertText(text) {
  const textarea = notesTextarea.value?.$el?.querySelector("textarea");
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = localNotes.value.substring(0, start);
  const after = localNotes.value.substring(end);

  localNotes.value = before + text + after;

  // Set cursor position after inserted text
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);
  });
}

function copyNotes() {
  if (!hasNotes.value) return;

  navigator.clipboard.writeText(localNotes.value).then(() => {
    // Could add a toast notification here
    console.log("Notes copied to clipboard");
  });
}

function formatLastSaved(date) {
  return formatDistanceToNow(date, { addSuffix: true });
}
</script>

<style scoped>
.day-notes-card {
  border-radius: 0;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.day-notes-header {
  border-bottom: 1px solid rgba(120, 130, 160, 0.12);
  background: rgba(59, 130, 246, 0.05);
}

.day-notes-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.day-notes-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1c2734;
  font-weight: 600;
}

.day-notes-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-notes-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
}

.day-notes-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: #6f7b96;
}

.day-notes-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

.v-textarea :deep(.v-field__input) {
  min-height: 60px;
}
</style>

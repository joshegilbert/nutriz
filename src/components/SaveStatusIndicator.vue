<template>
  <div class="save-status-indicator">
    <v-chip
      v-if="status !== 'idle'"
      :color="statusColor"
      size="x-small"
      variant="tonal"
      class="status-chip"
    >
      <v-icon v-if="status === 'saving'" size="x-small" class="mr-1">
        mdi-loading mdi-spin
      </v-icon>
      <v-icon v-else-if="status === 'saved'" size="x-small" class="mr-1">
        mdi-check
      </v-icon>
      <v-icon v-else-if="status === 'error'" size="x-small" class="mr-1">
        mdi-alert-circle
      </v-icon>
      {{ statusText }}
    </v-chip>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    default: "idle",
    validator: (value) => ["idle", "saving", "saved", "error"].includes(value),
  },
});

const statusColor = computed(() => {
  switch (props.status) {
    case "saving":
      return "grey";
    case "saved":
      return "success";
    case "error":
      return "error";
    default:
      return "grey";
  }
});

const statusText = computed(() => {
  switch (props.status) {
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "error":
      return "Error";
    default:
      return "";
  }
});
</script>

<style scoped>
.save-status-indicator {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

.status-chip {
  transition: all 0.3s ease;
}

.status-chip.fade-out {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

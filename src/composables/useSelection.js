import { ref, computed } from 'vue';

/**
 * Composable for managing multi-selection with keyboard shortcuts
 */
export function useSelection() {
  const selectedItems = ref(new Set());
  const lastSelectedIndex = ref(null);

  const isSelected = (index) => selectedItems.value.has(index);

  const toggleSelection = (index, event = null) => {
    if (event?.shiftKey && lastSelectedIndex.value !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex.value, index);
      const end = Math.max(lastSelectedIndex.value, index);
      for (let i = start; i <= end; i++) {
        selectedItems.value.add(i);
      }
    } else if (event?.ctrlKey || event?.metaKey) {
      // Multi-select
      if (selectedItems.value.has(index)) {
        selectedItems.value.delete(index);
      } else {
        selectedItems.value.add(index);
      }
    } else {
      // Single select
      selectedItems.value.clear();
      selectedItems.value.add(index);
    }
    lastSelectedIndex.value = index;
  };

  const clearSelection = () => {
    selectedItems.value.clear();
    lastSelectedIndex.value = null;
  };

  const selectAll = (totalItems) => {
    selectedItems.value.clear();
    for (let i = 0; i < totalItems; i++) {
      selectedItems.value.add(i);
    }
  };

  const getSelectedIndices = computed(() => Array.from(selectedItems.value));

  return {
    selectedItems,
    isSelected,
    toggleSelection,
    clearSelection,
    selectAll,
    getSelectedIndices,
  };
}


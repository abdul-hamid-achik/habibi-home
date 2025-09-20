import { create } from 'zustand';

// Selection item types
export type SelectionType = 'zone' | 'furniture' | 'diagram';

export interface SelectionItem {
  id: string;
  type: SelectionType;
}

// Selection state interface
export interface SelectionState {
  // Current selection
  selectedItems: SelectionItem[];
  activeSelection: SelectionItem | null;

  // Multi-selection support
  isMultiSelectMode: boolean;

  // Actions
  selectItem: (item: SelectionItem) => void;
  addToSelection: (item: SelectionItem) => void;
  removeFromSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectMultiple: (items: SelectionItem[]) => void;

  // Convenience getters
  getSelectedItemsByType: (type: SelectionType) => SelectionItem[];
  hasSelection: () => boolean;
  isSelected: (itemId: string) => boolean;
  getSelectedCount: () => number;
}

// Create the selection store
export const useSelectionStore = create<SelectionState>((set, get) => ({
  // Initial state
  selectedItems: [],
  activeSelection: null,
  isMultiSelectMode: false,

  // Select a single item (replaces current selection)
  selectItem: (item: SelectionItem) => set((state) => {
    // If item is already the only selected item, do nothing
    if (state.selectedItems.length === 1 &&
        state.selectedItems[0].id === item.id &&
        state.selectedItems[0].type === item.type) {
      return state;
    }

    return {
      selectedItems: [item],
      activeSelection: item,
      isMultiSelectMode: false,
    };
  }),

  // Add item to selection (for multi-select)
  addToSelection: (item: SelectionItem) => set((state) => {
    // Check if item is already selected
    const isAlreadySelected = state.selectedItems.some(
      selected => selected.id === item.id && selected.type === item.type
    );

    if (isAlreadySelected) {
      return state;
    }

    const newSelection = [...state.selectedItems, item];
    return {
      selectedItems: newSelection,
      activeSelection: item,
      isMultiSelectMode: newSelection.length > 1,
    };
  }),

  // Remove item from selection
  removeFromSelection: (itemId: string) => set((state) => {
    const newSelection = state.selectedItems.filter(item => item.id !== itemId);
    const newActiveSelection = newSelection.length > 0 ? newSelection[newSelection.length - 1] : null;

    return {
      selectedItems: newSelection,
      activeSelection: newActiveSelection,
      isMultiSelectMode: newSelection.length > 1,
    };
  }),

  // Clear all selection
  clearSelection: () => set({
    selectedItems: [],
    activeSelection: null,
    isMultiSelectMode: false,
  }),

  // Select multiple items at once
  selectMultiple: (items: SelectionItem[]) => set({
    selectedItems: [...items],
    activeSelection: items.length > 0 ? items[items.length - 1] : null,
    isMultiSelectMode: items.length > 1,
  }),

  // Get selected items by type
  getSelectedItemsByType: (type: SelectionType) => {
    const state = get();
    return state.selectedItems.filter(item => item.type === type);
  },

  // Check if there's any selection
  hasSelection: () => {
    const state = get();
    return state.selectedItems.length > 0;
  },

  // Check if specific item is selected
  isSelected: (itemId: string) => {
    const state = get();
    return state.selectedItems.some(item => item.id === itemId);
  },

  // Get count of selected items
  getSelectedCount: () => {
    const state = get();
    return state.selectedItems.length;
  },
}));

// Hook for backward compatibility with existing zone selection
export const useZoneSelection = () => {
  const { selectedItems, selectItem, clearSelection } = useSelectionStore();

  const selectedZoneId = selectedItems.find(item => item.type === 'zone')?.id || null;

  const setSelectedZoneId = (id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectItem({ id, type: 'zone' });
    }
  };

  const isZoneSelected = (id: string) => {
    return selectedItems.some(item => item.id === id && item.type === 'zone');
  };

  return {
    selectedZoneId,
    setSelectedZoneId,
    isZoneSelected,
  };
};

// Hook for backward compatibility with existing furniture selection
export const useFurnitureSelection = () => {
  const { selectedItems, selectItem, clearSelection } = useSelectionStore();

  const selectedFurnitureId = selectedItems.find(item => item.type === 'furniture')?.id || null;

  const setSelectedFurnitureId = (id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectItem({ id, type: 'furniture' });
    }
  };

  const isFurnitureSelected = (id: string) => {
    return selectedItems.some(item => item.id === id && item.type === 'furniture');
  };

  return {
    selectedFurnitureId,
    setSelectedFurnitureId,
    isFurnitureSelected,
  };
};

// Hook for diagram selection
export const useDiagramSelection = () => {
  const { selectedItems, selectItem, clearSelection } = useSelectionStore();

  const selectedDiagramId = selectedItems.find(item => item.type === 'diagram')?.id || null;

  const setSelectedDiagramId = (id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectItem({ id, type: 'diagram' });
    }
  };

  const isDiagramSelected = (id: string) => {
    return selectedItems.some(item => item.id === id && item.type === 'diagram');
  };

  return {
    selectedDiagramId,
    setSelectedDiagramId,
    isDiagramSelected,
  };
};
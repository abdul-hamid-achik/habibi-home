import { useCallback } from 'react';
import { useSelectionStore, SelectionType } from '../state/selection_store';

// Simple selection hook
export const useSelection = () => {
  const selectionStore = useSelectionStore();

  // Selection actions
  const selectItem = useCallback((id: string, type: SelectionType) => {
    selectionStore.selectItem({ id, type });
  }, [selectionStore]);

  const clearSelection = useCallback(() => {
    selectionStore.clearSelection();
  }, [selectionStore]);

  const isSelected = useCallback((id: string) => {
    return selectionStore.isSelected(id);
  }, [selectionStore]);

  return {
    selectedItems: selectionStore.selectedItems,
    selectItem,
    clearSelection,
    isSelected,
  };
};

// Simplified diagram selection compatibility hook
export const useDiagramSelectionCompat = () => {
  const { selectedItems, selectItem, clearSelection, isSelected } = useSelection();
  const selectedDiagramId = selectedItems.find(item => item.type === 'diagram')?.id || null;

  const selectDiagram = useCallback((id: string) => {
    selectItem(id, 'diagram');
  }, [selectItem]);

  const setSelectedDiagramId = useCallback((id: string | null) => {
    if (id) {
      selectItem(id, 'diagram');
    } else {
      clearSelection();
    }
  }, [selectItem, clearSelection]);

  return {
    selectedDiagramId,
    selectDiagram,
    setSelectedDiagramId,
    clearSelection,
    isSelected,
  };
};

// Simplified event handlers hook (no-op implementation)
export const useSelectionEventHandlers = (context: {
  onZoneDelete?: (id: string) => void;
  onZoneDuplicate?: (id: string) => void;
  onFurnitureDelete?: (id: string) => void;
  onFurnitureDuplicate?: (id: string) => void;
  onDiagramDelete?: (id: string) => void;
  onDiagramDuplicate?: (id: string) => void;
}) => {
  // Simplified no-op implementation to avoid complex event handling issues
  // The actual functionality can be handled directly in components
  return {};
};
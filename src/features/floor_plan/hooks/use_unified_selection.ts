import { useEffect, useCallback } from 'react';
import { useSelectionStore, SelectionType } from '../state/selection_store';
import { useShortcutsStore, attachGlobalShortcutHandler, registerDefaultShortcuts } from '../state/shortcuts_store';

// Main unified selection hook
export const useUnifiedSelection = () => {
  const selectionStore = useSelectionStore();
  const shortcutsStore = useShortcutsStore();

  // Initialize global shortcut handler on first use
  useEffect(() => {
    const cleanup = attachGlobalShortcutHandler();
    registerDefaultShortcuts();

    return cleanup;
  }, []);

  // Selection actions with type safety
  const selectItem = useCallback((id: string, type: SelectionType) => {
    selectionStore.selectItem({ id, type });
  }, [selectionStore]);

  const addToSelection = useCallback((id: string, type: SelectionType) => {
    selectionStore.addToSelection({ id, type });
  }, [selectionStore]);

  const removeFromSelection = useCallback((id: string) => {
    selectionStore.removeFromSelection(id);
  }, [selectionStore]);

  const toggleSelection = useCallback((id: string, type: SelectionType) => {
    if (selectionStore.isSelected(id)) {
      selectionStore.removeFromSelection(id);
    } else {
      selectionStore.addToSelection({ id, type });
    }
  }, [selectionStore]);

  // Context-specific selection helpers
  const selectZone = useCallback((id: string) => selectItem(id, 'zone'), [selectItem]);
  const selectFurniture = useCallback((id: string) => selectItem(id, 'furniture'), [selectItem]);
  const selectDiagram = useCallback((id: string) => selectItem(id, 'diagram'), [selectItem]);

  // Multi-selection helpers
  const selectMultipleItems = useCallback((items: Array<{ id: string; type: SelectionType }>) => {
    selectionStore.selectMultiple(items);
  }, [selectionStore]);

  // Shortcut actions
  const deleteSelected = useCallback(() => {
    const selectedItems = selectionStore.selectedItems;

    // Emit delete events for each selected item
    selectedItems.forEach(item => {
      const eventName = `${item.type}:delete`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: { id: item.id } }));
    });

    selectionStore.clearSelection();
  }, [selectionStore]);

  const duplicateSelected = useCallback(() => {
    const selectedItems = selectionStore.selectedItems;

    // Emit duplicate events for each selected item
    selectedItems.forEach(item => {
      const eventName = `${item.type}:duplicate`;
      window.dispatchEvent(new CustomEvent(eventName, { detail: { id: item.id } }));
    });
  }, [selectionStore]);

  return {
    // Selection state
    selectedItems: selectionStore.selectedItems,
    activeSelection: selectionStore.activeSelection,
    isMultiSelectMode: selectionStore.isMultiSelectMode,

    // Selection actions
    selectItem,
    addToSelection,
    removeFromSelection,
    toggleSelection,
    clearSelection: selectionStore.clearSelection,
    selectMultipleItems,

    // Context-specific actions
    selectZone,
    selectFurniture,
    selectDiagram,

    // Query methods
    hasSelection: selectionStore.hasSelection,
    isSelected: selectionStore.isSelected,
    getSelectedCount: selectionStore.getSelectedCount,
    getSelectedItemsByType: selectionStore.getSelectedItemsByType,

    // Shortcut actions
    deleteSelected,
    duplicateSelected,

    // Shortcuts control
    setShortcutsEnabled: shortcutsStore.setEnabled,
    isShortcutsEnabled: shortcutsStore.isEnabled,
  };
};

// Hook for registering context-specific event handlers
export const useSelectionEventHandlers = (context: {
  onZoneDelete?: (id: string) => void;
  onZoneDuplicate?: (id: string) => void;
  onFurnitureDelete?: (id: string) => void;
  onFurnitureDuplicate?: (id: string) => void;
  onDiagramDelete?: (id: string) => void;
  onDiagramDuplicate?: (id: string) => void;
  onSelectAll?: () => void;
}) => {
  useEffect(() => {
    const handlers: Array<{ event: string; handler: (e: CustomEvent) => void }> = [];

    if (context.onZoneDelete) {
      const handler = (e: CustomEvent) => context.onZoneDelete!(e.detail.id);
      window.addEventListener('zone:delete', handler);
      handlers.push({ event: 'zone:delete', handler });
    }

    if (context.onZoneDuplicate) {
      const handler = (e: CustomEvent) => context.onZoneDuplicate!(e.detail.id);
      window.addEventListener('zone:duplicate', handler);
      handlers.push({ event: 'zone:duplicate', handler });
    }

    if (context.onFurnitureDelete) {
      const handler = (e: CustomEvent) => context.onFurnitureDelete!(e.detail.id);
      window.addEventListener('furniture:delete', handler);
      handlers.push({ event: 'furniture:delete', handler });
    }

    if (context.onFurnitureDuplicate) {
      const handler = (e: CustomEvent) => context.onFurnitureDuplicate!(e.detail.id);
      window.addEventListener('furniture:duplicate', handler);
      handlers.push({ event: 'furniture:duplicate', handler });
    }

    if (context.onDiagramDelete) {
      const handler = (e: CustomEvent) => context.onDiagramDelete!(e.detail.id);
      window.addEventListener('diagram:delete', handler);
      handlers.push({ event: 'diagram:delete', handler });
    }

    if (context.onDiagramDuplicate) {
      const handler = (e: CustomEvent) => context.onDiagramDuplicate!(e.detail.id);
      window.addEventListener('diagram:duplicate', handler);
      handlers.push({ event: 'diagram:duplicate', handler });
    }

    if (context.onSelectAll) {
      const handler = () => context.onSelectAll!();
      window.addEventListener('editor:selectAll', handler);
      handlers.push({ event: 'editor:selectAll', handler });
    }

    // Cleanup
    return () => {
      handlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [context]);
};

// Backward compatibility hooks
export const useZoneSelectionCompat = () => {
  const { selectedItems, selectZone, clearSelection, isSelected } = useUnifiedSelection();

  const selectedZoneId = selectedItems.find(item => item.type === 'zone')?.id || null;

  const setSelectedZoneId = useCallback((id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectZone(id);
    }
  }, [selectZone, clearSelection]);

  return {
    selectedZoneId,
    setSelectedZoneId,
    isZoneSelected: (id: string) => isSelected(id),
  };
};

export const useFurnitureSelectionCompat = () => {
  const { selectedItems, selectFurniture, clearSelection, isSelected } = useUnifiedSelection();

  const selectedFurnitureId = selectedItems.find(item => item.type === 'furniture')?.id || null;

  const setSelectedFurnitureId = useCallback((id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectFurniture(id);
    }
  }, [selectFurniture, clearSelection]);

  return {
    selectedFurnitureId,
    setSelectedFurnitureId,
    isFurnitureSelected: (id: string) => isSelected(id),
  };
};

export const useDiagramSelectionCompat = () => {
  const { selectedItems, selectDiagram, clearSelection, isSelected } = useUnifiedSelection();

  const selectedDiagramId = selectedItems.find(item => item.type === 'diagram')?.id || null;

  const setSelectedDiagramId = useCallback((id: string | null) => {
    if (id === null) {
      clearSelection();
    } else {
      selectDiagram(id);
    }
  }, [selectDiagram, clearSelection]);

  return {
    selectedDiagramId,
    setSelectedDiagramId,
    isDiagramSelected: (id: string) => isSelected(id),
  };
};
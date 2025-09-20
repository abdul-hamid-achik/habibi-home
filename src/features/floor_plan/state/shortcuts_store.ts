import { create } from 'zustand';
import React from 'react';
import { useSelectionStore } from './selection_store';

// Keyboard shortcut definition
export interface ShortcutDefinition {
  id: string;
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  context?: 'global' | 'diagrams' | 'furniture' | 'zones';
  preventDefault?: boolean;
}

// Shortcuts state interface
export interface ShortcutsState {
  // Registered shortcuts
  shortcuts: Record<string, ShortcutDefinition>;
  isEnabled: boolean;

  // Actions
  registerShortcut: (shortcut: ShortcutDefinition) => void;
  unregisterShortcut: (id: string) => void;
  handleKeyDown: (event: KeyboardEvent) => boolean;
  setEnabled: (enabled: boolean) => void;

  // Getters
  getShortcutsByContext: (context?: string) => ShortcutDefinition[];
  getAllShortcuts: () => ShortcutDefinition[];
}

// Create the shortcuts store
export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  shortcuts: {},
  isEnabled: true,

  registerShortcut: (shortcut: ShortcutDefinition) => set((state) => ({
    shortcuts: {
      ...state.shortcuts,
      [shortcut.id]: shortcut,
    },
  })),

  unregisterShortcut: (id: string) => set((state) => {
    const { [id]: _removed, ...rest } = state.shortcuts;
    return { shortcuts: rest };
  }),

  handleKeyDown: (event: KeyboardEvent) => {
    const state = get();

    if (!state.isEnabled) return false;

    // Find matching shortcut
    const matchingShortcut = Object.values(state.shortcuts).find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = (shortcut.ctrlKey || false) === event.ctrlKey;
      const metaMatch = (shortcut.metaKey || false) === event.metaKey;
      const shiftMatch = (shortcut.shiftKey || false) === event.shiftKey;
      const altMatch = (shortcut.altKey || false) === event.altKey;

      return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
    });

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
        event.stopPropagation();
      }

      try {
        matchingShortcut.action();
        return true;
      } catch (error) {
        console.error(`Error executing shortcut ${matchingShortcut.id}:`, error);
        return false;
      }
    }

    return false;
  },

  setEnabled: (enabled: boolean) => set({ isEnabled: enabled }),

  getShortcutsByContext: (context?: string) => {
    const state = get();
    return Object.values(state.shortcuts).filter(shortcut =>
      !context || shortcut.context === context || shortcut.context === 'global'
    );
  },

  getAllShortcuts: () => {
    const state = get();
    return Object.values(state.shortcuts);
  },
}));

// Global keyboard event handler
let globalHandlerAttached = false;

export const attachGlobalShortcutHandler = () => {
  if (globalHandlerAttached) return;

  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    const { handleKeyDown } = useShortcutsStore.getState();
    handleKeyDown(event);
  };

  document.addEventListener('keydown', handleGlobalKeyDown);
  globalHandlerAttached = true;

  return () => {
    document.removeEventListener('keydown', handleGlobalKeyDown);
    globalHandlerAttached = false;
  };
};

// Hook for registering shortcuts with automatic cleanup
export const useShortcut = (shortcut: ShortcutDefinition) => {
  const { registerShortcut, unregisterShortcut } = useShortcutsStore();

  // Register shortcut on mount
  React.useEffect(() => {
    registerShortcut(shortcut);

    return () => {
      unregisterShortcut(shortcut.id);
    };
  }, [registerShortcut, unregisterShortcut, shortcut]);
};

// Common shortcut actions factory
export const createShortcutActions = () => {
  const selection = useSelectionStore.getState();

  return {
    // Selection actions
    clearSelection: () => {
      selection.clearSelection();
    },

    // Delete selected items
    deleteSelected: () => {
      const selectedItems = selection.selectedItems;

      selectedItems.forEach(item => {
        switch (item.type) {
          case 'zone':
            // Emit zone delete event
            window.dispatchEvent(new CustomEvent('zone:delete', { detail: { id: item.id } }));
            break;
          case 'furniture':
            // Emit furniture delete event
            window.dispatchEvent(new CustomEvent('furniture:delete', { detail: { id: item.id } }));
            break;
          case 'diagram':
            // Emit diagram delete event
            window.dispatchEvent(new CustomEvent('diagram:delete', { detail: { id: item.id } }));
            break;
        }
      });

      selection.clearSelection();
    },

    // Duplicate selected items
    duplicateSelected: () => {
      const selectedItems = selection.selectedItems;

      selectedItems.forEach(item => {
        switch (item.type) {
          case 'zone':
            window.dispatchEvent(new CustomEvent('zone:duplicate', { detail: { id: item.id } }));
            break;
          case 'furniture':
            window.dispatchEvent(new CustomEvent('furniture:duplicate', { detail: { id: item.id } }));
            break;
          case 'diagram':
            window.dispatchEvent(new CustomEvent('diagram:duplicate', { detail: { id: item.id } }));
            break;
        }
      });
    },

    // Select all items in current context
    selectAll: () => {
      // This would need to be implemented per context
      window.dispatchEvent(new CustomEvent('editor:selectAll'));
    },
  };
};

// Default global shortcuts
export const registerDefaultShortcuts = () => {
  const { registerShortcut } = useShortcutsStore.getState();
  const actions = createShortcutActions();

  // Escape - Clear selection
  registerShortcut({
    id: 'global:clearSelection',
    key: 'Escape',
    description: 'Clear selection',
    action: actions.clearSelection,
    context: 'global',
  });

  // Delete/Backspace - Delete selected
  registerShortcut({
    id: 'global:deleteSelected',
    key: 'Delete',
    description: 'Delete selected items',
    action: actions.deleteSelected,
    context: 'global',
  });

  registerShortcut({
    id: 'global:deleteSelectedBackspace',
    key: 'Backspace',
    description: 'Delete selected items',
    action: actions.deleteSelected,
    context: 'global',
  });

  // Ctrl+D / Cmd+D - Duplicate selected
  registerShortcut({
    id: 'global:duplicateSelectedCtrl',
    key: 'd',
    ctrlKey: true,
    description: 'Duplicate selected items',
    action: actions.duplicateSelected,
    context: 'global',
  });

  registerShortcut({
    id: 'global:duplicateSelectedCmd',
    key: 'd',
    metaKey: true,
    description: 'Duplicate selected items',
    action: actions.duplicateSelected,
    context: 'global',
  });

  // Ctrl+A / Cmd+A - Select all
  registerShortcut({
    id: 'global:selectAllCtrl',
    key: 'a',
    ctrlKey: true,
    description: 'Select all items',
    action: actions.selectAll,
    context: 'global',
  });

  registerShortcut({
    id: 'global:selectAllCmd',
    key: 'a',
    metaKey: true,
    description: 'Select all items',
    action: actions.selectAll,
    context: 'global',
  });
};
/**
 * Keyboard Shortcuts Store
 * Centralized keyboard shortcut management for the floor plan editor
 */

import React, { useEffect, useCallback, useRef, useMemo } from 'react';

export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: 'Global' | 'Selection' | 'Navigation' | 'Tools' | 'Edit';
  preventDefault?: boolean;
}

export interface ShortcutHandler {
  // Global actions
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onClearSelection: () => void;
  
  // Selection actions
  onDelete: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  
  // Furniture actions
  onRotateLeft: () => void;
  onRotateRight: () => void;
  
  // Navigation
  onPanUp: () => void;
  onPanDown: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  
  // Tools
  onSave: () => void;
  onExport: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandler) {
  const handlersRef = useRef(handlers);
  
  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Define all shortcuts (memoized to prevent useCallback dependency changes)
  const shortcuts: ShortcutAction[] = useMemo(() => [
    // Global shortcuts
    {
      key: 'z',
      ctrlKey: true,
      action: () => handlersRef.current.onUndo(),
      description: 'Undo last action',
      category: 'Global',
      preventDefault: true
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => handlersRef.current.onRedo(),
      description: 'Redo last undone action',
      category: 'Global',
      preventDefault: true
    },
    {
      key: 'y',
      ctrlKey: true,
      action: () => handlersRef.current.onRedo(),
      description: 'Redo last undone action (alternative)',
      category: 'Global',
      preventDefault: true
    },
    
    // Navigation shortcuts
    {
      key: 'z',
      action: () => handlersRef.current.onZoomOut(),
      description: 'Zoom out',
      category: 'Navigation'
    },
    {
      key: 'x',
      action: () => handlersRef.current.onZoomIn(),
      description: 'Zoom in',
      category: 'Navigation'
    },
    {
      key: 'f',
      action: () => handlersRef.current.onZoomFit(),
      description: 'Fit to screen',
      category: 'Navigation'
    },
    
    // Grid and snap
    {
      key: 'g',
      action: () => handlersRef.current.onToggleGrid(),
      description: 'Toggle grid',
      category: 'Tools'
    },
    {
      key: 's',
      action: () => handlersRef.current.onToggleSnap(),
      description: 'Toggle snap to grid',
      category: 'Tools'
    },
    
    // Selection shortcuts
    {
      key: 'Escape',
      action: () => handlersRef.current.onClearSelection(),
      description: 'Clear selection',
      category: 'Selection'
    },
    {
      key: 'a',
      ctrlKey: true,
      action: () => handlersRef.current.onSelectAll(),
      description: 'Select all',
      category: 'Selection',
      preventDefault: true
    },
    {
      key: 'Delete',
      action: () => handlersRef.current.onDelete(),
      description: 'Delete selected items',
      category: 'Edit'
    },
    {
      key: 'Backspace',
      action: () => handlersRef.current.onDelete(),
      description: 'Delete selected items',
      category: 'Edit'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => handlersRef.current.onDuplicate(),
      description: 'Duplicate selected items',
      category: 'Edit',
      preventDefault: true
    },
    
    // Rotation shortcuts
    {
      key: 'r',
      action: () => handlersRef.current.onRotateRight(),
      description: 'Rotate selected items +15°',
      category: 'Edit'
    },
    {
      key: 'r',
      shiftKey: true,
      action: () => handlersRef.current.onRotateLeft(),
      description: 'Rotate selected items -15°',
      category: 'Edit'
    },
    
    // Pan shortcuts (arrow keys)
    {
      key: 'ArrowUp',
      action: () => handlersRef.current.onPanUp(),
      description: 'Pan up',
      category: 'Navigation'
    },
    {
      key: 'ArrowDown',
      action: () => handlersRef.current.onPanDown(),
      description: 'Pan down',
      category: 'Navigation'
    },
    {
      key: 'ArrowLeft',
      action: () => handlersRef.current.onPanLeft(),
      description: 'Pan left',
      category: 'Navigation'
    },
    {
      key: 'ArrowRight',
      action: () => handlersRef.current.onPanRight(),
      description: 'Pan right',
      category: 'Navigation'
    },
    
    // File operations
    {
      key: 's',
      ctrlKey: true,
      action: () => handlersRef.current.onSave(),
      description: 'Save project',
      category: 'Global',
      preventDefault: true
    },
    {
      key: 'e',
      ctrlKey: true,
      action: () => handlersRef.current.onExport(),
      description: 'Export project',
      category: 'Global',
      preventDefault: true
    }
  ], []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!s.ctrlKey === event.ctrlKey;
      const shiftMatch = !!s.shiftKey === event.shiftKey;
      const altMatch = !!s.altKey === event.altKey;
      const metaMatch = !!s.metaKey === event.metaKey;
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });

    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }
      shortcut.action();
    }
  }, [shortcuts]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return shortcuts for documentation/help
  return shortcuts;
}

// Hook for managing shortcut help modal
export function useShortcutHelp() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const openHelp = useCallback(() => setIsOpen(true), []);
  const closeHelp = useCallback(() => setIsOpen(false), []);
  
  // Listen for F1 or ? key to open help
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1' || (event.key === '?' && !event.ctrlKey && !event.altKey)) {
        event.preventDefault();
        openHelp();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openHelp]);
  
  return { isOpen, openHelp, closeHelp };
}

// Component for displaying shortcuts help
export function ShortcutsHelp({ 
  shortcuts, 
  isOpen, 
  onClose 
}: { 
  shortcuts: ShortcutAction[]; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!isOpen) return null;
  
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = [];
    }
    groups[shortcut.category].push(shortcut);
    return groups;
  }, {} as Record<string, ShortcutAction[]>);
  
  const formatShortcut = (shortcut: ShortcutAction) => {
    const parts: string[] = [];
    if (shortcut.ctrlKey || shortcut.metaKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
    return parts.join(' + ');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-gray-900 border-b pb-1">{category}</h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t text-xs text-gray-500">
            <p>Press <kbd className="px-1 py-0.5 bg-gray-100 border rounded">F1</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 border rounded">?</kbd> to open this help at any time.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
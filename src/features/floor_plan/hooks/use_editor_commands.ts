/**
 * Editor Commands Hook
 * Combines command manager with keyboard shortcuts for the floor plan editor
 */

import { useRef, useCallback, useMemo } from 'react';
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { 
  CommandManager, 
  AddZoneCommand, 
  RemoveZoneCommand, 
  UpdateZoneCommand,
  AddFurnitureCommand,
  RemoveFurnitureCommand,
  UpdateFurnitureCommand,
  BatchCommand
} from '../state/command_manager';
import { useKeyboardShortcuts, ShortcutHandler } from '../state/shortcuts_store';

interface UseEditorCommandsProps {
  // State setters
  setZones: React.Dispatch<React.SetStateAction<FloorPlanZone[]>>;
  setFurniture: React.Dispatch<React.SetStateAction<FurnitureItemType[]>>;
  setSettings: React.Dispatch<React.SetStateAction<FloorPlanSettings>>;
  
  // Current state for reference
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  
  // Selection state
  selectedZoneId: string | null;
  selectedFurnitureId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  setSelectedFurnitureId: (id: string | null) => void;
  
  // Additional callbacks
  onSave?: () => void;
  onExport?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomFit?: () => void;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
}

export function useEditorCommands({
  setZones,
  setFurniture,
  setSettings,
  zones,
  furniture,
  settings,
  selectedZoneId,
  selectedFurnitureId,
  setSelectedZoneId,
  setSelectedFurnitureId,
  onSave,
  onExport,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleGrid,
  onToggleSnap
}: UseEditorCommandsProps) {
  
  const commandManager = useRef(new CommandManager());
  
  // Get selected items
  const selectedZone = useMemo(() => 
    zones.find(z => z.id === selectedZoneId) || null, 
    [zones, selectedZoneId]
  );
  
  const selectedFurniture = useMemo(() => 
    furniture.find(f => f.id === selectedFurnitureId) || null, 
    [furniture, selectedFurnitureId]
  );
  
  // Zone commands
  const addZone = useCallback((zone: FloorPlanZone) => {
    const command = new AddZoneCommand(zone, setZones);
    commandManager.current.executeCommand(command);
  }, [setZones]);
  
  const removeZone = useCallback((zone: FloorPlanZone) => {
    const command = new RemoveZoneCommand(zone, setZones);
    commandManager.current.executeCommand(command);
  }, [setZones]);
  
  const updateZone = useCallback((id: string, oldValues: Partial<FloorPlanZone>, newValues: Partial<FloorPlanZone>) => {
    const command = new UpdateZoneCommand(id, oldValues, newValues, setZones);
    commandManager.current.executeCommand(command);
  }, [setZones]);
  
  // Furniture commands
  const addFurniture = useCallback((furnitureItem: FurnitureItemType) => {
    const command = new AddFurnitureCommand(furnitureItem, setFurniture);
    commandManager.current.executeCommand(command);
  }, [setFurniture]);
  
  const removeFurniture = useCallback((furnitureItem: FurnitureItemType) => {
    const command = new RemoveFurnitureCommand(furnitureItem, setFurniture);
    commandManager.current.executeCommand(command);
  }, [setFurniture]);
  
  const updateFurniture = useCallback((id: string, oldValues: Partial<FurnitureItemType>, newValues: Partial<FurnitureItemType>) => {
    const command = new UpdateFurnitureCommand(id, oldValues, newValues, setFurniture);
    commandManager.current.executeCommand(command);
  }, [setFurniture]);
  
  // Batch operations
  const duplicateSelectedFurniture = useCallback(() => {
    if (!selectedFurniture) return;
    
    const newFurniture: FurnitureItemType = {
      ...selectedFurniture,
      id: Math.random().toString(36).substring(2),
      x: selectedFurniture.x + 20,
      y: selectedFurniture.y + 20
    };
    
    addFurniture(newFurniture);
    setSelectedFurnitureId(newFurniture.id);
  }, [selectedFurniture, addFurniture, setSelectedFurnitureId]);
  
  const deleteSelected = useCallback(() => {
    if (selectedZone) {
      removeZone(selectedZone);
      setSelectedZoneId(null);
    } else if (selectedFurniture) {
      removeFurniture(selectedFurniture);
      setSelectedFurnitureId(null);
    }
  }, [selectedZone, selectedFurniture, removeZone, removeFurniture, setSelectedZoneId, setSelectedFurnitureId]);
  
  const rotateSelectedFurniture = useCallback((degrees: number) => {
    if (!selectedFurniture) return;
    
    const oldRotation = { r: selectedFurniture.r };
    const newRotation = { r: (selectedFurniture.r + degrees) % 360 };
    
    updateFurniture(selectedFurniture.id, oldRotation, newRotation);
  }, [selectedFurniture, updateFurniture]);
  
  const selectAll = useCallback(() => {
    // For now, just select the first furniture item
    // In a full implementation, you'd handle multi-selection
    if (furniture.length > 0) {
      setSelectedFurnitureId(furniture[0].id);
    }
  }, [furniture, setSelectedFurnitureId]);
  
  // Command manager operations
  const undo = useCallback(() => {
    commandManager.current.undo();
  }, []);
  
  const redo = useCallback(() => {
    commandManager.current.redo();
  }, []);
  
  const canUndo = useCallback(() => {
    return commandManager.current.canUndo();
  }, []);
  
  const canRedo = useCallback(() => {
    return commandManager.current.canRedo();
  }, []);
  
  const getUndoName = useCallback(() => {
    return commandManager.current.getUndoName();
  }, []);
  
  const getRedoName = useCallback(() => {
    return commandManager.current.getRedoName();
  }, []);
  
  // Pan operations (for keyboard shortcuts)
  const panUp = useCallback(() => {
    // Implement panning by adjusting view offset
    console.log('Pan up');
  }, []);
  
  const panDown = useCallback(() => {
    console.log('Pan down');
  }, []);
  
  const panLeft = useCallback(() => {
    console.log('Pan left');
  }, []);
  
  const panRight = useCallback(() => {
    console.log('Pan right');
  }, []);
  
  // Shortcut handlers
  const shortcutHandlers: ShortcutHandler = useMemo(() => ({
    onUndo: undo,
    onRedo: redo,
    onZoomIn: onZoomIn || (() => {}),
    onZoomOut: onZoomOut || (() => {}),
    onZoomFit: onZoomFit || (() => {}),
    onToggleGrid: onToggleGrid || (() => {}),
    onToggleSnap: onToggleSnap || (() => {}),
    onClearSelection: () => {
      setSelectedZoneId(null);
      setSelectedFurnitureId(null);
    },
    onDelete: deleteSelected,
    onDuplicate: duplicateSelectedFurniture,
    onSelectAll: selectAll,
    onRotateLeft: () => rotateSelectedFurniture(-15),
    onRotateRight: () => rotateSelectedFurniture(15),
    onPanUp: panUp,
    onPanDown: panDown,
    onPanLeft: panLeft,
    onPanRight: panRight,
    onSave: onSave || (() => {}),
    onExport: onExport || (() => {})
  }), [
    undo, redo, onZoomIn, onZoomOut, onZoomFit, onToggleGrid, onToggleSnap,
    setSelectedZoneId, setSelectedFurnitureId, deleteSelected, duplicateSelectedFurniture,
    selectAll, rotateSelectedFurniture, panUp, panDown, panLeft, panRight,
    onSave, onExport
  ]);
  
  // Set up keyboard shortcuts
  const shortcuts = useKeyboardShortcuts(shortcutHandlers);
  
  return {
    // Command operations
    addZone,
    removeZone,
    updateZone,
    addFurniture,
    removeFurniture,
    updateFurniture,
    
    // Batch operations  
    duplicateSelectedFurniture,
    deleteSelected,
    rotateSelectedFurniture,
    selectAll,
    
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoName,
    getRedoName,
    
    // Shortcuts
    shortcuts,
    
    // Command manager (for debugging)
    commandManager: commandManager.current
  };
}
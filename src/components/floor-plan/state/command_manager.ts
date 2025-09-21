/**
 * Command Manager for Undo/Redo functionality
 * Implements the Command pattern for reversible operations
 */

import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { DiagramShape } from '../editor/schemas';

export interface EditorState {
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  diagramShapes?: DiagramShape[];
}

export interface Command {
  id: string;
  name: string;
  timestamp: number;
  execute(state: EditorState): EditorState;
  undo(state: EditorState): EditorState;
  canMergeWith?(other: Command): boolean;
  mergeWith?(other: Command): Command;
}

// Base command implementations
export abstract class BaseCommand implements Command {
  public id: string;
  public timestamp: number;

  constructor(
    public name: string
  ) {
    this.id = Math.random().toString(36).substring(2);
    this.timestamp = Date.now();
  }

  abstract execute(state: EditorState): EditorState;
  abstract undo(state: EditorState): EditorState;

  canMergeWith(_other: Command): boolean {
    return false; // Override in subclasses if merging is supported
  }

  mergeWith(_other: Command): Command {
    throw new Error('Merging not supported for this command type');
  }
}

// Add/Remove Zone Commands
export class AddZoneCommand extends BaseCommand {
  constructor(
    private zone: FloorPlanZone
  ) {
    super(`Add Zone: ${zone.name}`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      zones: [...state.zones, this.zone]
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      zones: state.zones.filter(z => z.id !== this.zone.id)
    };
  }
}

export class RemoveZoneCommand extends BaseCommand {
  constructor(
    private zone: FloorPlanZone
  ) {
    super(`Remove Zone: ${zone.name}`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      zones: state.zones.filter(z => z.id !== this.zone.id)
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      zones: [...state.zones, this.zone]
    };
  }
}

// Update Zone Command
export class UpdateZoneCommand extends BaseCommand {
  constructor(
    private zoneId: string,
    private oldValues: Partial<FloorPlanZone>,
    private newValues: Partial<FloorPlanZone>
  ) {
    super(`Update Zone`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      zones: state.zones.map(zone =>
        zone.id === this.zoneId ? { ...zone, ...this.newValues } : zone
      )
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      zones: state.zones.map(zone =>
        zone.id === this.zoneId ? { ...zone, ...this.oldValues } : zone
      )
    };
  }

  canMergeWith(other: Command): boolean {
    return other instanceof UpdateZoneCommand &&
      other.zoneId === this.zoneId &&
      Date.now() - other.timestamp < 1000; // Merge within 1 second
  }

  mergeWith(other: UpdateZoneCommand): Command {
    return new UpdateZoneCommand(
      this.zoneId,
      this.oldValues,
      other.newValues
    );
  }
}

// Add/Remove Furniture Commands
export class AddFurnitureCommand extends BaseCommand {
  constructor(
    private furniture: FurnitureItemType
  ) {
    super(`Add Furniture: ${furniture.name}`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      furniture: [...state.furniture, this.furniture]
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      furniture: state.furniture.filter(f => f.id !== this.furniture.id)
    };
  }
}

export class RemoveFurnitureCommand extends BaseCommand {
  constructor(
    private furniture: FurnitureItemType
  ) {
    super(`Remove Furniture: ${furniture.name}`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      furniture: state.furniture.filter(f => f.id !== this.furniture.id)
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      furniture: [...state.furniture, this.furniture]
    };
  }
}

// Update Furniture Command
export class UpdateFurnitureCommand extends BaseCommand {
  constructor(
    private furnitureId: string,
    private oldValues: Partial<FurnitureItemType>,
    private newValues: Partial<FurnitureItemType>
  ) {
    super(`Update Furniture`);
  }

  execute(state: EditorState): EditorState {
    return {
      ...state,
      furniture: state.furniture.map(furniture =>
        furniture.id === this.furnitureId ? { ...furniture, ...this.newValues } : furniture
      )
    };
  }

  undo(state: EditorState): EditorState {
    return {
      ...state,
      furniture: state.furniture.map(furniture =>
        furniture.id === this.furnitureId ? { ...furniture, ...this.oldValues } : furniture
      )
    };
  }

  canMergeWith(other: Command): boolean {
    return other instanceof UpdateFurnitureCommand &&
      other.furnitureId === this.furnitureId &&
      Date.now() - other.timestamp < 1000;
  }

  mergeWith(other: UpdateFurnitureCommand): Command {
    return new UpdateFurnitureCommand(
      this.furnitureId,
      this.oldValues,
      other.newValues
    );
  }
}

// Batch Command for multiple operations
export class BatchCommand extends BaseCommand {
  constructor(
    name: string,
    private commands: Command[]
  ) {
    super(name);
  }

  execute(state: EditorState): EditorState {
    return this.commands.reduce((currentState, cmd) => cmd.execute(currentState), state);
  }

  undo(state: EditorState): EditorState {
    // Undo in reverse order
    return [...this.commands].reverse().reduce((currentState, cmd) => cmd.undo(currentState), state);
  }
}

// Command Manager
export class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  private store: { getState: () => EditorState; setState: (state: EditorState) => void } | null = null;

  constructor(store?: { getState: () => EditorState; setState: (state: EditorState) => void }) {
    this.store = store || null;
  }

  // Set the store reference
  setStore(store: { getState: () => EditorState; setState: (state: EditorState) => void }): void {
    this.store = store;
  }

  // Execute a command and add it to history
  executeCommand(command: Command): void {
    if (!this.store) {
      console.error('CommandManager: No store set');
      return;
    }

    // Check if we can merge with the last command
    if (this.currentIndex >= 0) {
      const lastCommand = this.history[this.currentIndex];
      if (lastCommand.canMergeWith?.(command)) {
        const mergedCommand = lastCommand.mergeWith!(command);
        this.history[this.currentIndex] = mergedCommand;
        const newState = mergedCommand.execute(this.store.getState());
        this.store.setState(newState);
        return;
      }
    }

    // Remove any commands after current index (for when we undo then do new command)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Execute command and update store
    const currentState = this.store.getState();
    const newState = command.execute(currentState);
    this.store.setState(newState);

    // Add command to history
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  // Undo the last command
  undo(): boolean {
    if (!this.store || !this.canUndo()) return false;

    const command = this.history[this.currentIndex];
    const currentState = this.store.getState();
    const newState = command.undo(currentState);
    this.store.setState(newState);
    this.currentIndex--;
    return true;
  }

  // Redo the next command
  redo(): boolean {
    if (!this.store || !this.canRedo()) return false;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    const currentState = this.store.getState();
    const newState = command.execute(currentState);
    this.store.setState(newState);
    return true;
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current history for debugging
  getHistory(): Command[] {
    return [...this.history];
  }

  // Get current position in history
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  // Clear history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get the name of the command that would be undone
  getUndoName(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].name;
  }

  // Get the name of the command that would be redone
  getRedoName(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].name;
  }
}
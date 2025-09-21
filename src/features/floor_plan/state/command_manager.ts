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
  execute(): void;
  undo(): void;
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

  abstract execute(): void;
  abstract undo(): void;

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
    private zone: FloorPlanZone,
    private setState: React.Dispatch<React.SetStateAction<FloorPlanZone[]>>
  ) {
    super(`Add Zone: ${zone.name}`);
  }

  execute(): void {
    this.setState(prev => [...prev, this.zone]);
  }

  undo(): void {
    this.setState(prev => prev.filter(z => z.id !== this.zone.id));
  }
}

export class RemoveZoneCommand extends BaseCommand {
  constructor(
    private zone: FloorPlanZone,
    private setState: React.Dispatch<React.SetStateAction<FloorPlanZone[]>>
  ) {
    super(`Remove Zone: ${zone.name}`);
  }

  execute(): void {
    this.setState(prev => prev.filter(z => z.id !== this.zone.id));
  }

  undo(): void {
    this.setState(prev => [...prev, this.zone]);
  }
}

// Update Zone Command
export class UpdateZoneCommand extends BaseCommand {
  constructor(
    private zoneId: string,
    private oldValues: Partial<FloorPlanZone>,
    private newValues: Partial<FloorPlanZone>,
    private setState: (updater: (prev: FloorPlanZone[]) => FloorPlanZone[]) => void
  ) {
    super(`Update Zone`);
  }

  execute(): void {
    this.setState(prev => prev.map(zone =>
      zone.id === this.zoneId ? { ...zone, ...this.newValues } : zone
    ));
  }

  undo(): void {
    this.setState(prev => prev.map(zone =>
      zone.id === this.zoneId ? { ...zone, ...this.oldValues } : zone
    ));
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
      other.newValues,
      this.setState
    );
  }
}

// Add/Remove Furniture Commands
export class AddFurnitureCommand extends BaseCommand {
  constructor(
    private furniture: FurnitureItemType,
    private setState: React.Dispatch<React.SetStateAction<FurnitureItemType[]>>
  ) {
    super(`Add Furniture: ${furniture.name}`);
  }

  execute(): void {
    this.setState(prev => [...prev, this.furniture]);
  }

  undo(): void {
    this.setState(prev => prev.filter(f => f.id !== this.furniture.id));
  }
}

export class RemoveFurnitureCommand extends BaseCommand {
  constructor(
    private furniture: FurnitureItemType,
    private setState: React.Dispatch<React.SetStateAction<FurnitureItemType[]>>
  ) {
    super(`Remove Furniture: ${furniture.name}`);
  }

  execute(): void {
    this.setState(prev => prev.filter(f => f.id !== this.furniture.id));
  }

  undo(): void {
    this.setState(prev => [...prev, this.furniture]);
  }
}

// Update Furniture Command
export class UpdateFurnitureCommand extends BaseCommand {
  constructor(
    private furnitureId: string,
    private oldValues: Partial<FurnitureItemType>,
    private newValues: Partial<FurnitureItemType>,
    private setState: (updater: (prev: FurnitureItemType[]) => FurnitureItemType[]) => void
  ) {
    super(`Update Furniture`);
  }

  execute(): void {
    this.setState(prev => prev.map(furniture =>
      furniture.id === this.furnitureId ? { ...furniture, ...this.newValues } : furniture
    ));
  }

  undo(): void {
    this.setState(prev => prev.map(furniture =>
      furniture.id === this.furnitureId ? { ...furniture, ...this.oldValues } : furniture
    ));
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
      other.newValues,
      this.setState
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

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // Undo in reverse order
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }
}

// Command Manager
export class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  // Execute a command and add it to history
  executeCommand(command: Command): void {
    // Check if we can merge with the last command
    if (this.currentIndex >= 0) {
      const lastCommand = this.history[this.currentIndex];
      if (lastCommand.canMergeWith?.(command)) {
        const mergedCommand = lastCommand.mergeWith!(command);
        this.history[this.currentIndex] = mergedCommand;
        mergedCommand.execute();
        return;
      }
    }

    // Remove any commands after current index (for when we undo then do new command)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add command and execute
    command.execute();
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
    if (!this.canUndo()) return false;

    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;
    return true;
  }

  // Redo the next command
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.execute();
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
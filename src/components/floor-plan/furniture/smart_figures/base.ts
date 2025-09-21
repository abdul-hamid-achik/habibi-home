import Konva from 'konva';
import { z } from 'zod';
import { FurnitureRegistryEntry } from '../registry';

// Smart figure position and transform schema
export const figureTransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
});

// Smart figure state schema
export const figureStateSchema = z.object({
  id: z.string(),
  furnitureId: z.string(),
  transform: figureTransformSchema,
  isSelected: z.boolean().default(false),
  isHovered: z.boolean().default(false),
  isDragging: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Smart figure render options
export const figureRenderOptionsSchema = z.object({
  showLabel: z.boolean().default(true),
  showDimensions: z.boolean().default(false),
  showClearance: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  selectionColor: z.string().default('#007bff'),
  hoverColor: z.string().default('#0056b3'),
});

// Type exports
export type FigureTransform = z.infer<typeof figureTransformSchema>;
export type FigureState = z.infer<typeof figureStateSchema>;
export type FigureRenderOptions = z.infer<typeof figureRenderOptionsSchema>;

// Smart figure interface
export interface ISmartFigure {
  // Core properties
  readonly id: string;
  readonly furnitureId: string;
  readonly metadata: FurnitureRegistryEntry;

  // State management
  getState(): FigureState;
  setState(state: Partial<FigureState>): void;

  // Transform operations
  getTransform(): FigureTransform;
  setTransform(transform: Partial<FigureTransform>): void;

  // Konva integration
  getKonvaGroup(): Konva.Group;
  render(options?: Partial<FigureRenderOptions>): void;
  destroy(): void;

  // Interaction
  onSelect(callback: (figure: ISmartFigure) => void): void;
  onDeselect(callback: (figure: ISmartFigure) => void): void;
  onDragStart(callback: (figure: ISmartFigure) => void): void;
  onDragMove(callback: (figure: ISmartFigure) => void): void;
  onDragEnd(callback: (figure: ISmartFigure) => void): void;
  onTransform(callback: (figure: ISmartFigure) => void): void;

  // Geometry
  getBounds(): { x: number; y: number; width: number; height: number };
  hitTest(x: number, y: number): boolean;

  // Validation
  canPlaceAt(x: number, y: number): boolean;
  canRotate(rotation: number): boolean;
  canScale(scaleX: number, scaleY: number): boolean;
}

// Base smart figure implementation
export abstract class BaseSmartFigure implements ISmartFigure {
  protected state: FigureState;
  protected konvaGroup: Konva.Group;
  protected renderOptions: FigureRenderOptions;

  // Event callbacks
  protected selectCallbacks: Array<(figure: ISmartFigure) => void> = [];
  protected deselectCallbacks: Array<(figure: ISmartFigure) => void> = [];
  protected dragStartCallbacks: Array<(figure: ISmartFigure) => void> = [];
  protected dragMoveCallbacks: Array<(figure: ISmartFigure) => void> = [];
  protected dragEndCallbacks: Array<(figure: ISmartFigure) => void> = [];
  protected transformCallbacks: Array<(figure: ISmartFigure) => void> = [];

  constructor(
    public readonly id: string,
    public readonly furnitureId: string,
    public readonly metadata: FurnitureRegistryEntry,
    initialTransform: Partial<FigureTransform> = {},
    options: Partial<FigureRenderOptions> = {}
  ) {
    // Initialize state
    this.state = figureStateSchema.parse({
      id,
      furnitureId,
      transform: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        ...initialTransform,
      },
      isSelected: false,
      isHovered: false,
      isDragging: false,
    });

    // Initialize render options
    this.renderOptions = {
      showLabel: true,
      showDimensions: false,
      showClearance: false,
      opacity: metadata.appearance.opacity,
      selectionColor: '#007bff',
      hoverColor: '#0056b3',
      ...options,
    };

    // Create Konva group
    this.konvaGroup = new Konva.Group({
      id: this.id,
      x: this.state.transform.x,
      y: this.state.transform.y,
      rotation: this.state.transform.rotation,
      scaleX: this.state.transform.scaleX,
      scaleY: this.state.transform.scaleY,
      draggable: metadata.behavior?.isMovable ?? true,
    });

    this.setupEventHandlers();
  }

  // State management
  getState(): FigureState {
    return { ...this.state };
  }

  setState(state: Partial<FigureState>): void {
    this.state = { ...this.state, ...state };
    this.updateKonvaFromState();
  }

  // Transform operations
  getTransform(): FigureTransform {
    return { ...this.state.transform };
  }

  setTransform(transform: Partial<FigureTransform>): void {
    this.state.transform = { ...this.state.transform, ...transform };
    this.updateKonvaFromState();
  }

  // Konva integration
  getKonvaGroup(): Konva.Group {
    return this.konvaGroup;
  }

  abstract render(options?: Partial<FigureRenderOptions>): void;

  destroy(): void {
    this.konvaGroup.destroy();
  }

  // Event handlers
  onSelect(callback: (figure: ISmartFigure) => void): void {
    this.selectCallbacks.push(callback);
  }

  onDeselect(callback: (figure: ISmartFigure) => void): void {
    this.deselectCallbacks.push(callback);
  }

  onDragStart(callback: (figure: ISmartFigure) => void): void {
    this.dragStartCallbacks.push(callback);
  }

  onDragMove(callback: (figure: ISmartFigure) => void): void {
    this.dragMoveCallbacks.push(callback);
  }

  onDragEnd(callback: (figure: ISmartFigure) => void): void {
    this.dragEndCallbacks.push(callback);
  }

  onTransform(callback: (figure: ISmartFigure) => void): void {
    this.transformCallbacks.push(callback);
  }

  // Geometry
  getBounds(): { x: number; y: number; width: number; height: number } {
    const clientRect = this.konvaGroup.getClientRect();
    return clientRect;
  }

  hitTest(x: number, y: number): boolean {
    // Transform the point to the group's local coordinates
    const groupTransform = this.konvaGroup.getAbsoluteTransform().copy().invert();
    const localPoint = groupTransform.point({ x, y });

    // Check if the point is within the group's bounds
    return localPoint.x >= 0 &&
           localPoint.x <= this.metadata.dimensions.width &&
           localPoint.y >= 0 &&
           localPoint.y <= this.metadata.dimensions.height;
  }

  // Validation
  canPlaceAt(x: number, y: number): boolean {
    // Basic validation - can be overridden
    return x >= 0 && y >= 0;
  }

  canRotate(rotation: number): boolean {
    const behavior = this.metadata.behavior;
    if (!behavior?.isRotatable) return false;

    return rotation >= (behavior.minRotation ?? 0) &&
           rotation <= (behavior.maxRotation ?? 360);
  }

  canScale(): boolean {
    const behavior = this.metadata.behavior;
    return behavior?.isResizable ?? false;
  }

  // Protected helpers
  protected updateKonvaFromState(): void {
    this.konvaGroup.setAttrs({
      x: this.state.transform.x,
      y: this.state.transform.y,
      rotation: this.state.transform.rotation,
      scaleX: this.state.transform.scaleX,
      scaleY: this.state.transform.scaleY,
    });
  }

  protected updateStateFromKonva(): void {
    const attrs = this.konvaGroup.getAttrs();
    this.state.transform = {
      x: attrs.x ?? 0,
      y: attrs.y ?? 0,
      rotation: attrs.rotation ?? 0,
      scaleX: attrs.scaleX ?? 1,
      scaleY: attrs.scaleY ?? 1,
    };
  }

  protected setupEventHandlers(): void {
    // Selection
    this.konvaGroup.on('click tap', () => {
      this.state.isSelected = !this.state.isSelected;
      if (this.state.isSelected) {
        this.selectCallbacks.forEach(cb => cb(this));
      } else {
        this.deselectCallbacks.forEach(cb => cb(this));
      }
      this.render();
    });

    // Hover
    this.konvaGroup.on('mouseenter', () => {
      this.state.isHovered = true;
      this.render();
    });

    this.konvaGroup.on('mouseleave', () => {
      this.state.isHovered = false;
      this.render();
    });

    // Dragging
    this.konvaGroup.on('dragstart', () => {
      this.state.isDragging = true;
      this.dragStartCallbacks.forEach(cb => cb(this));
    });

    this.konvaGroup.on('dragmove', () => {
      this.updateStateFromKonva();
      this.dragMoveCallbacks.forEach(cb => cb(this));
    });

    this.konvaGroup.on('dragend', () => {
      this.state.isDragging = false;
      this.updateStateFromKonva();
      this.dragEndCallbacks.forEach(cb => cb(this));
    });

    // Transform
    this.konvaGroup.on('transform', () => {
      this.updateStateFromKonva();
      this.transformCallbacks.forEach(cb => cb(this));
    });
  }

  protected getStateColor(): string {
    if (this.state.isSelected) return this.renderOptions.selectionColor;
    if (this.state.isHovered) return this.renderOptions.hoverColor;
    return this.metadata.appearance.color;
  }

  protected createLabel(): Konva.Text | null {
    if (!this.renderOptions.showLabel) return null;

    return new Konva.Text({
      text: this.metadata.name,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#000',
      align: 'center',
      verticalAlign: 'middle',
      width: this.metadata.dimensions.width,
      height: 20,
      x: 0,
      y: this.metadata.dimensions.height / 2 - 10,
    });
  }
}
import Konva from 'konva';
import { BaseSmartFigure, FigureRenderOptions, FigureTransform } from './base';
import { FurnitureRegistryEntry } from '../registry';

export class RectangleFigure extends BaseSmartFigure {
  private mainRect: Konva.Rect | null = null;
  private selectionRect: Konva.Rect | null = null;
  private labelText: Konva.Text | null = null;

  constructor(
    id: string,
    furnitureId: string,
    metadata: FurnitureRegistryEntry,
    initialTransform: Partial<FigureTransform> = {},
    options: Partial<FigureRenderOptions> = {}
  ) {
    super(id, furnitureId, metadata, initialTransform, options);
    this.render();
  }

  render(options: Partial<FigureRenderOptions> = {}): void {
    // Update render options
    this.renderOptions = { ...this.renderOptions, ...options };

    // Clear existing shapes
    this.konvaGroup.destroyChildren();

    // Create main rectangle
    this.createMainRectangle();

    // Create selection indicator if selected
    if (this.state.isSelected) {
      this.createSelectionIndicator();
    }

    // Create label if enabled
    if (this.renderOptions.showLabel) {
      this.createRectangleLabel();
    }

    // Redraw the layer
    this.konvaGroup.getLayer()?.batchDraw();
  }

  private createMainRectangle(): void {
    const config = this.metadata.renderer.config || {};
    const cornerRadius = config.cornerRadius || 0;

    this.mainRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.metadata.dimensions.width,
      height: this.metadata.dimensions.height,
      fill: this.getStateColor(),
      stroke: '#000',
      strokeWidth: this.state.isSelected ? 2 : 1,
      cornerRadius: cornerRadius,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false, // Performance optimization
    });

    this.konvaGroup.add(this.mainRect);
  }

  private createSelectionIndicator(): void {
    this.selectionRect = new Konva.Rect({
      x: -3,
      y: -3,
      width: this.metadata.dimensions.width + 6,
      height: this.metadata.dimensions.height + 6,
      fill: 'transparent',
      stroke: this.renderOptions.selectionColor,
      strokeWidth: 2,
      dash: [5, 5],
      opacity: 0.8,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.selectionRect);
  }

  protected createRectangleLabel(): void {
    this.labelText = new Konva.Text({
      text: this.metadata.name,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: this.getContrastColor(),
      align: 'center',
      verticalAlign: 'middle',
      width: this.metadata.dimensions.width,
      height: this.metadata.dimensions.height,
      x: 0,
      y: 0,
      perfectDrawEnabled: false,
    });

    // Center the text
    this.labelText.offsetX(this.labelText.width() / 2);
    this.labelText.offsetY(this.labelText.height() / 2);
    this.labelText.x(this.metadata.dimensions.width / 2);
    this.labelText.y(this.metadata.dimensions.height / 2);

    this.konvaGroup.add(this.labelText);
  }

  private getContrastColor(): string {
    // Simple contrast calculation
    const color = this.metadata.appearance.color;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Override to provide rectangle-specific bounds
  getBounds(): { x: number; y: number; width: number; height: number } {
    const transform = this.getTransform();
    return {
      x: transform.x,
      y: transform.y,
      width: this.metadata.dimensions.width * transform.scaleX,
      height: this.metadata.dimensions.height * transform.scaleY,
    };
  }

  // Override to provide better hit testing for rectangles
  hitTest(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return x >= bounds.x &&
           x <= bounds.x + bounds.width &&
           y >= bounds.y &&
           y <= bounds.y + bounds.height;
  }
}
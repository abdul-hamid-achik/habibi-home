import Konva from 'konva';
import { BaseSmartFigure, FigureRenderOptions, FigureTransform } from './base';
import { FurnitureRegistryEntry } from '../registry';

export class SofaFigure extends BaseSmartFigure {
  private mainBody: Konva.Rect | null = null;
  private backrest: Konva.Rect | null = null;
  private armrest1: Konva.Rect | null = null;
  private armrest2: Konva.Rect | null = null;
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

    // Create sofa components
    this.createSofaBody();
    this.createBackrest();
    this.createArmrests();

    // Create selection indicator if selected
    if (this.state.isSelected) {
      this.createSelectionIndicator();
    }

    // Create label if enabled
    if (this.renderOptions.showLabel) {
      this.createSofaLabel();
    }

    // Redraw the layer
    this.konvaGroup.getLayer()?.batchDraw();
  }

  private createSofaBody(): void {
    const config = this.metadata.renderer.config || {};
    const cornerRadius = config.cornerRadius || 8;

    // Main seating area - slightly smaller than full dimensions to show structure
    const bodyWidth = this.metadata.dimensions.width * 0.85;
    const bodyHeight = this.metadata.dimensions.height * 0.7;
    const offsetX = (this.metadata.dimensions.width - bodyWidth) / 2;
    const offsetY = this.metadata.dimensions.height - bodyHeight;

    this.mainBody = new Konva.Rect({
      x: offsetX,
      y: offsetY,
      width: bodyWidth,
      height: bodyHeight,
      fill: this.getStateColor(),
      stroke: '#000',
      strokeWidth: this.state.isSelected ? 2 : 1,
      cornerRadius: cornerRadius,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.mainBody);
  }

  private createBackrest(): void {
    const config = this.metadata.renderer.config || {};
    const cornerRadius = Math.max(4, (config.cornerRadius || 8) - 2);

    // Backrest along the top
    const backWidth = this.metadata.dimensions.width * 0.75;
    const backHeight = this.metadata.dimensions.height * 0.35;
    const offsetX = (this.metadata.dimensions.width - backWidth) / 2;

    this.backrest = new Konva.Rect({
      x: offsetX,
      y: 0,
      width: backWidth,
      height: backHeight,
      fill: this.getDarkerColor(this.getStateColor()),
      stroke: '#000',
      strokeWidth: 1,
      cornerRadius: cornerRadius,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.backrest);
  }

  private createArmrests(): void {
    const config = this.metadata.renderer.config || {};
    const cornerRadius = Math.max(3, (config.cornerRadius || 8) - 3);

    // Armrest dimensions
    const armWidth = this.metadata.dimensions.width * 0.12;
    const armHeight = this.metadata.dimensions.height * 0.6;
    const armY = this.metadata.dimensions.height * 0.25;

    // Left armrest
    this.armrest1 = new Konva.Rect({
      x: 0,
      y: armY,
      width: armWidth,
      height: armHeight,
      fill: this.getDarkerColor(this.getStateColor()),
      stroke: '#000',
      strokeWidth: 1,
      cornerRadius: cornerRadius,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false,
    });

    // Right armrest
    this.armrest2 = new Konva.Rect({
      x: this.metadata.dimensions.width - armWidth,
      y: armY,
      width: armWidth,
      height: armHeight,
      fill: this.getDarkerColor(this.getStateColor()),
      stroke: '#000',
      strokeWidth: 1,
      cornerRadius: cornerRadius,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.armrest1);
    this.konvaGroup.add(this.armrest2);
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

  protected createSofaLabel(): void {
    this.labelText = new Konva.Text({
      text: this.metadata.name,
      fontSize: 11,
      fontFamily: 'Arial',
      fill: this.getContrastColor(),
      align: 'center',
      verticalAlign: 'middle',
      width: this.metadata.dimensions.width * 0.8,
      height: 20,
      x: this.metadata.dimensions.width * 0.1,
      y: this.metadata.dimensions.height * 0.55, // Position on the main body
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.labelText);
  }

  private getDarkerColor(color: string): string {
    // Convert hex to RGB and darken by 20%
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * 0.8);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * 0.8);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * 0.8);

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  }

  private getContrastColor(): string {
    // Simple contrast calculation
    const color = this.getStateColor();
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Override to provide sofa-specific bounds
  getBounds(): { x: number; y: number; width: number; height: number } {
    const transform = this.getTransform();
    return {
      x: transform.x,
      y: transform.y,
      width: this.metadata.dimensions.width * transform.scaleX,
      height: this.metadata.dimensions.height * transform.scaleY,
    };
  }

  // Override to provide better hit testing for sofas
  hitTest(x: number, y: number): boolean {
    const bounds = this.getBounds();
    return x >= bounds.x &&
           x <= bounds.x + bounds.width &&
           y >= bounds.y &&
           y <= bounds.y + bounds.height;
  }

  // Sofa-specific validation - prefer placement against walls
  canPlaceAt(x: number, y: number): boolean {
    if (!super.canPlaceAt(x, y)) return false;

    // Additional sofa-specific logic could go here
    // For example, checking wall proximity if placement constraints are defined
    const placement = this.metadata.placement;
    if (placement?.wallDistance) {
      // Implementation would check distance to nearest wall
      // For now, just return true
    }

    return true;
  }
}
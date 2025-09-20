import Konva from 'konva';
import { BaseSmartFigure, FigureRenderOptions, FigureTransform } from './base';
import { FurnitureRegistryEntry } from '../registry';

export class CircularFigure extends BaseSmartFigure {
  private mainCircle: Konva.Circle | null = null;
  private innerCircle: Konva.Circle | null = null;
  private selectionCircle: Konva.Circle | null = null;
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

    // Create circular components
    this.createMainCircle();
    this.createInnerDetail();

    // Create selection indicator if selected
    if (this.state.isSelected) {
      this.createSelectionIndicator();
    }

    // Create label if enabled
    if (this.renderOptions.showLabel) {
      this.createCircularLabel();
    }

    // Redraw the layer
    this.konvaGroup.getLayer()?.batchDraw();
  }

  private createMainCircle(): void {
    // Use the smaller dimension to ensure it fits in both width and height
    const radius = Math.min(this.metadata.dimensions.width, this.metadata.dimensions.height) / 2;
    const centerX = this.metadata.dimensions.width / 2;
    const centerY = this.metadata.dimensions.height / 2;

    this.mainCircle = new Konva.Circle({
      x: centerX,
      y: centerY,
      radius: radius,
      fill: this.getStateColor(),
      stroke: '#000',
      strokeWidth: this.state.isSelected ? 2 : 1,
      opacity: this.renderOptions.opacity,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.mainCircle);
  }

  private createInnerDetail(): void {
    // Create an inner circle for depth (like a plant pot rim or decorative element)
    const mainRadius = Math.min(this.metadata.dimensions.width, this.metadata.dimensions.height) / 2;
    const innerRadius = mainRadius * 0.7;
    const centerX = this.metadata.dimensions.width / 2;
    const centerY = this.metadata.dimensions.height / 2;

    // Different styling based on category
    let innerColor = this.getDarkerColor(this.getStateColor());
    let innerOpacity = 0.6;

    if (this.metadata.category === 'decor') {
      // For plants, create a darker inner circle to represent the pot
      innerColor = this.getDarkerColor(this.getStateColor());
      innerOpacity = 0.8;
    }

    this.innerCircle = new Konva.Circle({
      x: centerX,
      y: centerY,
      radius: innerRadius,
      fill: innerColor,
      stroke: '#000',
      strokeWidth: 0.5,
      opacity: innerOpacity,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.innerCircle);
  }

  private createSelectionIndicator(): void {
    const radius = Math.min(this.metadata.dimensions.width, this.metadata.dimensions.height) / 2;
    const centerX = this.metadata.dimensions.width / 2;
    const centerY = this.metadata.dimensions.height / 2;

    this.selectionCircle = new Konva.Circle({
      x: centerX,
      y: centerY,
      radius: radius + 4,
      fill: 'transparent',
      stroke: this.renderOptions.selectionColor,
      strokeWidth: 2,
      dash: [5, 5],
      opacity: 0.8,
      perfectDrawEnabled: false,
    });

    this.konvaGroup.add(this.selectionCircle);
  }

  protected createCircularLabel(): void {
    const centerX = this.metadata.dimensions.width / 2;
    const centerY = this.metadata.dimensions.height / 2;

    this.labelText = new Konva.Text({
      text: this.metadata.name,
      fontSize: 10,
      fontFamily: 'Arial',
      fill: this.getContrastColor(),
      align: 'center',
      verticalAlign: 'middle',
      perfectDrawEnabled: false,
    });

    // Center the text manually
    const textWidth = this.labelText.width();
    const textHeight = this.labelText.height();

    this.labelText.setAttrs({
      x: centerX - textWidth / 2,
      y: centerY - textHeight / 2,
    });

    this.konvaGroup.add(this.labelText);
  }

  private getDarkerColor(color: string): string {
    // Convert hex to RGB and darken by 30%
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * 0.7);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * 0.7);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * 0.7);

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

  // Override to provide circular bounds
  getBounds(): { x: number; y: number; width: number; height: number } {
    const transform = this.getTransform();
    const radius = Math.min(this.metadata.dimensions.width, this.metadata.dimensions.height) / 2;
    const centerX = this.metadata.dimensions.width / 2;
    const centerY = this.metadata.dimensions.height / 2;

    return {
      x: transform.x + centerX - radius * transform.scaleX,
      y: transform.y + centerY - radius * transform.scaleY,
      width: radius * 2 * transform.scaleX,
      height: radius * 2 * transform.scaleY,
    };
  }

  // Override to provide circular hit testing
  hitTest(x: number, y: number): boolean {
    const transform = this.getTransform();
    const radius = Math.min(this.metadata.dimensions.width, this.metadata.dimensions.height) / 2;
    const centerX = transform.x + this.metadata.dimensions.width / 2;
    const centerY = transform.y + this.metadata.dimensions.height / 2;

    const distance = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );

    return distance <= radius * Math.max(transform.scaleX, transform.scaleY);
  }

  // Circular items typically can't be rotated meaningfully
  canRotate(rotation: number): boolean {
    // For plants and other circular decor, rotation doesn't make sense
    if (this.metadata.category === 'decor') {
      return false;
    }
    return super.canRotate(rotation);
  }

  // Override placement logic for circular items
  canPlaceAt(x: number, y: number): boolean {
    if (!super.canPlaceAt(x, y)) return false;

    // Circular items might need clearance from walls and other furniture
    const placement = this.metadata.placement;
    if (placement?.requiredClearance) {
      // Implementation would check clearance around the circular area
      // For now, just return true
    }

    return true;
  }
}
// Smart figures exports
export {
  type ISmartFigure,
  BaseSmartFigure,
  type FigureTransform,
  type FigureState,
  type FigureRenderOptions,
  figureTransformSchema,
  figureStateSchema,
  figureRenderOptionsSchema,
} from './base';

export { RectangleFigure } from './rectangle_figure';
export { SofaFigure } from './sofa_figure';
export { CircularFigure } from './circular_figure';

export {
  SmartFigureFactory,
  createSmartFigure,
  createSmartFigures,
} from './factory';

// Re-export for convenience
export type { FurnitureRegistryEntry } from '../registry';

// Smart figure manager for handling collections of figures
import { ISmartFigure } from './base';
import { SmartFigureFactory } from './factory';
import Konva from 'konva';

export class SmartFigureManager {
  private figures: Map<string, ISmartFigure> = new Map();
  private layer: Konva.Layer;
  private selectedFigureId: string | null = null;

  constructor(layer: Konva.Layer) {
    this.layer = layer;
  }

  // Figure management
  addFigure(figure: ISmartFigure): void {
    this.figures.set(figure.id, figure);
    this.layer.add(figure.getKonvaGroup());

    // Set up event handlers
    figure.onSelect((f) => this.selectFigure(f.id));
    figure.onDeselect((f) => this.deselectFigure(f.id));

    this.layer.batchDraw();
  }

  removeFigure(figureId: string): boolean {
    const figure = this.figures.get(figureId);
    if (figure) {
      figure.destroy();
      this.figures.delete(figureId);

      if (this.selectedFigureId === figureId) {
        this.selectedFigureId = null;
      }

      this.layer.batchDraw();
      return true;
    }
    return false;
  }

  getFigure(figureId: string): ISmartFigure | undefined {
    return this.figures.get(figureId);
  }

  getAllFigures(): ISmartFigure[] {
    return Array.from(this.figures.values());
  }

  // Selection management
  selectFigure(figureId: string): void {
    // Deselect current figure
    if (this.selectedFigureId) {
      const currentFigure = this.figures.get(this.selectedFigureId);
      if (currentFigure) {
        currentFigure.setState({ isSelected: false });
        currentFigure.render();
      }
    }

    // Select new figure
    const figure = this.figures.get(figureId);
    if (figure) {
      figure.setState({ isSelected: true });
      figure.render();
      this.selectedFigureId = figureId;
    }

    this.layer.batchDraw();
  }

  deselectFigure(figureId: string): void {
    const figure = this.figures.get(figureId);
    if (figure) {
      figure.setState({ isSelected: false });
      figure.render();
    }

    if (this.selectedFigureId === figureId) {
      this.selectedFigureId = null;
    }

    this.layer.batchDraw();
  }

  getSelectedFigure(): ISmartFigure | null {
    return this.selectedFigureId ? this.figures.get(this.selectedFigureId) || null : null;
  }

  clearSelection(): void {
    if (this.selectedFigureId) {
      this.deselectFigure(this.selectedFigureId);
    }
  }

  // Batch operations
  selectAll(): void {
    this.figures.forEach(figure => {
      figure.setState({ isSelected: true });
      figure.render();
    });
    this.layer.batchDraw();
  }

  deleteSelected(): void {
    if (this.selectedFigureId) {
      this.removeFigure(this.selectedFigureId);
    }
  }

  duplicateSelected(): ISmartFigure | null {
    const selected = this.getSelectedFigure();
    if (!selected) return null;

    const transform = selected.getTransform();
    const newTransform = {
      ...transform,
      x: transform.x + 20,
      y: transform.y + 20,
    };

    const newFigureId = `${selected.id}_copy_${Date.now()}`;
    // Create a new figure of the same type using the factory
    const newFigure = SmartFigureFactory.createFromMetadata(
      selected.metadata,
      newFigureId,
      newTransform
    );

    this.addFigure(newFigure);
    this.selectFigure(newFigureId);

    return newFigure;
  }

  // Rendering
  renderAll(): void {
    this.figures.forEach(figure => figure.render());
    this.layer.batchDraw();
  }

  // Cleanup
  clear(): void {
    this.figures.forEach(figure => figure.destroy());
    this.figures.clear();
    this.selectedFigureId = null;
    this.layer.removeChildren();
    this.layer.batchDraw();
  }

  // Hit testing
  getFigureAt(x: number, y: number): ISmartFigure | null {
    for (const figure of this.figures.values()) {
      if (figure.hitTest(x, y)) {
        return figure;
      }
    }
    return null;
  }

  // Statistics
  getStats(): {
    totalFigures: number;
    selectedFigure: string | null;
    figuresByCategory: Record<string, number>;
  } {
    const figuresByCategory: Record<string, number> = {};

    this.figures.forEach(figure => {
      const category = figure.metadata.category;
      figuresByCategory[category] = (figuresByCategory[category] || 0) + 1;
    });

    return {
      totalFigures: this.figures.size,
      selectedFigure: this.selectedFigureId,
      figuresByCategory,
    };
  }
}
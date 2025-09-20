import { ISmartFigure, FigureTransform, FigureRenderOptions } from './base';
import { RectangleFigure } from './rectangle_figure';
import { SofaFigure } from './sofa_figure';
import { CircularFigure } from './circular_figure';
import { FurnitureRegistryEntry, furnitureRegistry } from '../registry';

// Smart figure factory for creating appropriate figure types
export class SmartFigureFactory {
  // Map of renderer types to figure classes
  private static figureTypeMap = {
    'basic': RectangleFigure,
    'rectangle': RectangleFigure,
    'sofa': SofaFigure,
    'circular': CircularFigure,
    'plant': CircularFigure,
  };

  /**
   * Create a smart figure from furniture registry entry
   */
  static createFromRegistry(
    furnitureId: string,
    figureId: string,
    initialTransform: Partial<FigureTransform> = {},
    options: Partial<FigureRenderOptions> = {}
  ): ISmartFigure | null {
    const metadata = furnitureRegistry.get(furnitureId);
    if (!metadata) {
      console.error(`Furniture ${furnitureId} not found in registry`);
      return null;
    }

    return this.createFromMetadata(metadata, figureId, initialTransform, options);
  }

  /**
   * Create a smart figure from metadata
   */
  static createFromMetadata(
    metadata: FurnitureRegistryEntry,
    figureId: string,
    initialTransform: Partial<FigureTransform> = {},
    options: Partial<FigureRenderOptions> = {}
  ): ISmartFigure {
    const figureType = this.determineFigureType(metadata);
    const FigureClass = this.figureTypeMap[figureType] || RectangleFigure;

    return new FigureClass(
      figureId,
      metadata.id,
      metadata,
      initialTransform,
      options
    );
  }

  /**
   * Determine the appropriate figure type based on metadata
   */
  private static determineFigureType(metadata: FurnitureRegistryEntry): keyof typeof SmartFigureFactory.figureTypeMap {
    // Check renderer type first
    if (metadata.renderer.type && metadata.renderer.type in this.figureTypeMap) {
      return metadata.renderer.type as keyof typeof SmartFigureFactory.figureTypeMap;
    }

    // Check renderer config for specific figure type
    if (metadata.renderer.config?.figureType) {
      const configType = metadata.renderer.config.figureType;
      if (configType in this.figureTypeMap) {
        return configType;
      }
    }

    // Determine based on category and other properties
    switch (metadata.category) {
      case 'sofa':
        return 'sofa';

      case 'decor':
        // Check if it's a plant or circular item
        if (metadata.name.toLowerCase().includes('plant') ||
            metadata.renderer.config?.cornerRadius === 20) {
          return 'circular';
        }
        return 'basic';

      case 'table':
        // Round tables might be circular
        if (metadata.name.toLowerCase().includes('round') ||
            metadata.dimensions.width === metadata.dimensions.height) {
          return 'circular';
        }
        return 'basic';

      default:
        return 'basic';
    }
  }

  /**
   * Register a new figure type
   */
  static registerFigureType(
    name: string,
    figureClass: new (
      id: string,
      furnitureId: string,
      metadata: FurnitureRegistryEntry,
      initialTransform?: Partial<FigureTransform>,
      options?: Partial<FigureRenderOptions>
    ) => ISmartFigure
  ): void {
    (this.figureTypeMap as Record<string, typeof figureClass>)[name] = figureClass;
  }

  /**
   * Get available figure types
   */
  static getAvailableFigureTypes(): string[] {
    return Object.keys(this.figureTypeMap);
  }

  /**
   * Create multiple figures from furniture IDs
   */
  static createMultiple(
    furnitureItems: Array<{
      furnitureId: string;
      figureId: string;
      transform?: Partial<FigureTransform>;
      options?: Partial<FigureRenderOptions>;
    }>
  ): ISmartFigure[] {
    const figures: ISmartFigure[] = [];

    for (const item of furnitureItems) {
      const figure = this.createFromRegistry(
        item.furnitureId,
        item.figureId,
        item.transform,
        item.options
      );

      if (figure) {
        figures.push(figure);
      }
    }

    return figures;
  }
}

// Utility function for creating figures with automatic ID generation
export function createSmartFigure(
  furnitureId: string,
  transform: Partial<FigureTransform> = {},
  options: Partial<FigureRenderOptions> = {}
): ISmartFigure | null {
  const figureId = `figure_${furnitureId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return SmartFigureFactory.createFromRegistry(furnitureId, figureId, transform, options);
}

// Utility function for batch creation
export function createSmartFigures(
  furnitureItems: Array<{
    furnitureId: string;
    transform?: Partial<FigureTransform>;
    options?: Partial<FigureRenderOptions>;
  }>
): ISmartFigure[] {
  return furnitureItems.map((item, index) => {
    const figureId = `figure_${item.furnitureId}_${Date.now()}_${index}`;
    return SmartFigureFactory.createFromRegistry(
      item.furnitureId,
      figureId,
      item.transform,
      item.options
    );
  }).filter(Boolean) as ISmartFigure[];
}
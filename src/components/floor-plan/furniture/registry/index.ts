import type { FurnitureDefinition } from './schemas';

// Import all furniture definitions
import { large_sofa } from '../sofa/large_sofa';
import { medium_sofa } from '../sofa/medium_sofa';
import { small_sofa } from '../sofa/small_sofa';
import { armchair } from '../chair/armchair';
import { dining_table_large } from '../table/dining_table_large';
import { coffee_table } from '../table/coffee_table';
import { queen_bed } from '../bed/queen_bed';
import { single_bed } from '../bed/single_bed';
import { dresser } from '../storage/dresser';
import { refrigerator } from '../appliance/refrigerator';
import { tv_55_inch } from '../electronics/tv_55_inch';
import { large_plant } from '../decor/large_plant';

// Furniture registry - collection of all furniture definitions
export const furniture_registry: Record<string, FurnitureDefinition> = {
  large_sofa,
  medium_sofa,
  small_sofa,
  armchair,
  dining_table_large,
  coffee_table,
  queen_bed,
  single_bed,
  dresser,
  refrigerator,
  tv_55_inch,
  large_plant,
};

// Helper functions
export function getAllFurniture(): FurnitureDefinition[] {
  return Object.values(furniture_registry);
}

export function getFurnitureById(id: string): FurnitureDefinition | undefined {
  return furniture_registry[id];
}

export function getFurnitureByCategory(category: string): FurnitureDefinition[] {
  return getAllFurniture().filter(furniture => furniture.category === category);
}

export function getFurnitureCategories(): string[] {
  const categories = new Set(getAllFurniture().map(furniture => furniture.category));
  return Array.from(categories).sort();
}

// Legacy compatibility function
export function getAllFurnitureLegacy() {
  return getAllFurniture().map(furniture => ({
    id: furniture.id,
    name: furniture.name,
    category: furniture.category,
    dimensions: {
      width: furniture.default_size.w,
      height: furniture.default_size.h,
    },
    appearance: {
      color: furniture.default_color,
      opacity: 1,
    },
    metadata: {
      description: "",
      tags: [],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: furniture.constraints.rotation_step_deg || 90,
    },
    placement: {},
    renderer: {
      type: "konva" as const,
      config: {},
    },
  }));
}

// Export everything from schemas for convenience
export * from './schemas';
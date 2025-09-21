// Main furniture registry exports
export {
  FurnitureRegistryManager,
  furnitureRegistry,
  validateFurnitureMetadata,
  validateFurnitureRegistry,
  type FurnitureMetadata,
  type FurnitureRegistryEntry,
  type FurnitureRegistry,
  furnitureMetadataSchema,
  furnitureRegistryEntrySchema,
  furnitureRegistrySchema,
} from "./registry";

export { DEFAULT_FURNITURE_ITEMS } from "./default_items";

// New modular furniture system exports
export {
  furniture_registry,
  getAllFurniture as getAllFurnitureNew,
  getFurnitureById as getFurnitureByIdNew,
  getFurnitureByCategory as getFurnitureByCategoryNew,
  getFurnitureCategories,
  getAllFurnitureLegacy as getAllFurnitureLegacyNew,
  type FurnitureDefinition,
  type FurnitureRenderProps,
  type FurnitureDefinitionMetadata,
} from "./registry/";

// Initialize the default registry
import { furnitureRegistry, type FurnitureRegistryEntry } from "./registry";
import { DEFAULT_FURNITURE_ITEMS } from "./default_items";

// Register all default furniture items
for (const [id, item] of Object.entries(DEFAULT_FURNITURE_ITEMS)) {
  try {
    furnitureRegistry.register(item);
  } catch (error) {
    console.error(`Failed to register furniture item ${id}:`, error);
  }
}

// Utility functions for backward compatibility and easy access
export function getFurnitureById(id: string) {
  return furnitureRegistry.get(id);
}

export function getFurnitureByCategory(category: string) {
  return furnitureRegistry.getAllByCategory(category);
}

export function getAllFurniture() {
  return furnitureRegistry.getAll();
}

export function searchFurniture(query: string) {
  return furnitureRegistry.search(query);
}

// Convert registry entry to legacy FurnitureSpec format for compatibility
export function toLegacyFurnitureSpec(entry: FurnitureRegistryEntry) {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    width: entry.dimensions.width,
    height: entry.dimensions.height,
    depth: entry.dimensions.depth,
    color: entry.appearance.color,
  };
}

// Convert all registry entries to legacy format
export function getAllFurnitureLegacy() {
  const registry = furnitureRegistry.getAll();
  return Object.values(registry).map(toLegacyFurnitureSpec);
}

// Validation status
const validation = furnitureRegistry.validate();
if (!validation.isValid) {
  console.error('Furniture registry validation failed:', validation.errors);
} else {
  console.log(`Furniture registry initialized with ${furnitureRegistry.list().length} items`);
}
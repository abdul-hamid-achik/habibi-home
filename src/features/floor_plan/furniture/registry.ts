import { z } from "zod";
import { validateCategoryId } from "@/features/floor_plan/data/categories";

// Core furniture metadata schema
export const furnitureMetadataSchema = z.object({
  // Core identification
  id: z.string()
    .min(1, "Furniture ID is required")
    .regex(/^[a-z0-9_]+$/, "ID must use snake_case (lowercase letters, numbers, underscores only)"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),

  // Physical dimensions (in cm)
  dimensions: z.object({
    width: z.number().positive("Width must be positive"),
    height: z.number().positive("Height must be positive"),
    depth: z.number().positive("Depth must be positive").optional(),
  }),

  // Visual properties
  appearance: z.object({
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"),
    opacity: z.number().min(0).max(1).default(1),
  }),

  // Registry metadata
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    isDefault: z.boolean().default(true),
    version: z.string().default("1.0.0"),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
  }),

  // Behavior configuration
  behavior: z.object({
    isMovable: z.boolean().default(true),
    isResizable: z.boolean().default(false),
    isRotatable: z.boolean().default(true),
    snapToGrid: z.boolean().default(true),
    minRotation: z.number().default(0),
    maxRotation: z.number().default(360),
    rotationStep: z.number().default(90),
  }).optional(),

  // Placement constraints
  placement: z.object({
    allowedZones: z.array(z.string()).optional(), // Zone IDs where this can be placed
    requiredClearance: z.object({
      front: z.number().default(0),
      back: z.number().default(0),
      left: z.number().default(0),
      right: z.number().default(0),
    }).optional(),
    wallDistance: z.object({
      min: z.number().default(0),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
});

// Registry entry schema
export const furnitureRegistryEntrySchema = furnitureMetadataSchema.extend({
  // Renderer configuration
  renderer: z.object({
    type: z.enum(["basic", "konva", "custom"]).default("basic"),
    config: z.record(z.any()).optional(), // Renderer-specific configuration
  }),
});

// Registry schema
export const furnitureRegistrySchema = z.record(
  z.string(), // furniture ID as key
  furnitureRegistryEntrySchema
);

// Type exports
export type FurnitureMetadata = z.infer<typeof furnitureMetadataSchema>;
export type FurnitureRegistryEntry = z.infer<typeof furnitureRegistryEntrySchema>;
export type FurnitureRegistry = z.infer<typeof furnitureRegistrySchema>;

// Validation functions
export function validateFurnitureMetadata(metadata: unknown): FurnitureMetadata {
  const result = furnitureMetadataSchema.safeParse(metadata);
  if (!result.success) {
    throw new Error(`Invalid furniture metadata: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }

  // Additional validation: check if category exists
  if (!validateCategoryId(result.data.category)) {
    throw new Error(`Invalid category: ${result.data.category}`);
  }

  return result.data;
}

export function validateFurnitureRegistry(registry: unknown): FurnitureRegistry {
  const result = furnitureRegistrySchema.safeParse(registry);
  if (!result.success) {
    throw new Error(`Invalid furniture registry: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }

  // Additional validation: ensure all categories are valid
  for (const [id, entry] of Object.entries(result.data)) {
    if (!validateCategoryId(entry.category)) {
      throw new Error(`Invalid category for furniture ${id}: ${entry.category}`);
    }

    // Ensure ID matches the key
    if (entry.id !== id) {
      throw new Error(`Furniture ID mismatch: key is ${id}, but entry.id is ${entry.id}`);
    }
  }

  return result.data;
}

// Registry management class
export class FurnitureRegistryManager {
  private registry: FurnitureRegistry = {};

  constructor(initialRegistry?: FurnitureRegistry) {
    if (initialRegistry) {
      this.registry = validateFurnitureRegistry(initialRegistry);
    }
  }

  // Registry operations
  register(entry: FurnitureRegistryEntry): void {
    const validated = validateFurnitureMetadata(entry);
    this.registry[validated.id] = { ...validated, renderer: entry.renderer || { type: "basic" } };
  }

  unregister(id: string): boolean {
    if (this.registry[id]) {
      delete this.registry[id];
      return true;
    }
    return false;
  }

  get(id: string): FurnitureRegistryEntry | undefined {
    return this.registry[id];
  }

  getAll(): FurnitureRegistry {
    return { ...this.registry };
  }

  getAllByCategory(category: string): FurnitureRegistryEntry[] {
    return Object.values(this.registry).filter(entry => entry.category === category);
  }

  exists(id: string): boolean {
    return id in this.registry;
  }

  list(): string[] {
    return Object.keys(this.registry);
  }

  search(query: string): FurnitureRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Object.values(this.registry).filter(entry =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.category.toLowerCase().includes(lowerQuery) ||
      entry.metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // Utility methods
  getDimensions(id: string): { width: number; height: number; depth?: number } | undefined {
    const entry = this.get(id);
    return entry?.dimensions;
  }

  getColor(id: string): string | undefined {
    const entry = this.get(id);
    return entry?.appearance.color;
  }

  canPlaceInZone(furnitureId: string, zoneId: string): boolean {
    const entry = this.get(furnitureId);
    if (!entry?.placement?.allowedZones) return true; // No restrictions
    return entry.placement.allowedZones.includes(zoneId);
  }

  // Validation
  validate(): { isValid: boolean; errors: string[] } {
    try {
      validateFurnitureRegistry(this.registry);
      return { isValid: true, errors: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: error instanceof Error ? [error.message] : ['Unknown validation error']
      };
    }
  }
}

// Create global registry instance
export const furnitureRegistry = new FurnitureRegistryManager();
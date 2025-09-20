import { z } from 'zod';
import { getAllFurnitureLegacy } from '@/features/floor_plan/furniture';

export interface FurnitureSpec {
  id: string;
  name: string;
  category: string;
  width: number; // cm
  height: number; // cm
  depth?: number; // cm (for 3D representation)
  color: string;
}

// Zod schemas for validation
export const furnitureSpecSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  depth: z.number().positive('Depth must be positive').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
});

export const furnitureCatalogSchema = z.array(furnitureSpecSchema);

export type FurnitureSpecInput = z.input<typeof furnitureSpecSchema>;
export type FurnitureSpecOutput = z.output<typeof furnitureSpecSchema>;

// Validation function
export function validateFurnitureCatalog(catalog: unknown): FurnitureSpec[] {
  const result = furnitureCatalogSchema.safeParse(catalog);
  if (!result.success) {
    throw new Error(`Invalid furniture catalog: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }
  return result.data;
}

// Use furniture registry as the source of truth
export const DEFAULT_FURNITURE_CATALOG: FurnitureSpec[] = getAllFurnitureLegacy();

// Validate the default catalog on module load
try {
  validateFurnitureCatalog(DEFAULT_FURNITURE_CATALOG);
} catch (error) {
  console.error('Default furniture catalog validation failed:', error);
}


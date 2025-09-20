import { z } from "zod";

// Zod schema for furniture category validation
export const furnitureCategorySchema = z.object({
  id: z.string().min(1, "Category ID is required"),
  name: z.string().min(1, "Category name is required"),
  icon: z.string().min(1, "Category icon is required"),
  description: z.string().optional(),
});

export const furnitureCategoriesSchema = z.array(furnitureCategorySchema);

// Type exports
export type FurnitureCategory = z.infer<typeof furnitureCategorySchema>;

// Validation function
export function validateFurnitureCategories(categories: unknown): FurnitureCategory[] {
  const result = furnitureCategoriesSchema.safeParse(categories);
  if (!result.success) {
    throw new Error(`Invalid furniture categories: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }
  return result.data;
}

// Centralized furniture categories with Zod validation
export const FURNITURE_CATEGORIES: FurnitureCategory[] = [
  { id: "sofa", name: "Sofas", icon: "🛋️", description: "Living room seating" },
  { id: "chair", name: "Chairs", icon: "🪑", description: "Individual seating" },
  { id: "table", name: "Tables", icon: "🪨", description: "Dining and side tables" },
  { id: "desk", name: "Desks", icon: "🖥️", description: "Work surfaces" },
  { id: "bed", name: "Beds", icon: "🛏️", description: "Bedroom furniture" },
  { id: "storage", name: "Storage", icon: "🗄️", description: "Cabinets and wardrobes" },
  { id: "appliance", name: "Appliances", icon: "🏠", description: "Kitchen and laundry appliances" },
  { id: "electronics", name: "Electronics", icon: "📺", description: "TVs and entertainment" },
  { id: "decor", name: "Decor", icon: "🪴", description: "Decorative items" },
];

// Utility functions
export function getCategoryById(id: string): FurnitureCategory | undefined {
  return FURNITURE_CATEGORIES.find(category => category.id === id);
}

export function getCategoryNames(): string[] {
  return FURNITURE_CATEGORIES.map(category => category.name);
}

export function getCategoryIds(): string[] {
  return FURNITURE_CATEGORIES.map(category => category.id);
}

export function validateCategoryId(id: string): boolean {
  return FURNITURE_CATEGORIES.some(category => category.id === id);
}

// Validate categories on module load
try {
  validateFurnitureCategories(FURNITURE_CATEGORIES);
} catch (error) {
  console.error('Furniture categories validation failed:', error);
}
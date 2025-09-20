import { z } from "zod";

// Zod schemas for seed data validation
export const apartmentZoneSchema = z.object({
  id: z.string().min(1, "Zone ID is required"),
  zoneId: z.string().min(1, "Zone identifier is required"),
  name: z.string().min(1, "Zone name is required"),
  x: z.number().min(0, "X coordinate must be non-negative"),
  y: z.number().min(0, "Y coordinate must be non-negative"),
  w: z.number().min(1, "Width must be positive"),
  h: z.number().min(1, "Height must be positive"),
});

export const furnitureLayoutItemSchema = z.object({
  name: z.string().min(1, "Furniture name is required"),
  x: z.number().min(0, "X coordinate must be non-negative"),
  y: z.number().min(0, "Y coordinate must be non-negative"),
  r: z.number().min(0).max(360, "Rotation must be between 0-360 degrees"),
  zoneId: z.string().min(1, "Zone ID is required"),
});

export const apartmentZonesSchema = z.array(apartmentZoneSchema);
export const furnitureLayoutSchema = z.array(furnitureLayoutItemSchema);

// Type exports
export type ApartmentZone = z.infer<typeof apartmentZoneSchema>;
export type FurnitureLayoutItem = z.infer<typeof furnitureLayoutItemSchema>;

// Validation functions
export function validateApartmentZones(zones: unknown): ApartmentZone[] {
  const result = apartmentZonesSchema.safeParse(zones);
  if (!result.success) {
    throw new Error(`Invalid apartment zones: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }
  return result.data;
}

export function validateFurnitureLayout(layout: unknown): FurnitureLayoutItem[] {
  const result = furnitureLayoutSchema.safeParse(layout);
  if (!result.success) {
    throw new Error(`Invalid furniture layout: ${result.error.issues.map(issue => issue.message).join(', ')}`);
  }
  return result.data;
}

// Default apartment zones for Tipo 7
export const DEFAULT_APARTMENT_ZONES: ApartmentZone[] = [
  // Left column
  { id: "balcony", zoneId: "balcony", name: "balcony", x: 0, y: 720, w: 420, h: 80 },
  { id: "living", zoneId: "living", name: "living room", x: 0, y: 560, w: 420, h: 160 },
  { id: "dining", zoneId: "dining", name: "dining room", x: 0, y: 440, w: 420, h: 120 },
  { id: "kitchen", zoneId: "kitchen", name: "L-shaped kitchen", x: 0, y: 260, w: 420, h: 180 },
  { id: "entry", zoneId: "entry", name: "ENTRY", x: 0, y: 300, w: 120, h: 70 },
  { id: "vestibule", zoneId: "vestibule", name: "vestibule / hallway", x: 120, y: 260, w: 300, h: 180 },
  // Central column
  { id: "hallway", zoneId: "hallway", name: "hallway / core", x: 420, y: 0, w: 230, h: 800 },
  { id: "laundry", zoneId: "laundry", name: "laundry", x: 420, y: 140, w: 230, h: 140 },
  { id: "bathroom1", zoneId: "bathroom1", name: "bathroom 1", x: 420, y: 280, w: 230, h: 160 },
  { id: "bathroom2", zoneId: "bathroom2", name: "bathroom 2", x: 420, y: 440, w: 230, h: 200 },
  // Right column
  { id: "bedroom2", zoneId: "bedroom2", name: "bedroom 2/visits", x: 650, y: 0, w: 400, h: 260 },
  { id: "study", zoneId: "study", name: "study / TV", x: 650, y: 260, w: 400, h: 240 },
  { id: "master_bedroom", zoneId: "master_bedroom", name: "master bedroom", x: 650, y: 500, w: 400, h: 300 },
];

export const DEFAULT_FURNITURE_LAYOUT: FurnitureLayoutItem[] = [
  // Living room (upper left column)
  { name: "large sofa", x: 30, y: 585, r: 0, zoneId: "living" },
  { name: "medium sofa", x: 245, y: 545, r: 90, zoneId: "living" },
  { name: "sideboard", x: 260, y: 705, r: 0, zoneId: "balcony" },
  { name: "coffee table", x: 150, y: 600, r: 0, zoneId: "living" },
  // Dining room
  { name: "dining table 121×245", x: 80, y: 450, r: 0, zoneId: "dining" },
  // TV room (middle right column)
  { name: "blue sofa", x: 680, y: 300, r: 0, zoneId: "study" },
  { name: "small sofa", x: 680, y: 410, r: 0, zoneId: "study" },
  { name: "55\" TV", x: 750, y: 270, r: 0, zoneId: "study" },
  // Master bedroom (lower right)
  { name: "queen bed", x: 700, y: 540, r: 0, zoneId: "master_bedroom" },
  { name: "dresser", x: 938, y: 555, r: 0, zoneId: "master_bedroom" },
  { name: "nightstand", x: 650, y: 580, r: 0, zoneId: "master_bedroom" },
  { name: "nightstand", x: 913, y: 580, r: 0, zoneId: "master_bedroom" },
  // Bedroom 2
  { name: "single bed", x: 700, y: 50, r: 0, zoneId: "bedroom2" },
  { name: "desk", x: 850, y: 150, r: 0, zoneId: "bedroom2" },
];

// Validate seed data on module load
try {
  validateApartmentZones(DEFAULT_APARTMENT_ZONES);
  validateFurnitureLayout(DEFAULT_FURNITURE_LAYOUT);
} catch (error) {
  console.error('Seed data validation failed:', error);
}
import { z } from "zod";

// Additional frontend types that extend database types
export interface FloorPlanZone {
  id: string;
  zoneId: string;
  name: string;
  x: number;
  y: number;
  w: number; // width in cm
  h: number; // height in cm
  color?: string;
  suggestedFurniture?: string[];
}

export interface FurnitureItemType {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number; // width in cm
  h: number; // height in cm
  r: number; // rotation in degrees
  color: string;
  catalogId?: string;
  zoneId?: string;
}

export interface FloorPlanSettings {
  // Frontend-specific properties
  scale: number;
  snap: number; // frontend alias for snapGrid
  showGrid: boolean;
  showDimensions: boolean;
  apartmentWidth: number;
  apartmentHeight: number;
  canvasMode: 'fixed' | 'fit-to-screen' | 'centered';
  maxCanvasWidth?: number;
  maxCanvasHeight?: number;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportedFloorPlanData {
  // Basic properties from ImportedFloorPlan
  id: number;
  shortId: string;
  slug: string;
  userId: string | null;
  originalImageUrl: string | null;
  originalImageWidth: number | null;
  originalImageHeight: number | null;
  analysisData: unknown;
  dimensions: { width: number; height: number };
  zones: FloorPlanZone[];
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isProcessed: boolean;
}

// API request/response schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  apartmentType: z.string().default("type_7"),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Validation schemas for frontend use
export const floorPlanZoneSchema = z.object({
  id: z.string().min(1, "Zone ID is required"),
  zoneId: z.string().min(1, "Zone ID is required"),
  name: z.string().min(1, "Zone name is required"),
  x: z.number().min(0, "X coordinate must be non-negative"),
  y: z.number().min(0, "Y coordinate must be non-negative"),
  w: z.number().min(1, "Width must be positive"),
  h: z.number().min(1, "Height must be positive"),
  color: z.string().optional(),
  type: z.string().optional(),
  suggestedFurniture: z.array(z.string()).optional(),
});

export const furnitureItemSchema = z.object({
  id: z.string().min(1, "Furniture ID is required"),
  name: z.string().min(1, "Furniture name is required"),
  x: z.number().min(0, "X coordinate must be non-negative"),
  y: z.number().min(0, "Y coordinate must be non-negative"),
  w: z.number().min(1, "Width must be positive"),
  h: z.number().min(1, "Height must be positive"),
  r: z.number().min(0).max(360).default(0),
  color: z.string().min(1, "Color is required"),
  catalogId: z.string().uuid().optional(),
  zoneId: z.string().optional(),
});

export const floorPlanSettingsSchema = z.object({
  scale: z.number().min(0.1, "Scale must be positive").max(5, "Scale must be reasonable"),
  snap: z.number().min(1, "Snap grid must be positive").max(100, "Snap grid must be reasonable"),
  showGrid: z.boolean(),
  showDimensions: z.boolean(),
  apartmentWidth: z.number().min(50, "Apartment width must be at least 50cm").max(5000, "Apartment width must be reasonable"),
  apartmentHeight: z.number().min(50, "Apartment height must be at least 50cm").max(5000, "Apartment height must be reasonable"),
  canvasMode: z.enum(['fixed', 'fit-to-screen', 'centered']),
  maxCanvasWidth: z.number().min(100).max(5000).optional(),
  maxCanvasHeight: z.number().min(100).max(5000).optional(),
});

export const zoneSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  type: z.string().optional(),
  color: z.string().optional(),
  suggestedFurniture: z.array(z.string()).optional(),
});

export const saveProjectDataSchema = z.object({
  zones: z.array(zoneSchema),
  furniture: z.array(furnitureItemSchema),
  settings: z.object({
    apartmentWidth: z.number(),
    apartmentHeight: z.number(),
    scale: z.number(),
    snapGrid: z.number(),
    showGrid: z.boolean(),
    showDimensions: z.boolean(),
  }),
});
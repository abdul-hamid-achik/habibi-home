import { z } from "zod";

// Frontend types for the floor plan editor
export interface FloorPlanZone {
  id: string;
  zoneId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  type?: string;
  suggestedFurniture?: string[];
}

export interface FurnitureItemType {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number; // rotation
  color: string;
  catalogId?: string;
  zoneId?: string;
}

export interface FloorPlanSettings {
  scale: number;
  snap: number;
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
  id: number;
  shortId: string;
  slug: string;
  userId?: string;
  originalImageUrl?: string;
  originalImageWidth?: number;
  originalImageHeight?: number;
  analysisData: unknown;
  dimensions: { width: number; height: number };
  zones: FloorPlanZone[];
  projectId?: string;
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

export const furnitureItemSchema = z.object({
  name: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  r: z.number().default(0),
  color: z.string(),
  catalogId: z.string().optional(),
  zoneId: z.string().optional(),
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

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveProjectDataInput = z.infer<typeof saveProjectDataSchema>;
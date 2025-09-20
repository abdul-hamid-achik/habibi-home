/**
 * Zod schemas for floor plan editor settings
 * Provides both legacy camelCase compatibility and new snake_case normalized views
 */

import { z } from "zod";

// Legacy editor settings schema (camelCase for compatibility)
export const editor_settings_schema = z.object({
  apartmentWidth: z.number().min(50).max(5000),
  apartmentHeight: z.number().min(50).max(5000),
  scale: z.number().min(0.1).max(5),
  snap: z.number().min(0).max(100),
  showGrid: z.boolean(),
  showDimensions: z.boolean(),
  canvasMode: z.enum(['fixed', 'fit-to-screen', 'centered']),
  maxCanvasWidth: z.number().min(100).max(5000).optional(),
  maxCanvasHeight: z.number().min(100).max(5000).optional(),
});

// Normalized snake_case schema for new features
export const normalized_editor_settings_schema = z.object({
  apartment_width_cm: z.number().min(50).max(5000),
  apartment_height_cm: z.number().min(50).max(5000),
  scale_px_per_cm: z.number().min(0.1).max(5),
  snap_cm: z.number().min(0).max(100),
  show_grid: z.boolean(),
  show_dimensions: z.boolean(),
  canvas_mode: z.enum(['fixed', 'fit-to-screen', 'centered']),
  max_canvas_width_px: z.number().min(100).max(5000).optional(),
  max_canvas_height_px: z.number().min(100).max(5000).optional(),
});

// Type definitions
export type EditorSettings = z.infer<typeof editor_settings_schema>;
export type NormalizedEditorSettings = z.infer<typeof normalized_editor_settings_schema>;

// Converter functions
export function legacyToNormalized(legacy: EditorSettings): NormalizedEditorSettings {
  return {
    apartment_width_cm: legacy.apartmentWidth,
    apartment_height_cm: legacy.apartmentHeight,
    scale_px_per_cm: legacy.scale,
    snap_cm: legacy.snap,
    show_grid: legacy.showGrid,
    show_dimensions: legacy.showDimensions,
    canvas_mode: legacy.canvasMode,
    max_canvas_width_px: legacy.maxCanvasWidth,
    max_canvas_height_px: legacy.maxCanvasHeight,
  };
}

export function normalizedToLegacy(normalized: NormalizedEditorSettings): EditorSettings {
  return {
    apartmentWidth: normalized.apartment_width_cm,
    apartmentHeight: normalized.apartment_height_cm,
    scale: normalized.scale_px_per_cm,
    snap: normalized.snap_cm,
    showGrid: normalized.show_grid,
    showDimensions: normalized.show_dimensions,
    canvasMode: normalized.canvas_mode,
    maxCanvasWidth: normalized.max_canvas_width_px,
    maxCanvasHeight: normalized.max_canvas_height_px,
  };
}

// Validation helpers
export function validateEditorSettings(settings: unknown): EditorSettings {
  const result = editor_settings_schema.safeParse(settings);
  if (!result.success) {
    throw new Error(`Invalid editor settings: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  return result.data;
}

export function validateNormalizedSettings(settings: unknown): NormalizedEditorSettings {
  const result = normalized_editor_settings_schema.safeParse(settings);
  if (!result.success) {
    throw new Error(`Invalid normalized settings: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  return result.data;
}

// Utility function to get normalized view from any settings object
export function getNormalizedSettings(settings: EditorSettings): NormalizedEditorSettings {
  const validated = validateEditorSettings(settings);
  return legacyToNormalized(validated);
}

// Default settings in both formats
export const DEFAULT_LEGACY_SETTINGS: EditorSettings = {
  scale: 0.9,
  snap: 5,
  showGrid: true,
  showDimensions: true,
  apartmentWidth: 1050,
  apartmentHeight: 800,
  canvasMode: 'centered',
  maxCanvasWidth: 1200,
  maxCanvasHeight: 800,
};

export const DEFAULT_NORMALIZED_SETTINGS: NormalizedEditorSettings = legacyToNormalized(DEFAULT_LEGACY_SETTINGS);

// Diagram shape schema for drawing tools
export const diagram_shape_schema = z.object({
  id: z.string(),
  type: z.enum(['rectangle', 'circle', 'line', 'freehand', 'text']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().optional(),
  points: z.array(z.number()).optional(),
  text: z.string().optional(),
  fill: z.string(),
  stroke: z.string(),
  strokeWidth: z.number(),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
});

export type DiagramShape = z.infer<typeof diagram_shape_schema>;
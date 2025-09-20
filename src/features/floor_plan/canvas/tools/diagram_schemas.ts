import { z } from 'zod';

// Drawing tool types
export const drawing_tool_schema = z.enum(['select', 'rectangle', 'circle', 'line', 'freehand', 'text']);

// Shape type schema
export const shape_type_schema = z.enum(['rectangle', 'circle', 'line', 'freehand', 'text']);

// Hex color schema
export const hex_color_schema = z.string().regex(/^#[0-9A-Fa-f]{6}$|^transparent$/);

// Base shape schema with common properties
export const base_shape_schema = z.object({
  id: z.string().min(1),
  type: shape_type_schema,
  x: z.number(),
  y: z.number(),
  fill: hex_color_schema,
  stroke: hex_color_schema,
  strokeWidth: z.number().min(0),
  rotation: z.number().optional().default(0),
  scaleX: z.number().positive().optional().default(1),
  scaleY: z.number().positive().optional().default(1),
});

// Shape-specific schemas
export const rectangle_shape_schema = base_shape_schema.extend({
  type: z.literal('rectangle'),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const circle_shape_schema = base_shape_schema.extend({
  type: z.literal('circle'),
  radius: z.number().positive(),
});

export const line_shape_schema = base_shape_schema.extend({
  type: z.literal('line'),
  points: z.array(z.number()).min(4), // [x1, y1, x2, y2]
});

export const freehand_shape_schema = base_shape_schema.extend({
  type: z.literal('freehand'),
  points: z.array(z.number()).min(4),
});

export const text_shape_schema = base_shape_schema.extend({
  type: z.literal('text'),
  text: z.string().min(1),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// Union of all shape types
export const diagram_shape_schema = z.discriminatedUnion('type', [
  rectangle_shape_schema,
  circle_shape_schema,
  line_shape_schema,
  freehand_shape_schema,
  text_shape_schema,
]);

// Diagram export schema (for JSON export validation)
export const diagram_export_schema = z.object({
  shapes: z.array(diagram_shape_schema),
  metadata: z.object({
    exportedAt: z.string().datetime(),
    canvasWidth: z.number().positive(),
    canvasHeight: z.number().positive(),
    scale: z.number().positive(),
    version: z.string().default('1.0'),
  }),
}).strict();

// Type exports
export type DrawingTool = z.infer<typeof drawing_tool_schema>;
export type ShapeType = z.infer<typeof shape_type_schema>;
export type DiagramShape = z.infer<typeof diagram_shape_schema>;
export type DiagramExport = z.infer<typeof diagram_export_schema>;

// Shape creation helpers with validation
export function createRectangleShape(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<Pick<DiagramShape, 'fill' | 'stroke' | 'strokeWidth'>> = {}
): DiagramShape {
  return rectangle_shape_schema.parse({
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill: options.fill || 'transparent',
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 2,
  });
}

export function createCircleShape(
  id: string,
  x: number,
  y: number,
  radius: number,
  options: Partial<Pick<DiagramShape, 'fill' | 'stroke' | 'strokeWidth'>> = {}
): DiagramShape {
  return circle_shape_schema.parse({
    id,
    type: 'circle',
    x,
    y,
    radius,
    fill: options.fill || 'transparent',
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 2,
  });
}

export function createLineShape(
  id: string,
  points: number[],
  options: Partial<Pick<DiagramShape, 'fill' | 'stroke' | 'strokeWidth'>> = {}
): DiagramShape {
  return line_shape_schema.parse({
    id,
    type: 'line',
    x: 0,
    y: 0,
    points,
    fill: options.fill || 'transparent',
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 2,
  });
}

export function createFreehandShape(
  id: string,
  x: number,
  y: number,
  points: number[],
  options: Partial<Pick<DiagramShape, 'fill' | 'stroke' | 'strokeWidth'>> = {}
): DiagramShape {
  return freehand_shape_schema.parse({
    id,
    type: 'freehand',
    x,
    y,
    points,
    fill: options.fill || 'transparent',
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 2,
  });
}

export function createTextShape(
  id: string,
  x: number,
  y: number,
  text: string,
  options: Partial<Pick<DiagramShape, 'fill' | 'stroke' | 'strokeWidth' | 'width' | 'height'>> = {}
): DiagramShape {
  return text_shape_schema.parse({
    id,
    type: 'text',
    x,
    y,
    text,
    fill: options.fill || '#000000',
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 0,
    width: options.width,
    height: options.height,
  });
}

// Validation helpers
export function validateShapes(shapes: unknown[]): DiagramShape[] {
  return shapes.map((shape, index) => {
    try {
      return diagram_shape_schema.parse(shape);
    } catch (error) {
      throw new Error(`Invalid shape at index ${index}: ${error}`);
    }
  });
}

export function validateDiagramExport(data: unknown): DiagramExport {
  return diagram_export_schema.parse(data);
}
import { z } from "zod";
import React from "react";

// Furniture definition metadata schema
export const furniture_definition_metadata_schema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  default_size: z.object({
    w: z.number().positive(),
    h: z.number().positive(),
  }),
  default_color: z.string(),
  constraints: z.object({
    min_size: z.object({
      w: z.number().positive(),
      h: z.number().positive(),
    }),
    lock_aspect_ratio: z.boolean().optional(),
    rotation_step_deg: z.number().optional(),
  }),
});

// Props for rendering furniture with Konva
export interface FurnitureRenderProps {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  scale_px_per_cm: number;
  name?: string;
  color?: string;
  is_selected?: boolean;
}

// Furniture definition interface
export interface FurnitureDefinition {
  id: string;
  name: string;
  category: string;
  default_size: {
    w: number;
    h: number;
  };
  default_color: string;
  constraints: {
    min_size: {
      w: number;
      h: number;
    };
    lock_aspect_ratio?: boolean;
    rotation_step_deg?: number;
  };
  render_konva: (props: FurnitureRenderProps) => React.ReactNode;
}

// Type exports
export type FurnitureDefinitionMetadata = z.infer<typeof furniture_definition_metadata_schema>;
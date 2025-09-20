import { pgTable, text, integer, jsonb, timestamp, boolean, uuid, decimal, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Neon Auth handles user management automatically
// Users are stored in the neon_auth.users_sync table
// No need for manual user table creation

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // References Neon Auth user ID
  name: text("name").notNull(),
  description: text("description"),
  apartmentType: text("apartment_type").notNull().default("type_7"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
});

// Zones table (room/area definitions)
export const zones = pgTable("zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  zoneId: text("zone_id").notNull(), // e.g., "living", "bedroom1"
  name: text("name").notNull(),
  x: decimal("x", { precision: 10, scale: 2 }).notNull(),
  y: decimal("y", { precision: 10, scale: 2 }).notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  color: text("color"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Furniture catalog table
export const furnitureCatalog = pgTable("furniture_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "sofa", "bed", "table", etc.
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  depth: decimal("depth", { precision: 10, scale: 2 }),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Furniture items in projects
export const furnitureItems = pgTable("furniture_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  catalogId: uuid("catalog_id")
    .references(() => furnitureCatalog.id),
  name: text("name").notNull(),
  x: decimal("x", { precision: 10, scale: 2 }).notNull(),
  y: decimal("y", { precision: 10, scale: 2 }).notNull(),
  width: decimal("width", { precision: 10, scale: 2 }).notNull(),
  height: decimal("height", { precision: 10, scale: 2 }).notNull(),
  rotation: decimal("rotation", { precision: 5, scale: 2 }).default("0"),
  color: text("color").notNull(),
  zoneId: text("zone_id"), // which zone/room this item is in
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Project settings/configuration
export const projectSettings = pgTable("project_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  apartmentWidth: decimal("apartment_width", { precision: 10, scale: 2 }).default("1050"),
  apartmentHeight: decimal("apartment_height", { precision: 10, scale: 2 }).default("800"),
  scale: decimal("scale", { precision: 5, scale: 3 }).default("0.9"),
  snapGrid: integer("snap_grid").default(5),
  showGrid: boolean("show_grid").default(true),
  showDimensions: boolean("show_dimensions").default(true),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Imported floor plans (from AI analysis)
export const importedFloorPlans = pgTable("imported_floor_plans", {
  id: serial("id").primaryKey(),
  shortId: text("short_id").notNull().unique(), // 8-character short ID for URLs
  slug: text("slug").notNull().unique(), // SEO-friendly slug
  userId: text("user_id"), // References Neon Auth user ID

  // Original image data
  originalImageUrl: text("original_image_url"),
  originalImageWidth: integer("original_image_width"),
  originalImageHeight: integer("original_image_height"),

  // AI analysis results
  analysisData: jsonb("analysis_data").notNull(), // Store the full AI response
  dimensions: jsonb("dimensions").notNull(), // {width: number, height: number}
  zones: jsonb("zones").notNull(), // Array of zone objects

  // Project data created from import
  projectId: uuid("project_id").references(() => projects.id),

  // Metadata
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  isProcessed: boolean("is_processed").default(false), // Whether project was created
});

// Zod schemas for validation
// User schemas are not needed as Neon Auth handles user management

export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);

export const insertZoneSchema = createInsertSchema(zones);
export const selectZoneSchema = createSelectSchema(zones);

export const insertFurnitureCatalogSchema = createInsertSchema(furnitureCatalog);
export const selectFurnitureCatalogSchema = createSelectSchema(furnitureCatalog);

export const insertFurnitureItemSchema = createInsertSchema(furnitureItems);
export const selectFurnitureItemSchema = createSelectSchema(furnitureItems);

export const insertProjectSettingsSchema = createInsertSchema(projectSettings);
export const selectProjectSettingsSchema = createSelectSchema(projectSettings);

export const insertImportedFloorPlanSchema = createInsertSchema(importedFloorPlans);
export const selectImportedFloorPlanSchema = createSelectSchema(importedFloorPlans);

// Manual schemas for type inference
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  apartmentType: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isPublic: z.boolean().nullable(),
});

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  zoneId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const FurnitureCatalogItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number().nullable(),
  color: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
});

export const FurnitureItemSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  catalogId: z.string().uuid().nullable(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  color: z.string(),
  zoneId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProjectSettingsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  apartmentWidth: z.number(),
  apartmentHeight: z.number(),
  scale: z.number(),
  snapGrid: z.number(),
  showGrid: z.boolean(),
  showDimensions: z.boolean(),
  updatedAt: z.date(),
});

export const ImportedFloorPlanSchema = z.object({
  id: z.number(),
  shortId: z.string(),
  slug: z.string(),
  userId: z.string().nullable(),
  originalImageUrl: z.string().nullable(),
  originalImageWidth: z.number().nullable(),
  originalImageHeight: z.number().nullable(),
  analysisData: z.any(),
  dimensions: z.any(),
  zones: z.any(),
  projectId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isProcessed: z.boolean(),
});

// Types
// User type is not needed as Neon Auth handles user management
export type Project = z.infer<typeof ProjectSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type FurnitureCatalogItem = z.infer<typeof FurnitureCatalogItemSchema>;
export type FurnitureItem = z.infer<typeof FurnitureItemSchema>;
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type ImportedFloorPlan = z.infer<typeof ImportedFloorPlanSchema>;
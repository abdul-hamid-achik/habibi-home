import { pgTable, text, integer, jsonb, timestamp, boolean, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (for NextAuth)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("accounts", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

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

// Types
export type User = z.infer<typeof selectUserSchema>;
export type Project = z.infer<typeof selectProjectSchema>;
export type Zone = z.infer<typeof selectZoneSchema>;
export type FurnitureCatalogItem = z.infer<typeof selectFurnitureCatalogSchema>;
export type FurnitureItem = z.infer<typeof selectFurnitureItemSchema>;
export type ProjectSettings = z.infer<typeof selectProjectSettingsSchema>;
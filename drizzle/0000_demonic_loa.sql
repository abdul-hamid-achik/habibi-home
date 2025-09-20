CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "furniture_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"depth" numeric(10, 2),
	"color" text NOT NULL,
	"is_default" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "furniture_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"catalog_id" uuid,
	"name" text NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"rotation" numeric(5, 2) DEFAULT '0',
	"color" text NOT NULL,
	"zone_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imported_floor_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_id" text NOT NULL,
	"slug" text NOT NULL,
	"user_id" text,
	"original_image_url" text,
	"original_image_width" integer,
	"original_image_height" integer,
	"analysis_data" jsonb NOT NULL,
	"dimensions" jsonb NOT NULL,
	"zones" jsonb NOT NULL,
	"project_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_processed" boolean DEFAULT false,
	CONSTRAINT "imported_floor_plans_short_id_unique" UNIQUE("short_id"),
	CONSTRAINT "imported_floor_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"apartment_width" numeric(10, 2) DEFAULT '1050',
	"apartment_height" numeric(10, 2) DEFAULT '800',
	"scale" numeric(5, 3) DEFAULT '0.9',
	"snap_grid" integer DEFAULT 5,
	"show_grid" boolean DEFAULT true,
	"show_dimensions" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"apartment_type" text DEFAULT 'type_7' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_public" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"zone_id" text NOT NULL,
	"name" text NOT NULL,
	"x" numeric(10, 2) NOT NULL,
	"y" numeric(10, 2) NOT NULL,
	"width" numeric(10, 2) NOT NULL,
	"height" numeric(10, 2) NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "furniture_items" ADD CONSTRAINT "furniture_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "furniture_items" ADD CONSTRAINT "furniture_items_catalog_id_furniture_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."furniture_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_floor_plans" ADD CONSTRAINT "imported_floor_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imported_floor_plans" ADD CONSTRAINT "imported_floor_plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
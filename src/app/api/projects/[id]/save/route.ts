import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
    projects,
    zones,
    furnitureItems,
    projectSettings,
    selectProjectSchema,
    insertZoneSchema,
    insertFurnitureItemSchema,
    insertProjectSettingsSchema
} from '@/lib/db/schema';
import {
    saveProjectDataSchema
} from '@/types';
import { eq } from 'drizzle-orm';
import { stackServerApp } from '@/app/stack';

// Zod schema for project ID validation
const projectIdSchema = z.object({
    id: z.string().uuid("Invalid project ID"),
});

// POST - Save project data (zones, furniture, settings)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get authenticated user
        let user;
        try {
            user = await stackServerApp.getUser();
            if (!user) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }
        } catch {
            return NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Validate project ID
        const idValidationResult = projectIdSchema.safeParse({ id });
        if (!idValidationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid project ID',
                    details: idValidationResult.error.issues
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        // Validate save data
        const validationResult = saveProjectDataSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid save data',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        const { zones: zonesData, furniture: furnitureData, settings: settingsData } = validationResult.data;

        // Verify project exists and user owns it
        const [project] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        if (project.userId !== user.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Use transaction to ensure data consistency
        await db.transaction(async (tx) => {
            // Delete existing zones for this project
            await tx
                .delete(zones)
                .where(eq(zones.projectId, id));

            // Insert new zones
            if (zonesData.length > 0) {
                const zonesToInsert = zonesData.map(zone => ({
                    projectId: id,
                    zoneId: zone.zoneId,
                    name: zone.name,
                    x: zone.x,
                    y: zone.y,
                    width: zone.w,
                    height: zone.h,
                    color: zone.color || null,
                }));

                // Validate zones data using the database schema
                const zonesValidationResult = insertZoneSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(zonesToInsert);
                if (!zonesValidationResult.success) {
                    throw new Error(`Invalid zones data: ${zonesValidationResult.error.issues.map(issue => issue.message).join(', ')}`);
                }

                await tx
                    .insert(zones)
                    .values(zonesValidationResult.data);
            }

            // Delete existing furniture items for this project
            await tx
                .delete(furnitureItems)
                .where(eq(furnitureItems.projectId, id));

            // Insert new furniture items
            if (furnitureData.length > 0) {
                const furnitureToInsert = furnitureData.map(item => ({
                    projectId: id,
                    catalogId: item.catalogId || null,
                    name: item.name,
                    x: item.x,
                    y: item.y,
                    width: item.w,
                    height: item.h,
                    rotation: item.r,
                    color: item.color,
                    zoneId: item.zoneId || null,
                }));

                // Validate furniture data using the database schema
                const furnitureValidationResult = insertFurnitureItemSchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(furnitureToInsert);
                if (!furnitureValidationResult.success) {
                    throw new Error(`Invalid furniture data: ${furnitureValidationResult.error.issues.map(issue => issue.message).join(', ')}`);
                }

                await tx
                    .insert(furnitureItems)
                    .values(furnitureValidationResult.data);
            }

            // Update or create project settings
            const [existingSettings] = await tx
                .select()
                .from(projectSettings)
                .where(eq(projectSettings.projectId, id))
                .limit(1);

            const settingsToSave = {
                projectId: id,
                apartmentWidth: settingsData.apartmentWidth,
                apartmentHeight: settingsData.apartmentHeight,
                scale: settingsData.scale,
                snap: settingsData.snap,
                showGrid: settingsData.showGrid,
                showDimensions: settingsData.showDimensions,
            };

            // Validate settings data
            const settingsValidationResult = insertProjectSettingsSchema.omit({ id: true, updatedAt: true }).safeParse(settingsToSave);
            if (!settingsValidationResult.success) {
                throw new Error(`Invalid settings data: ${settingsValidationResult.error.issues.map(issue => issue.message).join(', ')}`);
            }

            if (existingSettings) {
                await tx
                    .update(projectSettings)
                    .set({
                        ...settingsValidationResult.data,
                        updatedAt: new Date(),
                    })
                    .where(eq(projectSettings.id, existingSettings.id));
            } else {
                await tx
                    .insert(projectSettings)
                    .values(settingsValidationResult.data);
            }

            // Update project updatedAt timestamp
            await tx
                .update(projects)
                .set({ updatedAt: new Date() })
                .where(eq(projects.id, id));
        });

        // Get updated project data
        const [updatedProject] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        // Validate updated project data
        const returnValidationResult = selectProjectSchema.safeParse(updatedProject);
        if (!returnValidationResult.success) {
            console.error('Updated project validation failed:', returnValidationResult.error.issues);
            return NextResponse.json(
                {
                    error: 'Invalid updated project data from database',
                    details: returnValidationResult.error.issues
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            project: returnValidationResult.data,
            message: 'Project saved successfully'
        });

    } catch (error) {
        console.error('Save project error:', error);
        return NextResponse.json(
            {
                error: 'Failed to save project',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

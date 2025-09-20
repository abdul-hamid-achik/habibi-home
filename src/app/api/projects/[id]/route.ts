import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects, selectProjectSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stackServerApp } from '@/app/stack';
import { error } from 'console';
import { updateProjectSchema } from '@/types';

// Zod schema for project ID validation
const projectIdSchema = z.object({
    id: z.string().uuid("Invalid project ID"),
});

// GET - Get a specific project
export async function GET(
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

        // Get project
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

        // Check if user owns this project
        if (project.userId !== user.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Validate project data
        const validationResult = selectProjectSchema.safeParse(project);
        if (!validationResult.success) {
            console.error('Project validation failed:', validationResult.error.issues);
            return NextResponse.json(
                {
                    error: 'Invalid project data from database',
                    details: validationResult.error.issues
                },
                { status: 500 }
            );
        }

        return NextResponse.json(validationResult.data);

    } catch (error) {
        console.error('Get project error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch project',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PUT - Update a specific project
export async function PUT(
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

        // Validate input data
        const validationResult = updateProjectSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid update data',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        // Get existing project to check ownership
        const [existingProject] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        if (!existingProject) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Check if user owns this project
        if (existingProject.userId !== user.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Update project
        const [updatedProject] = await db
            .update(projects)
            .set({
                ...validationResult.data,
                updatedAt: new Date(),
            })
            .where(eq(projects.id, id))
            .returning();

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

        return NextResponse.json(returnValidationResult.data);

    } catch {
        console.error('Update project error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update project',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a specific project
export async function DELETE(
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

        // Get existing project to check ownership
        const [existingProject] = await db
            .select()
            .from(projects)
            .where(eq(projects.id, id))
            .limit(1);

        if (!existingProject) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Check if user owns this project
        if (existingProject.userId !== user.id) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Delete project (this will cascade delete zones, furniture items, and settings)
        await db
            .delete(projects)
            .where(eq(projects.id, id));

        return NextResponse.json({ success: true });

    } catch {
        console.error('Delete project error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete project',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

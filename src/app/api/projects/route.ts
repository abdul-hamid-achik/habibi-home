import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, insertProjectSchema, selectProjectSchema } from '@/lib/db/schema';
import { createProjectSchema } from '@/types';
import { eq } from 'drizzle-orm';
import { stackServerApp } from '@/app/stack';

// POST - Create a new project
export async function POST(request: NextRequest) {
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

        const body = await request.json();

        // Validate input data
        const validationResult = createProjectSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid project data',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        // Create project data
        const projectData = {
            userId: user.id,
            ...validationResult.data,
        };

        // Validate with database schema
        const dbValidationResult = insertProjectSchema.safeParse(projectData);
        if (!dbValidationResult.success) {
            return NextResponse.json(
                {
                    error: 'Database validation failed',
                    details: dbValidationResult.error.issues
                },
                { status: 400 }
            );
        }

        // Save to database
        const [savedProject] = await db
            .insert(projects)
            .values(dbValidationResult.data)
            .returning();

        // Validate returned data
        const returnValidationResult = selectProjectSchema.safeParse(savedProject);
        if (!returnValidationResult.success) {
            console.error('Database return validation failed:', returnValidationResult.error.issues);
            return NextResponse.json(
                {
                    error: 'Invalid project data from database',
                    details: returnValidationResult.error.issues
                },
                { status: 500 }
            );
        }

        return NextResponse.json(returnValidationResult.data);

    } catch (error) {
        console.error('Create project error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create project',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - List projects for authenticated user
export async function GET() {
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

        // Get user's projects
        const userProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, user.id))
            .orderBy(projects.createdAt);

        // Validate all returned projects
        const validatedProjects = [];
        for (const project of userProjects) {
            const validationResult = selectProjectSchema.safeParse(project);
            if (validationResult.success) {
                validatedProjects.push(validationResult.data);
            } else {
                console.error('Project validation failed:', project.id, validationResult.error.issues);
            }
        }

        return NextResponse.json(validatedProjects);

    } catch (error) {
        console.error('Get projects error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch projects',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importedFloorPlans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Zod schema for shortId validation
const shortIdSchema = z.object({
    shortId: z.string().min(1, "ShortId is required").length(8, "ShortId must be exactly 8 characters"),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shortId: string }> }
) {
    try {
        const { shortId } = await params;

        // Validate the shortId parameter
        const validationResult = shortIdSchema.safeParse({ shortId });
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Invalid shortId format',
                    details: validationResult.error.issues
                },
                { status: 400 }
            );
        }

        // Get the imported floor plan
        const [floorPlan] = await db
            .select()
            .from(importedFloorPlans)
            .where(eq(importedFloorPlans.shortId, shortId))
            .limit(1);

        if (!floorPlan) {
            return NextResponse.json(
                { error: 'Imported floor plan not found' },
                { status: 404 }
            );
        }

        // Convert database JSON fields back to objects
        const result = {
            id: floorPlan.id,
            shortId: floorPlan.shortId,
            slug: floorPlan.slug,
            userId: floorPlan.userId,
            originalImageUrl: floorPlan.originalImageUrl,
            originalImageWidth: floorPlan.originalImageWidth,
            originalImageHeight: floorPlan.originalImageHeight,
            analysisData: floorPlan.analysisData,
            dimensions: floorPlan.dimensions,
            zones: floorPlan.zones,
            projectId: floorPlan.projectId,
            createdAt: floorPlan.createdAt,
            updatedAt: floorPlan.updatedAt,
            isProcessed: floorPlan.isProcessed,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching imported floor plan:', error);
        return NextResponse.json(
            { error: 'Failed to fetch imported floor plan' },
            { status: 500 }
        );
    }
}

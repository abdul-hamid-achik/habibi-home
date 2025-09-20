import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { importedFloorPlans, selectImportedFloorPlanSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { stackServerApp } from '@/app/stack';

// Simple in-memory rate limiting store
// In production, consider using Redis or a similar solution
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function getClientIP(request: NextRequest): string {
    // Try various headers to get the real client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    if (realIP) {
        return realIP;
    }
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Fallback to a generic identifier if no IP headers are available
    return request.headers.get('user-agent') || 'unknown';
}

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowKey = `${identifier}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;

    const current = rateLimitStore.get(windowKey);

    if (!current) {
        rateLimitStore.set(windowKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }

    current.count++;
    return true;
}

// Zod schema for shortId validation with comprehensive security checks
const shortIdSchema = z.object({
    shortId: z.string()
        .min(1, "ShortId is required")
        .length(8, "ShortId must be exactly 8 characters")
        .regex(/^[a-zA-Z0-9]+$/, "ShortId must contain only alphanumeric characters")
        .refine((val) => {
            // Additional security check: ensure it doesn't contain suspicious patterns
            const suspiciousPatterns = [
                /(.)\1{3,}/, // 4 or more repeated characters
                /^[0-9]+$/, // All numbers (too predictable)
                /^[a-z]+$/, // All lowercase letters
                /^[A-Z]+$/, // All uppercase letters
            ];

            return !suspiciousPatterns.some(pattern => pattern.test(val));
        }, "ShortId contains suspicious patterns that could indicate an attack"),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shortId: string }> }
) {
    try {
        // Rate limiting check
        const clientIP = getClientIP(request);
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    details: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString(),
                        'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
                    }
                }
            );
        }

        const { shortId } = await params;

        // Security: Check for potential injection attempts
        if (!shortId || typeof shortId !== 'string') {
            return NextResponse.json(
                { error: 'Invalid shortId parameter' },
                { status: 400 }
            );
        }

        // Security: Sanitize the shortId (remove any potential control characters)
        const sanitizedShortId = shortId.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim();

        // Validate the sanitized shortId
        const shortIdValidationResult = shortIdSchema.safeParse({ shortId: sanitizedShortId });
        if (!shortIdValidationResult.success) {
            const errorResponse = NextResponse.json(
                {
                    error: 'Invalid shortId format',
                    details: shortIdValidationResult.error.issues
                },
                { status: 400 }
            );

            // Add security headers to error response
            errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
            errorResponse.headers.set('X-Frame-Options', 'DENY');
            errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
            errorResponse.headers.set('Cache-Control', 'no-cache, no-store');

            return errorResponse;
        }

        // Get the imported floor plan
        const [floorPlan] = await db
            .select()
            .from(importedFloorPlans)
            .where(eq(importedFloorPlans.shortId, sanitizedShortId))
            .limit(1);

        if (!floorPlan) {
            const errorResponse = NextResponse.json(
                { error: 'Imported floor plan not found' },
                { status: 404 }
            );

            // Add security headers to error response
            errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
            errorResponse.headers.set('X-Frame-Options', 'DENY');
            errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
            errorResponse.headers.set('Cache-Control', 'no-cache, no-store');

            return errorResponse;
        }

        // Check if user is authenticated and authorized to access this floor plan
        let currentUserId: string | null = null;
        try {
            const user = await stackServerApp.getUser();
            currentUserId = user?.id || null;
        } catch (error) {
            // Auth is optional for now, but log the attempt
            console.log('Auth check failed for shortId access:', error);
        }

        // Security: Check if the floor plan belongs to the current user
        // For now, allow access if userId is null (public access) or matches current user
        // In the future, this could be more restrictive
        if (floorPlan.userId && currentUserId && floorPlan.userId !== currentUserId) {
            const errorResponse = NextResponse.json(
                { error: 'Access denied: Floor plan belongs to another user' },
                { status: 403 }
            );

            // Add security headers to error response
            errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
            errorResponse.headers.set('X-Frame-Options', 'DENY');
            errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
            errorResponse.headers.set('Cache-Control', 'no-cache, no-store');

            return errorResponse;
        }

        // Validate data from database
        const validationResult = selectImportedFloorPlanSchema.safeParse(floorPlan);
        if (!validationResult.success) {
            console.error('Database data validation failed:', validationResult.error.issues);
            const errorResponse = NextResponse.json(
                {
                    error: 'Invalid floor plan data from database',
                    details: validationResult.error.issues
                },
                { status: 500 }
            );

            // Add security headers to error response
            errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
            errorResponse.headers.set('X-Frame-Options', 'DENY');
            errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
            errorResponse.headers.set('Cache-Control', 'no-cache, no-store');

            return errorResponse;
        }

        const result = validationResult.data;

        // Add security headers
        const response = NextResponse.json(result);

        // Security headers
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Cache control for sensitive data
        response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    } catch (error) {
        console.error('Error fetching imported floor plan:', error);
        const errorResponse = NextResponse.json(
            { error: 'Failed to fetch imported floor plan' },
            { status: 500 }
        );

        // Add security headers to error response
        errorResponse.headers.set('X-Content-Type-Options', 'nosniff');
        errorResponse.headers.set('X-Frame-Options', 'DENY');
        errorResponse.headers.set('X-XSS-Protection', '1; mode=block');
        errorResponse.headers.set('Cache-Control', 'no-cache, no-store');

        return errorResponse;
    }
}

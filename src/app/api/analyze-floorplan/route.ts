import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { importedFloorPlans } from '@/lib/db/schema';
import { stackServerApp } from '@/lib/stack-auth-server';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Helper function to generate unique short ID
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate SEO-friendly slug
function generateSlug(baseName: string): string {
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

// Helper function to ensure unique slug
async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;

  while (true) {
    // Check if slug exists
    const existing = await db
      .select()
      .from(importedFloorPlans)
      .where(eq(importedFloorPlans.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    // If slug exists, add counter
    slug = generateSlug(`${baseName}-${counter}`);
    counter++;
  }
}

interface Zone {
  name: string;
  zoneId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  suggestedFurniture?: string[];
}

interface FloorPlanAnalysis {
  totalArea: number; // in m²
  dimensions: {
    width: number; // in meters
    height: number; // in meters
  };
  zones: Zone[];
  scale: number; // pixels per meter for the extracted plan
}

// Zod schemas for validation
const ZoneSchema = z.object({
  name: z.string(),
  zoneId: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  type: z.string(),
  suggestedFurniture: z.array(z.string()).optional(),
});

const FloorPlanAnalysisSchema = z.object({
  totalArea: z.number(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  zones: z.array(ZoneSchema),
  scale: z.number(),
});

// Multi-step analysis for better reliability:
// 1. Layout detection → basic room identification
// 2. Dimension extraction → measurements and scale
// 3. Zone refinement → precise coordinates
// 4. Validation → final cleanup and validation
const createAnalysisPrompt = (totalArea?: number) => `
You are an expert architectural floor plan analyzer. Focus on ACCURATE room identification and coordinate extraction.

CRITICAL: Respond with ONLY valid JSON. No text before or after.

${totalArea ? `Total area provided: ${totalArea} m²` : 'Estimate total area if needed'}

PRIORITY: Identify rooms first, then coordinates. Be precise with percentages.

IMPORTANT: The coordinate system should be:
- 0,0 is the TOP-LEFT corner of the floor plan
- x increases to the RIGHT
- y increases DOWNWARD
- Return coordinates as percentages (0-100) of the total floor plan dimensions
- Ensure zones don't excessively overlap
- Organize zones in a realistic layout

If you see room labels, use them. Otherwise:
- Largest central space → Living Room
- Kitchen features (counters, appliances) → Kitchen
- Small private rooms → Bedroom
- Very small rooms with fixtures → Bathroom
- Entry point → Entrance
- Connecting areas → Hallway

For each zone, also specify appropriate furniture types that would typically go in that room.

JSON format (respond with ONLY this JSON, no other text):
{
  "totalArea": ${totalArea || 85.5},
  "dimensions": {
    "width": 12.5,
    "height": 8.0
  },
  "zones": [
    {
      "name": "Living Room",
      "zoneId": "living_room",
      "x": 10,
      "y": 15,
      "width": 35,
      "height": 25,
      "type": "living",
      "suggestedFurniture": ["sofa", "coffee table", "side table", "armchair"]
    },
    {
      "name": "Kitchen",
      "zoneId": "kitchen",
      "x": 45,
      "y": 15,
      "width": 25,
      "height": 20,
      "type": "kitchen",
      "suggestedFurniture": ["dining table", "stove", "refrigerator", "dishwasher"]
    },
    {
      "name": "Bedroom",
      "zoneId": "bedroom_1",
      "x": 70,
      "y": 15,
      "width": 30,
      "height": 40,
      "type": "bedroom",
      "suggestedFurniture": ["bed", "nightstand", "dresser", "wardrobe"]
    }
  ],
  "scale": 50
}`;

// Helper function to validate and optimize zone layout
function validateAndOptimizeZones(zones: Zone[], canvasWidth: number, canvasHeight: number): Zone[] {
  const optimizedZones: Zone[] = [];
  const MIN_ZONE_SIZE = 50; // Minimum zone dimension in cm
  const OVERLAP_THRESHOLD = 0.3; // Maximum allowed overlap (30%)

  zones.forEach((zone) => {
    // Validate zone dimensions
    const optimizedZone = { ...zone };

    // Ensure minimum dimensions
    if (zone.w < MIN_ZONE_SIZE) {
      optimizedZone.w = MIN_ZONE_SIZE;
    }
    if (zone.h < MIN_ZONE_SIZE) {
      optimizedZone.h = MIN_ZONE_SIZE;
    }

    // Ensure zones stay within canvas bounds
    optimizedZone.x = Math.max(0, Math.min(canvasWidth - zone.w, zone.x));
    optimizedZone.y = Math.max(0, Math.min(canvasHeight - zone.h, zone.y));

    // Check for excessive overlap with existing zones
    let hasExcessiveOverlap = false;
    for (const existingZone of optimizedZones) {
      const overlap = calculateZoneOverlap(optimizedZone, existingZone);
      if (overlap > OVERLAP_THRESHOLD) {
        hasExcessiveOverlap = true;
        break;
      }
    }

    // If no excessive overlap or this is the first zone, add it
    if (!hasExcessiveOverlap || optimizedZones.length === 0) {
      optimizedZones.push(optimizedZone);
    } else {
      // Try to reposition zone to reduce overlap
      const repositionedZone = repositionZoneToReduceOverlap(optimizedZone, optimizedZones, canvasWidth, canvasHeight);
      if (repositionedZone) {
        optimizedZones.push(repositionedZone);
      }
    }
  });

  return optimizedZones;
}

// Calculate overlap between two zones (returns overlap ratio 0-1)
function calculateZoneOverlap(zone1: Zone, zone2: Zone): number {
  const xOverlap = Math.max(0, Math.min(zone1.x + zone1.w, zone2.x + zone2.w) - Math.max(zone1.x, zone2.x));
  const yOverlap = Math.max(0, Math.min(zone1.y + zone1.h, zone2.y + zone2.h) - Math.max(zone1.y, zone2.y));
  const overlapArea = xOverlap * yOverlap;
  const zone1Area = zone1.w * zone1.h;

  return overlapArea / zone1Area;
}

// Try to reposition a zone to reduce overlap
function repositionZoneToReduceOverlap(zone: Zone, existingZones: Zone[], canvasWidth: number, canvasHeight: number): Zone | null {
  const attempts = [
    { x: zone.x + 50, y: zone.y },      // Right
    { x: zone.x - 50, y: zone.y },      // Left
    { x: zone.x, y: zone.y + 50 },      // Down
    { x: zone.x, y: zone.y - 50 },      // Up
    { x: zone.x + 30, y: zone.y + 30 }, // Diagonal
    { x: zone.x - 30, y: zone.y - 30 }, // Diagonal opposite
  ];

  for (const attempt of attempts) {
    const repositionedZone = {
      ...zone,
      x: Math.max(0, Math.min(canvasWidth - zone.w, attempt.x)),
      y: Math.max(0, Math.min(canvasHeight - zone.h, attempt.y))
    };

    // Check if this new position has acceptable overlap
    let maxOverlap = 0;
    for (const existingZone of existingZones) {
      const overlap = calculateZoneOverlap(repositionedZone, existingZone);
      maxOverlap = Math.max(maxOverlap, overlap);
    }

    if (maxOverlap <= 0.2) { // Allow 20% overlap as acceptable
      return repositionedZone;
    }
  }

  // If no good position found, return null to skip this zone
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const totalAreaString = formData.get('totalArea') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob with unique filename
    const timestamp = Date.now();
    const uniqueFilename = `floorplan-${timestamp}-${file.name}`;
    const blob = await put(uniqueFilename, file, {
      access: 'public',
    });

    // Parse user-provided total area
    const userTotalArea = totalAreaString ? parseFloat(totalAreaString) : undefined;

    // Convert image to base64 for OpenAI
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Create dynamic prompt with total area if provided
    const analysisPrompt = createAnalysisPrompt(userTotalArea);

    // Analyze with OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert architectural floor plan analyzer. You MUST respond with ONLY valid JSON objects. Never include explanatory text, apologies, or commentary. Always output pure JSON."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.0, // Zero temperature for most consistent analysis
    });

    const analysisText = response.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error('No analysis received from OpenAI');
    }

    console.log('OpenAI Response:', analysisText);

    // Parse and validate the JSON response using Zod
    let analysis: FloorPlanAnalysis;
    try {
      // Clean the response text
      let cleanText = analysisText.trim();

      // Remove any markdown code blocks
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');

      // Extract JSON object if embedded in text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

      // Parse JSON first, then validate with Zod
      const rawAnalysis = JSON.parse(jsonString);
      analysis = FloorPlanAnalysisSchema.parse(rawAnalysis);
    } catch (parseError) {
      console.error('Failed to parse/validate OpenAI response:', analysisText);
      console.error('Parse error:', parseError);

      // Enhanced error handling for different floor plan types
      const refusalPatterns = [
        "unable to analyze",
        "can't analyze",
        "cannot analyze",
        "please provide",
        "necessary details",
        "i'm unable",
        "i cannot",
        "i can't",
        "unable to process",
        "cannot process",
        "direct analysis",
        "not enough information",
        "insufficient detail",
        "cannot extract",
        "no clear rooms",
        "too complex",
        "too simple",
        "cannot identify"
      ];

      const isRefusal = refusalPatterns.some(pattern =>
        analysisText.toLowerCase().includes(pattern)
      );

      // Detect if it's a complex floor plan (furniture, detailed styling)
      const isComplexFloorPlan = analysisText.toLowerCase().includes('furniture') ||
        analysisText.toLowerCase().includes('decorative') ||
        analysisText.toLowerCase().includes('styled');

      if (isRefusal) {
        const errorMessage = isComplexFloorPlan
          ? 'Complex floor plan detected. Try with a simpler architectural drawing.'
          : 'Basic floor plan detected. Add room labels and measurements for better results.';

        return NextResponse.json(
          {
            error: 'AI Vision Analysis Limited',
            details: `The AI model could not extract detailed room information from this floor plan. ${errorMessage}`,
            suggestion: 'For best results: 1) Use clear architectural drawings 2) Add room labels 3) Include measurements 4) Avoid decorative elements',
            totalArea: userTotalArea || 85.5,
            dimensions: { width: 12.5, height: 8.0 },
            zones: [],
            scale: 50,
            imageUrl: blob.url,
            imageSize: file.size,
            processedAt: new Date().toISOString()
          },
          { status: 422 }
        );
      }

      throw new Error(`Invalid analysis format received: ${parseError}`);
    }

    // Zod validation already ensures the structure is complete

    // Convert percentage-based coordinates to absolute coordinates based on analysis dimensions
    // The analysis returns coordinates as percentages of the total floor plan dimensions
    const FLOOR_PLAN_WIDTH_CM = Math.round(analysis.dimensions.width * 100); // Convert meters to cm
    const FLOOR_PLAN_HEIGHT_CM = Math.round(analysis.dimensions.height * 100); // Convert meters to cm

    // Validate that the converted dimensions make sense for the editor
    const MIN_DIMENSION = 300; // cm
    const MAX_DIMENSION = 2000; // cm

    const editorWidth = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, FLOOR_PLAN_WIDTH_CM));
    const editorHeight = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, FLOOR_PLAN_HEIGHT_CM));

    const convertedZones = analysis.zones.map(zone => ({
      ...zone,
      // Convert percentages to absolute coordinates in cm based on analysis dimensions
      x: Math.round((zone.x / 100) * editorWidth),
      y: Math.round((zone.y / 100) * editorHeight),
      w: Math.round((zone.w / 100) * editorWidth),
      h: Math.round((zone.h / 100) * editorHeight),
    }));

    // Update analysis dimensions to match the editor dimensions
    analysis.dimensions.width = editorWidth / 100; // Convert back to meters
    analysis.dimensions.height = editorHeight / 100;

    // Validate and optimize zone layout
    const validatedZones = validateAndOptimizeZones(convertedZones, editorWidth, editorHeight);

    // Replace converted zones with validated ones
    convertedZones.splice(0, convertedZones.length, ...validatedZones);

    // Generate unique identifiers
    const shortId = generateShortId();
    const slug = await generateUniqueSlug(`floor-plan-${Date.now()}`);

    // Get user session (optional for now)
    let userId: string | null = null;
    try {
      const user = await stackServerApp.getUser();
      userId = user?.id || null;
    } catch (error) {
      // Auth is optional for now, continue without user
      console.log('Auth check failed, continuing without user:', error);
    }

    // Save to database
    const [savedFloorPlan] = await db
      .insert(importedFloorPlans)
      .values({
        shortId,
        slug,
        userId,
        originalImageUrl: blob.url,
        originalImageWidth: null, // TODO: Extract from image if needed
        originalImageHeight: null,
        analysisData: analysis,
        dimensions: analysis.dimensions,
        zones: convertedZones,
        isProcessed: false,
      })
      .returning();

    const result = {
      ...analysis,
      zones: convertedZones,
      imageUrl: blob.url,
      imageSize: file.size,
      processedAt: new Date().toISOString(),
      // New fields for URL routing
      id: savedFloorPlan.id,
      shortId: savedFloorPlan.shortId,
      slug: savedFloorPlan.slug,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Floor plan analysis error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze floor plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { importedFloorPlans, insertImportedFloorPlanSchema } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { stackServerApp } from '@/app/stack';

// Roboflow API configuration
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || process.env.NEXT_PUBLIC_ROBOFLOW_PUBLISHEABLE_API_KEY;
const ROBOFLOW_MODEL_ENDPOINT = 'https://serverless.roboflow.com/floor-plan-wnhb5/4';
// Enable Roboflow by default when API key is available (can be disabled with NEXT_PUBLIC_ROBOFLOW_ENABLED=false)
const ROBOFLOW_ENABLED = process.env.NEXT_PUBLIC_ROBOFLOW_ENABLED !== 'false' && !!ROBOFLOW_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id: number;
}

interface RoboflowResponse {
  time: number;
  image: {
    width: number;
    height: number;
  };
  predictions: RoboflowPrediction[];
}

// Helper function to generate unique short ID with collision detection
async function generateUniqueShortId(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(8);
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loops

  while (attempts < maxAttempts) {
    // Use crypto.getRandomValues for cryptographically secure random bytes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }

    // Check if this shortId already exists in the database
    const existing = await db
      .select()
      .from(importedFloorPlans)
      .where(eq(importedFloorPlans.shortId, result))
      .limit(1);

    if (existing.length === 0) {
      return result; // Found a unique ID
    }

    attempts++;
  }

  // If we've exhausted attempts, throw an error
  throw new Error('Failed to generate unique shortId after maximum attempts');
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


// Create a two-phase analysis approach
const createDescriptivePrompt = () => `
You are looking at a specific floor plan image. Describe EXACTLY what you see in THIS image.

DO NOT give generic descriptions. Look at THIS SPECIFIC floor plan and tell me:

ANALYZE THE FLOOR PLAN BY:

1. **Room Detection** - Even without labels, identify rooms by:
   - Size: Larger spaces are usually living rooms
   - Kitchen fixtures: Look for counters, sinks, appliances drawn as rectangles/squares
   - Bathrooms: Small rooms with toilet/shower symbols
   - Bedrooms: Medium-sized enclosed rooms with doors
   - Hallways: Narrow connecting spaces

2. **Visual Clues**:
   - Thick black lines = walls
   - Gaps in walls = doorways
   - Small squares/rectangles within rooms = fixtures (toilets, sinks, etc.)
   - L-shaped areas often = kitchens with counters
   - Rectangular boxes in bathrooms = showers/tubs

3. **Spatial Analysis**:
   - Describe the location of EACH distinct space you see
   - Use directions: top-left, bottom-right, center, etc.
   - Note which rooms connect to each other
   - Identify the main entrance (usually opens to a hallway or living area)

4. **Count and List**:
   - How many distinct rooms/spaces do you see?
   - What is the approximate shape of each room?
   - Which rooms have doors vs open connections?

Even if you can't be 100% certain of room types, describe EVERY space you see and make educated guesses based on size and fixtures.`;

const createExtractionPrompt = (description: string, totalArea?: number) => `
Based on this floor plan description:
"${description}"

Convert to JSON with ALL required fields for each room.

${totalArea ? `Total area: ${totalArea} m²` : 'Estimate total area around 85 m²'}

MAPPING RULES:
- "top-left" → x:10, y:10
- "top-center" → x:40, y:10
- "top-right" → x:70, y:10
- "center" → x:40, y:40
- "bottom-left" → x:10, y:70
- "bottom-center" → x:40, y:70
- "bottom-right" → x:70, y:70
- "left side" → x:10
- "right side" → x:70

Return EXACTLY this structure with ALL fields filled:
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
      "y": 10,
      "w": 40,
      "h": 40,
      "type": "living",
      "suggestedFurniture": ["sofa", "coffee table"]
    }
  ],
  "scale": 50
}`;

// Map Roboflow classes to our room types
function mapClassToRoomType(roboflowClass: string): string {
  const classMap: { [key: string]: string } = {
    'bedroom': 'bedroom',
    'living_room': 'living',
    'kitchen': 'kitchen',
    'bathroom': 'bathroom',
    'dining_room': 'dining',
    'office': 'office',
    'closet': 'storage',
    'hallway': 'hallway',
    'room': 'room',
    'space': 'room',
  };

  return classMap[roboflowClass.toLowerCase()] || 'room';
}

// Helper function to get furniture for room type
function getFurnitureForType(roomType: string): string[] {
  const furnitureMap: Record<string, string[]> = {
    living: ["sofa", "coffee table", "TV stand", "armchair"],
    bedroom: ["bed", "nightstand", "wardrobe", "dresser"],
    kitchen: ["dining table", "stove", "refrigerator", "counter"],
    bathroom: ["toilet", "sink", "shower", "mirror"],
    hallway: ["console table", "coat rack"],
    dining: ["dining table", "chairs", "sideboard"],
    entrance: ["shoe rack", "coat rack", "mirror"],
    utility: ["washer", "dryer", "shelving"],
    storage: ["shelving", "storage boxes"],
    office: ["desk", "office chair", "bookshelf", "filing cabinet"],
    room: ["table", "chairs", "lighting"],
  };

  return furnitureMap[roomType] || ["furniture"];
}

// Roboflow analysis function
async function analyzeWithRoboflow(file: File, userTotalArea?: number) {
  if (!ROBOFLOW_API_KEY) {
    throw new Error('Roboflow API key not configured');
  }

  // Convert file to base64 for Roboflow API
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  console.log('Analyzing floor plan with Roboflow...');

  // Call Roboflow API using the correct format
  const url = new URL(ROBOFLOW_MODEL_ENDPOINT);
  url.searchParams.append('api_key', ROBOFLOW_API_KEY);
  url.searchParams.append('confidence', '0.3');
  url.searchParams.append('overlap', '0.5');

  const roboflowResponse = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: base64,
  });

  if (!roboflowResponse.ok) {
    const errorText = await roboflowResponse.text();
    console.error('Roboflow API error:', errorText);
    throw new Error(`Roboflow API returned ${roboflowResponse.status}: ${errorText}`);
  }

  const roboflowResult: RoboflowResponse = await roboflowResponse.json();
  console.log('🤖 Roboflow Raw Response:', JSON.stringify(roboflowResult, null, 2));
  console.log('Roboflow predictions:', roboflowResult.predictions.length);

  // Convert Roboflow predictions to our zone format  
  const filteredPredictions = roboflowResult.predictions.filter(pred => {
    // Filter out doors and low confidence predictions
    if (pred.class === 'door') {
      console.log(`🚫 Filtered out door: ${pred.width}x${pred.height}, confidence: ${pred.confidence}`);
      return false;
    }
    if (pred.confidence < 0.4) {
      console.log(`🚫 Filtered out low confidence ${pred.class}: ${pred.confidence}`);
      return false;
    }

    // Filter out very small detections by area (likely fixtures, not rooms)
    const area = pred.width * pred.height;
    const minRoomArea = 1000; // Minimum 1000 sq pixels (e.g., 32x32)
    if (area < minRoomArea) {
      console.log(`🚫 Filtered out tiny ${pred.class}: ${pred.width}x${pred.height} (${area} sq px)`);
      return false;
    }

    console.log(`✅ Keeping ${pred.class}: ${pred.width}x${pred.height} (${area} sq px), confidence: ${pred.confidence}`);
    return true;
  });

  console.log(`📊 Filtered ${roboflowResult.predictions.length} predictions down to ${filteredPredictions.length} rooms`);

  const zones = filteredPredictions
    .map((pred, index) => {
      const roomType = mapClassToRoomType(pred.class);
      let roomName = pred.class.charAt(0).toUpperCase() + pred.class.slice(1).replace('_', ' ');

      // Better naming for generic rooms
      if (pred.class === 'room') {
        roomName = `Room ${index + 1}`;
      }

      return {
        name: roomName,
        zoneId: `roboflow_${pred.class}_${index}`,
        x: Math.round(pred.x - pred.width / 2), // Roboflow gives center coordinates
        y: Math.round(pred.y - pred.height / 2),
        w: Math.round(pred.width),
        h: Math.round(pred.height),
        type: roomType,
        suggestedFurniture: getFurnitureForType(roomType),
      };
    });

  console.log('🔄 Roboflow Converted Zones:', JSON.stringify(zones, null, 2));

  // If no rooms detected, provide a basic layout
  if (zones.length === 0) {
    console.log('No rooms detected by Roboflow, creating basic layout');
    const imageWidth = roboflowResult.image.width || 800;
    const imageHeight = roboflowResult.image.height || 600;

    zones.push({
      name: 'Main Room',
      zoneId: 'main_room_1',
      x: Math.round(imageWidth * 0.1),
      y: Math.round(imageHeight * 0.1),
      w: Math.round(imageWidth * 0.8),
      h: Math.round(imageHeight * 0.8),
      type: 'room',
      suggestedFurniture: ['table', 'chairs'],
    });
  }

  const totalArea = userTotalArea || 85.5;

  // Convert from image pixels to percentage coordinates (0-100) 
  // This matches the format that GPT-4 Vision uses
  const imageWidth = roboflowResult.image.width || 800;
  const imageHeight = roboflowResult.image.height || 600;

  console.log(`🔄 Converting from image ${imageWidth}×${imageHeight}px to percentage coordinates`);

  // Convert zones from pixel coordinates to percentage coordinates
  const percentageZones = zones.map(zone => ({
    ...zone,
    x: Math.round((zone.x / imageWidth) * 100),
    y: Math.round((zone.y / imageHeight) * 100),
    w: Math.round((zone.w / imageWidth) * 100),
    h: Math.round((zone.h / imageHeight) * 100),
  }));

  console.log('🎯 Percentage Zones:', JSON.stringify(percentageZones, null, 2));

  const finalAnalysis = {
    totalArea,
    dimensions: {
      width: 12.5, // meters (will be processed by main function)
      height: 8.0
    },
    zones: percentageZones,
    scale: 50, // will be adjusted by main function
  };

  console.log('✅ Roboflow Final Analysis:', JSON.stringify(finalAnalysis, null, 2));

  return finalAnalysis;
}

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

    let analysis: FloorPlanAnalysis;
    let analysisMethod = 'gpt-vision';

    console.log(`🤖 Roboflow enabled: ${ROBOFLOW_ENABLED}, API key present: ${!!ROBOFLOW_API_KEY}`);

    // Try Roboflow first if enabled (enabled by default when API key is available)
    if (ROBOFLOW_ENABLED) {
      try {
        console.log('Trying Roboflow analysis...');
        analysis = await analyzeWithRoboflow(file, userTotalArea);
        analysisMethod = 'roboflow';
        console.log('Roboflow analysis successful!');
      } catch (roboflowError) {
        console.error('❌ Roboflow analysis failed:', roboflowError);
        console.log('⬇️ Falling back to GPT-4 Vision...');

        // Fall back to GPT-4 Vision
        analysis = await analyzeWithGPTVision(file, userTotalArea);
        analysisMethod = 'gpt-vision-fallback';
        console.log('✅ GPT-4 Vision fallback completed');
      }
    } else {
      // Use GPT-4 Vision directly
      console.log('Using GPT-4 Vision analysis...');
      analysis = await analyzeWithGPTVision(file, userTotalArea);
    }

    // Convert percentage-based coordinates to absolute coordinates based on analysis dimensions
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
    const shortId = await generateUniqueShortId();
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

    // Validate data before saving to database
    const floorPlanData = {
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
    };

    const validationResult = insertImportedFloorPlanSchema.safeParse(floorPlanData);
    if (!validationResult.success) {
      console.error('Validation failed for imported floor plan:', validationResult.error.issues);
      throw new Error(`Invalid floor plan data: ${validationResult.error.issues.map(issue => issue.message).join(', ')}`);
    }

    // Save to database
    const [savedFloorPlan] = await db
      .insert(importedFloorPlans)
      .values(validationResult.data)
      .returning();

    const result = {
      ...analysis,
      zones: convertedZones,
      imageUrl: blob.url,
      imageSize: file.size,
      processedAt: new Date().toISOString(),
      analysisMethod,
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

// GPT-4 Vision analysis function (fallback)
async function analyzeWithGPTVision(file: File, userTotalArea?: number): Promise<FloorPlanAnalysis> {
  // Convert image to base64 for OpenAI
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = file.type;
  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Debug: Check if image data is valid
  console.log('Image details:', {
    fileSize: file.size,
    mimeType: mimeType,
    base64Length: base64.length,
    dataUrlPreview: dataUrl.substring(0, 50) + '...'
  });

  // Phase 1: Get detailed description of the floor plan
  console.log('Phase 1: Getting floor plan description...');
  const descriptionResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You have computer vision capabilities. Look at the PROVIDED IMAGE and describe EXACTLY what you see. Do not give generic floor plan descriptions. Analyze THIS SPECIFIC image's walls, rooms, and grid layout."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: createDescriptivePrompt(),
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
    max_tokens: 1000,
    temperature: 0.2,
  });

  const description = descriptionResponse.choices[0]?.message?.content;
  console.log('Floor plan description:', description);

  if (!description) {
    throw new Error('Failed to get floor plan description');
  }

  // Phase 2: Convert description to structured data
  console.log('Phase 2: Converting to structured data...');
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a precise data converter. Take floor plan descriptions and convert them into exact JSON coordinates. Place rooms EXACTLY where they are described in the input. Never use generic placements."
      },
      {
        role: "user",
        content: createExtractionPrompt(description, userTotalArea),
      },
    ],
    max_tokens: 1500,
    temperature: 0.0,
  });

  const analysisText = response.choices[0]?.message?.content;

  if (!analysisText) {
    throw new Error('No analysis received from OpenAI');
  }

  console.log('OpenAI Response:', analysisText);

  // Parse and validate the JSON response using Zod
  let cleanText = analysisText.trim();

  // Remove any markdown code blocks
  cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');

  // Extract JSON object if embedded in text
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

  // Parse JSON first, then validate with Zod
  const rawAnalysis = JSON.parse(jsonString);

  // Transform and ensure all required fields
  if (rawAnalysis.zones && Array.isArray(rawAnalysis.zones)) {
    rawAnalysis.zones = rawAnalysis.zones.map((zone: Record<string, unknown>, index: number) => {
      const zoneType = (zone.type as string) || 'room';
      return {
        ...zone,
        // Ensure w/h instead of width/height
        w: zone.w ?? zone.width,
        h: zone.h ?? zone.height,
        width: undefined,
        height: undefined,
        // Add missing required fields
        name: zone.name || `${zoneType.charAt(0).toUpperCase() + zoneType.slice(1)} ${index + 1}`,
        zoneId: zone.zoneId || `${zoneType}_${index + 1}`,
        suggestedFurniture: zone.suggestedFurniture || getFurnitureForType(zoneType)
      };
    });
  }

  return FloorPlanAnalysisSchema.parse(rawAnalysis);
}
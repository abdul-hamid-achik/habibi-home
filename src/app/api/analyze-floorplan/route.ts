import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface Zone {
  name: string;
  zoneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
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
  width: z.number(),
  height: z.number(),
  type: z.string(),
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

// TODO: Consider multi-step analysis for better reliability:
// 1. Layout detection → basic room identification
// 2. Dimension extraction → measurements and scale
// 3. Zone refinement → precise coordinates
// 4. Validation → final cleanup and validation
//
// Current single-prompt approach works for most cases but multi-step
// would be more reliable for complex floor plans
const createAnalysisPrompt = (totalArea?: number) => `
You are an expert architectural floor plan analyzer. Focus on ACCURATE room identification and coordinate extraction.

CRITICAL: Respond with ONLY valid JSON. No text before or after.

${totalArea ? `Total area provided: ${totalArea} m²` : 'Estimate total area if needed'}

PRIORITY: Identify rooms first, then coordinates. Be precise with percentages.

If you see room labels, use them. Otherwise:
- Largest central space → Living Room
- Kitchen features (counters, appliances) → Kitchen
- Small private rooms → Bedroom
- Very small rooms with fixtures → Bathroom
- Entry point → Entrance
- Connecting areas → Hallway

Return percentages (0-100) for coordinates and dimensions.

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
      "type": "living"
    },
    {
      "name": "Kitchen",
      "zoneId": "kitchen",
      "x": 45,
      "y": 15,
      "width": 25,
      "height": 20,
      "type": "kitchen"
    }
  ],
  "scale": 50
}`;

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

    // Convert percentage-based coordinates to absolute coordinates
    // Assuming a standard floor plan size for the editor (similar to your original)
    const EDITOR_WIDTH = 1050; // cm
    const EDITOR_HEIGHT = 800; // cm

    const convertedZones = analysis.zones.map(zone => ({
      ...zone,
      // Convert percentages to absolute coordinates in cm
      x: Math.round((zone.x / 100) * EDITOR_WIDTH),
      y: Math.round((zone.y / 100) * EDITOR_HEIGHT),
      w: Math.round((zone.width / 100) * EDITOR_WIDTH),
      h: Math.round((zone.height / 100) * EDITOR_HEIGHT),
    }));

    const result = {
      ...analysis,
      zones: convertedZones,
      imageUrl: blob.url,
      imageSize: file.size,
      processedAt: new Date().toISOString(),
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
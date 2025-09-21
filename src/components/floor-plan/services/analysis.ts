import { z } from 'zod';

// Schema for AI analysis response
const analysisResponseSchema = z.object({
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  zones: z.array(z.object({
    zoneId: z.string().optional(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })).optional(),
});

export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;

interface AnalyzeFloorPlanOptions {
  file: File;
  signal?: AbortSignal;
}

/**
 * Analyzes a floor plan image using AI to extract dimensions and zones
 */
export async function analyzeFloorPlan({ file, signal }: AnalyzeFloorPlanOptions): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/analyze-floorplan', {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Floor plan analysis failed: ${error}`);
  }

  const data = await response.json();

  // Validate response data
  const result = analysisResponseSchema.safeParse(data);
  if (!result.success) {
    console.warn('Invalid analysis response format:', result.error);
    // Return raw data if validation fails but log warning
    return data as AnalysisResponse;
  }

  return result.data;
}
"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileImage, Loader2, Check, AlertCircle, Zap, X } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { Input } from '../ui/input';
import { z } from 'zod';

const floorPlanAnalysisSchema = z.object({
  totalArea: z.number().positive(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  zones: z.array(z.object({
    name: z.string().min(1),
    zoneId: z.string().min(1),
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive(),
    type: z.string(),
  })),
  scale: z.number().positive(),
  imageUrl: z.string().url(),
  imageSize: z.number().positive(),
  processedAt: z.string(),
  shortId: z.string().length(8).optional(),
  slug: z.string().optional(),
  id: z.number().optional(),
});

type FloorPlanAnalysisResult = z.infer<typeof floorPlanAnalysisSchema>;

interface FloorPlanUploaderProps {
  onAnalysisComplete: (analysis: FloorPlanAnalysisResult) => void;
  className?: string;
}

export function FloorPlanUploader({ onAnalysisComplete, className }: FloorPlanUploaderProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<FloorPlanAnalysisResult | null>(null);
  const [totalArea, setTotalArea] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper function to validate analysis result
  const validateAnalysisResult = (analysis: FloorPlanAnalysisResult) => {
    const validationResult = floorPlanAnalysisSchema.safeParse(analysis);
    if (!validationResult.success) {
      console.error('Invalid analysis result:', validationResult.error);
      throw new Error('Invalid analysis result format received from server');
    }
    return validationResult.data;
  };

  const analyzeFloorPlan = async (file: File, userProvidedArea?: number) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add the user-provided total area if available
      if (userProvidedArea && userProvidedArea > 0) {
        formData.append('totalArea', userProvidedArea.toString());
      }

      setUploadProgress('Analyzing floor plan...');

      // Smart analysis with automatic fallback (Roboflow → GPT-4 Vision)
      console.log('Analyzing floor plan...');
      setUploadProgress('Analyzing with Computer Vision...');

      const response = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details || errorData.error || 'Analysis failed';

        // Show specific suggestions for different error types
        if (response.status === 422) {
          throw new Error(`${errorMessage}\n\n${errorData.suggestion || ''}`);
        }

        throw new Error(errorMessage);
      }

      const analysis = await response.json();

      // Validate the analysis result
      const validatedAnalysis = validateAnalysisResult(analysis);

      setUploadProgress('Analysis complete!');
      setLastAnalysis(validatedAnalysis);

      // Redirect to editor with the imported data
      if (validatedAnalysis.shortId) {
        setTimeout(() => {
          router.push(`/editor/${validatedAnalysis.shortId}`);
        }, 1000); // Small delay to show success message
      } else {
        onAnalysisComplete(validatedAnalysis);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Floor plan analysis error:', err);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(''), 2000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError(null);

      // Create preview URL for the image
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [previewUrl]);

  const handleAnalyze = () => {
    if (!uploadedFile) return;

    const areaValue = totalArea ? parseFloat(totalArea) : undefined;
    analyzeFloorPlan(uploadedFile, areaValue);
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const dropzoneClasses = `
    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
    ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
    ${isDragReject ? 'border-red-500 bg-red-50' : ''}
    ${isUploading ? 'pointer-events-none opacity-70' : ''}
  `;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            AI Floor Plan Import
          </CardTitle>
          <CardDescription>
            Drop your architectural drawing and let AI extract rooms and measurements automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Only show dropzone when no file is uploaded */}
          {!uploadedFile && (
            <div {...getRootProps()} className={dropzoneClasses}>
              <input {...getInputProps()} />
              <div className="space-y-4">
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600 mt-2">{uploadProgress}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      {isDragActive ? (
                        <p className="text-blue-600 font-medium">Drop your floor plan here!</p>
                      ) : (
                        <div>
                          <p className="font-medium">Drop floor plan image here, or click to browse</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Supports JPG, PNG, GIF up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Area Input and Analyze Button */}
          {uploadedFile && !lastAnalysis && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              {/* Image Preview */}
              {previewUrl && (
                <div className="relative w-full h-64 bg-white rounded-lg overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="Floor plan preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(null);
                      }
                      setTotalArea('');
                      setError(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <FileImage className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {uploadedFile.name}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Total Area (optional but recommended)
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="number"
                      placeholder="84.23"
                      value={totalArea}
                      onChange={(e) => setTotalArea(e.target.value)}
                      className="flex-1"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">m²</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Providing the total area (like 84.23 m²) helps AI calculate room proportions more accurately
                  </p>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isUploading}
                  className="w-full"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Floor Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {lastAnalysis && (
            <Alert>
              <Check className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Analysis Complete!</p>
                  <p className="text-sm text-green-700">Redirecting to editor...</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Total Area:</strong> {lastAnalysis.totalArea} m²
                    </div>
                    <div>
                      <strong>Dimensions:</strong> {lastAnalysis.dimensions.width}×{lastAnalysis.dimensions.height}m
                    </div>
                    <div>
                      <strong>Zones Found:</strong> {lastAnalysis.zones.length}
                    </div>
                    <div>
                      <strong>Scale:</strong> {lastAnalysis.scale}px/m
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lastAnalysis.zones.map((zone, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {zone.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Upload your architectural floor plan drawing</li>
              <li>2. Enter the total area (e.g., 84.23 m²) if known</li>
              <li>3. AI analyzes the image to identify rooms and measurements</li>
              <li>4. Zones are created in the interactive editor</li>
              <li>5. Start adding furniture to your layout!</li>
            </ol>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Tips:</strong> Adding the total area greatly improves accuracy. Look for area information on your floor plan (like &quot;84.23 m²&quot;).
              </p>
            </div>
          </div>

          {lastAnalysis && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'image/*';
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setUploadedFile(file);

                      // Clean up old preview and create new one
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);

                      setTotalArea('');
                      setLastAnalysis(null);
                    }
                  };
                  fileInput.click();
                }}
                disabled={isUploading}
              >
                <FileImage className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (lastAnalysis.shortId) {
                    router.push(`/editor/${lastAnalysis.shortId}`);
                  } else {
                    onAnalysisComplete(lastAnalysis);
                  }
                }}
              >
                Open in Editor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
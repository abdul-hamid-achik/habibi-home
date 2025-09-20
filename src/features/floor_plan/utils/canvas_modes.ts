import { FloorPlanSettings } from '@/types';

export type CanvasMode = 'fixed' | 'fit-to-screen' | 'centered';

export interface CanvasSize {
  width: number;
  height: number;
  scale?: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Calculate canvas dimensions based on display mode and constraints
 * @param settings - Floor plan settings including dimensions and mode
 * @param viewport - Available viewport dimensions (optional)
 * @returns Calculated canvas dimensions in pixels
 */
export function calculateCanvasSize(
  settings: FloorPlanSettings,
  viewport?: ViewportSize
): CanvasSize {
  const {
    apartmentWidth,
    apartmentHeight,
    scale,
    canvasMode,
    maxCanvasWidth = Infinity,
    maxCanvasHeight = Infinity
  } = settings;

  // Base dimensions in pixels
  let width = apartmentWidth * scale;
  let height = apartmentHeight * scale;

  // Apply max constraints
  width = Math.min(width, maxCanvasWidth);
  height = Math.min(height, maxCanvasHeight);

  switch (canvasMode) {
    case 'fixed':
      // Use exact dimensions with max constraints
      return { width, height };

    case 'fit-to-screen':
      if (!viewport) {
        // If no viewport provided, use constrained dimensions
        return { width, height };
      }

      // Calculate scale to fit viewport while maintaining aspect ratio
      const aspectRatio = apartmentWidth / apartmentHeight;
      const viewportAspectRatio = viewport.width / viewport.height;

      let fitScale = scale;
      let fitWidth = width;
      let fitHeight = height;

      if (aspectRatio > viewportAspectRatio) {
        // Constrained by width
        fitWidth = Math.min(viewport.width, maxCanvasWidth);
        fitHeight = fitWidth / aspectRatio;
        fitScale = fitWidth / apartmentWidth;
      } else {
        // Constrained by height
        fitHeight = Math.min(viewport.height, maxCanvasHeight);
        fitWidth = fitHeight * aspectRatio;
        fitScale = fitHeight / apartmentHeight;
      }

      return {
        width: Math.round(fitWidth),
        height: Math.round(fitHeight),
        scale: fitScale
      };

    case 'centered':
      // Fixed size but centered in viewport
      // Size calculation is same as 'fixed', centering is handled by CSS/positioning
      return { width, height };

    default:
      // Fallback to fixed mode
      return { width, height };
  }
}

/**
 * Calculate centering offsets for centered canvas mode
 * @param canvasSize - Canvas dimensions
 * @param viewport - Viewport dimensions
 * @returns Offset coordinates for centering
 */
export function calculateCenterOffset(
  canvasSize: CanvasSize,
  viewport: ViewportSize
): { x: number; y: number } {
  return {
    x: Math.max(0, (viewport.width - canvasSize.width) / 2),
    y: Math.max(0, (viewport.height - canvasSize.height) / 2),
  };
}

/**
 * Get CSS classes for canvas container based on mode
 * @param mode - Canvas display mode
 * @returns CSS class names
 */
export function getCanvasModeClasses(mode: CanvasMode): string {
  const baseClasses = 'relative border bg-white shadow-lg';

  switch (mode) {
    case 'fixed':
      return `${baseClasses}`;
    case 'fit-to-screen':
      return `${baseClasses} w-full h-full`;
    case 'centered':
      return `${baseClasses} mx-auto my-auto`;
    default:
      return baseClasses;
  }
}

/**
 * Check if canvas mode requires viewport dimensions
 * @param mode - Canvas display mode
 * @returns True if viewport dimensions are needed
 */
export function requiresViewport(mode: CanvasMode): boolean {
  return mode === 'fit-to-screen';
}

/**
 * Calculate effective scale for a given canvas mode
 * @param settings - Floor plan settings
 * @param canvasSize - Calculated canvas size
 * @returns Effective scale factor
 */
export function getEffectiveScale(
  settings: FloorPlanSettings,
  canvasSize: CanvasSize
): number {
  if (canvasSize.scale !== undefined) {
    return canvasSize.scale;
  }
  return settings.scale;
}
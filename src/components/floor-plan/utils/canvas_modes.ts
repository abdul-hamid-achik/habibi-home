import { FloorPlanSettings } from '@/types';

export type CanvasMode = 'fixed' | 'fit-to-screen' | 'centered' | 'adaptive';

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
      const viewportAspectRatio = viewport.width / viewport.height;
      const apartmentAspectRatio = apartmentWidth / apartmentHeight;

      let fitScale = scale;
      let fitWidth = width;
      let fitHeight = height;

      if (apartmentAspectRatio > viewportAspectRatio) {
        // Constrained by width
        fitWidth = Math.min(viewport.width, maxCanvasWidth);
        fitHeight = fitWidth / apartmentAspectRatio;
        fitScale = fitWidth / apartmentWidth;
      } else {
        // Constrained by height
        fitHeight = Math.min(viewport.height, maxCanvasHeight);
        fitWidth = fitHeight * apartmentAspectRatio;
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

    case 'adaptive':
      if (!viewport) {
        // If no viewport provided, use constrained dimensions
        return { width, height };
      }

      // Calculate available space (accounting for UI elements)
      const availableWidth = viewport.width;
      const availableHeight = viewport.height;

      // Calculate optimal scale to maximize canvas usage while maintaining aspect ratio

      // Start with a reasonable base scale
      let optimalScale = scale;

      // Calculate how much we can scale up while staying within viewport bounds
      const maxScaleByWidth = availableWidth / apartmentWidth;
      const maxScaleByHeight = availableHeight / apartmentHeight;

      // Use the more restrictive constraint
      const maxPossibleScale = Math.min(maxScaleByWidth, maxScaleByHeight);

      // Apply a conservative scaling factor (leave some margin for UI)
      optimalScale = Math.min(maxPossibleScale * 0.9, scale * 1.5);

      // Ensure we don't go below the base scale
      optimalScale = Math.max(optimalScale, scale * 0.8);

      // Calculate final dimensions
      const finalWidth = apartmentWidth * optimalScale;
      const finalHeight = apartmentHeight * optimalScale;

      // Apply max constraints
      const constrainedWidth = Math.min(finalWidth, maxCanvasWidth);
      const constrainedHeight = Math.min(finalHeight, maxCanvasHeight);

      // If we hit constraints, adjust scale proportionally
      const adjustedScale = constrainedWidth < finalWidth
        ? constrainedWidth / apartmentWidth
        : constrainedHeight < finalHeight
          ? constrainedHeight / apartmentHeight
          : optimalScale;

      return {
        width: Math.round(constrainedWidth),
        height: Math.round(constrainedHeight),
        scale: adjustedScale
      };

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
      return `${baseClasses}`;
    case 'centered':
      return `${baseClasses}`;
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
  return mode === 'fit-to-screen' || mode === 'adaptive';
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

/**
 * Calculate canvas area in the specified unit system
 * @param settings - Floor plan settings
 * @param unitSystem - Unit system ('cm' | 'm')
 * @returns Canvas area as [value, unit] tuple
 */
export function calculateCanvasArea(
  settings: FloorPlanSettings,
  unitSystem: 'cm' | 'm' = 'cm'
): { value: number; unit: string; formatted: string } {
  const widthCm = settings.apartmentWidth;
  const heightCm = settings.apartmentHeight;

  if (unitSystem === 'm') {
    const widthM = widthCm / 100;
    const heightM = heightCm / 100;
    const areaM2 = widthM * heightM;

    return {
      value: areaM2,
      unit: 'm²',
      formatted: `${areaM2.toFixed(1)} m²`
    };
  } else {
    const areaCm2 = widthCm * heightCm;

    return {
      value: areaCm2,
      unit: 'cm²',
      formatted: `${areaCm2} cm²`
    };
  }
}
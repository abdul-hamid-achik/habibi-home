/**
 * Unit conversion utilities for floor plan editor
 * All internal calculations use centimeters (cm) as the base unit
 */

/**
 * Convert centimeters to pixels based on scale factor
 * @param cm - Value in centimeters
 * @param scale - Scale factor (pixels per centimeter)
 * @returns Value in pixels
 */
export function cm2px(cm: number, scale: number): number {
  return cm * scale;
}

/**
 * Convert pixels to centimeters based on scale factor
 * @param px - Value in pixels
 * @param scale - Scale factor (pixels per centimeter)
 * @returns Value in centimeters
 */
export function px2cm(px: number, scale: number): number {
  if (scale === 0) return 0;
  return px / scale;
}

/**
 * Snap a value to the nearest grid increment
 * @param value - Value to snap (in cm)
 * @param snap - Grid increment size (in cm), 0 to disable snapping
 * @returns Snapped value (in cm)
 */
export function snapToGrid(value: number, snap: number): number {
  if (snap <= 0) return value;
  return Math.round(value / snap) * snap;
}

/**
 * Snap a point to the nearest grid increment
 * @param x - X coordinate (in cm)
 * @param y - Y coordinate (in cm)
 * @param snap - Grid increment size (in cm), 0 to disable snapping
 * @returns Snapped coordinates
 */
export function snapPoint(
  x: number,
  y: number,
  snap: number
): { x: number; y: number } {
  return {
    x: snapToGrid(x, snap),
    y: snapToGrid(y, snap),
  };
}

/**
 * Snap dimensions to the nearest grid increment
 * @param width - Width (in cm)
 * @param height - Height (in cm)
 * @param snap - Grid increment size (in cm), 0 to disable snapping
 * @returns Snapped dimensions
 */
export function snapDimensions(
  width: number,
  height: number,
  snap: number
): { width: number; height: number } {
  return {
    width: snapToGrid(width, snap),
    height: snapToGrid(height, snap),
  };
}

/**
 * Convert a rectangle from cm to px
 * @param rect - Rectangle in cm
 * @param scale - Scale factor (pixels per centimeter)
 * @returns Rectangle in pixels
 */
export function rectCm2Px(
  rect: { x: number; y: number; w: number; h: number },
  scale: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: cm2px(rect.x, scale),
    y: cm2px(rect.y, scale),
    w: cm2px(rect.w, scale),
    h: cm2px(rect.h, scale),
  };
}

/**
 * Convert a rectangle from px to cm
 * @param rect - Rectangle in pixels
 * @param scale - Scale factor (pixels per centimeter)
 * @returns Rectangle in cm
 */
export function rectPx2Cm(
  rect: { x: number; y: number; w: number; h: number },
  scale: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: px2cm(rect.x, scale),
    y: px2cm(rect.y, scale),
    w: px2cm(rect.w, scale),
    h: px2cm(rect.h, scale),
  };
}
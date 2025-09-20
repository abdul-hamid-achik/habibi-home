/**
 * Geometry utilities for floor plan calculations
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RotatedRectangle extends Rectangle {
  r: number; // rotation in degrees
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculate bounding box for a rectangle
 * @param rect - Rectangle
 * @returns Bounding box
 */
export function getBounds(rect: Rectangle): Bounds {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.w;
  const maxY = rect.y + rect.h;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate bounding box for a rotated rectangle
 * @param rect - Rotated rectangle
 * @returns Bounding box that contains the rotated rectangle
 */
export function getRotatedBounds(rect: RotatedRectangle): Bounds {
  if (rect.r === 0) {
    return getBounds(rect);
  }

  const rad = (rect.r * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Get center point
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  // Calculate corners relative to center
  const hw = rect.w / 2;
  const hh = rect.h / 2;

  const corners: Point[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];

  // Rotate corners and find bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const corner of corners) {
    const x = cx + corner.x * cos - corner.y * sin;
    const y = cy + corner.x * sin + corner.y * cos;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a point is inside a rectangle
 * @param point - Point to check
 * @param rect - Rectangle
 * @returns True if point is inside rectangle
 */
export function pointInRect(point: Point, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

/**
 * Check if two rectangles overlap
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles overlap
 */
export function rectsOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
  return !(
    rect1.x + rect1.w < rect2.x ||
    rect2.x + rect2.w < rect1.x ||
    rect1.y + rect1.h < rect2.y ||
    rect2.y + rect2.h < rect1.y
  );
}

/**
 * Calculate center point of a rectangle
 * @param rect - Rectangle
 * @returns Center point
 */
export function getRectCenter(rect: Rectangle): Point {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

/**
 * Calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize angle to 0-360 degrees
 * @param degrees - Angle in degrees
 * @returns Normalized angle
 */
export function normalizeAngle(degrees: number): number {
  let angle = degrees % 360;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/**
 * Rotate a point around another point
 * @param point - Point to rotate
 * @param center - Center of rotation
 * @param degrees - Rotation angle in degrees
 * @returns Rotated point
 */
export function rotatePoint(point: Point, center: Point, degrees: number): Point {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Constrain a rectangle to stay within bounds
 * @param rect - Rectangle to constrain
 * @param bounds - Boundary limits
 * @returns Constrained rectangle
 */
export function constrainToBounds(rect: Rectangle, bounds: Rectangle): Rectangle {
  const newRect = { ...rect };

  // Constrain position
  newRect.x = Math.max(bounds.x, Math.min(bounds.x + bounds.w - rect.w, rect.x));
  newRect.y = Math.max(bounds.y, Math.min(bounds.y + bounds.h - rect.h, rect.y));

  // Constrain size if needed
  newRect.w = Math.min(rect.w, bounds.w);
  newRect.h = Math.min(rect.h, bounds.h);

  return newRect;
}

/**
 * Calculate aspect ratio
 * @param width - Width
 * @param height - Height
 * @returns Aspect ratio (width / height)
 */
export function aspectRatio(width: number, height: number): number {
  return height === 0 ? 0 : width / height;
}

/**
 * Scale rectangle while maintaining aspect ratio
 * @param rect - Original rectangle
 * @param targetWidth - Target width (optional)
 * @param targetHeight - Target height (optional)
 * @returns Scaled rectangle
 */
export function scaleRectAspectRatio(
  rect: Rectangle,
  targetWidth?: number,
  targetHeight?: number
): Rectangle {
  if (!targetWidth && !targetHeight) {
    return rect;
  }

  const ratio = aspectRatio(rect.w, rect.h);

  let newWidth = rect.w;
  let newHeight = rect.h;

  if (targetWidth && targetHeight) {
    // Fit within both constraints
    const targetRatio = aspectRatio(targetWidth, targetHeight);
    if (ratio > targetRatio) {
      newWidth = targetWidth;
      newHeight = targetWidth / ratio;
    } else {
      newHeight = targetHeight;
      newWidth = targetHeight * ratio;
    }
  } else if (targetWidth) {
    newWidth = targetWidth;
    newHeight = targetWidth / ratio;
  } else if (targetHeight) {
    newHeight = targetHeight;
    newWidth = targetHeight * ratio;
  }

  return {
    x: rect.x,
    y: rect.y,
    w: newWidth,
    h: newHeight,
  };
}
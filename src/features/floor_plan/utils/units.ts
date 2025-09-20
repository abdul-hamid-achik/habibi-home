/**
 * Unit conversion utilities for floor plan editor
 * Using snake_case for new features, camelCase aliases for compatibility
 */

// Snake case functions (preferred for new features)
export const cm2px_func = (scale_px_per_cm: number) => (cm: number): number => {
  return cm * scale_px_per_cm;
};

export const px2cm_func = (scale_px_per_cm: number) => (px: number): number => {
  return px / scale_px_per_cm;
};

export const snap_to_grid = (cm: number, snap_cm: number): number => {
  if (snap_cm <= 0) return cm;
  return Math.round(cm / snap_cm) * snap_cm;
};

// Legacy compatibility functions (match existing import pattern)
export const cm2px = (cm: number, scale: number): number => {
  return cm * scale;
};

export const px2cm = (px: number, scale: number): number => {
  return px / scale;
};

export const snapToGrid = (value: number, snap: number): number => {
  if (snap <= 0) return value;
  return Math.round(value / snap) * snap;
};
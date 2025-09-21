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

// Unit system conversion functions
export const cm_to_m = (cm: number): number => {
  return cm / 100;
};

export const m_to_cm = (m: number): number => {
  return m * 100;
};

export const cm2_to_m2 = (cm2: number): number => {
  return cm2 / 10000;
};

export const m2_to_cm2 = (m2: number): number => {
  return m2 * 10000;
};

// Format functions with units
export const format_dimension = (value: number, unitSystem: 'cm' | 'm'): string => {
  if (unitSystem === 'm') {
    return `${cm_to_m(value).toFixed(1)} m`;
  }
  return `${value} cm`;
};

export const format_area = (value: number, unitSystem: 'cm' | 'm'): string => {
  if (unitSystem === 'm') {
    return `${cm2_to_m2(value).toFixed(1)} m²`;
  }
  return `${value} cm²`;
};

// Parse functions (extract numeric value from formatted string)
export const parse_dimension = (formatted: string): number => {
  const match = formatted.match(/([\d.]+)\s*(cm|m)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (unit === 'm') {
    return m_to_cm(value);
  }
  return value;
};

export const parse_area = (formatted: string): number => {
  const match = formatted.match(/([\d.]+)\s*(m²|cm²)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (unit === 'm²') {
    return m2_to_cm2(value);
  }
  return value;
};
/**
 * Zone logic utilities for automatic zone assignment and furniture placement
 */

import { FloorPlanZone, FurnitureItemType } from '@/types';

export interface ZoneAssignmentResult {
  zoneId: string | null;
  zoneName: string | null;
  overlapsMultiple: boolean;
  overlappingZones: string[];
}

/**
 * Calculate if two rectangles overlap
 */
function rectanglesOverlap(
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number }
): boolean {
  return !(
    rect1.x >= rect2.x + rect2.w ||
    rect2.x >= rect1.x + rect1.w ||
    rect1.y >= rect2.y + rect2.h ||
    rect2.y >= rect1.y + rect1.h
  );
}

/**
 * Calculate the overlap area between two rectangles
 */
function calculateOverlapArea(
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number }
): number {
  if (!rectanglesOverlap(rect1, rect2)) return 0;

  const overlapX1 = Math.max(rect1.x, rect2.x);
  const overlapY1 = Math.max(rect1.y, rect2.y);
  const overlapX2 = Math.min(rect1.x + rect1.w, rect2.x + rect2.w);
  const overlapY2 = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);

  return (overlapX2 - overlapX1) * (overlapY2 - overlapY1);
}

/**
 * Determine which zone a furniture item should be assigned to
 * Returns the zone with the largest overlap area
 */
export function detectFurnitureZone(
  furniture: Pick<FurnitureItemType, 'x' | 'y' | 'w' | 'h'>,
  zones: FloorPlanZone[]
): ZoneAssignmentResult {
  const overlappingZones: Array<{
    zone: FloorPlanZone;
    overlapArea: number;
  }> = [];

  // Calculate overlap with each zone
  for (const zone of zones) {
    const overlapArea = calculateOverlapArea(furniture, zone);
    if (overlapArea > 0) {
      overlappingZones.push({ zone, overlapArea });
    }
  }

  // No overlaps
  if (overlappingZones.length === 0) {
    return {
      zoneId: null,
      zoneName: null,
      overlapsMultiple: false,
      overlappingZones: []
    };
  }

  // Sort by overlap area (largest first)
  overlappingZones.sort((a, b) => b.overlapArea - a.overlapArea);

  // Get the zone with the largest overlap
  const primaryZone = overlappingZones[0].zone;

  return {
    zoneId: primaryZone.id,
    zoneName: primaryZone.name,
    overlapsMultiple: overlappingZones.length > 1,
    overlappingZones: overlappingZones.map(item => item.zone.id)
  };
}

/**
 * Auto-assign all furniture to their best zones
 */
export function autoAssignFurnitureToZones(
  furniture: FurnitureItemType[],
  zones: FloorPlanZone[]
): FurnitureItemType[] {
  return furniture.map(item => {
    const assignment = detectFurnitureZone(item, zones);
    return {
      ...item,
      zoneId: assignment.zoneId || undefined
    };
  });
}

/**
 * Check if furniture placement is valid within a zone
 */
export function isValidFurniturePlacement(
  furniture: Pick<FurnitureItemType, 'x' | 'y' | 'w' | 'h'>,
  zone: FloorPlanZone,
  minOverlapPercentage: number = 0.8
): boolean {
  const furnitureArea = furniture.w * furniture.h;
  const overlapArea = calculateOverlapArea(furniture, zone);
  const overlapPercentage = overlapArea / furnitureArea;

  return overlapPercentage >= minOverlapPercentage;
}

/**
 * Get furniture within a specific zone
 */
export function getFurnitureInZone(
  furniture: FurnitureItemType[],
  zoneId: string
): FurnitureItemType[] {
  return furniture.filter(item => item.zoneId === zoneId);
}

/**
 * Get unassigned furniture (not in any zone)
 */
export function getUnassignedFurniture(
  furniture: FurnitureItemType[]
): FurnitureItemType[] {
  return furniture.filter(item => !item.zoneId);
}

/**
 * Calculate zone utilization statistics
 */
export function calculateZoneUtilization(
  zone: FloorPlanZone,
  furniture: FurnitureItemType[]
): {
  totalArea: number;
  occupiedArea: number;
  utilizationPercentage: number;
  furnitureCount: number;
} {
  const zoneArea = zone.w * zone.h;
  const furnitureInZone = getFurnitureInZone(furniture, zone.id);

  let occupiedArea = 0;
  for (const item of furnitureInZone) {
    const overlapArea = calculateOverlapArea(item, zone);
    occupiedArea += overlapArea;
  }

  return {
    totalArea: zoneArea,
    occupiedArea,
    utilizationPercentage: (occupiedArea / zoneArea) * 100,
    furnitureCount: furnitureInZone.length
  };
}

/**
 * Suggest optimal furniture placement within a zone
 */
export function suggestFurniturePlacement(
  furniture: Pick<FurnitureItemType, 'w' | 'h'>,
  zone: FloorPlanZone,
  existingFurniture: FurnitureItemType[],
  padding: number = 10
): { x: number; y: number } | null {
  const furnitureInZone = getFurnitureInZone(existingFurniture, zone.id);

  // Try to place furniture starting from top-left corner
  for (let y = zone.y + padding; y <= zone.y + zone.h - furniture.h - padding; y += 5) {
    for (let x = zone.x + padding; x <= zone.x + zone.w - furniture.w - padding; x += 5) {
      const testPosition = { x, y, w: furniture.w, h: furniture.h };

      // Check if position conflicts with existing furniture
      const hasConflict = furnitureInZone.some(existing =>
        rectanglesOverlap(testPosition, existing)
      );

      if (!hasConflict) {
        return { x, y };
      }
    }
  }

  // No valid placement found
  return null;
}
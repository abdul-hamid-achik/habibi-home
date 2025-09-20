import { useState, useCallback, useMemo } from 'react';
import { FloorPlanZone, FurnitureItemType } from '@/types';

interface DragState {
  isDragging: boolean;
  draggedFurniture: FurnitureItemType | null;
  dragPosition: { x: number; y: number } | null;
  startPosition: { x: number; y: number } | null;
}

interface UseZoneAssignmentProps {
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  scale: number;
  onFurnitureUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
}

export function useZoneAssignment({
  zones,
  furniture,
  scale,
  onFurnitureUpdate
}: UseZoneAssignmentProps) {
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedFurniture: null,
    dragPosition: null,
    startPosition: null
  });
  
  // Convert pixels to cm
  const px2cm = useCallback((px: number) => px / scale, [scale]);
  
  // Find zone containing a point (in cm coordinates)
  const findZoneAtPosition = useCallback((x: number, y: number) => {
    return zones.find(zone => {
      return x >= zone.x && 
             x <= zone.x + zone.w &&
             y >= zone.y && 
             y <= zone.y + zone.h;
    });
  }, [zones]);
  
  // Get zone containing furniture center (in screen coordinates)
  const getZoneAtScreenPosition = useCallback((screenX: number, screenY: number) => {
    const cmX = px2cm(screenX);
    const cmY = px2cm(screenY);
    return findZoneAtPosition(cmX, cmY);
  }, [px2cm, findZoneAtPosition]);
  
  // Start dragging furniture
  const startDrag = useCallback((furniture: FurnitureItemType, screenPosition: { x: number; y: number }) => {
    setDragState({
      isDragging: true,
      draggedFurniture: furniture,
      dragPosition: screenPosition,
      startPosition: screenPosition
    });
  }, []);
  
  // Update drag position
  const updateDragPosition = useCallback((screenPosition: { x: number; y: number }) => {
    setDragState(prev => prev.isDragging ? {
      ...prev,
      dragPosition: screenPosition
    } : prev);
  }, []);
  
  // End drag and handle zone assignment
  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedFurniture || !dragState.dragPosition) {
      setDragState({
        isDragging: false,
        draggedFurniture: null,
        dragPosition: null,
        startPosition: null
      });
      return;
    }
    
    const { draggedFurniture, dragPosition } = dragState;
    
    // Find the zone under the drop position
    const targetZone = getZoneAtScreenPosition(dragPosition.x, dragPosition.y);
    
    // Update furniture position
    const newX = px2cm(dragPosition.x - (draggedFurniture.w * scale) / 2);
    const newY = px2cm(dragPosition.y - (draggedFurniture.h * scale) / 2);
    
    // Prepare updates
    const updates: Partial<FurnitureItemType> = {
      x: Math.round(newX),
      y: Math.round(newY)
    };
    
    // Assign to zone if dropped in one
    if (targetZone) {
      updates.zoneId = targetZone.id;
    } else {
      // If dropped outside any zone, remove zone assignment
      updates.zoneId = undefined;
    }
    
    // Apply updates
    onFurnitureUpdate(draggedFurniture.id, updates);
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedFurniture: null,
      dragPosition: null,
      startPosition: null
    });
  }, [dragState, getZoneAtScreenPosition, px2cm, scale, onFurnitureUpdate]);
  
  // Cancel drag (return to original position)
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedFurniture: null,
      dragPosition: null,
      startPosition: null
    });
  }, []);
  
  // Get current hovered zone
  const hoveredZone = useMemo(() => {
    if (!dragState.isDragging || !dragState.dragPosition) {
      return null;
    }
    return getZoneAtScreenPosition(dragState.dragPosition.x, dragState.dragPosition.y);
  }, [dragState.isDragging, dragState.dragPosition, getZoneAtScreenPosition]);
  
  // Auto-assign furniture to zones based on their center position
  const autoAssignFurnitureToZones = useCallback(() => {
    furniture.forEach(item => {
      const centerX = item.x + item.w / 2;
      const centerY = item.y + item.h / 2;
      const zone = findZoneAtPosition(centerX, centerY);
      
      if (zone && item.zoneId !== zone.id) {
        onFurnitureUpdate(item.id, { zoneId: zone.id });
      } else if (!zone && item.zoneId) {
        onFurnitureUpdate(item.id, { zoneId: undefined });
      }
    });
  }, [furniture, findZoneAtPosition, onFurnitureUpdate]);
  
  // Get furniture by zone
  const getFurnitureInZone = useCallback((zoneId: string) => {
    return furniture.filter(item => item.zoneId === zoneId);
  }, [furniture]);
  
  // Get unassigned furniture
  const getUnassignedFurniture = useCallback(() => {
    return furniture.filter(item => !item.zoneId);
  }, [furniture]);
  
  // Check if furniture overlaps with zone boundaries
  const getFurnitureZoneOverlap = useCallback((furnitureItem: FurnitureItemType) => {
    const overlappingZones: FloorPlanZone[] = [];
    
    zones.forEach(zone => {
      // Check if furniture rectangle intersects with zone rectangle
      const furnitureLeft = furnitureItem.x;
      const furnitureRight = furnitureItem.x + furnitureItem.w;
      const furnitureTop = furnitureItem.y;
      const furnitureBottom = furnitureItem.y + furnitureItem.h;
      
      const zoneLeft = zone.x;
      const zoneRight = zone.x + zone.w;
      const zoneTop = zone.y;
      const zoneBottom = zone.y + zone.h;
      
      const hasOverlap = !(
        furnitureRight <= zoneLeft ||
        furnitureLeft >= zoneRight ||
        furnitureBottom <= zoneTop ||
        furnitureTop >= zoneBottom
      );
      
      if (hasOverlap) {
        overlappingZones.push(zone);
      }
    });
    
    return overlappingZones;
  }, [zones]);
  
  return {
    // Drag state
    isDragging: dragState.isDragging,
    draggedFurniture: dragState.draggedFurniture,
    dragPosition: dragState.dragPosition,
    hoveredZone,
    
    // Drag controls
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    
    // Zone assignment utilities
    autoAssignFurnitureToZones,
    getFurnitureInZone,
    getUnassignedFurniture,
    getFurnitureZoneOverlap,
    findZoneAtPosition,
    getZoneAtScreenPosition
  };
}
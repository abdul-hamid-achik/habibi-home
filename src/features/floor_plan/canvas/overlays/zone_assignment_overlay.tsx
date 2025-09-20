"use client";

import React, { useMemo } from 'react';
import { FloorPlanZone, FurnitureItemType } from '@/types';

interface ZoneAssignmentOverlayProps {
  // Canvas dimensions
  width: number;
  height: number;
  scale: number;
  
  // Data
  zones: FloorPlanZone[];
  
  // Drag state
  isDragging: boolean;
  draggedFurniture: FurnitureItemType | null;
  dragPosition: { x: number; y: number } | null;
  
  // Feedback
  highlightedZoneId: string | null;
}

export function ZoneAssignmentOverlay({
  width,
  height,
  scale,
  zones,
  isDragging,
  draggedFurniture,
  dragPosition,
  highlightedZoneId
}: ZoneAssignmentOverlayProps) {
  
  // Convert cm to pixels
  const cm2px = (cm: number) => cm * scale;
  
  // Calculate which zone contains the current drag position
  const getZoneAtPosition = (x: number, y: number) => {
    if (!draggedFurniture || !dragPosition) return null;
    
    // Convert screen coordinates to cm
    const furnitureCenterX = x / scale;
    const furnitureCenterY = y / scale;
    
    return zones.find(zone => {
      return furnitureCenterX >= zone.x && 
             furnitureCenterX <= zone.x + zone.w &&
             furnitureCenterY >= zone.y && 
             furnitureCenterY <= zone.y + zone.h;
    });
  };
  
  const hoveredZone = dragPosition ? getZoneAtPosition(dragPosition.x, dragPosition.y) : null;
  
  // Memoize zone overlays to prevent unnecessary re-renders
  const zoneOverlays = useMemo(() => {
    if (!isDragging || !draggedFurniture) return [];
    
    return zones.map(zone => {
      const isHovered = hoveredZone?.id === zone.id;
      const isHighlighted = highlightedZoneId === zone.id;
      const isCurrentZone = draggedFurniture.zoneId === zone.id;
      
      let overlayStyle = {};
      let borderStyle = {};
      let textStyle = {};
      
      if (isHovered) {
        // Zone being hovered during drag
        overlayStyle = {
          backgroundColor: 'rgba(34, 197, 94, 0.2)', // green
          backdropFilter: 'blur(1px)'
        };
        borderStyle = {
          border: '2px solid #22c55e',
          borderRadius: '4px'
        };
        textStyle = {
          color: '#15803d',
          fontWeight: 'bold',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '11px'
        };
      } else if (isCurrentZone) {
        // Zone where the furniture currently belongs
        overlayStyle = {
          backgroundColor: 'rgba(59, 130, 246, 0.15)', // blue
        };
        borderStyle = {
          border: '1px dashed #3b82f6',
          borderRadius: '4px'
        };
        textStyle = {
          color: '#1d4ed8',
          fontSize: '11px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '1px 4px',
          borderRadius: '2px'
        };
      } else if (isHighlighted) {
        // Zone highlighted for other reasons
        overlayStyle = {
          backgroundColor: 'rgba(168, 85, 247, 0.1)', // purple
        };
        borderStyle = {
          border: '1px solid #a855f7',
          borderRadius: '4px'
        };
      } else {
        // Default zone appearance during drag
        overlayStyle = {
          backgroundColor: 'rgba(156, 163, 175, 0.05)', // gray
        };
        borderStyle = {
          border: '1px solid rgba(156, 163, 175, 0.3)',
          borderRadius: '4px'
        };
      }
      
      return (
        <div
          key={zone.id}
          className="absolute pointer-events-none transition-all duration-150"
          style={{
            left: cm2px(zone.x),
            top: cm2px(zone.y),
            width: cm2px(zone.w),
            height: cm2px(zone.h),
            ...overlayStyle,
            ...borderStyle,
            zIndex: isHovered ? 20 : 10
          }}
        >
          {/* Zone label */}
          <div
            className="absolute top-1 left-1 text-xs select-none transition-all duration-150"
            style={textStyle}
          >
            {zone.name}
            {isHovered && ' ✓'}
            {isCurrentZone && !isHovered && ' (current)'}
          </div>
          
          {/* Drop hint for hovered zone */}
          {isHovered && (
            <div className="absolute bottom-1 right-1 text-xs text-green-700 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm">
              Drop to assign
            </div>
          )}
        </div>
      );
    });
  }, [zones, isDragging, draggedFurniture, hoveredZone, highlightedZoneId, cm2px]);
  
  // Drag preview for the furniture being moved
  const dragPreview = useMemo(() => {
    if (!isDragging || !draggedFurniture || !dragPosition) return null;
    
    return (
      <div
        className="absolute pointer-events-none transition-transform duration-75"
        style={{
          left: dragPosition.x - cm2px(draggedFurniture.w) / 2,
          top: dragPosition.y - cm2px(draggedFurniture.h) / 2,
          width: cm2px(draggedFurniture.w),
          height: cm2px(draggedFurniture.h),
          backgroundColor: draggedFurniture.color,
          border: '2px solid rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          opacity: 0.7,
          transform: `rotate(${draggedFurniture.r}deg)`,
          transformOrigin: 'center',
          zIndex: 30,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
          {draggedFurniture.name}
        </div>
      </div>
    );
  }, [isDragging, draggedFurniture, dragPosition, cm2px]);
  
  if (!isDragging || !draggedFurniture) {
    return null;
  }
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    >
      {/* Zone overlays */}
      {zoneOverlays}
      
      {/* Drag preview */}
      {dragPreview}
      
      {/* Assignment instructions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-95 px-4 py-2 rounded-lg shadow-lg border z-40">
        <div className="text-sm font-medium text-gray-800">
          Dragging: {draggedFurniture.name}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {hoveredZone ? (
            <span className="text-green-600">Drop in <strong>{hoveredZone.name}</strong> to assign</span>
          ) : (
            'Hover over a zone to assign furniture'
          )}
        </div>
      </div>
    </div>
  );
}
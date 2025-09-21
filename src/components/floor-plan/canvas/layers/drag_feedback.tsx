"use client";

import React from 'react';
import { FloorPlanZone, FurnitureItemType } from '@/types';
import { detectFurnitureZone, isValidFurniturePlacement } from '../../utils/zone_logic';

interface DragFeedbackProps {
  // Drag state
  isDragging: boolean;
  draggedItem: FurnitureItemType | null;
  dragPosition: { x: number; y: number } | null;

  // Canvas properties
  canvasWidth: number;
  canvasHeight: number;
  scale: number; // px per cm

  // Floor plan data
  zones: FloorPlanZone[];

  // Visual settings
  showZoneHighlight?: boolean;
  showValidationFeedback?: boolean;
}

export function DragFeedback({
  isDragging,
  draggedItem,
  dragPosition,
  canvasWidth,
  canvasHeight,
  scale,
  zones,
  showZoneHighlight = true,
  showValidationFeedback = true
}: DragFeedbackProps) {

  if (!isDragging || !draggedItem || !dragPosition) {
    return null;
  }

  // Convert cm to pixels
  const cm2px = (cm: number) => cm * scale;

  // Calculate furniture position in cm
  const furnitureCm = {
    x: dragPosition.x / scale,
    y: dragPosition.y / scale,
    w: draggedItem.w,
    h: draggedItem.h
  };

  // Detect which zone the furniture would be in
  const zoneAssignment = detectFurnitureZone(furnitureCm, zones);
  const targetZone = zones.find(z => z.id === zoneAssignment.zoneId);

  // Check if placement is valid
  const isValidPlacement = targetZone ?
    isValidFurniturePlacement(furnitureCm, targetZone, 0.5) : false;

  // Check if furniture is within canvas bounds
  const isWithinBounds =
    dragPosition.x >= 0 &&
    dragPosition.y >= 0 &&
    dragPosition.x + cm2px(draggedItem.w) <= canvasWidth &&
    dragPosition.y + cm2px(draggedItem.h) <= canvasHeight;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Zone Highlight */}
      {showZoneHighlight && targetZone && (
        <div
          className={`absolute border-2 transition-all duration-150 ${
            isValidPlacement
              ? 'border-green-400 bg-green-100 bg-opacity-20'
              : 'border-yellow-400 bg-yellow-100 bg-opacity-20'
          }`}
          style={{
            left: cm2px(targetZone.x),
            top: cm2px(targetZone.y),
            width: cm2px(targetZone.w),
            height: cm2px(targetZone.h),
            zIndex: 25
          }}
        >
          {/* Zone Label */}
          <div
            className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
              isValidPlacement
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-white'
            }`}
          >
            {targetZone.name}
            {zoneAssignment.overlapsMultiple && (
              <span className="ml-1 opacity-75">(overlapping)</span>
            )}
          </div>
        </div>
      )}

      {/* Furniture Ghost/Preview */}
      <div
        className={`absolute border-2 border-dashed transition-all duration-150 ${
          !isWithinBounds
            ? 'border-red-500 bg-red-100 bg-opacity-30'
            : isValidPlacement
              ? 'border-green-500 bg-green-100 bg-opacity-30'
              : targetZone
                ? 'border-yellow-500 bg-yellow-100 bg-opacity-30'
                : 'border-blue-500 bg-blue-100 bg-opacity-30'
        }`}
        style={{
          left: dragPosition.x,
          top: dragPosition.y,
          width: cm2px(draggedItem.w),
          height: cm2px(draggedItem.h),
          zIndex: 35
        }}
      >
        {/* Furniture Icon/Name */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${
              !isWithinBounds
                ? 'bg-red-500 text-white'
                : isValidPlacement
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
            }`}
          >
            {draggedItem.name}
          </div>
        </div>

        {/* Rotation indicator */}
        {draggedItem.r !== 0 && (
          <div
            className="absolute top-1 right-1 w-4 h-4 bg-white bg-opacity-80 rounded border text-xs flex items-center justify-center"
            title={`Rotated ${draggedItem.r}°`}
          >
            ↻
          </div>
        )}
      </div>

      {/* Validation Feedback */}
      {showValidationFeedback && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-w-xs">
          <div className="text-sm">
            <div className="font-medium mb-1">
              Moving: {draggedItem.name}
            </div>

            {!isWithinBounds && (
              <div className="text-red-600 text-xs">
                ⚠️ Outside canvas bounds
              </div>
            )}

            {isWithinBounds && targetZone && (
              <div className="text-xs space-y-1">
                <div className={isValidPlacement ? 'text-green-600' : 'text-yellow-600'}>
                  {isValidPlacement ? '✓' : '⚠️'} Zone: {targetZone.name}
                </div>

                {zoneAssignment.overlapsMultiple && (
                  <div className="text-orange-600">
                    ⚠️ Overlaps multiple zones
                  </div>
                )}

                {!isValidPlacement && (
                  <div className="text-yellow-600">
                    Partially outside zone
                  </div>
                )}
              </div>
            )}

            {isWithinBounds && !targetZone && (
              <div className="text-blue-600 text-xs">
                No zone assignment
              </div>
            )}

            <div className="text-xs text-gray-500 mt-1">
              {Math.round(furnitureCm.x)}×{Math.round(furnitureCm.y)} cm
            </div>
          </div>
        </div>
      )}

      {/* Canvas Bounds Indicator */}
      {!isWithinBounds && (
        <div
          className="absolute border-2 border-red-500 border-dashed bg-red-50 bg-opacity-20"
          style={{
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
            zIndex: 20
          }}
        />
      )}
    </div>
  );
}
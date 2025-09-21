"use client";

import React, { useState } from 'react';
import { FloorPlanZone, FloorPlanSettings } from '@/types';
import { cm2px } from '../../utils/units';

interface ZonesLayerProps {
  zones: FloorPlanZone[];
  settings: FloorPlanSettings;
  selectedZoneId: string | null;
  onZoneSelect: (id: string | null) => void;
  onZoneUpdate?: (id: string, updates: Partial<FloorPlanZone>) => void;
  editorMode: 'zones' | 'furniture' | 'diagrams';
}

export function ZonesLayer({
  zones,
  settings,
  selectedZoneId,
  onZoneSelect,
  onZoneUpdate,
  editorMode
}: ZonesLayerProps) {
  const toPx = (cm: number) => cm2px(cm, settings.scale);
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleZoneClick = (e: React.MouseEvent, zone: FloorPlanZone) => {
    e.stopPropagation();
    if (editorMode === 'zones') {
      onZoneSelect(zone.id);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, zone: FloorPlanZone) => {
    if (editorMode !== 'zones') return;

    e.stopPropagation();
    setDraggedZone(zone.id);
    setDragStart({ x: e.clientX, y: e.clientY });
    onZoneSelect(zone.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedZone || !dragStart || editorMode !== 'zones' || !onZoneUpdate) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const zone = zones.find(z => z.id === draggedZone);
    if (!zone) return;

    const newX = Math.max(0, zone.x + Math.round(deltaX / settings.scale));
    const newY = Math.max(0, zone.y + Math.round(deltaY / settings.scale));

    onZoneUpdate(draggedZone, { x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggedZone(null);
    setDragStart(null);
  };


  return (
    <>
      {zones.map(zone => {
        const isSelected = selectedZoneId === zone.id;
        const isInZonesMode = editorMode === 'zones';
        const isDragging = draggedZone === zone.id;

        return (
          <div key={zone.id}>
            {/* Main zone rectangle */}
            <div
              className={`absolute flex items-center justify-center select-none rounded border-2 transition-all cursor-pointer ${isInZonesMode
                ? isSelected
                  ? 'border-blue-500 bg-blue-100/50 shadow-lg'
                  : 'border-amber-400 bg-amber-100/30 hover:bg-amber-100/50'
                : 'border-gray-300 bg-gray-100/30'
                } ${isDragging ? 'shadow-2xl z-10' : ''}`}
              style={{
                left: toPx(zone.x),
                top: toPx(zone.y),
                width: toPx(zone.w),
                height: toPx(zone.h),
                zIndex: isSelected ? 3 : 1,
              }}
              onClick={(e) => handleZoneClick(e, zone)}
              onMouseDown={(e) => handleMouseDown(e, zone)}
            >
              <div className="text-center text-xs text-gray-700 px-1 pointer-events-none">
                <div className="font-medium truncate">{zone.name}</div>
                {settings.showDimensions && (
                  <div className="text-xs opacity-70">
                    {Math.round(zone.w)}×{Math.round(zone.h)}cm
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })}

      {/* Invisible overlay to capture mouse events */}
      {draggedZone && (
        <div
          className="fixed inset-0 z-40 cursor-grabbing"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}
    </>
  );
}
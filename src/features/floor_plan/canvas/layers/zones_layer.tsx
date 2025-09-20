"use client";

import React from 'react';
import { FloorPlanZone, FloorPlanSettings } from '@/types';
import { cm2px } from '../../utils/units';

interface ZonesLayerProps {
  zones: FloorPlanZone[];
  settings: FloorPlanSettings;
  selectedZoneId: string | null;
  onZoneSelect: (id: string | null) => void;
  editorMode: 'zones' | 'furniture' | 'diagrams';
}

export function ZonesLayer({
  zones,
  settings,
  selectedZoneId,
  onZoneSelect,
  editorMode
}: ZonesLayerProps) {
  const toPx = (cm: number) => cm2px(cm, settings.scale);

  return (
    <>
      {zones.map(zone => (
        <div
          key={zone.id}
          onClick={() => editorMode === 'zones' && onZoneSelect(zone.id)}
          className={`absolute flex items-center justify-center cursor-pointer select-none rounded border-2 ${
            editorMode === 'zones'
              ? selectedZoneId === zone.id
                ? 'border-blue-500 bg-blue-100/50'
                : 'border-amber-400 bg-amber-100/30 hover:bg-amber-100/50'
              : 'border-gray-300 bg-gray-100/30'
          }`}
          style={{
            left: toPx(zone.x),
            top: toPx(zone.y),
            width: toPx(zone.w),
            height: toPx(zone.h),
          }}
        >
          <div className="text-center text-xs text-gray-700 px-1">
            <div className="font-medium">{zone.name}</div>
            {settings.showDimensions && (
              <div className="text-xs opacity-70">
                {Math.round(zone.w)}×{Math.round(zone.h)}cm
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
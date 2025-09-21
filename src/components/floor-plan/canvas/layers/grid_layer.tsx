"use client";

import React from 'react';
import { FloorPlanSettings } from '@/types';
import { cm2px } from '../../utils/units';

interface GridLayerProps {
  settings: FloorPlanSettings;
  width: number;
  height: number;
}

export function GridLayer({ settings, width, height }: GridLayerProps) {
  if (!settings.showGrid) {
    return null;
  }

  const gridSpacing = cm2px(25, settings.scale); // 25cm grid spacing

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
    >
      <defs>
        <pattern
          id="grid"
          width={gridSpacing}
          height={gridSpacing}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSpacing} 0 L 0 0 0 ${gridSpacing}`}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
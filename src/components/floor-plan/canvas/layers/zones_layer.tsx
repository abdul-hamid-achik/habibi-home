"use client";

import React from 'react';
import { Rect, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
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

  const handleZoneClick = (zone: FloorPlanZone) => {
    if (editorMode === 'zones') {
      onZoneSelect(zone.id);
    }
  };

  const handleZoneDragStart = (zone: FloorPlanZone) => {
    if (editorMode !== 'zones') return;
    // Select the zone when dragging starts
    onZoneSelect(zone.id);
  };

  const handleZoneDragMove = (e: KonvaEventObject<DragEvent>, zone: FloorPlanZone) => {
    if (editorMode !== 'zones' || !onZoneUpdate) return;

    const node = e.target;
    const newX = Math.round(node.x() / settings.scale);
    const newY = Math.round(node.y() / settings.scale);

    onZoneUpdate(zone.id, {
      x: newX,
      y: newY
    });
  };

  const handleZoneTransform = (e: KonvaEventObject<Event>, zone: FloorPlanZone) => {
    if (editorMode !== 'zones' || !onZoneUpdate) return;

    const node = e.target;
    const newX = Math.round(node.x() / settings.scale);
    const newY = Math.round(node.y() / settings.scale);
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(20, Math.round(zone.w * scaleX));
    const newHeight = Math.max(20, Math.round(zone.h * scaleY));

    onZoneUpdate(zone.id, {
      x: newX,
      y: newY,
      w: newWidth,
      h: newHeight
    });
  };

  return (
    <>
      {zones.map(zone => {
        const isSelected = selectedZoneId === zone.id;
        const isInZonesMode = editorMode === 'zones';

        return (
          <Group
            key={zone.id}
            x={toPx(zone.x)}
            y={toPx(zone.y)}
            draggable={isInZonesMode}
            onClick={() => handleZoneClick(zone)}
            onTap={() => handleZoneClick(zone)}
            onDragStart={() => handleZoneDragStart(zone)}
            onDragMove={(e) => handleZoneDragMove(e, zone)}
            onTransformEnd={(e) => handleZoneTransform(e, zone)}
          >
            <Rect
              width={toPx(zone.w)}
              height={toPx(zone.h)}
              fill={isInZonesMode
                ? isSelected
                  ? 'rgba(59, 130, 246, 0.3)' // blue
                  : 'rgba(245, 158, 11, 0.2)' // amber
                : 'rgba(156, 163, 175, 0.2)' // gray
              }
              stroke={isInZonesMode
                ? isSelected
                  ? '#3b82f6' // blue
                  : '#f59e0b' // amber
                : '#9ca3af' // gray
              }
              strokeWidth={2}
              cornerRadius={4}
              opacity={isInZonesMode ? 1 : 0.7}
            />

            <Text
              x={toPx(zone.w) / 2}
              y={toPx(zone.h) / 2}
              text={zone.name}
              fontSize={12}
              fontStyle="bold"
              fill="#374151"
              align="center"
              verticalAlign="middle"
              width={toPx(zone.w) - 8}
              height={toPx(zone.h) - 8}
              listening={false}
            />

            {settings.showDimensions && (
              <Text
                x={toPx(zone.w) / 2}
                y={toPx(zone.h) / 2 + 16}
                text={`${Math.round(zone.w)}×${Math.round(zone.h)}cm`}
                fontSize={10}
                fill="#6b7280"
                align="center"
                verticalAlign="top"
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </>
  );
}
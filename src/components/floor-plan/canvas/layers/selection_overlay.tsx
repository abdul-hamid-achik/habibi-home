"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Transformer, Group, Rect } from 'react-konva';
import Konva from 'konva';
import { FloorPlanZone, FurnitureItemType } from '@/types';

interface SelectionOverlayProps {
  // Canvas props
  width: number;
  height: number;
  scale: number;

  // Selection state
  selectedFurniture: FurnitureItemType | null;
  selectedZone: FloorPlanZone | null;
  editorMode: 'zones' | 'furniture' | 'diagrams';

  // Callbacks
  onFurnitureUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
  onZoneUpdate: (id: string, updates: Partial<FloorPlanZone>) => void;
  onRotationChange: (rotation: number) => void;

  // Snap settings
  snapEnabled: boolean;
  snapGrid: number;

  // Constraints
  constrainToCanvas?: boolean;
}

export function SelectionOverlay({
  width,
  height,
  scale,
  selectedFurniture,
  selectedZone,
  editorMode,
  onFurnitureUpdate,
  onZoneUpdate,
  onRotationChange,
  snapEnabled,
  snapGrid,
  constrainToCanvas = true
}: SelectionOverlayProps) {

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectionRectRef = useRef<Konva.Rect>(null);

  const [_isDragging, setIsDragging] = useState(false);
  const [_isTransforming, setIsTransforming] = useState(false);

  // Convert cm to pixels
  const cm2px = (cm: number) => cm * scale;
  const px2cm = (px: number) => px / scale;

  // Snap to grid helper
  const snapToGrid = (value: number) => {
    if (!snapEnabled || snapGrid <= 0) return value;
    const snappedCm = Math.round(px2cm(value) / snapGrid) * snapGrid;
    return cm2px(snappedCm);
  };

  // Apply constraints
  const applyConstraints = (x: number, y: number, w: number, h: number) => {
    if (!constrainToCanvas) return { x, y, w, h };

    // Constrain to canvas bounds
    const minX = 0;
    const minY = 0;
    const maxX = width - w;
    const maxY = height - h;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
      w: Math.max(10, Math.min(width - x, w)),
      h: Math.max(10, Math.min(height - y, h))
    };
  };

  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const selectionRect = selectionRectRef.current;

    if (!transformer || !selectionRect) return;

    if ((selectedFurniture && editorMode === 'furniture') || (selectedZone && editorMode === 'zones')) {
      transformer.nodes([selectionRect]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedFurniture, selectedZone, editorMode]);

  // Handle transform events
  const handleTransformStart = () => {
    setIsTransforming(true);
  };

  const handleTransform = () => {
    const selectionRect = selectionRectRef.current;
    const transformer = transformerRef.current;

    if (!selectionRect || !transformer) return;

    const node = selectionRect;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Calculate new dimensions
    let newWidth = Math.max(5, node.width() * scaleX);
    let newHeight = Math.max(5, node.height() * scaleY);

    // Apply snapping to size
    if (snapEnabled) {
      newWidth = cm2px(Math.round(px2cm(newWidth) / snapGrid) * snapGrid);
      newHeight = cm2px(Math.round(px2cm(newHeight) / snapGrid) * snapGrid);
    }

    // Reset scale and apply new dimensions
    node.scaleX(1);
    node.scaleY(1);
    node.width(newWidth);
    node.height(newHeight);

    // Update position with snapping
    let newX = node.x();
    let newY = node.y();

    if (snapEnabled) {
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
      node.x(newX);
      node.y(newY);
    }

    // Apply constraints
    const constrained = applyConstraints(newX, newY, newWidth, newHeight);
    node.x(constrained.x);
    node.y(constrained.y);
    node.width(constrained.w);
    node.height(constrained.h);
  };

  const handleTransformEnd = () => {
    setIsTransforming(false);

    const selectionRect = selectionRectRef.current;
    if (!selectionRect) return;

    const newX = px2cm(selectionRect.x());
    const newY = px2cm(selectionRect.y());
    const newW = px2cm(selectionRect.width());
    const newH = px2cm(selectionRect.height());
    const newR = selectionRect.rotation();

    // Update the selected item
    if (selectedFurniture && editorMode === 'furniture') {
      onFurnitureUpdate(selectedFurniture.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH),
        r: Math.round(newR) % 360
      });
      onRotationChange(Math.round(newR) % 360);
    } else if (selectedZone && editorMode === 'zones') {
      onZoneUpdate(selectedZone.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH)
      });
    }
  };

  // Handle drag events
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragMove = () => {
    const selectionRect = selectionRectRef.current;
    if (!selectionRect) return;

    let newX = selectionRect.x();
    let newY = selectionRect.y();

    // Apply snapping
    if (snapEnabled) {
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
      selectionRect.x(newX);
      selectionRect.y(newY);
    }

    // Apply constraints
    const constrained = applyConstraints(
      newX,
      newY,
      selectionRect.width(),
      selectionRect.height()
    );
    selectionRect.x(constrained.x);
    selectionRect.y(constrained.y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    const selectionRect = selectionRectRef.current;
    if (!selectionRect) return;

    const newX = px2cm(selectionRect.x());
    const newY = px2cm(selectionRect.y());

    // Update the selected item
    if (selectedFurniture && editorMode === 'furniture') {
      onFurnitureUpdate(selectedFurniture.id, {
        x: Math.round(newX),
        y: Math.round(newY)
      });
    } else if (selectedZone && editorMode === 'zones') {
      onZoneUpdate(selectedZone.id, {
        x: Math.round(newX),
        y: Math.round(newY)
      });
    }
  };

  // Get current selection for rendering
  const getSelectionProps = () => {
    if (selectedFurniture && editorMode === 'furniture') {
      return {
        x: cm2px(selectedFurniture.x),
        y: cm2px(selectedFurniture.y),
        width: cm2px(selectedFurniture.w),
        height: cm2px(selectedFurniture.h),
        rotation: selectedFurniture.r,
        fill: 'transparent',
        stroke: '#2563eb',
        strokeWidth: 2,
        dash: [5, 5]
      };
    } else if (selectedZone && editorMode === 'zones') {
      return {
        x: cm2px(selectedZone.x),
        y: cm2px(selectedZone.y),
        width: cm2px(selectedZone.w),
        height: cm2px(selectedZone.h),
        rotation: 0,
        fill: 'transparent',
        stroke: '#dc2626',
        strokeWidth: 2,
        dash: [5, 5]
      };
    }
    return null;
  };

  const selectionProps = getSelectionProps();

  if (!selectionProps) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Layer>
          <Group>
            {/* Selection rectangle */}
            <Rect
              ref={selectionRectRef}
              {...selectionProps}
              draggable={true}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onTransformStart={handleTransformStart}
              onTransform={handleTransform}
              onTransformEnd={handleTransformEnd}
            />

            {/* Transformer with rotation handle */}
            <Transformer
              ref={transformerRef}
              rotateAnchorOffset={20}
              enabledAnchors={[
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'top-center',
                'bottom-center',
                'middle-left',
                'middle-right'
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                // Enforce minimum size
                const minSize = 10;
                if (newBox.width < minSize) {
                  newBox.width = minSize;
                }
                if (newBox.height < minSize) {
                  newBox.height = minSize;
                }
                return newBox;
              }}
              rotationSnaps={snapEnabled ? [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345] : []}
              anchorSize={8}
              anchorCornerRadius={2}
              anchorFill="#2563eb"
              anchorStroke="#1d4ed8"
              borderStroke="#2563eb"
              borderStrokeWidth={1}
              rotateHandleOffset={20}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
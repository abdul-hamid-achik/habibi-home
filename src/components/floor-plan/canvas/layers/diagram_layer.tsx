"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useDiagramSelectionCompat, useSelectionEventHandlers } from '../../hooks/use_selection';
import { Stage, Layer, Rect, Circle, Line, Text, Transformer } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Square,
  Circle as CircleIcon,
  Minus,
  Edit3,
  MousePointer,
  Download,
  Trash2,
  Copy,
} from 'lucide-react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { FloorPlanSettings } from '@/types';
import {
  DrawingTool,
  DiagramShape,
  DiagramExport,
  diagram_export_schema,
} from '../tools/diagram_schemas';
import {
  DrawingToolManager,
  DrawingState,
  DrawingCallbacks,
  DRAWING_COLORS,
  duplicateShape,
  deleteShape,
} from '../tools/drawing_tools';

interface DiagramLayerProps {
  width: number;
  height: number;
  settings: FloorPlanSettings;
  editorMode: 'zones' | 'furniture' | 'diagrams';
  onExport?: (dataUrl: string, format: 'png' | 'json') => void;
  onDiagramSelect?: (id: string | null) => void;
  className?: string;
  // Diagram shapes from store
  shapes: DiagramShape[];
  // Selection state
  selectedDiagramId: string | null;
  // Drawing state from store
  drawingState: DrawingState;
  // Callbacks for diagram operations
  onShapeAdd: (shape: DiagramShape) => void;
  onShapeUpdate: (id: string, updates: Partial<DiagramShape>) => void;
  onShapeDelete: (id: string) => void;
}

export function DiagramLayer({
  width,
  height,
  settings,
  editorMode,
  onExport,
  onDiagramSelect,
  className,
  shapes,
  selectedDiagramId,
  drawingState,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete
}: DiagramLayerProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const toolManager = useRef(new DrawingToolManager()).current;

  // Use the provided drawing state from the store

  const callbacks: DrawingCallbacks = {
    onShapeAdd: onShapeAdd,
    onShapeUpdate: onShapeUpdate,
    onShapeDelete: onShapeDelete,
  };

  // Handle mouse events
  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (editorMode !== 'diagrams') return;

    const updates = toolManager.handleMouseDown(e, drawingState, callbacks);
    // The drawing state is managed by the parent component/store
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (editorMode !== 'diagrams') return;

    const updates = toolManager.handleMouseMove(e, drawingState, callbacks, shapes);
    // The drawing state is managed by the parent component/store
  };

  const handleMouseUp = () => {
    if (editorMode !== 'diagrams') return;

    const updates = toolManager.handleMouseUp();
    // The drawing state is managed by the parent component/store
  };

  const handleShapeClick = (e: KonvaEventObject<MouseEvent>, shapeId: string) => {
    if (editorMode !== 'diagrams' || drawingState.tool !== 'select') return;

    e.cancelBubble = true;
    onDiagramSelect?.(shapeId);

    const node = e.target;
    if (transformerRef.current) {
      transformerRef.current.nodes([node]);
    }
  };

  const handleTransformEnd = (e: KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply to width/height
    node.scaleX(1);
    node.scaleY(1);

    const shapeId = node.id();
    const updates: Partial<DiagramShape> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    // Apply scale to dimensions based on shape type
    const shape = shapes.find(s => s.id === shapeId);
    if (shape) {
      if (shape.type === 'rectangle') {
        Object.assign(updates, {
          width: Math.max(5, shape.width * scaleX),
          height: Math.max(5, shape.height * scaleY)
        });
      } else if (shape.type === 'circle') {
        Object.assign(updates, {
          radius: Math.max(5, shape.radius * Math.max(scaleX, scaleY))
        });
      }
    }

    callbacks.onShapeUpdate(shapeId, updates);
  };

  const deleteSelected = () => {
    if (selectedDiagramId) {
      callbacks.onShapeDelete(selectedDiagramId);
    }
  };

  const duplicateSelected = () => {
    if (!selectedDiagramId) return;

    const selectedShape = shapes.find(s => s.id === selectedDiagramId);
    if (selectedShape) {
      const newShape = duplicateShape(selectedShape);
      callbacks.onShapeAdd(newShape);
    }
  };

  const exportToPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const dataURL = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
    if (onExport) {
      onExport(dataURL, 'png');
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToJSON = () => {
    const exportData: DiagramExport = {
      shapes,
      metadata: {
        exportedAt: new Date().toISOString(),
        canvasWidth: width,
        canvasHeight: height,
        scale: settings.scale,
        version: '1.0',
      },
    };

    // Validate the export data
    try {
      const validatedData = diagram_export_schema.parse(exportData);
      const jsonString = JSON.stringify(validatedData, null, 2);

      if (onExport) {
        onExport(jsonString, 'json');
      } else {
        // Default download behavior
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'diagram.json';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to validate diagram export:', error);
    }
  };

  // Register event handlers for unified selection system
  useSelectionEventHandlers({
    onDiagramDelete: (id: string) => {
      callbacks.onShapeDelete(id);
    },
    onDiagramDuplicate: (id: string) => {
      const selectedShape = shapes.find(s => s.id === id);
      if (selectedShape) {
        const newShape = duplicateShape(selectedShape);
        callbacks.onShapeAdd(newShape);
      }
    },
  });

  // Clear transformer when selection changes
  useEffect(() => {
    if (transformerRef.current) {
      if (selectedDiagramId) {
        const selectedNode = stageRef.current?.findOne(`#${selectedDiagramId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedDiagramId]);

  const renderShape = (shape: DiagramShape) => {
    const commonProps = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      rotation: shape.rotation || 0,
      scaleX: shape.scaleX || 1,
      scaleY: shape.scaleY || 1,
      draggable: drawingState.tool === 'select',
      onClick: (e: KonvaEventObject<MouseEvent>) => handleShapeClick(e, shape.id),
      onTransformEnd: handleTransformEnd,
    };

    switch (shape.type) {
      case 'rectangle':
        return (
          <Rect
            key={shape.id}
            {...commonProps}
            width={shape.width}
            height={shape.height}
          />
        );

      case 'circle':
        return (
          <Circle
            key={shape.id}
            {...commonProps}
            radius={shape.radius}
          />
        );

      case 'line':
      case 'freehand':
        return (
          <Line
            key={shape.id}
            {...commonProps}
            points={shape.points}
            lineCap="round"
            lineJoin="round"
          />
        );

      case 'text':
        return (
          <Text
            key={shape.id}
            {...commonProps}
            text={shape.text}
            fontSize={16}
            fontFamily="Arial"
            width={shape.width}
            height={shape.height}
            onDblClick={() => {
              const newText = prompt('Edit text:', shape.text || '');
              if (newText !== null) {
                callbacks.onShapeUpdate(shape.id, { text: newText });
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  // Only render when in diagrams mode
  if (editorMode !== 'diagrams') {
    return null;
  }

  // Only render the canvas layer, tools are now handled by the main editor
  return (
    <div className={`absolute inset-0 ${className || ''}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {shapes.map(renderShape)}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to maintain minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { FurnitureItemType, FloorPlanSettings } from '@/types';
import { cm2px } from '../utils/units';
import {
  SmartFigureManager,
  createSmartFigure,
  type ISmartFigure,
  type FigureRenderOptions
} from '../furniture/smart_figures';
import { furnitureRegistry } from '../furniture';

interface FurnitureLayerProps {
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  selectedFurnitureId: string | null;
  onFurnitureSelect: (id: string | null) => void;
  onFurnitureUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
  editorMode: 'zones' | 'furniture' | 'diagrams';
  width: number;
  height: number;
}

export function FurnitureLayer({
  furniture,
  settings,
  selectedFurnitureId,
  onFurnitureSelect,
  onFurnitureUpdate,
  editorMode,
  width,
  height
}: FurnitureLayerProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const figureManagerRef = useRef<SmartFigureManager | null>(null);
  const [figureMap, setFigureMap] = useState<Map<string, ISmartFigure>>(new Map());

  // Convert furniture items to smart figures
  const createFiguresFromFurniture = useCallback(() => {
    if (!layerRef.current) return;

    // Clear existing figures
    if (figureManagerRef.current) {
      figureManagerRef.current.clear();
    } else {
      figureManagerRef.current = new SmartFigureManager(layerRef.current);
    }

    const newFigureMap = new Map<string, ISmartFigure>();

    // Create smart figures for each furniture item
    furniture.forEach(item => {
      // Try to find furniture in registry by name (legacy lookup)
      const registryEntries = Object.values(furnitureRegistry.getAll());
      const matchingEntry = registryEntries.find(entry =>
        entry.name.toLowerCase() === item.name.toLowerCase()
      );

      if (!matchingEntry) {
        console.warn(`No registry entry found for furniture: ${item.name}`);
        return;
      }

      // Create smart figure
      const figure = createSmartFigure(
        matchingEntry.id,
        {
          x: cm2px(item.x, settings.scale),
          y: cm2px(item.y, settings.scale),
          rotation: item.r,
          scaleX: 1,
          scaleY: 1,
        },
        {
          showLabel: true,
          showDimensions: settings.showDimensions,
          opacity: 1,
        }
      );

      if (figure) {
        // Set up event handlers
        figure.onSelect(() => {
          onFurnitureSelect(item.id);
        });

        figure.onDeselect(() => {
          if (selectedFurnitureId === item.id) {
            onFurnitureSelect(null);
          }
        });

        figure.onDragEnd(() => {
          const transform = figure.getTransform();
          const newX = transform.x / settings.scale;
          const newY = transform.y / settings.scale;

          onFurnitureUpdate(item.id, {
            x: Math.round(newX),
            y: Math.round(newY),
          });
        });

        figure.onTransform(() => {
          const transform = figure.getTransform();
          onFurnitureUpdate(item.id, {
            r: Math.round(transform.rotation) % 360,
          });
        });

        // Add to manager and map
        figureManagerRef.current?.addFigure(figure);
        newFigureMap.set(item.id, figure);
      }
    });

    setFigureMap(newFigureMap);
  }, [furniture, settings.scale, settings.showDimensions, onFurnitureSelect, onFurnitureUpdate, selectedFurnitureId]);

  // Update selection when selectedFurnitureId changes
  useEffect(() => {
    if (!figureManagerRef.current) return;

    // Clear current selection
    figureManagerRef.current.clearSelection();

    // Select the new furniture if any
    if (selectedFurnitureId) {
      const figure = figureMap.get(selectedFurnitureId);
      if (figure) {
        figureManagerRef.current.selectFigure(figure.id);
      }
    }
  }, [selectedFurnitureId, figureMap]);

  // Update figure positions when furniture data changes
  useEffect(() => {
    furniture.forEach(item => {
      const figure = figureMap.get(item.id);
      if (figure) {
        const currentTransform = figure.getTransform();
        const expectedX = cm2px(item.x, settings.scale);
        const expectedY = cm2px(item.y, settings.scale);
        const expectedRotation = item.r;

        // Only update if values have changed (avoid infinite loops)
        if (
          Math.abs(currentTransform.x - expectedX) > 1 ||
          Math.abs(currentTransform.y - expectedY) > 1 ||
          Math.abs(currentTransform.rotation - expectedRotation) > 1
        ) {
          figure.setTransform({
            x: expectedX,
            y: expectedY,
            rotation: expectedRotation,
          });
          figure.render();
        }
      }
    });
  }, [furniture, settings.scale, figureMap]);

  // Recreate figures when furniture list changes
  useEffect(() => {
    createFiguresFromFurniture();
  }, [createFiguresFromFurniture]);

  // Update render options when settings change
  useEffect(() => {
    if (!figureManagerRef.current) return;

    const renderOptions: Partial<FigureRenderOptions> = {
      showDimensions: settings.showDimensions,
    };

    figureManagerRef.current.getAllFigures().forEach(figure => {
      figure.render(renderOptions);
    });
  }, [settings.showDimensions]);

  // Hide/show furniture based on editor mode
  useEffect(() => {
    if (!layerRef.current) return;

    const isVisible = editorMode === 'furniture';
    layerRef.current.visible(isVisible);
    layerRef.current.getLayer()?.batchDraw();
  }, [editorMode]);

  // Handle stage click for deselection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect all
    if (e.target === stageRef.current) {
      onFurnitureSelect(null);
    }
  }, [onFurnitureSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (figureManagerRef.current) {
        figureManagerRef.current.clear();
      }
    };
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        display: editorMode === 'furniture' ? 'block' : 'none'
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onClick={handleStageClick}
        onTap={handleStageClick}
        className="pointer-events-auto"
      >
        <Layer ref={layerRef} />
      </Stage>
    </div>
  );
}
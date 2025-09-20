"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { GridLayer } from './layers/grid_layer';
import { ZonesLayer } from './layers/zones_layer';
import { FurnitureLayer } from '../editor/furniture_layer';
import { DiagramLayer } from './layers/diagram_layer';
import {
  calculateCanvasSize,
  calculateCenterOffset,
  getCanvasModeClasses,
  requiresViewport,
  getEffectiveScale,
  type CanvasSize,
  type ViewportSize
} from '../utils/canvas_modes';

interface KonvaStageProps {
  // Data
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;

  // Editor state
  editorMode: 'zones' | 'furniture' | 'diagrams';
  selectedZoneId: string | null;
  selectedFurnitureId: string | null;

  // Event handlers
  onZoneSelect: (id: string | null) => void;
  onFurnitureSelect: (id: string | null) => void;
  onFurnitureUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
  onDiagramExport?: (dataUrl: string, format: 'png' | 'json') => void;

  // Container props
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function KonvaStage({
  zones,
  furniture,
  settings,
  editorMode,
  selectedZoneId,
  selectedFurnitureId,
  onZoneSelect,
  onFurnitureSelect,
  onFurnitureUpdate,
  onDiagramExport,
  className,
  containerRef
}: KonvaStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 800, height: 600 });

  // Update viewport size when container size changes
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport({
          width: rect.width - 32, // Account for padding
          height: rect.height - 32,
        });
      }
    };

    updateViewport();

    const handleResize = () => {
      setTimeout(updateViewport, 100); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    if (containerRef?.current) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [containerRef]);

  // Calculate canvas dimensions based on mode
  const canvasSize: CanvasSize = useMemo(() => {
    const needsViewport = requiresViewport(settings.canvasMode);
    return calculateCanvasSize(settings, needsViewport ? viewport : undefined);
  }, [settings, viewport]);

  // Calculate effective scale (may differ from settings.scale in fit-to-screen mode)
  const effectiveScale = useMemo(() => {
    return getEffectiveScale(settings, canvasSize);
  }, [settings, canvasSize]);

  // Calculate center offset for centered mode
  const centerOffset = useMemo(() => {
    if (settings.canvasMode === 'centered') {
      return calculateCenterOffset(canvasSize, viewport);
    }
    return { x: 0, y: 0 };
  }, [settings.canvasMode, canvasSize, viewport]);

  // Updated settings with effective scale for layers
  const effectiveSettings = useMemo(() => ({
    ...settings,
    scale: effectiveScale,
  }), [settings, effectiveScale]);

  const containerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      width: canvasSize.width,
      height: canvasSize.height,
    };

    if (settings.canvasMode === 'centered') {
      baseStyle.transform = `translate(${centerOffset.x}px, ${centerOffset.y}px)`;
    }

    return baseStyle;
  }, [canvasSize, settings.canvasMode, centerOffset]);

  const containerClasses = useMemo(() => {
    return getCanvasModeClasses(settings.canvasMode);
  }, [settings.canvasMode]);

  // Handle stage click for deselection
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If clicking on empty space, deselect all
    if (e.target === stageRef.current) {
      onZoneSelect(null);
      onFurnitureSelect(null);
    }
  };

  // Render based on editor mode
  const renderContent = () => {
    if (editorMode === 'diagrams') {
      return (
        <DiagramLayer
          width={canvasSize.width}
          height={canvasSize.height}
          settings={effectiveSettings}
          editorMode={editorMode}
          onExport={onDiagramExport}
          className="w-full h-full"
        />
      );
    }

    return (
      <div
        className={containerClasses}
        style={containerStyle}
      >
        {/* Grid Layer */}
        <GridLayer
          settings={effectiveSettings}
          width={canvasSize.width}
          height={canvasSize.height}
        />

        {/* Zones Layer */}
        <ZonesLayer
          zones={zones}
          settings={effectiveSettings}
          selectedZoneId={selectedZoneId}
          onZoneSelect={onZoneSelect}
          editorMode={editorMode}
        />

        {/* Konva Furniture Layer */}
        <FurnitureLayer
          furniture={furniture}
          settings={effectiveSettings}
          selectedFurnitureId={selectedFurnitureId}
          onFurnitureSelect={onFurnitureSelect}
          onFurnitureUpdate={onFurnitureUpdate}
          editorMode={editorMode}
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </div>
    );
  };

  return (
    <div className={`w-full h-full ${className || ''}`}>
      {settings.canvasMode === 'fit-to-screen' ? (
        <div className="w-full h-full flex items-center justify-center">
          {renderContent()}
        </div>
      ) : settings.canvasMode === 'centered' ? (
        <div className="w-full h-full flex items-center justify-center">
          {renderContent()}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {renderContent()}
        </div>
      )}
    </div>
  );
}

export type { KonvaStageProps };
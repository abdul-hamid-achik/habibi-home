"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { GridLayer } from './layers/grid_layer';
import { ZonesLayer } from './layers/zones_layer';
import { FurnitureLayer } from './layers/furniture_layer';
import { DiagramLayer } from './layers/diagram_layer';
import { BackgroundLayer } from './layers/background_layer';
import { SelectionOverlay } from './layers/selection_overlay';
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
  onZoneUpdate?: (id: string, updates: Partial<FloorPlanZone>) => void;
  onFurnitureSelect: (id: string | null) => void;
  onDiagramSelect?: (id: string | null) => void;
  onFurnitureUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
  onDiagramExport?: (dataUrl: string, format: 'png' | 'json') => void;
  onBackgroundUpdate?: (updates: {
    opacity?: number;
    scale?: number;
    rotation?: number;
    offsetX?: number;
    offsetY?: number;
    locked?: boolean;
  }) => void;

  // Container props
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;

  // Layer visibility
  showZones?: boolean;
  showFurniture?: boolean;
  showDiagrams?: boolean;
}

export function KonvaStage({
  zones,
  furniture,
  settings,
  editorMode,
  selectedZoneId,
  selectedFurnitureId,
  onZoneSelect,
  onZoneUpdate,
  onFurnitureSelect,
  onDiagramSelect,
  onFurnitureUpdate,
  onDiagramExport,
  onBackgroundUpdate,
  className,
  containerRef,
  showZones = true,
  showFurniture = true,
  showDiagrams = true
}: KonvaStageProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [viewport, setViewport] = useState<ViewportSize | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update viewport size when container size changes
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewport({
          width: rect.width - 32, // Account for padding
          height: rect.height - 32,
        });
        // Mark as initialized after first measurement
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    };

    // Initial measurement without delay
    updateViewport();

    const handleResize = () => {
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(updateViewport);
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
  }, [containerRef, isInitialized]);

  // Calculate canvas dimensions based on mode
  const canvasSize: CanvasSize = useMemo(() => {
    const needsViewport = requiresViewport(settings.canvasMode);
    // Use viewport only when available and needed
    const viewportToUse = needsViewport && viewport ? viewport : undefined;
    // For initial render, use settings dimensions to prevent jumps
    if (needsViewport && !viewport) {
      return {
        width: Math.min(settings.apartmentWidth * settings.scale, settings.maxCanvasWidth || 1200),
        height: Math.min(settings.apartmentHeight * settings.scale, settings.maxCanvasHeight || 800)
      };
    }
    return calculateCanvasSize(settings, viewportToUse);
  }, [settings, viewport]);

  // Calculate effective scale (may differ from settings.scale in fit-to-screen mode)
  const effectiveScale = useMemo(() => {
    return getEffectiveScale(settings, canvasSize);
  }, [settings, canvasSize]);

  // Calculate center offset for centered mode - removed as we'll use flexbox centering instead
  const centerOffset = useMemo(() => {
    return { x: 0, y: 0 };
  }, []);

  // Updated settings with effective scale for layers
  const effectiveSettings = useMemo(() => ({
    ...settings,
    scale: effectiveScale,
  }), [settings, effectiveScale]);

  const containerStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      width: canvasSize.width,
      height: canvasSize.height,
      // Remove transform-based centering to prevent shifts
      transition: 'none', // Disable any transitions during initial render
    };

    return baseStyle;
  }, [canvasSize]);

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
    if (editorMode === 'diagrams' && showDiagrams) {
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
        {/* Background Image Layer (below grid) */}
        <BackgroundLayer
          url={settings.background?.url}
          opacity={settings.background?.opacity}
          scale={settings.background?.scale}
          rotation={settings.background?.rotation}
          offsetX={settings.background?.offsetX}
          offsetY={settings.background?.offsetY}
          locked={settings.background?.locked}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          editorScale={effectiveSettings.scale}
          onImageUpdate={onBackgroundUpdate}
        />
        {/* Grid Layer */}
        <GridLayer
          settings={effectiveSettings}
          width={canvasSize.width}
          height={canvasSize.height}
        />

        {/* Konva Furniture Layer */}
        {showFurniture && (
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
        )}

        {/* Zones Layer */}
        {showZones && (
          <ZonesLayer
            zones={zones}
            settings={effectiveSettings}
            selectedZoneId={selectedZoneId}
            onZoneSelect={onZoneSelect}
            onZoneUpdate={onZoneUpdate}
            editorMode={editorMode}
          />
        )}

        {/* Selection Overlay for resizing and transforming */}
        <SelectionOverlay
          width={canvasSize.width}
          height={canvasSize.height}
          scale={effectiveSettings.scale}
          selectedFurniture={selectedFurnitureId ? furniture.find(f => f.id === selectedFurnitureId) || null : null}
          selectedZone={selectedZoneId ? zones.find(z => z.id === selectedZoneId) || null : null}
          editorMode={editorMode}
          onFurnitureUpdate={onFurnitureUpdate}
          onZoneUpdate={onZoneUpdate || (() => { })}
          onRotationChange={(rotation) => {
            if (selectedFurnitureId) {
              onFurnitureUpdate(selectedFurnitureId, { r: rotation });
            }
          }}
          snapEnabled={effectiveSettings.snap > 0}
          snapGrid={effectiveSettings.snap}
          constrainToCanvas={true}
        />
      </div>
    );
  };

  // Don't render until viewport is initialized to prevent layout shift
  if (!viewport && requiresViewport(settings.canvasMode)) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className || ''}`}>
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex items-center justify-center overflow-auto ${className || ''}`}>
      <div className="flex items-center justify-center min-w-full min-h-full">
        {renderContent()}
      </div>
    </div>
  );
}

export type { KonvaStageProps };
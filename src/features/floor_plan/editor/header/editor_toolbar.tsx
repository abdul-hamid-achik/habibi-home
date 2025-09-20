"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  Monitor,
  Ruler,
  ImagePlus,
  Download,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Copy,
  RotateCcw,
  RotateCw,
  Package,
  Circle,
  Square,
  Minus,
  Pen,
  Type,
  FileImage,
  FileJson
} from 'lucide-react';
import { FloorPlanZone, FurnitureItemType } from '@/types';

type EditorMode = 'zones' | 'furniture' | 'diagrams';
type CanvasMode = 'fixed' | 'fit-to-screen' | 'centered';

interface EditorToolbarProps {
  // Current state
  editorMode: EditorMode;
  canvasMode: CanvasMode;
  scale: number;
  showGrid: boolean;
  snapEnabled: boolean;
  
  // Selected items
  selectedZone: FloorPlanZone | null;
  selectedFurniture: FurnitureItemType | null;
  selectedDiagramShapes: string[];
  
  // Global actions
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onCanvasModeChange: (mode: CanvasMode) => void;
  onCalibrateScale: () => void;
  onImportBackground: () => void;
  onExport: () => void;
  
  // Zone actions
  onAddZone: () => void;
  onDeleteZone: () => void;
  onBringZoneForward: () => void;
  onSendZoneBack: () => void;
  
  // Furniture actions
  onAddFromLibrary: () => void;
  onDuplicateFurniture: () => void;
  onDeleteFurniture: () => void;
  onRotateFurniture: (degrees: number) => void;
  onFurnitureRotationChange: (rotation: number) => void;
  onAssignToZone: (zoneId: string) => void;
  
  // Diagram actions
  onSelectDiagramTool: (tool: string) => void;
  onSetDiagramStroke: (color: string) => void;
  onSetDiagramFill: (color: string) => void;
  onSetDiagramStrokeWidth: (width: number) => void;
  onDeleteDiagramShapes: () => void;
  onExportDiagramPNG: () => void;
  onExportDiagramJSON: () => void;
  
  // Data
  zones: FloorPlanZone[];
  
  // State
  canUndo: boolean;
  canRedo: boolean;
  currentDiagramTool?: string;
}

export function EditorToolbar({
  editorMode,
  canvasMode,
  scale,
  showGrid,
  snapEnabled,
  selectedZone,
  selectedFurniture,
  selectedDiagramShapes,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onToggleGrid,
  onToggleSnap,
  onCanvasModeChange,
  onCalibrateScale,
  onImportBackground,
  onExport,
  onAddZone,
  onDeleteZone,
  onBringZoneForward,
  onSendZoneBack,
  onAddFromLibrary,
  onDuplicateFurniture,
  onDeleteFurniture,
  onRotateFurniture,
  onFurnitureRotationChange,
  onAssignToZone,
  onSelectDiagramTool,
  onSetDiagramStroke,
  onSetDiagramFill,
  onSetDiagramStrokeWidth,
  onDeleteDiagramShapes,
  onExportDiagramPNG,
  onExportDiagramJSON,
  zones,
  canUndo,
  canRedo,
  currentDiagramTool
}: EditorToolbarProps) {
  
  const renderGlobalActions = () => (
    <div className="flex items-center space-x-1">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={onUndo}
        className="h-8 w-8 p-0"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={onRedo}
        className="h-8 w-8 p-0"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Zoom */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        className="h-8 w-8 p-0"
        title="Zoom Out (Z)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomFit}
        className="h-8 w-8 p-0"
        title="Zoom Fit"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        className="h-8 w-8 p-0"
        title="Zoom In (X)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <span className="text-xs text-gray-500 min-w-12 text-center">
        {Math.round(scale * 100)}%
      </span>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Grid & Snap */}
      <Button
        variant={snapEnabled ? "default" : "ghost"}
        size="sm"
        onClick={onToggleSnap}
        className="h-8 w-8 p-0"
        title="Toggle Snap (S)"
      >
        <Magnet className="h-4 w-4" />
      </Button>
      <Button
        variant={showGrid ? "default" : "ghost"}
        size="sm"
        onClick={onToggleGrid}
        className="h-8 w-8 p-0"
        title="Toggle Grid (G)"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Canvas Mode */}
      <Select value={canvasMode} onValueChange={onCanvasModeChange}>
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="centered">Centered</SelectItem>
          <SelectItem value="fit-to-screen">Fit Screen</SelectItem>
          <SelectItem value="fixed">Fixed Size</SelectItem>
        </SelectContent>
      </Select>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCalibrateScale}
        className="h-8 px-2"
        title="Calibrate Scale"
      >
        <Ruler className="h-4 w-4 mr-1" />
        Calibrate
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onImportBackground}
        className="h-8 px-2"
        title="Import Background"
      >
        <ImagePlus className="h-4 w-4 mr-1" />
        Background
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onExport}
        className="h-8 px-2"
        title="Export"
      >
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  );
  
  const renderZoneActions = () => {
    if (editorMode !== 'zones') return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs font-medium text-gray-600 px-2">Zone Tools</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddZone}
          className="h-8 px-2"
          title="Add Zone"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
        {selectedZone && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteZone}
              className="h-8 w-8 p-0"
              title="Delete Zone"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBringZoneForward}
              className="h-8 w-8 p-0"
              title="Bring Forward"
            >
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSendZoneBack}
              className="h-8 w-8 p-0"
              title="Send Back"
            >
              <MoveDown className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };
  
  const renderFurnitureActions = () => {
    if (editorMode !== 'furniture') return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs font-medium text-gray-600 px-2">Furniture Tools</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddFromLibrary}
          className="h-8 px-2"
          title="Add from Library"
        >
          <Package className="h-4 w-4 mr-1" />
          Add
        </Button>
        {selectedFurniture && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicateFurniture}
              className="h-8 w-8 p-0"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteFurniture}
              className="h-8 w-8 p-0"
              title="Delete (Del)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotateFurniture(-15)}
              className="h-8 w-8 p-0"
              title="Rotate -15° (R)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotateFurniture(15)}
              className="h-8 w-8 p-0"
              title="Rotate +15° (Shift+R)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <input
              type="number"
              value={selectedFurniture.r}
              onChange={(e) => onFurnitureRotationChange(Number(e.target.value))}
              className="w-16 h-8 text-xs border rounded px-2"
              title="Rotation (degrees)"
            />
            <Select value={selectedFurniture.zoneId || ""} onValueChange={onAssignToZone}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Zone</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    );
  };
  
  const renderDiagramActions = () => {
    if (editorMode !== 'diagrams') return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Separator orientation="vertical" className="h-6" />
        <span className="text-xs font-medium text-gray-600 px-2">Diagram Tools</span>
        
        {/* Drawing Tools */}
        <Button
          variant={currentDiagramTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('select')}
          className="h-8 w-8 p-0"
          title="Select"
        >
          <Monitor className="h-4 w-4" />
        </Button>
        <Button
          variant={currentDiagramTool === 'line' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('line')}
          className="h-8 w-8 p-0"
          title="Line"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={currentDiagramTool === 'rectangle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('rectangle')}
          className="h-8 w-8 p-0"
          title="Rectangle"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={currentDiagramTool === 'circle' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('circle')}
          className="h-8 w-8 p-0"
          title="Circle"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          variant={currentDiagramTool === 'draw' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('draw')}
          className="h-8 w-8 p-0"
          title="Freehand"
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={currentDiagramTool === 'text' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onSelectDiagramTool('text')}
          className="h-8 w-8 p-0"
          title="Text"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Style Controls */}
        <input
          type="color"
          onChange={(e) => onSetDiagramStroke(e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Stroke Color"
        />
        <input
          type="color"
          onChange={(e) => onSetDiagramFill(e.target.value)}
          className="w-8 h-8 border rounded cursor-pointer"
          title="Fill Color"
        />
        <input
          type="range"
          min="1"
          max="10"
          onChange={(e) => onSetDiagramStrokeWidth(Number(e.target.value))}
          className="w-16"
          title="Stroke Width"
        />
        
        {selectedDiagramShapes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteDiagramShapes}
            className="h-8 w-8 p-0"
            title="Delete Selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportDiagramPNG}
          className="h-8 px-2"
          title="Export PNG"
        >
          <FileImage className="h-4 w-4 mr-1" />
          PNG
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportDiagramJSON}
          className="h-8 px-2"
          title="Export JSON"
        >
          <FileJson className="h-4 w-4 mr-1" />
          JSON
        </Button>
      </div>
    );
  };
  
  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2 min-h-12">
      <div className="flex items-center space-x-2 overflow-x-auto">
        {renderGlobalActions()}
        {renderZoneActions()}
        {renderFurnitureActions()}
        {renderDiagramActions()}
      </div>
    </div>
  );
}
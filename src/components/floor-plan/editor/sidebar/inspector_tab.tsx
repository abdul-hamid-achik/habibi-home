"use client";

import React from 'react';
import { FloorPlanZone, FurnitureItemType } from '@/types';
import { ZoneInspector } from './inspectors/zone_inspector';
import { FurnitureInspector } from './inspectors/furniture_inspector';
import { DiagramInspector } from './inspectors/diagram_inspector';
import { Search } from 'lucide-react';
import { DiagramShape } from '../../canvas/tools/diagram_schemas';

type EditorMode = 'zones' | 'furniture' | 'diagrams';

interface InspectorTabProps {
  editorMode: EditorMode;
  selectedZone: FloorPlanZone | null;
  selectedFurniture: FurnitureItemType | null;
  selectedDiagramShape: DiagramShape | null;
  zones: FloorPlanZone[];

  // Zone actions
  onUpdateZone: (id: string, updates: Partial<FloorPlanZone>) => void;
  onDeleteZone: () => void;

  // Furniture actions
  onUpdateFurniture: (id: string, updates: Partial<FurnitureItemType>) => void;
  onDeleteFurniture: () => void;
  onDuplicateFurniture: () => void;
  onRotateFurniture: (degrees: number) => void;
  onReplaceFurniture: (catalogName: string) => void;
  onAssignToZone: (zoneId: string) => void;

  // Diagram actions
  onUpdateDiagramShape: (id: string, updates: Record<string, unknown>) => void;
  onDeleteDiagramShape: () => void;
  onDuplicateDiagramShape: () => void;
}

export function InspectorTab({
  editorMode,
  selectedZone,
  selectedFurniture,
  selectedDiagramShape,
  zones,
  onUpdateZone,
  onDeleteZone,
  onUpdateFurniture,
  onDeleteFurniture,
  onDuplicateFurniture,
  onRotateFurniture,
  onReplaceFurniture,
  onAssignToZone,
  onUpdateDiagramShape,
  onDeleteDiagramShape,
  onDuplicateDiagramShape
}: InspectorTabProps) {

  // Auto-determine which inspector to show based on selection
  const getActiveInspector = () => {
    if (selectedFurniture && editorMode === 'furniture') {
      return 'furniture';
    }
    if (selectedZone && editorMode === 'zones') {
      return 'zone';
    }
    if (selectedDiagramShape && editorMode === 'diagrams') {
      return 'diagram';
    }
    return 'none';
  };

  const activeInspector = getActiveInspector();

  if (activeInspector === 'zone' && selectedZone) {
    return (
      <ZoneInspector
        zone={selectedZone}
        onUpdate={onUpdateZone}
        onDelete={onDeleteZone}
      />
    );
  }

  if (activeInspector === 'furniture' && selectedFurniture) {
    return (
      <FurnitureInspector
        furniture={selectedFurniture}
        zones={zones}
        onUpdate={onUpdateFurniture}
        onDelete={onDeleteFurniture}
        onDuplicate={onDuplicateFurniture}
        onRotate={onRotateFurniture}
        onReplace={onReplaceFurniture}
        onAssignToZone={onAssignToZone}
      />
    );
  }

  if (activeInspector === 'diagram' && selectedDiagramShape) {
    return (
      <DiagramInspector
        shapes={[selectedDiagramShape]}
        onUpdate={onUpdateDiagramShape}
        onDelete={onDeleteDiagramShape}
        onDuplicate={onDuplicateDiagramShape}
      />
    );
  }

  // Default state - show selection prompt
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-500 px-4">
      <Search className="w-8 h-8 mb-3 opacity-50" />
      <div className="text-center">
        <p className="text-sm font-medium mb-1">No Selection</p>
        <p className="text-xs leading-relaxed">
          {editorMode === 'zones' && "Click a zone to inspect its properties"}
          {editorMode === 'furniture' && "Click furniture to inspect its properties"}
          {editorMode === 'diagrams' && "Select diagram shapes to inspect their properties"}
        </p>
      </div>
    </div>
  );
}
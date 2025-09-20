"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Layers,
  Eye,
  EyeOff,
  Settings,
  Sofa,
  Package,
  Pencil,
  Image,
  Grid3X3,
  MoveUp,
  MoveDown,
  Lock,
  Unlock
} from 'lucide-react';
import { FloorPlanZone, FurnitureItemType } from '@/types';

interface LayerItem {
  id: string;
  name: string;
  type: 'background' | 'grid' | 'zones' | 'furniture' | 'diagrams';
  visible: boolean;
  locked?: boolean;
  opacity?: number;
  count?: number;
}

interface LayersTabProps {
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  diagramShapes: any[];
  showGrid: boolean;
  backgroundImage?: {
    visible: boolean;
    locked: boolean;
    opacity: number;
  };
  
  onToggleLayerVisibility: (layerType: string) => void;
  onToggleLayerLock: (layerType: string) => void;
  onSetLayerOpacity: (layerType: string, opacity: number) => void;
  onMoveLayerUp: (layerType: string) => void;
  onMoveLayerDown: (layerType: string) => void;
  onConfigureLayer: (layerType: string) => void;
}

export function LayersTab({
  zones,
  furniture,
  diagramShapes,
  showGrid,
  backgroundImage,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onSetLayerOpacity,
  onMoveLayerUp,
  onMoveLayerDown,
  onConfigureLayer
}: LayersTabProps) {
  
  const layers: LayerItem[] = [
    {
      id: 'diagrams',
      name: 'Diagrams',
      type: 'diagrams',
      visible: true,
      count: diagramShapes.length
    },
    {
      id: 'furniture',
      name: 'Furniture',
      type: 'furniture',
      visible: true,
      count: furniture.length
    },
    {
      id: 'zones',
      name: 'Zones',
      type: 'zones',
      visible: true,
      count: zones.length
    },
    {
      id: 'grid',
      name: 'Grid',
      type: 'grid',
      visible: showGrid
    },
    ...(backgroundImage ? [{
      id: 'background',
      name: 'Background',
      type: 'background' as const,
      visible: backgroundImage.visible,
      locked: backgroundImage.locked,
      opacity: backgroundImage.opacity
    }] : [])
  ];
  
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'background': return <Image className="w-4 h-4" />;
      case 'grid': return <Grid3X3 className="w-4 h-4" />;
      case 'zones': return <Settings className="w-4 h-4" />;
      case 'furniture': return <Sofa className="w-4 h-4" />;
      case 'diagrams': return <Pencil className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 flex flex-col h-full">
          <div className="flex-1 space-y-1 overflow-y-auto">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                className="group flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 transition-colors"
              >
                {/* Layer Icon and Info */}
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getLayerIcon(layer.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {layer.name}
                    </div>
                    {layer.count !== undefined && (
                      <div className="text-xs text-gray-500">
                        {layer.count} items
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Layer Controls */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Move Up/Down */}
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveLayerUp(layer.type)}
                      className="h-6 w-6 p-0"
                      title="Move Up"
                    >
                      <MoveUp className="w-3 h-3" />
                    </Button>
                  )}
                  {index < layers.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveLayerDown(layer.type)}
                      className="h-6 w-6 p-0"
                      title="Move Down"
                    >
                      <MoveDown className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {/* Lock/Unlock */}
                  {layer.locked !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleLayerLock(layer.type)}
                      className="h-6 w-6 p-0"
                      title={layer.locked ? "Unlock" : "Lock"}
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                  
                  {/* Configure */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onConfigureLayer(layer.type)}
                    className="h-6 w-6 p-0"
                    title="Configure"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Visibility Toggle */}
                <Switch
                  checked={layer.visible}
                  onCheckedChange={() => onToggleLayerVisibility(layer.type)}
                  className="ml-2"
                />
              </div>
            ))}
          </div>
          
          {/* Opacity Controls for Background */}
          {backgroundImage && (
            <div className="border-t pt-3 mt-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Background Opacity</span>
                  <span className="text-xs text-gray-500">
                    {Math.round(backgroundImage.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={backgroundImage.opacity}
                  onChange={(e) => onSetLayerOpacity('background', Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {/* Layer Statistics */}
          <div className="border-t pt-3 mt-3">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Total: {zones.length + furniture.length + diagramShapes.length} objects</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-medium">{zones.length}</div>
                  <div>Zones</div>
                </div>
                <div>
                  <div className="font-medium">{furniture.length}</div>
                  <div>Furniture</div>
                </div>
                <div>
                  <div className="font-medium">{diagramShapes.length}</div>
                  <div>Diagrams</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
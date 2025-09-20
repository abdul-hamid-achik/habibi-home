"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Settings } from 'lucide-react';
import { FloorPlanZone } from '@/types';

interface ZoneInspectorProps {
  zone: FloorPlanZone;
  onUpdate: (id: string, updates: Partial<FloorPlanZone>) => void;
  onDelete: () => void;
}

export function ZoneInspector({ zone, onUpdate, onDelete }: ZoneInspectorProps) {
  const updateZone = (updates: Partial<FloorPlanZone>) => {
    onUpdate(zone.id, updates);
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Zone Inspector
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              title="Delete Zone"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Zone Identification */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Zone Name</Label>
              <Input
                value={zone.name}
                onChange={(e) => updateZone({ name: e.target.value })}
                className="h-8 text-sm"
                placeholder="Zone name..."
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Zone ID</Label>
              <Input
                value={zone.zoneId}
                onChange={(e) => updateZone({ zoneId: e.target.value })}
                className="h-8 text-sm"
                placeholder="zone_id"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for furniture assignment and exports
              </p>
            </div>
          </div>

          {/* Position and Size */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Position & Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">X (cm)</Label>
                <Input
                  type="number"
                  value={zone.x}
                  onChange={(e) => updateZone({ x: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Y (cm)</Label>
                <Input
                  type="number"
                  value={zone.y}
                  onChange={(e) => updateZone({ y: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Width (cm)</Label>
                <Input
                  type="number"
                  value={zone.w}
                  onChange={(e) => updateZone({ w: Math.max(10, Number(e.target.value)) })}
                  className="h-7 text-xs"
                  min="10"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Height (cm)</Label>
                <Input
                  type="number"
                  value={zone.h}
                  onChange={(e) => updateZone({ h: Math.max(10, Number(e.target.value)) })}
                  className="h-7 text-xs"
                  min="10"
                />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Appearance</Label>
            <div>
              <Label className="text-xs text-gray-600">Color</Label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="color"
                  value={zone.color || "#e3f2fd"}
                  onChange={(e) => updateZone({ color: e.target.value })}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
                <Input
                  value={zone.color || "#e3f2fd"}
                  onChange={(e) => updateZone({ color: e.target.value })}
                  className="h-8 text-xs flex-1"
                  placeholder="#e3f2fd"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateZone({ color: undefined })}
                  className="h-8 px-2 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Zone Info */}
          <div className="space-y-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <div className="font-medium">Zone Information</div>
            <div>Area: {Math.round((zone.w * zone.h) / 10000 * 100) / 100} m²</div>
            <div>Dimensions: {zone.w} × {zone.h} cm</div>
            <div>Position: ({zone.x}, {zone.y})</div>
          </div>

          {/* Suggested Furniture */}
          {zone.suggestedFurniture && zone.suggestedFurniture.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Suggested Furniture</Label>
              <div className="space-y-1">
                {zone.suggestedFurniture.map((furniture, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-blue-50 border border-blue-200 rounded text-blue-700"
                  >
                    {furniture}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
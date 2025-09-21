"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Package,
  RefreshCw
} from 'lucide-react';
import { FloorPlanZone, FurnitureItemType } from '@/types';
import { getAllFurnitureLegacy } from '@/features/floor_plan/furniture';

interface FurnitureInspectorProps {
  furniture: FurnitureItemType;
  zones: FloorPlanZone[];
  onUpdate: (id: string, updates: Partial<FurnitureItemType>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRotate: (degrees: number) => void;
  onReplace: (catalogName: string) => void;
  onAssignToZone: (zoneId: string) => void;
}

export function FurnitureInspector({
  furniture,
  zones,
  onUpdate,
  onDelete,
  onDuplicate,
  onRotate,
  onReplace,
  onAssignToZone
}: FurnitureInspectorProps) {

  const updateFurniture = (updates: Partial<FurnitureItemType>) => {
    onUpdate(furniture.id, updates);
  };

  const catalogItem = getAllFurnitureLegacy().find(item => item.name === furniture.name);
  const assignedZone = zones.find(zone => zone.id === furniture.zoneId);

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-sm border mr-3"
                style={{ backgroundColor: furniture.color }}
              />
              <span className="truncate">{furniture.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                className="h-6 w-6 p-0"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                title="Delete (Del)"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">

          {/* Position */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">X (cm)</Label>
                <Input
                  type="number"
                  value={furniture.x}
                  onChange={(e) => updateFurniture({ x: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Y (cm)</Label>
                <Input
                  type="number"
                  value={furniture.y}
                  onChange={(e) => updateFurniture({ y: Number(e.target.value) })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-600">Width (cm)</Label>
                <Input
                  type="number"
                  value={furniture.w}
                  onChange={(e) => updateFurniture({ w: Math.max(1, Number(e.target.value)) })}
                  className="h-7 text-xs"
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Height (cm)</Label>
                <Input
                  type="number"
                  value={furniture.h}
                  onChange={(e) => updateFurniture({ h: Math.max(1, Number(e.target.value)) })}
                  className="h-7 text-xs"
                  min="1"
                />
              </div>
            </div>
            {catalogItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFurniture({ w: catalogItem.width, h: catalogItem.height })}
                className="h-7 px-2 text-xs w-full"
              >
                Reset to Default Size
              </Button>
            )}
          </div>

          {/* Rotation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Rotation</Label>
              <span className="text-xs text-gray-500">{furniture.r}°</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[furniture.r]}
                onValueChange={([value]) => updateFurniture({ r: value })}
                min={0}
                max={360}
                step={15}
                className="w-full"
              />
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(-90)}
                  className="h-7 px-2 flex-1"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  -90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(-15)}
                  className="h-7 px-2 flex-1"
                >
                  -15°
                </Button>
                <Input
                  type="number"
                  value={furniture.r}
                  onChange={(e) => updateFurniture({ r: Number(e.target.value) % 360 })}
                  className="h-7 text-xs w-16 text-center"
                  min="0"
                  max="360"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(15)}
                  className="h-7 px-2 flex-1"
                >
                  +15°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRotate(90)}
                  className="h-7 px-2 flex-1"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  +90°
                </Button>
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Color</Label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={furniture.color}
                onChange={(e) => updateFurniture({ color: e.target.value })}
                className="w-8 h-8 border rounded cursor-pointer"
              />
              <Input
                value={furniture.color}
                onChange={(e) => updateFurniture({ color: e.target.value })}
                className="h-8 text-xs flex-1"
              />
              {catalogItem && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFurniture({ color: catalogItem.color })}
                  className="h-8 px-2 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Zone Assignment */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Zone Assignment</Label>
            <Select
              value={furniture.zoneId || ""}
              onValueChange={(value) => onAssignToZone(value)}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Select zone..." />
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
            {assignedZone && (
              <div className="text-xs p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                Currently in: {assignedZone.name}
              </div>
            )}
          </div>

          {/* Replace with Library Item */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Replace Furniture</Label>
            <Select onValueChange={onReplace}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Replace with..." />
              </SelectTrigger>
              <SelectContent>
                {getAllFurnitureLegacy()
                  .filter(item => item.name !== furniture.name)
                  .map(item => (
                    <SelectItem key={item.name} value={item.name}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded border"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Replaces current item while preserving position
            </p>
          </div>

          {/* Furniture Info */}
          <div className="space-y-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <div className="font-medium">Furniture Information</div>
            <div>Type: {catalogItem?.category || 'Custom'}</div>
            <div>Size: {furniture.w} × {furniture.h} cm</div>
            <div>Position: ({furniture.x}, {furniture.y})</div>
            <div>Rotation: {furniture.r}°</div>
            {catalogItem && (
              <div>Catalog: {catalogItem.name}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Trash2, Pencil } from 'lucide-react';

interface DiagramShape {
  id: string;
  type: string;
  x: number;
  y: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  [key: string]: any;
}

interface DiagramInspectorProps {
  shapes: DiagramShape[];
  onUpdate: (id: string, updates: any) => void;
  onDelete: () => void;
}

export function DiagramInspector({ shapes, onUpdate, onDelete }: DiagramInspectorProps) {
  const isMultiSelection = shapes.length > 1;
  const shape = shapes[0]; // For single selection
  
  const updateShape = (updates: any) => {
    if (isMultiSelection) {
      // Apply updates to all selected shapes
      shapes.forEach(s => onUpdate(s.id, updates));
    } else if (shape) {
      onUpdate(shape.id, updates);
    }
  };

  // Get common properties for multi-selection
  const getCommonProperty = (property: string) => {
    if (!shapes.length) return undefined;
    const firstValue = shapes[0][property];
    const allSame = shapes.every(s => s[property] === firstValue);
    return allSame ? firstValue : undefined;
  };

  const commonStroke = getCommonProperty('stroke');
  const commonFill = getCommonProperty('fill');
  const commonStrokeWidth = getCommonProperty('strokeWidth');
  const commonOpacity = getCommonProperty('opacity');

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Pencil className="w-4 h-4 mr-2" />
              {isMultiSelection ? `${shapes.length} Shapes` : `${shape?.type} Shape`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
              title="Delete Selected"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          
          {/* Position (single selection only) */}
          {!isMultiSelection && shape && (
            <div className="space-y-3">
              <Label className="text-xs font-medium">Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">X</Label>
                  <Input
                    type="number"
                    value={shape.x}
                    onChange={(e) => updateShape({ x: Number(e.target.value) })}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Y</Label>
                  <Input
                    type="number"
                    value={shape.y}
                    onChange={(e) => updateShape({ y: Number(e.target.value) })}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Size (for shapes that have size) */}
          {!isMultiSelection && shape && (shape.type === 'rectangle' || shape.type === 'circle') && (
            <div className="space-y-3">
              <Label className="text-xs font-medium">Size</Label>
              {shape.type === 'rectangle' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">Width</Label>
                    <Input
                      type="number"
                      value={shape.width || 0}
                      onChange={(e) => updateShape({ width: Math.max(1, Number(e.target.value)) })}
                      className="h-7 text-xs"
                      min="1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Height</Label>
                    <Input
                      type="number"
                      value={shape.height || 0}
                      onChange={(e) => updateShape({ height: Math.max(1, Number(e.target.value)) })}
                      className="h-7 text-xs"
                      min="1"
                    />
                  </div>
                </div>
              )}
              {shape.type === 'circle' && (
                <div>
                  <Label className="text-xs text-gray-600">Radius</Label>
                  <Input
                    type="number"
                    value={shape.radius || 0}
                    onChange={(e) => updateShape({ radius: Math.max(1, Number(e.target.value)) })}
                    className="h-7 text-xs"
                    min="1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Text Content (for text shapes) */}
          {!isMultiSelection && shape && shape.type === 'text' && (
            <div className="space-y-3">
              <Label className="text-xs font-medium">Text Content</Label>
              <Input
                value={shape.text || ''}
                onChange={(e) => updateShape({ text: e.target.value })}
                className="h-8 text-sm"
                placeholder="Enter text..."
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Font Size</Label>
                  <Input
                    type="number"
                    value={shape.fontSize || 14}
                    onChange={(e) => updateShape({ fontSize: Math.max(8, Number(e.target.value)) })}
                    className="h-7 text-xs"
                    min="8"
                    max="72"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Font Weight</Label>
                  <select
                    value={shape.fontWeight || 'normal'}
                    onChange={(e) => updateShape({ fontWeight: e.target.value })}
                    className="h-7 text-xs border rounded px-2 w-full"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stroke Style */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Stroke</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label className="text-xs text-gray-600 w-12">Color</Label>
                <input
                  type="color"
                  value={commonStroke || '#000000'}
                  onChange={(e) => updateShape({ stroke: e.target.value })}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
                <Input
                  value={commonStroke || '#000000'}
                  onChange={(e) => updateShape({ stroke: e.target.value })}
                  className="h-8 text-xs flex-1"
                  placeholder={isMultiSelection ? 'Mixed values' : '#000000'}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-gray-600">Width</Label>
                  <span className="text-xs text-gray-500">
                    {commonStrokeWidth || (isMultiSelection ? 'Mixed' : '1')}px
                  </span>
                </div>
                <Slider
                  value={[commonStrokeWidth || 1]}
                  onValueChange={([value]) => updateShape({ strokeWidth: value })}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Fill Style (for shapes that support fill) */}
          {(isMultiSelection || (shape && shape.type !== 'line')) && (
            <div className="space-y-3">
              <Label className="text-xs font-medium">Fill</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={commonFill || '#ffffff'}
                  onChange={(e) => updateShape({ fill: e.target.value })}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
                <Input
                  value={commonFill || '#ffffff'}
                  onChange={(e) => updateShape({ fill: e.target.value })}
                  className="h-8 text-xs flex-1"
                  placeholder={isMultiSelection ? 'Mixed values' : '#ffffff'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateShape({ fill: 'transparent' })}
                  className="h-8 px-2 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
          )}

          {/* Opacity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Opacity</Label>
              <span className="text-xs text-gray-500">
                {Math.round((commonOpacity || 1) * 100)}%
              </span>
            </div>
            <Slider
              value={[commonOpacity || 1]}
              onValueChange={([value]) => updateShape({ opacity: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Shape Information */}
          <div className="space-y-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <div className="font-medium">Selection Information</div>
            {isMultiSelection ? (
              <>
                <div>Selected: {shapes.length} shapes</div>
                <div>Types: {[...new Set(shapes.map(s => s.type))].join(', ')}</div>
              </>
            ) : shape ? (
              <>
                <div>Type: {shape.type}</div>
                <div>Position: ({Math.round(shape.x)}, {Math.round(shape.y)})</div>
                {shape.type === 'rectangle' && (
                  <div>Size: {shape.width} × {shape.height}</div>
                )}
                {shape.type === 'circle' && (
                  <div>Radius: {shape.radius}</div>
                )}
                {shape.type === 'text' && (
                  <div>Text: "{shape.text || 'Empty'}"</div>
                )}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
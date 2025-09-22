"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X, Calculator, Home } from 'lucide-react';

interface SizeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentWidth: number; // cm
  currentHeight: number; // cm
  onSizeChange: (width: number, height: number, scale: number) => void;
}

export function SizeWizard({
  isOpen,
  onClose,
  currentWidth,
  currentHeight,
  onSizeChange
}: SizeWizardProps) {

  const [mode, setMode] = useState<'area' | 'dimensions'>('area');
  const [area, setArea] = useState<number>(Math.round((currentWidth * currentHeight) / 10000)); // m²
  const [aspectRatio, setAspectRatio] = useState<number>(currentWidth / currentHeight);
  const [customWidth, setCustomWidth] = useState<number>(Math.round(currentWidth / 100)); // m
  const [customHeight, setCustomHeight] = useState<number>(Math.round(currentHeight / 100)); // m
  const [scale, setScale] = useState<number>(0.9);

  // Calculate dimensions from area and aspect ratio
  const calculateFromArea = () => {
    const widthM = Math.sqrt(area * aspectRatio);
    const heightM = area / widthM;
    return {
      width: Math.round(widthM * 100), // convert to cm
      height: Math.round(heightM * 100) // convert to cm
    };
  };

  // Calculate area from custom dimensions
  const calculateAreaFromDimensions = useCallback(() => {
    return Math.round((customWidth * customHeight) * 100) / 100; // m²
  }, [customWidth, customHeight]);

  // Get final dimensions based on mode
  const getFinalDimensions = () => {
    if (mode === 'area') {
      return calculateFromArea();
    } else {
      return {
        width: Math.round(customWidth * 100),
        height: Math.round(customHeight * 100)
      };
    }
  };

  const finalDimensions = getFinalDimensions();
  const finalArea = (finalDimensions.width * finalDimensions.height) / 10000; // m²

  // Update area when custom dimensions change
  useEffect(() => {
    if (mode === 'dimensions') {
      setArea(calculateAreaFromDimensions());
    }
  }, [customWidth, customHeight, mode, calculateAreaFromDimensions]);

  // Preset sizes
  const presets = [
    { name: "Studio", area: 25, aspect: 1.2 },
    { name: "1 Bedroom", area: 45, aspect: 1.3 },
    { name: "2 Bedroom", area: 70, aspect: 1.4 },
    { name: "3 Bedroom", area: 95, aspect: 1.5 },
    { name: "4 Bedroom", area: 120, aspect: 1.6 }
  ];

  const handleApply = () => {
    onSizeChange(finalDimensions.width, finalDimensions.height, scale);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-96 max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Size Wizard
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Mode Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Input Method</Label>
            <div className="flex space-x-2">
              <Button
                variant={mode === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('area')}
                className="flex-1"
              >
                By Area (m²)
              </Button>
              <Button
                variant={mode === 'dimensions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('dimensions')}
                className="flex-1"
              >
                By Dimensions
              </Button>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setArea(preset.area);
                    setAspectRatio(preset.aspect);
                    setMode('area');
                  }}
                  className="text-xs h-8"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {mode === 'area' ? (
            /* Area Mode */
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Total Area (m²)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="h-8 text-sm"
                    min="10"
                    max="500"
                    step="5"
                  />
                  <span className="text-xs text-gray-500">m²</span>
                </div>
                <Slider
                  value={[area]}
                  onValueChange={([value]) => setArea(value)}
                  min={15}
                  max={200}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Aspect Ratio</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="number"
                    value={aspectRatio.toFixed(2)}
                    onChange={(e) => setAspectRatio(Number(e.target.value))}
                    className="h-8 text-sm"
                    min="0.5"
                    max="3"
                    step="0.1"
                  />
                  <span className="text-xs text-gray-500">width:height</span>
                </div>
                <Slider
                  value={[aspectRatio]}
                  onValueChange={([value]) => setAspectRatio(value)}
                  min={0.7}
                  max={2.5}
                  step={0.1}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Square</span>
                  <span>Rectangular</span>
                </div>
              </div>
            </div>
          ) : (
            /* Dimensions Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Width (m)</Label>
                  <Input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="h-8 text-sm mt-1"
                    min="2"
                    max="30"
                    step="0.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Height (m)</Label>
                  <Input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="h-8 text-sm mt-1"
                    min="2"
                    max="30"
                    step="0.5"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Area: {calculateAreaFromDimensions()} m²
              </div>
            </div>
          )}

          {/* Scale */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Display Scale</Label>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 w-8">{(scale * 100).toFixed(0)}%</span>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.4}
                max={1.4}
                step={0.05}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">{scale.toFixed(2)} px/cm</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Smaller</span>
              <span>Larger</span>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <Home className="w-4 h-4 mr-2 text-gray-600" />
              <Label className="text-sm font-medium">Preview</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-600">Dimensions</div>
                <div className="font-medium">
                  {(finalDimensions.width / 100).toFixed(1)} × {(finalDimensions.height / 100).toFixed(1)} m
                </div>
                <div className="text-xs text-gray-500">
                  {finalDimensions.width} × {finalDimensions.height} cm
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Area</div>
                <div className="font-medium">{finalArea.toFixed(1)} m²</div>
                <div className="text-xs text-gray-500">
                  Canvas: {Math.round(finalDimensions.width * scale)} × {Math.round(finalDimensions.height * scale)} px
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Size
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
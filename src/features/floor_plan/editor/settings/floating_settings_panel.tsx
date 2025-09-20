"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from '@/components/ui/sheet';
import { Settings2, Ruler, Grid3X3, Monitor } from 'lucide-react';
import { FloorPlanSettings } from '@/types';

interface FloatingSettingsPanelProps {
  settings: FloorPlanSettings;
  onSettingsChange: (settings: Partial<FloorPlanSettings>) => void;
}

export function FloatingSettingsPanel({
  settings,
  onSettingsChange
}: FloatingSettingsPanelProps) {
  const updateSetting = <K extends keyof FloorPlanSettings>(
    key: K,
    value: FloorPlanSettings[K]
  ) => {
    onSettingsChange({ [key]: value });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            variant="outline"
          >
            <Settings2 className="h-6 w-6" />
            <span className="sr-only">Display Settings</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-80 sm:w-96">
          <SheetHeader>
            <SheetTitle className="flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-blue-600" />
              Display Settings
            </SheetTitle>
            <SheetDescription>
              Customize how your floor plan is displayed and interacted with.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Scale Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Scale & Measurements</Label>
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600">Scale</Label>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      {settings.scale.toFixed(2)} px/cm
                    </span>
                  </div>
                  <Slider
                    value={[settings.scale]}
                    onValueChange={([value]) => updateSetting('scale', value)}
                    min={0.4}
                    max={1.4}
                    step={0.02}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.4x</span>
                    <span>1.4x</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Snap Grid (cm)</Label>
                  <Input
                    type="number"
                    value={settings.snap}
                    onChange={(e) => updateSetting('snap', Math.max(0, Number(e.target.value)))}
                    className="h-8 text-sm"
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-gray-400">
                    Set to 0 to disable grid snapping
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Grid3X3 className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Visual Display</Label>
              </div>

              <div className="space-y-4 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show Grid</Label>
                    <p className="text-xs text-gray-500">Display background grid lines</p>
                  </div>
                  <Switch
                    checked={settings.showGrid}
                    onCheckedChange={(checked) => updateSetting('showGrid', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Show Dimensions</Label>
                    <p className="text-xs text-gray-500">Display size labels on items</p>
                  </div>
                  <Switch
                    checked={settings.showDimensions}
                    onCheckedChange={(checked) => updateSetting('showDimensions', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Canvas Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">Canvas Display</Label>
              </div>

              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Display Mode</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="fixed"
                        name="canvasMode"
                        value="fixed"
                        checked={settings.canvasMode === 'fixed'}
                        onChange={(e) => updateSetting('canvasMode', e.target.value as 'fixed' | 'fit-to-screen' | 'centered')}
                        className="text-blue-600"
                      />
                      <Label htmlFor="fixed" className="text-sm cursor-pointer">
                        Fixed Size - Use exact dimensions
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="fit-to-screen"
                        name="canvasMode"
                        value="fit-to-screen"
                        checked={settings.canvasMode === 'fit-to-screen'}
                        onChange={(e) => updateSetting('canvasMode', e.target.value as 'fixed' | 'fit-to-screen' | 'centered')}
                        className="text-blue-600"
                      />
                      <Label htmlFor="fit-to-screen" className="text-sm cursor-pointer">
                        Fit to Screen - Scale to available space
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="centered"
                        name="canvasMode"
                        value="centered"
                        checked={settings.canvasMode === 'centered'}
                        onChange={(e) => updateSetting('canvasMode', e.target.value as 'fixed' | 'fit-to-screen' | 'centered')}
                        className="text-blue-600"
                      />
                      <Label htmlFor="centered" className="text-sm cursor-pointer">
                        Centered - Fixed size, centered on screen
                      </Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Choose how the canvas is displayed in the editor
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Width (cm)</Label>
                    <Input
                      type="number"
                      value={settings.apartmentWidth}
                      onChange={(e) => updateSetting('apartmentWidth', Number(e.target.value))}
                      className="h-8 text-sm"
                      min="200"
                      max="3000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Height (cm)</Label>
                    <Input
                      type="number"
                      value={settings.apartmentHeight}
                      onChange={(e) => updateSetting('apartmentHeight', Number(e.target.value))}
                      className="h-8 text-sm"
                      min="200"
                      max="3000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Max Canvas Width (px)</Label>
                    <Input
                      type="number"
                      value={settings.maxCanvasWidth || 1200}
                      onChange={(e) => updateSetting('maxCanvasWidth', Number(e.target.value))}
                      className="h-8 text-sm"
                      min="400"
                      max="2000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Max Canvas Height (px)</Label>
                    <Input
                      type="number"
                      value={settings.maxCanvasHeight || 800}
                      onChange={(e) => updateSetting('maxCanvasHeight', Number(e.target.value))}
                      className="h-8 text-sm"
                      min="300"
                      max="1500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Total floor plan dimensions and canvas size constraints
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2 pl-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    scale: 0.7,
                    snap: 10,
                    showGrid: true,
                    showDimensions: false,
                    canvasMode: 'fit-to-screen'
                  })}
                  className="h-8 text-xs"
                >
                  Full Screen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    scale: 1.2,
                    snap: 5,
                    showGrid: true,
                    showDimensions: true,
                    canvasMode: 'centered'
                  })}
                  className="h-8 text-xs"
                >
                  Detail View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    scale: 0.9,
                    snap: 5,
                    showGrid: true,
                    showDimensions: true,
                    canvasMode: 'centered'
                  })}
                  className="h-8 text-xs"
                >
                  Centered
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    scale: 0.8,
                    showGrid: true,
                    showDimensions: true,
                    canvasMode: 'fit-to-screen'
                  })}
                  className="h-8 text-xs"
                >
                  Post-Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSettingsChange({
                    showGrid: false,
                    showDimensions: false,
                    canvasMode: 'fit-to-screen'
                  })}
                  className="h-8 text-xs"
                >
                  Clean View
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
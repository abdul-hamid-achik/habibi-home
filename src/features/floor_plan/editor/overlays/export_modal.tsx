"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Download, 
  X, 
  FileImage, 
  FileText, 
  Database,
  Printer,
  Settings
} from 'lucide-react';
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { DiagramShape } from '../schemas';

interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'csv';
  quality: number;
  scale: number;
  width?: number;
  height?: number;
  includeGrid: boolean;
  includeDimensions: boolean;
  includeLabels: boolean;
  includeBackground: boolean;
  includeFurniture: boolean;
  includeZones: boolean;
  includeDiagrams: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  margins?: number;
  title?: string;
  description?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  diagramShapes?: DiagramShape[];
  canvasWidth: number;
  canvasHeight: number;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  zones,
  furniture,
  settings,
  diagramShapes = [],
  canvasWidth,
  canvasHeight
}: ExportModalProps) {
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.9,
    scale: 1.0,
    width: canvasWidth,
    height: canvasHeight,
    includeGrid: settings.showGrid,
    includeDimensions: settings.showDimensions,
    includeLabels: true,
    includeBackground: true,
    includeFurniture: true,
    includeZones: true,
    includeDiagrams: true,
    paperSize: 'A4',
    orientation: 'landscape',
    margins: 20,
    title: 'Floor Plan',
    description: ''
  });
  
  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  type FormatType = ExportOptions['format'];
  type PaperSizeType = ExportOptions['paperSize'];
  type OrientationType = ExportOptions['orientation'];
  
  // Calculate output dimensions
  const getOutputDimensions = () => {
    if (exportOptions.format === 'pdf') {
      const paperSizes = {
        A4: { width: 210, height: 297 }, // mm
        A3: { width: 297, height: 420 },
        Letter: { width: 216, height: 279 },
        Legal: { width: 216, height: 356 },
        Custom: { width: exportOptions.width || 210, height: exportOptions.height || 297 }
      };
      
      const size = paperSizes[exportOptions.paperSize || 'A4'];
      return exportOptions.orientation === 'portrait' 
        ? { width: size.width, height: size.height }
        : { width: size.height, height: size.width };
    }
    
    return {
      width: Math.round((exportOptions.width || canvasWidth) * exportOptions.scale),
      height: Math.round((exportOptions.height || canvasHeight) * exportOptions.scale)
    };
  };
  
  const outputDimensions = getOutputDimensions();
  
  // Format-specific options
  const isImageFormat = ['png', 'jpg', 'svg'].includes(exportOptions.format);
  const isPDFFormat = exportOptions.format === 'pdf';
  const isDataFormat = ['json', 'csv'].includes(exportOptions.format);
  
  // Estimate file size
  const estimateFileSize = () => {
    const pixels = outputDimensions.width * outputDimensions.height;
    
    switch (exportOptions.format) {
      case 'png':
        return `~${Math.round(pixels * 4 / 1024 / 1024 * 100) / 100} MB`;
      case 'jpg':
        return `~${Math.round(pixels * 3 * exportOptions.quality / 1024 / 1024 * 100) / 100} MB`;
      case 'svg':
        return `~${Math.round((zones.length + furniture.length + diagramShapes.length) * 0.5)} KB`;
      case 'pdf':
        return `~${Math.round(pixels / 1024 / 1024 * 0.5)} MB`;
      case 'json':
        return `~${Math.round((JSON.stringify({ zones, furniture, settings }).length) / 1024)} KB`;
      case 'csv':
        return `~${Math.round((zones.length + furniture.length) * 0.1)} KB`;
      default:
        return 'Unknown';
    }
  };
  
  const handleExport = () => {
    onExport(exportOptions);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-[500px] max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Download className="w-5 h-5 mr-2" />
              Export Floor Plan
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
          
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'png', label: 'PNG', icon: FileImage, desc: 'High quality image' },
                { value: 'jpg', label: 'JPG', icon: FileImage, desc: 'Compressed image' },
                { value: 'svg', label: 'SVG', icon: FileImage, desc: 'Vector graphics' },
                { value: 'pdf', label: 'PDF', icon: Printer, desc: 'Print ready' },
                { value: 'json', label: 'JSON', icon: Database, desc: 'Data export' },
                { value: 'csv', label: 'CSV', icon: FileText, desc: 'Spreadsheet data' }
              ].map(format => (
                <Button
                  key={format.value}
                  variant={exportOptions.format === format.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateOption('format', format.value as FormatType)}
                  className="h-auto p-3 flex flex-col items-center space-y-1"
                >
                  <format.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{format.label}</span>
                  <span className="text-xs text-gray-500">{format.desc}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Image Format Options */}
          {isImageFormat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Width (px)</Label>
                  <Input
                    type="number"
                    value={exportOptions.width}
                    onChange={(e) => updateOption('width', Number(e.target.value))}
                    className="h-8 text-sm"
                    min="100"
                    max="8000"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Height (px)</Label>
                  <Input
                    type="number"
                    value={exportOptions.height}
                    onChange={(e) => updateOption('height', Number(e.target.value))}
                    className="h-8 text-sm"
                    min="100"
                    max="8000"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-medium">Scale Factor</Label>
                  <span className="text-xs text-gray-500">{exportOptions.scale}x</span>
                </div>
                <Slider
                  value={[exportOptions.scale]}
                  onValueChange={([value]) => updateOption('scale', value)}
                  min={0.25}
                  max={4}
                  step={0.25}
                  className="w-full"
                />
              </div>
              
              {exportOptions.format === 'jpg' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-medium">Quality</Label>
                    <span className="text-xs text-gray-500">{Math.round(exportOptions.quality * 100)}%</span>
                  </div>
                  <Slider
                    value={[exportOptions.quality]}
                    onValueChange={([value]) => updateOption('quality', value)}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
          
          {/* PDF Options */}
          {isPDFFormat && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Paper Size</Label>
                  <Select 
                    value={exportOptions.paperSize} 
                    onValueChange={(value) => updateOption('paperSize', value as PaperSizeType)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                      <SelectItem value="A3">A3 (297×420mm)</SelectItem>
                      <SelectItem value="Letter">Letter (8.5×11&quot;)</SelectItem>
                      <SelectItem value="Legal">Legal (8.5×14&quot;)</SelectItem>
                      <SelectItem value="Custom">Custom Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Orientation</Label>
                  <Select 
                    value={exportOptions.orientation} 
                    onValueChange={(value) => updateOption('orientation', value as OrientationType)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape</SelectItem>
                      <SelectItem value="portrait">Portrait</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-medium">Margins (mm)</Label>
                <Input
                  type="number"
                  value={exportOptions.margins}
                  onChange={(e) => updateOption('margins', Number(e.target.value))}
                  className="h-8 text-sm mt-1"
                  min="0"
                  max="50"
                />
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium">Title</Label>
                  <Input
                    value={exportOptions.title}
                    onChange={(e) => updateOption('title', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Floor Plan Title"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Description</Label>
                  <Input
                    value={exportOptions.description}
                    onChange={(e) => updateOption('description', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Content Options */}
          {!isDataFormat && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Include in Export</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'includeZones', label: 'Zones', count: zones.length },
                  { key: 'includeFurniture', label: 'Furniture', count: furniture.length },
                  { key: 'includeDiagrams', label: 'Diagrams', count: diagramShapes.length },
                  { key: 'includeGrid', label: 'Grid Lines', count: null },
                  { key: 'includeDimensions', label: 'Dimensions', count: null },
                  { key: 'includeLabels', label: 'Labels', count: null }
                ].map(option => (
                  <div key={option.key} className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                      onCheckedChange={(checked) => updateOption(option.key as keyof ExportOptions, checked)}
                    />
                    <Label className="text-xs">
                      {option.label}
                      {option.count !== null && (
                        <span className="text-gray-500 ml-1">({option.count})</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Preview Info */}
          <div className="space-y-3 p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <Settings className="w-4 h-4 mr-2 text-gray-600" />
              <Label className="text-sm font-medium">Export Preview</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-600">Output Size</div>
                <div className="font-medium">
                  {outputDimensions.width} × {outputDimensions.height}
                  {isPDFFormat ? 'mm' : 'px'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Est. File Size</div>
                <div className="font-medium">{estimateFileSize()}</div>
              </div>
              <div>
                <div className="text-gray-600">Content</div>
                <div className="font-medium">
                  {[
                    exportOptions.includeZones && `${zones.length} zones`,
                    exportOptions.includeFurniture && `${furniture.length} furniture`,
                    exportOptions.includeDiagrams && `${diagramShapes.length} diagrams`
                  ].filter(Boolean).join(', ') || 'None selected'}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Format</div>
                <div className="font-medium">{exportOptions.format.toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
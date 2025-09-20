"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Save,
  Undo,
  Zap,
  Sofa,
  Armchair,
  Table,
  Bed,
  Package,
  Monitor,
  Leaf,
  Search,
  X,
  Keyboard
} from "lucide-react";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings, saveProjectDataSchema, zoneSchema, furnitureItemSchema } from "@/types";
import { DEFAULT_APARTMENT_ZONES, DEFAULT_FURNITURE_LAYOUT, DEFAULT_FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { FloorPlanUploader } from "./floor-plan-uploader";
import { FloatingSettingsPanel } from "./floating-settings-panel";

// Canvas container component for different display modes

interface FloorPlanEditorProps {
  projectId?: string;
  initialZones?: FloorPlanZone[];
  initialFurniture?: FurnitureItemType[];
  initialSettings?: Partial<FloorPlanSettings>;
  onSave?: (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings }) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_SETTINGS: FloorPlanSettings = {
  scale: 0.9,
  snap: 5,
  showGrid: true,
  showDimensions: true,
  apartmentWidth: 1050,
  apartmentHeight: 800,
  canvasMode: 'centered',
  maxCanvasWidth: 1200,
  maxCanvasHeight: 800,
};

export function FloorPlanEditor({
  initialZones,
  initialFurniture,
  initialSettings,
  onSave
}: FloorPlanEditorProps) {
  // Editor state
  const [settings, setSettings] = useState<FloorPlanSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [zones, setZones] = useState<FloorPlanZone[]>(() => {
    if (initialZones?.length) return initialZones;
    return DEFAULT_APARTMENT_ZONES.map(z => ({
      ...z,
      id: generateId(),
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h
    }));
  });

  const [furniture, setFurniture] = useState<FurnitureItemType[]>(() => {
    if (initialFurniture?.length) return initialFurniture;
    return DEFAULT_FURNITURE_LAYOUT.map(item => {
      const catalogItem = DEFAULT_FURNITURE_CATALOG.find(cat => cat.name === item.name);
      return {
        id: generateId(),
        name: item.name,
        x: item.x,
        y: item.y,
        w: catalogItem?.width || 100,
        h: catalogItem?.height || 100,
        r: item.r,
        color: catalogItem?.color || "#666666",
        zoneId: item.zoneId,
      };
    });
  });

  // Editor mode and selection
  const [editZones, setEditZones] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [showAIImport, setShowAIImport] = useState(false);

  // Keyboard shortcut overlay state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Furniture catalog state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Refs for Moveable
  const zoneRefs = useRef<Record<string, HTMLElement | null>>({});

  // Computed values
  const selectedZone = useMemo(() =>
    zones.find(z => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const selectedFurniture = useMemo(() =>
    furniture.find(f => f.id === selectedFurnitureId) || null,
    [furniture, selectedFurnitureId]
  );

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    sofa: <Sofa className="w-4 h-4" />,
    chair: <Armchair className="w-4 h-4" />,
    table: <Table className="w-4 h-4" />,
    desk: <Monitor className="w-4 h-4" />,
    bed: <Bed className="w-4 h-4" />,
    storage: <Package className="w-4 h-4" />,
    appliance: <Zap className="w-4 h-4" />,
    electronics: <Monitor className="w-4 h-4" />,
    decor: <Leaf className="w-4 h-4" />,
  };

  // Filter furniture based on search and category
  const filteredFurniture = useMemo(() => {
    return DEFAULT_FURNITURE_CATALOG.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = [...new Set(DEFAULT_FURNITURE_CATALOG.map(item => item.category))];
    return categories.map(category => {
      const categoryData = {
        sofa: { name: "Sofas", icon: <Sofa className="w-4 h-4" /> },
        chair: { name: "Chairs", icon: <Armchair className="w-4 h-4" /> },
        table: { name: "Tables", icon: <Table className="w-4 h-4" /> },
        desk: { name: "Desks", icon: <Monitor className="w-4 h-4" /> },
        bed: { name: "Beds", icon: <Bed className="w-4 h-4" /> },
        storage: { name: "Storage", icon: <Package className="w-4 h-4" /> },
        appliance: { name: "Appliances", icon: <Zap className="w-4 h-4" /> },
        electronics: { name: "Electronics", icon: <Monitor className="w-4 h-4" /> },
        decor: { name: "Decor", icon: <Leaf className="w-4 h-4" /> },
      }[category] || { name: category, icon: <Package className="w-4 h-4" /> };
      return { id: category, ...categoryData };
    });
  }, []);

  // Utility functions
  const cm2px = (cm: number) => cm * settings.scale;
  const px2cm = (px: number) => px / settings.scale;
  const snapCm = (value: number) => {
    return settings.snap ? Math.round(value / settings.snap) * settings.snap : value;
  };

  // Actions
  const resetLayout = () => {
    setZones(DEFAULT_APARTMENT_ZONES.map(z => ({
      ...z,
      id: generateId(),
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h
    })));
    setFurniture(DEFAULT_FURNITURE_LAYOUT.map(item => {
      const catalogItem = DEFAULT_FURNITURE_CATALOG.find(cat => cat.name === item.name);
      return {
        id: generateId(),
        name: item.name,
        x: item.x,
        y: item.y,
        w: catalogItem?.width || 100,
        h: catalogItem?.height || 100,
        r: item.r,
        color: catalogItem?.color || "#666666",
        zoneId: item.zoneId,
      };
    }));
    setSelectedZoneId(null);
    setSelectedFurnitureId(null);

    // Reset to centered mode with default dimensions
    setSettings(prev => ({
      ...DEFAULT_SETTINGS,
      ...prev,
    }));
  };

  const handleAIAnalysis = (analysis: { dimensions?: { width: number; height: number }; zones?: Array<{ zoneId?: string; name: string; x: number; y: number; w: number; h: number }> }) => {

    // Update apartment settings based on analysis
    const dimensions = analysis.dimensions;
    if (dimensions && dimensions.width && dimensions.height) {
      setSettings(prev => ({
        ...prev,
        apartmentWidth: Math.round(dimensions.width * 100), // Convert meters to cm
        apartmentHeight: Math.round(dimensions.height * 100),
        canvasMode: 'fit-to-screen', // Switch to fit-to-screen after import
        scale: 0.8, // Reset scale to better fit imported floor plans
      }));
    }

    // Import zones from analysis
    if (analysis.zones && analysis.zones.length > 0) {
      const importedZones = analysis.zones.map((zone) => ({
        id: generateId(),
        zoneId: zone.zoneId || zone.name.toLowerCase().replace(/\s+/g, '_'),
        name: zone.name,
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        color: undefined, // Let the default styling handle colors
      }));

      setZones(importedZones);
    }

    // Clear existing furniture when importing new zones
    setFurniture([]);
    setSelectedZoneId(null);
    setSelectedFurnitureId(null);
    setShowAIImport(false);
  };

  const addFurniture = (catalogName: string) => {
    const catalogItem = DEFAULT_FURNITURE_CATALOG.find(cat => cat.name === catalogName);
    if (!catalogItem) return;

    const newItem: FurnitureItemType = {
      id: generateId(),
      name: catalogItem.name,
      x: 50,
      y: 50,
      w: catalogItem.width,
      h: catalogItem.height,
      r: 0,
      color: catalogItem.color,
    };

    setFurniture(prev => [...prev, newItem]);
  };

  const duplicateFurniture = useCallback(() => {
    if (!selectedFurniture) return;

    const newItem: FurnitureItemType = {
      ...selectedFurniture,
      id: generateId(),
      x: selectedFurniture.x + 20,
      y: selectedFurniture.y + 20,
    };

    setFurniture(prev => [...prev, newItem]);
    setSelectedFurnitureId(newItem.id);
  }, [selectedFurniture]);

  const deleteFurniture = () => {
    if (!selectedFurniture) return;
    setFurniture(prev => prev.filter(f => f.id !== selectedFurniture.id));
    setSelectedFurnitureId(null);
  };

  const rotateFurniture = (degrees: number) => {
    if (!selectedFurniture) return;
    setFurniture(prev =>
      prev.map(f =>
        f.id === selectedFurniture.id
          ? { ...f, r: (f.r + degrees) % 360 }
          : f
      )
    );
  };

  const handleSave = () => {
    if (onSave) {
      // Validate data before saving
      const validationResult = saveProjectDataSchema.safeParse({
        zones,
        furniture,
        settings: {
          apartmentWidth: settings.apartmentWidth,
          apartmentHeight: settings.apartmentHeight,
          scale: settings.scale,
          snapGrid: settings.snap,
          showGrid: settings.showGrid,
          showDimensions: settings.showDimensions,
        }
      });

      if (!validationResult.success) {
        console.error('Invalid project data:', validationResult.error);
        // For now, we'll still call onSave but log the error
        // In production, you might want to show a user-friendly error
        console.warn('Saving project with invalid data');
      }

      const validatedData = validationResult.success ? validationResult.data : { zones, furniture, settings };
      onSave(validatedData as { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings });
    }
  };

  // Update furniture helper
  const updateFurniture = (id: string, updates: Partial<FurnitureItemType>) => {
    setFurniture(prev => {
      const updatedFurniture = prev.map(f => f.id === id ? { ...f, ...updates } : f);

      // Validate the updated furniture item
      const updatedItem = updatedFurniture.find(f => f.id === id);
      if (updatedItem) {
        const validationResult = furnitureItemSchema.safeParse(updatedItem);
        if (!validationResult.success) {
          console.warn(`Invalid furniture data for item ${id}:`, validationResult.error);
        }
      }

      return updatedFurniture;
    });
  };

  // Update zone helper
  const updateZone = (id: string, updates: Partial<FloorPlanZone>) => {
    setZones(prev => {
      const updatedZones = prev.map(z => z.id === id ? { ...z, ...updates } : z);

      // Validate the updated zone
      const updatedZone = updatedZones.find(z => z.id === id);
      if (updatedZone) {
        const validationResult = zoneSchema.safeParse(updatedZone);
        if (!validationResult.success) {
          console.warn(`Invalid zone data for zone ${id}:`, validationResult.error);
        }
      }

      return updatedZones;
    });
  };

  // Keyboard shortcuts for zones and furniture
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement) return;

      // Zone shortcuts (only when editZones is true)
      if (editZones) {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedZoneId) {
              event.preventDefault();
              const newZones = zones.filter(z => z.id !== selectedZoneId);
              setZones(newZones);
              setSelectedZoneId(null);
            }
            break;

          case 'Escape':
            event.preventDefault();
            setSelectedZoneId(null);
            break;

          case 'ArrowUp':
            if (zones.length > 0) {
              event.preventDefault();
              const currentIndex = selectedZoneId
                ? zones.findIndex(z => z.id === selectedZoneId)
                : zones.length - 1;
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : zones.length - 1;
              setSelectedZoneId(zones[nextIndex].id);
            }
            break;

          case 'ArrowDown':
            if (zones.length > 0) {
              event.preventDefault();
              const currentIndex = selectedZoneId
                ? zones.findIndex(z => z.id === selectedZoneId)
                : -1;
              const nextIndex = currentIndex < zones.length - 1 ? currentIndex + 1 : 0;
              setSelectedZoneId(zones[nextIndex].id);
            }
            break;

          case 'n':
          case 'N':
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              const newZone: FloorPlanZone = {
                id: generateId(),
                zoneId: `zone_${zones.length + 1}`,
                name: `Zone ${zones.length + 1}`,
                x: 100,
                y: 100,
                w: 200,
                h: 150,
              };
              setZones([...zones, newZone]);
              setSelectedZoneId(newZone.id);
            }
            break;
        }
      }

      // Furniture shortcuts (only when not in editZones mode)
      if (!editZones) {
        switch (event.key) {
          case 'Delete':
          case 'Backspace':
            if (selectedFurnitureId) {
              event.preventDefault();
              const newFurniture = furniture.filter(f => f.id !== selectedFurnitureId);
              setFurniture(newFurniture);
              setSelectedFurnitureId(null);
            }
            break;

          case 'Escape':
            event.preventDefault();
            setSelectedFurnitureId(null);
            break;

          case 'd':
          case 'D':
            if ((event.ctrlKey || event.metaKey) && selectedFurnitureId) {
              event.preventDefault();
              duplicateFurniture();
            }
            break;

          case 'ArrowUp':
            if (furniture.length > 0) {
              event.preventDefault();
              const currentIndex = selectedFurnitureId
                ? furniture.findIndex(f => f.id === selectedFurnitureId)
                : furniture.length - 1;
              const nextIndex = currentIndex > 0 ? currentIndex - 1 : furniture.length - 1;
              setSelectedFurnitureId(furniture[nextIndex].id);
            }
            break;

          case 'ArrowDown':
            if (furniture.length > 0) {
              event.preventDefault();
              const currentIndex = selectedFurnitureId
                ? furniture.findIndex(f => f.id === selectedFurnitureId)
                : -1;
              const nextIndex = currentIndex < furniture.length - 1 ? currentIndex + 1 : 0;
              setSelectedFurnitureId(furniture[nextIndex].id);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editZones, selectedZoneId, selectedFurnitureId, zones, furniture, duplicateFurniture]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Habibi Floor Plan Editor</h1>
          <Button
            variant={editZones ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setEditZones(!editZones);
              setSelectedFurnitureId(null);
              setSelectedZoneId(null);
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            {editZones ? "Exit Zone Edit" : "Edit Zones"}
          </Button>
          <Button
            variant={showAIImport ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowAIImport(!showAIImport);
              setEditZones(false);
              setSelectedFurnitureId(null);
              setSelectedZoneId(null);
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            AI Import
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
          >
            <Keyboard className="w-4 h-4 mr-2" />
            Shortcuts
          </Button>
          <Button variant="outline" size="sm" onClick={resetLayout}>
            <Undo className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div className="w-96 bg-white overflow-y-auto">
          <div className="p-0 space-y-6">
            {/* AI Import, Zone Editor, or Furniture Catalog */}
            {showAIImport ? (
              <FloorPlanUploader
                onAnalysisComplete={handleAIAnalysis}
              />
            ) : editZones ? (
              <div className="space-y-4">
                {/* Zone Editor Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold">Zone Editor</h3>
                    <div className="group relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Keyboard className="w-3 h-3" />
                      </Button>
                      <div className="absolute left-0 top-6 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs rounded-md p-2 w-48 shadow-lg">
                          <div className="space-y-1">
                            <div className="font-medium mb-1">Keyboard Shortcuts</div>
                            <div>↑↓ Navigate zones</div>
                            <div>⌫ Delete selected</div>
                            <div>Esc Clear selection</div>
                            <div>Ctrl+N Add new zone</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{zones.length} zones</div>
                </div>

                {/* Compact Zones List */}
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {zones.map((zone, index) => (
                    <div
                      key={zone.id}
                      className={`group flex items-center space-x-2 p-2 border rounded-sm cursor-pointer transition-all hover:shadow-sm ${selectedZoneId === zone.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center text-xs font-medium bg-white">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Input
                          value={zone.name}
                          onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                          className="h-6 text-xs border-0 p-0 focus:ring-0 focus:border-b focus:border-blue-300 bg-transparent"
                          placeholder="Zone name..."
                        />
                        <Input
                          value={`${zone.w}×${zone.h}`}
                          onChange={(e) => {
                            const value = e.target.value;
                            const match = value.match(/^(\d+)×(\d+)$/);
                            if (match) {
                              const newW = parseInt(match[1]);
                              const newH = parseInt(match[2]);
                              if (!isNaN(newW) && !isNaN(newH) && newW > 0 && newH > 0) {
                                updateZone(zone.id, { w: newW, h: newH });
                              }
                            }
                          }}
                          className="h-5 text-xs border-0 p-0 focus:ring-0 focus:border-b focus:border-blue-300 bg-transparent"
                          placeholder="WxH cm"
                        />
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newZones = zones.filter(z => z.id !== zone.id);
                            setZones(newZones);
                            if (selectedZoneId === zone.id) {
                              setSelectedZoneId(null);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Zone Properties */}
                {selectedZone && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium flex items-center justify-between">
                        <span>Edit Zone Properties</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedZoneId(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">X</Label>
                          <Input
                            type="number"
                            value={selectedZone.x}
                            onChange={(e) => updateZone(selectedZone.id, { x: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={selectedZone.y}
                            onChange={(e) => updateZone(selectedZone.id, { y: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">W</Label>
                          <Input
                            type="number"
                            value={selectedZone.w}
                            onChange={(e) => updateZone(selectedZone.id, { w: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">H</Label>
                          <Input
                            type="number"
                            value={selectedZone.h}
                            onChange={(e) => updateZone(selectedZone.id, { h: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Add Zone */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => {
                    const newZone: FloorPlanZone = {
                      id: generateId(),
                      zoneId: `zone_${zones.length + 1}`,
                      name: `Zone ${zones.length + 1}`,
                      x: 100,
                      y: 100,
                      w: 200,
                      h: 150,
                    };
                    setZones([...zones, newZone]);
                    setSelectedZoneId(newZone.id);
                  }}
                >
                  + Add Zone
                </Button>
              </div>
            ) : (
              <>
                {/* Furniture Catalog */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                        Furniture Catalog
                        <div className="group relative ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <Keyboard className="w-3 h-3" />
                          </Button>
                          <div className="absolute left-0 top-6 z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-gray-900 text-white text-xs rounded-md p-2 w-48 shadow-lg">
                              <div className="space-y-1">
                                <div className="font-medium mb-1">Furniture Shortcuts</div>
                                <div>↑↓ Navigate furniture</div>
                                <div>⌫ Delete selected</div>
                                <div>⌘D Duplicate</div>
                                <div>Esc Clear selection</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{furniture.length} items</div>
                    </CardTitle>
                    <div className="relative mt-2">
                      <Input
                        placeholder="Search furniture..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-3 pr-10 h-8 text-xs"
                      />
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
                        {searchTerm ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center w-6 h-6">
                            <Search className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={selectedCategory === null ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs h-7 px-2"
                      >
                        All
                      </Button>
                      {availableCategories.map(category => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                          className="text-xs h-7 px-2"
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>

                    {/* Furniture Grid */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredFurniture.map(item => (
                        <div
                          key={item.name}
                          className="group flex items-center justify-between p-2.5 border rounded hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded border"
                              style={{ backgroundColor: item.color + '30', borderColor: item.color }}>
                              {categoryIcons[item.category]}
                            </div>
                            <div className="flex-1 min-w-0 ml-2">
                              <div className="text-xs font-medium text-gray-900 truncate">{item.name}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {item.width}×{item.height} cm
                              </div>
                            </div>
                            <div
                              className="w-3 h-3 rounded border"
                              style={{ backgroundColor: item.color, borderColor: item.color }}
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addFurniture(item.name)}
                            className="h-6 px-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity mr-2"
                          >
                            +
                          </Button>
                        </div>
                      ))}
                    </div>

                    {filteredFurniture.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">No furniture found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected Furniture */}
                {selectedFurniture && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base font-semibold flex items-center">
                        <div
                          className="w-3 h-3 rounded-sm border mr-3"
                          style={{ backgroundColor: selectedFurniture.color }}
                        />
                        {selectedFurniture.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">X</Label>
                          <Input
                            type="number"
                            value={selectedFurniture.x}
                            onChange={(e) => updateFurniture(selectedFurniture.id, { x: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y</Label>
                          <Input
                            type="number"
                            value={selectedFurniture.y}
                            onChange={(e) => updateFurniture(selectedFurniture.id, { y: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width</Label>
                          <Input
                            type="number"
                            value={selectedFurniture.w}
                            onChange={(e) => updateFurniture(selectedFurniture.id, { w: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height</Label>
                          <Input
                            type="number"
                            value={selectedFurniture.h}
                            onChange={(e) => updateFurniture(selectedFurniture.id, { h: Number(e.target.value) })}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Rotation: {selectedFurniture.r}°</Label>
                        <Input
                          type="number"
                          value={selectedFurniture.r}
                          onChange={(e) => updateFurniture(selectedFurniture.id, { r: Number(e.target.value) })}
                          className="h-7 text-xs mt-1"
                        />
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateFurniture(-90)}
                          className="h-7 px-2 flex-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rotateFurniture(90)}
                          className="h-7 px-2 flex-1"
                        >
                          <RotateCw className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={duplicateFurniture}
                          className="h-7 px-2 flex-1"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={deleteFurniture}
                          className="h-7 px-2 flex-1"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 p-4 overflow-auto">
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="relative border bg-white shadow-lg"
              style={{
                width: cm2px(Math.min(settings.apartmentWidth, settings.maxCanvasWidth || Infinity)),
                height: cm2px(Math.min(settings.apartmentHeight, settings.maxCanvasHeight || Infinity)),
                position: 'relative'
              }}
            >
              {/* Grid */}
              {settings.showGrid && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={cm2px(Math.min(settings.apartmentWidth, settings.maxCanvasWidth || Infinity))}
                  height={cm2px(Math.min(settings.apartmentHeight, settings.maxCanvasHeight || Infinity))}
                >
                  <defs>
                    <pattern
                      id="grid"
                      width={cm2px(25)}
                      height={cm2px(25)}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${cm2px(25)} 0 L 0 0 0 ${cm2px(25)}`}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              )}

              {/* Zones */}
              {zones.map(zone => (
                <div
                  key={zone.id}
                  ref={el => { zoneRefs.current[zone.id] = el; }}
                  onClick={() => editZones && setSelectedZoneId(zone.id)}
                  className={`absolute flex items-center justify-center cursor-pointer select-none rounded border-2 ${editZones
                    ? selectedZoneId === zone.id
                      ? 'border-blue-500 bg-blue-100/50'
                      : 'border-amber-400 bg-amber-100/30 hover:bg-amber-100/50'
                    : 'border-gray-300 bg-gray-100/30'
                    }`}
                  style={{
                    left: cm2px(zone.x),
                    top: cm2px(zone.y),
                    width: cm2px(zone.w),
                    height: cm2px(zone.h),
                  }}
                >
                  <div className="text-center text-xs text-gray-700 px-1">
                    <div className="font-medium">{zone.name}</div>
                    {settings.showDimensions && (
                      <div className="text-xs opacity-70">{zone.w}×{zone.h} cm</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Furniture Items - All draggable with Rnd */}
              {!editZones && furniture.map(item => (
                <Rnd
                  key={item.id}
                  default={{
                    x: cm2px(item.x),
                    y: cm2px(item.y),
                    width: cm2px(item.w),
                    height: cm2px(item.h)
                  }}
                  minWidth={cm2px(10)}
                  minHeight={cm2px(10)}
                  bounds="parent"
                  enableResizing={selectedFurnitureId === item.id}
                  disableDragging={false}
                  onDragStart={() => {
                    setSelectedFurnitureId(item.id);
                  }}
                  onDragStop={(_e, d) => {
                    const newX = snapCm(px2cm(d.x));
                    const newY = snapCm(px2cm(d.y));
                    updateFurniture(item.id, { x: newX, y: newY });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newW = Math.max(10, snapCm(px2cm(ref.offsetWidth)));
                    const newH = Math.max(10, snapCm(px2cm(ref.offsetHeight)));
                    const newX = snapCm(px2cm(position.x));
                    const newY = snapCm(px2cm(position.y));
                    updateFurniture(item.id, { x: newX, y: newY, w: newW, h: newH });
                  }}
                  className={`${selectedFurnitureId === item.id ? 'z-40' : 'z-10'}`}
                  style={{
                    backgroundColor: item.color,
                    transform: `rotate(${item.r}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div
                    className={`w-full h-full flex items-center justify-center cursor-move select-none rounded border-2 text-white text-xs font-medium ${selectedFurnitureId === item.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-800'
                      }`}
                    onClick={() => setSelectedFurnitureId(item.id)}
                  >
                    <div className="text-center px-1">
                      <div>{item.name}</div>
                      {settings.showDimensions && (
                        <div className="text-xs opacity-80">{item.w}×{item.h} cm</div>
                      )}
                    </div>
                  </div>
                </Rnd>
              ))}

              {/* Rnd for Zones */}
              {editZones && selectedZone && (
                <Rnd
                  key={selectedZone.id}
                  default={{
                    x: cm2px(selectedZone.x),
                    y: cm2px(selectedZone.y),
                    width: cm2px(selectedZone.w),
                    height: cm2px(selectedZone.h)
                  }}
                  minWidth={cm2px(10)}
                  minHeight={cm2px(10)}
                  bounds="parent"
                  enableResizing={true}
                  disableDragging={false}
                  onDragStop={(e, d) => {
                    const newX = snapCm(px2cm(d.x));
                    const newY = snapCm(px2cm(d.y));
                    updateZone(selectedZone.id, { x: newX, y: newY });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newW = Math.max(10, snapCm(px2cm(ref.offsetWidth)));
                    const newH = Math.max(10, snapCm(px2cm(ref.offsetHeight)));
                    const newX = snapCm(px2cm(position.x));
                    const newY = snapCm(px2cm(position.y));
                    updateZone(selectedZone.id, { x: newX, y: newY, w: newW, h: newH });
                  }}
                  className="z-50"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px dashed #3b82f6'
                  }}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Overlay */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-xl border p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {editZones ? (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Zone Editor</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Navigate zones</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑ ↓</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Delete selected zone</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌫</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear selection</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Delete</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Add new zone</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ N</kbd>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Furniture Editor</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Navigate furniture</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑ ↓</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Delete selected furniture</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌫</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicate furniture</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ D</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Clear selection</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">DELETE</kbd>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-2">General</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-xs text-gray-600">
                    Click the &quot;Shortcuts&quot; button in the header to view all shortcuts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Settings Panel */}
      <FloatingSettingsPanel
        settings={settings}
        onSettingsChange={(updates) => setSettings(prev => ({ ...prev, ...updates }))}
      />
    </div>
  );
}
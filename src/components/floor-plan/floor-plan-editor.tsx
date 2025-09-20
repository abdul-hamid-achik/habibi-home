"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserButton } from "@stackframe/stack";
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
    Keyboard,
    Layers,
    Pencil,
} from "lucide-react";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings, saveProjectDataSchema, zoneSchema, furnitureItemSchema } from "@/types";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { DEFAULT_APARTMENT_ZONES, DEFAULT_FURNITURE_LAYOUT } from "@/features/floor_plan/data/seeds";
import { FloorPlanUploader } from "./floor-plan-uploader";
import { FloatingSettingsPanel } from "@/features/floor_plan/editor/settings/floating_settings_panel";
import { cm2px, px2cm, snapToGrid } from "@/features/floor_plan/utils/units";
import { KonvaDiagramCanvas, DiagramShape } from "./konva-diagram-canvas";
import Link from "next/link";

interface FloorPlanEditorProps {
    projectId?: string;
    initialZones?: FloorPlanZone[];
    initialFurniture?: FurnitureItemType[];
    initialSettings?: Partial<FloorPlanSettings>;
    onSave?: (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings; diagrams?: DiagramShape[] }) => void;
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

type EditorMode = 'zones' | 'furniture' | 'diagrams';

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

        const validFurniture = DEFAULT_FURNITURE_LAYOUT.filter(item => {
            const validZones = DEFAULT_APARTMENT_ZONES.map(z => z.zoneId);
            return validZones.includes(item.zoneId);
        });

        if (validFurniture.length > 0) {
            return validFurniture.map(item => {
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
        }

        return [
            {
                id: generateId(),
                name: "large sofa",
                x: 100,
                y: 100,
                w: 205,
                h: 100,
                r: 0,
                color: "#2b5db9",
            },
            {
                id: generateId(),
                name: "coffee table",
                x: 150,
                y: 250,
                w: 120,
                h: 60,
                r: 0,
                color: "#8b6914",
            }
        ];
    });

    // Diagram shapes state
    const [diagramShapes, setDiagramShapes] = useState<DiagramShape[]>([]);

    // Editor mode and selection
    const [editorMode, setEditorMode] = useState<EditorMode>('furniture');
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
    const [showAIImport, setShowAIImport] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

    // Furniture catalog state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

    // Utility functions (using shared utils)
    const toPx = (cm: number) => cm2px(cm, settings.scale);
    const toCm = (px: number) => px2cm(px, settings.scale);
    const snapCm = (value: number) => snapToGrid(value, settings.snap);

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
        setDiagramShapes([]);
        setSelectedZoneId(null);
        setSelectedFurnitureId(null);

        setSettings(prev => ({
            ...DEFAULT_SETTINGS,
            ...prev,
        }));
    };

    const handleAIAnalysis = (analysis: { dimensions?: { width: number; height: number }; zones?: Array<{ zoneId?: string; name: string; x: number; y: number; w: number; h: number }> }) => {
        const dimensions = analysis.dimensions;
        if (dimensions && dimensions.width && dimensions.height) {
            setSettings(prev => ({
                ...prev,
                apartmentWidth: Math.round(dimensions.width * 100),
                apartmentHeight: Math.round(dimensions.height * 100),
                canvasMode: 'fit-to-screen',
                scale: 0.8,
            }));
        }

        if (analysis.zones && analysis.zones.length > 0) {
            const importedZones = analysis.zones.map((zone) => ({
                id: generateId(),
                zoneId: zone.zoneId || zone.name.toLowerCase().replace(/\s+/g, '_'),
                name: zone.name,
                x: zone.x,
                y: zone.y,
                w: zone.w,
                h: zone.h,
                color: undefined,
            }));

            setZones(importedZones);
        }

        setFurniture([]);
        setDiagramShapes([]);
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

    const rotateFurniture = useCallback((degrees: number) => {
        if (!selectedFurniture) return;
        setFurniture(prev =>
            prev.map(f =>
                f.id === selectedFurniture.id
                    ? { ...f, r: (f.r + degrees) % 360 }
                    : f
            )
        );
    }, [selectedFurniture]);

    const handleSave = () => {
        if (onSave) {
            const validationResult = saveProjectDataSchema.safeParse({
                zones,
                furniture,
                settings: {
                    apartmentWidth: settings.apartmentWidth,
                    apartmentHeight: settings.apartmentHeight,
                    scale: settings.scale,
                    snap: settings.snap,
                    showGrid: settings.showGrid,
                    showDimensions: settings.showDimensions,
                }
            });

            if (!validationResult.success) {
                console.error('Invalid project data:', validationResult.error);
                console.warn('Saving project with invalid data');
            }

            const validatedData = validationResult.success ? validationResult.data : { zones, furniture, settings };
            onSave({
                ...validatedData as { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings },
                diagrams: diagramShapes
            });
        }
    };

    // Update furniture helper
    const updateFurniture = useCallback((id: string, updates: Partial<FurnitureItemType>) => {
        setFurniture(prev => {
            const updatedFurniture = prev.map(f => f.id === id ? { ...f, ...updates } : f);

            const updatedItem = updatedFurniture.find(f => f.id === id);
            if (updatedItem) {
                const validationResult = furnitureItemSchema.safeParse(updatedItem);
                if (!validationResult.success) {
                    console.warn(`Invalid furniture data for item ${id}:`, validationResult.error);
                }
            }

            return updatedFurniture;
        });
    }, []);

    // Update zone helper
    const updateZone = (id: string, updates: Partial<FloorPlanZone>) => {
        setZones(prev => {
            const updatedZones = prev.map(z => z.id === id ? { ...z, ...updates } : z);

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

    // Diagram shape handlers
    const handleShapeAdd = (shape: DiagramShape) => {
        setDiagramShapes(prev => [...prev, shape]);
    };

    const handleShapeUpdate = (id: string, updates: Partial<DiagramShape>) => {
        setDiagramShapes(prev => prev.map(shape =>
            shape.id === id ? { ...shape, ...updates } : shape
        ));
    };

    const handleShapeDelete = (id: string) => {
        setDiagramShapes(prev => prev.filter(shape => shape.id !== id));
    };

    const handleDiagramExport = (dataUrl: string, format: 'png' | 'json') => {
        console.log(`Exported diagram as ${format}:`, dataUrl);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold">
                        <Link href="/">Enhanced Floor Plan Editor</Link>
                    </h1>

                    {/* Mode Selection */}
                    <div className="flex border rounded-lg overflow-hidden">
                        <Button
                            size="sm"
                            variant={editorMode === 'zones' ? 'default' : 'ghost'}
                            onClick={() => {
                                setEditorMode('zones');
                                setSelectedFurnitureId(null);
                            }}
                            className="rounded-none"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Zones
                        </Button>
                        <Button
                            size="sm"
                            variant={editorMode === 'furniture' ? 'default' : 'ghost'}
                            onClick={() => {
                                setEditorMode('furniture');
                                setSelectedZoneId(null);
                            }}
                            className="rounded-none"
                        >
                            <Sofa className="w-4 h-4 mr-2" />
                            Furniture
                        </Button>
                        <Button
                            size="sm"
                            variant={editorMode === 'diagrams' ? 'default' : 'ghost'}
                            onClick={() => {
                                setEditorMode('diagrams');
                                setSelectedZoneId(null);
                                setSelectedFurnitureId(null);
                            }}
                            className="rounded-none"
                        >
                            <Pencil className="w-4 h-4 mr-2" />
                            Diagrams
                        </Button>
                    </div>

                    <Button
                        variant={showAIImport ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setShowAIImport(!showAIImport);
                            setEditorMode('zones');
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
                    <UserButton />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar */}
                <div className="w-96 bg-white overflow-y-auto">
                    <div className="p-4">
                        {showAIImport ? (
                            <FloorPlanUploader onAnalysisComplete={handleAIAnalysis} />
                        ) : editorMode === 'diagrams' ? (
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm font-semibold flex items-center">
                                            <Layers className="w-4 h-4 mr-2" />
                                            Diagram Tools
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Use the drawing tools in the canvas to create diagrams, annotations, and custom shapes on your floor plan.
                                        </p>
                                        <div className="space-y-2 text-xs text-gray-500">
                                            <div>• Select tool to move and resize shapes</div>
                                            <div>• Rectangle and circle tools for basic shapes</div>
                                            <div>• Line tool for straight lines</div>
                                            <div>• Draw tool for freehand sketching</div>
                                            <div>• Text tool for labels and notes</div>
                                            <div>• Export your work as PNG or JSON</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : editorMode === 'zones' ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">Zone Editor</h3>
                                    <div className="text-xs text-gray-500">{zones.length} zones</div>
                                </div>

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
                            <div className="space-y-4">
                                {/* Furniture Catalog */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Sofa className="w-4 h-4 mr-2" />
                                                Furniture Catalog
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-gray-100 p-4 overflow-auto">
                    {editorMode === 'diagrams' ? (
                        <KonvaDiagramCanvas
                            width={toPx(Math.min(settings.apartmentWidth, settings.maxCanvasWidth || Infinity))}
                            height={toPx(Math.min(settings.apartmentHeight, settings.maxCanvasHeight || Infinity))}
                            scale={settings.scale}
                            showGrid={settings.showGrid}
                            zones={zones}
                            furniture={furniture}
                            onShapeAdd={handleShapeAdd}
                            onShapeUpdate={handleShapeUpdate}
                            onShapeDelete={handleShapeDelete}
                            onExport={handleDiagramExport}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div
                                className="relative border bg-white shadow-lg"
                                style={{
                                    width: toPx(Math.min(settings.apartmentWidth, settings.maxCanvasWidth || Infinity)),
                                    height: toPx(Math.min(settings.apartmentHeight, settings.maxCanvasHeight || Infinity)),
                                    position: 'relative'
                                }}
                            >
                                {/* Grid */}
                                {settings.showGrid && (
                                    <svg
                                        className="absolute inset-0 pointer-events-none"
                                        width={toPx(Math.min(settings.apartmentWidth, settings.maxCanvasWidth || Infinity))}
                                        height={toPx(Math.min(settings.apartmentHeight, settings.maxCanvasHeight || Infinity))}
                                    >
                                        <defs>
                                            <pattern
                                                id="grid"
                                                width={toPx(25)}
                                                height={toPx(25)}
                                                patternUnits="userSpaceOnUse"
                                            >
                                                <path
                                                    d={`M ${toPx(25)} 0 L 0 0 0 ${toPx(25)}`}
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
                                        onClick={() => editorMode === 'zones' && setSelectedZoneId(zone.id)}
                                        className={`absolute flex items-center justify-center cursor-pointer select-none rounded border-2 ${editorMode === 'zones'
                                            ? selectedZoneId === zone.id
                                                ? 'border-blue-500 bg-blue-100/50'
                                                : 'border-amber-400 bg-amber-100/30 hover:bg-amber-100/50'
                                            : 'border-gray-300 bg-gray-100/30'
                                            }`}
                                        style={{
                                            left: toPx(zone.x),
                                            top: toPx(zone.y),
                                            width: toPx(zone.w),
                                            height: toPx(zone.h),
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

                                {/* Furniture Items */}
                                {editorMode === 'furniture' && furniture.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedFurnitureId(item.id)}
                                        className={`absolute flex items-center justify-center cursor-move select-none rounded border-2 text-white text-xs font-medium ${selectedFurnitureId === item.id
                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                            : 'border-gray-800'
                                            }`}
                                        style={{
                                            left: toPx(item.x),
                                            top: toPx(item.y),
                                            width: toPx(item.w),
                                            height: toPx(item.h),
                                            backgroundColor: item.color,
                                            transform: `rotate(${item.r}deg)`,
                                            transformOrigin: 'center'
                                        }}
                                    >
                                        <div className="text-center px-1">
                                            <div>{item.name}</div>
                                            {settings.showDimensions && (
                                                <div className="text-xs opacity-80">{item.w}×{item.h} cm</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Settings Panel */}
            <FloatingSettingsPanel
                settings={settings}
                onSettingsChange={(updates) => setSettings(prev => ({ ...prev, ...updates }))}
            />
        </div>
    );
}

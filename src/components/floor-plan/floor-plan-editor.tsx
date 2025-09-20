"use client";

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserButton } from "@stackframe/stack";
import {
    Settings,
    Save,
    Layers,
    Package
} from "lucide-react";

// Types
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { DiagramShape } from '../../features/floor_plan/editor/schemas';

// Advanced UX Components
import { EditorToolbar } from '../../features/floor_plan/editor/header/editor_toolbar';
import { LibraryTab } from '../../features/floor_plan/editor/sidebar/library_tab';
import { SelectionOverlay } from '../../features/floor_plan/canvas/layers/selection_overlay';
import { BackgroundLayer } from '../../features/floor_plan/canvas/layers/background_layer';
import { DragFeedback } from '../../features/floor_plan/canvas/layers/drag_feedback';
import { ExportModal } from '../../features/floor_plan/editor/overlays/export_modal';
import { CalibrationModal } from '../../features/floor_plan/editor/overlays/calibration_modal';
import { BackgroundImportModal } from '../../features/floor_plan/editor/overlays/background_import_modal';

// State Management
import { CommandManager } from '../../features/floor_plan/state/command_manager';

// Utilities
import { cm2px } from '../../features/floor_plan/utils/units';
import { detectFurnitureZone, autoAssignFurnitureToZones } from '../../features/floor_plan/utils/zone_logic';
import { DEFAULT_APARTMENT_ZONES, DEFAULT_FURNITURE_LAYOUT } from '../../features/floor_plan/data/seeds';
import { DEFAULT_LEGACY_SETTINGS } from '../../features/floor_plan/editor/schemas';

// Existing Components
import { FloorPlanUploader } from "./floor-plan-uploader";
import { KonvaDiagramCanvas } from "./konva-diagram-canvas";

// Generate ID utility
function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

interface FloorPlanEditorProps {
    initialZones?: FloorPlanZone[];
    initialFurniture?: FurnitureItemType[];
    initialSettings?: FloorPlanSettings;
    onSave?: (data: {
        zones: FloorPlanZone[];
        furniture: FurnitureItemType[];
        settings: FloorPlanSettings;
        diagramShapes: DiagramShape[];
    }) => void;
}

function FloorPlanEditorInner({
    initialZones = [],
    initialFurniture = [],
    initialSettings = DEFAULT_LEGACY_SETTINGS,
    onSave
}: FloorPlanEditorProps) {

    // Core State - Initialize with default layout if no initial data provided
    const [zones, setZones] = useState<FloorPlanZone[]>(
        initialZones.length > 0 ? initialZones : DEFAULT_APARTMENT_ZONES.map(z => ({
            ...z,
            id: generateId(),
        }))
    );
    const [furniture, setFurniture] = useState<FurnitureItemType[]>(
        initialFurniture.length > 0 ? initialFurniture : DEFAULT_FURNITURE_LAYOUT.map(f => ({
            ...f,
            id: generateId(),
            w: 100, // Default width
            h: 60,  // Default height
            color: "#8B5CF6", // Default color
        }))
    );
    const [settings, setSettings] = useState<FloorPlanSettings>(initialSettings);
    const [diagramShapes, setDiagramShapes] = useState<DiagramShape[]>([]);

    // UI State
    const [editorMode, setEditorMode] = useState<'zones' | 'furniture' | 'diagrams'>('furniture');
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'library' | 'inspector' | 'layers'>('library');

    // Modal State
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

    // Background Image State
    const [backgroundImage, setBackgroundImage] = useState<{
        url: string;
        opacity: number;
        scale: number;
        offsetX: number;
        offsetY: number;
        locked: boolean;
    } | null>(null);

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<FurnitureItemType | null>(null);
    const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

    // Command Manager for Undo/Redo
    const commandManagerRef = useRef(new CommandManager());

    // Canvas dimensions
    const canvasWidth = cm2px(settings.apartmentWidth, settings.scale);
    const canvasHeight = cm2px(settings.apartmentHeight, settings.scale);

    // Computed values
    const selectedFurniture = useMemo(() =>
        furniture.find(f => f.id === selectedFurnitureId) || null,
        [furniture, selectedFurnitureId]
    );

    const selectedZone = useMemo(() =>
        zones.find(z => z.id === selectedZoneId) || null,
        [zones, selectedZoneId]
    );

    // Utility functions
    const toPx = (cm: number) => cm2px(cm, settings.scale);

    // Load default layout
    const resetLayout = () => {
        setZones(DEFAULT_APARTMENT_ZONES.map(z => ({
            ...z,
            id: generateId(),
        })));
        setFurniture(DEFAULT_FURNITURE_LAYOUT.map(f => ({
            ...f,
            id: generateId(),
            w: 100,
            h: 60,
            color: "#8B5CF6",
        })));
        commandManagerRef.current.clear();
    };

    // Furniture operations
    const addFurniture = useCallback((catalogName: string) => {
        // This would look up furniture from catalog
        const newFurniture: FurnitureItemType = {
            id: generateId(),
            name: catalogName,
            x: 50,
            y: 50,
            w: 80,
            h: 60,
            r: 0,
            color: "#8B5CF6",
            zoneId: undefined
        };

        setFurniture(prev => [...prev, newFurniture]);
        setSelectedFurnitureId(newFurniture.id);
    }, []);

    const updateFurniture = useCallback((id: string, updates: Partial<FurnitureItemType>) => {
        setFurniture(prev => prev.map(f =>
            f.id === id ? { ...f, ...updates } : f
        ));

        // Auto-assign to zone if position changed
        if (updates.x !== undefined || updates.y !== undefined) {
            const updatedFurniture = furniture.find(f => f.id === id);
            if (updatedFurniture) {
                const finalFurniture = { ...updatedFurniture, ...updates };
                const zoneAssignment = detectFurnitureZone(finalFurniture, zones);
                if (zoneAssignment.zoneId !== updatedFurniture.zoneId) {
                    setFurniture(prev => prev.map(f =>
                        f.id === id ? { ...f, zoneId: zoneAssignment.zoneId || undefined } : f
                    ));
                }
            }
        }
    }, [furniture, zones]);

    const deleteFurniture = useCallback((id: string) => {
        setFurniture(prev => prev.filter(f => f.id !== id));
        if (selectedFurnitureId === id) {
            setSelectedFurnitureId(null);
        }
    }, [selectedFurnitureId]);

    // Zone operations

    const updateZone = useCallback((id: string, updates: Partial<FloorPlanZone>) => {
        setZones(prev => prev.map(z =>
            z.id === id ? { ...z, ...updates } : z
        ));
    }, []);

    const deleteZone = useCallback((id: string) => {
        setZones(prev => prev.filter(z => z.id !== id));
        if (selectedZoneId === id) {
            setSelectedZoneId(null);
        }
        // Remove zone assignments from furniture
        setFurniture(prev => prev.map(f =>
            f.zoneId === id ? { ...f, zoneId: undefined } : f
        ));
    }, [selectedZoneId]);

    // Diagram operations
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

    // Handle AI Analysis from uploader
    const handleAIAnalysis = (analysis: {
        dimensions?: { width: number; height: number };
        zones?: Array<{
            zoneId?: string;
            name: string;
            x: number;
            y: number;
            w: number;
            h: number
        }>
    }) => {
        if (analysis.dimensions) {
            setSettings(prev => ({
                ...prev,
                apartmentWidth: analysis.dimensions!.width,
                apartmentHeight: analysis.dimensions!.height
            }));
        }

        if (analysis.zones && analysis.zones.length > 0) {
            const newZones = analysis.zones.map(z => ({
                id: generateId(),
                name: z.name,
                x: z.x,
                y: z.y,
                w: z.w,
                h: z.h,
                color: "#e3f2fd"
            }));
            setZones(newZones);
        }
    };

    // Export functionality
    const handleExport = (options: {
        format: string;
        quality?: number;
        scale?: number;
        [key: string]: unknown;
    }) => {
        console.log('Exporting with options:', options);
        // Implementation would go here
    };

    // Auto-assign all furniture to zones
    const autoAssignAllFurniture = () => {
        const updatedFurniture = autoAssignFurnitureToZones(furniture, zones);
        setFurniture(updatedFurniture);
    };

    // Zoom functions (placeholder implementations)
    const handleZoomIn = () => {
        console.log('Zoom in');
        // TODO: Implement zoom functionality
    };

    const handleZoomOut = () => {
        console.log('Zoom out');
        // TODO: Implement zoom functionality
    };

    const handleZoomFit = () => {
        console.log('Zoom fit');
        // TODO: Implement zoom fit functionality
    };

    // Drag handlers for furniture library
    const handleDragStart = useCallback((furnitureName: string, event: React.DragEvent) => {
        const newFurniture: FurnitureItemType = {
            id: generateId(),
            name: furnitureName,
            x: 50,
            y: 50,
            w: 80,
            h: 60,
            r: 0,
            color: "#8B5CF6",
            zoneId: undefined
        };

        setDraggedItem(newFurniture);
        setIsDragging(true);

        // Store data for drop
        event.dataTransfer.setData('application/json', JSON.stringify(newFurniture));
    }, []);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        // Update drag position for visual feedback
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setDragPosition({
            x: event.clientX - rect.left - 40, // Center the preview
            y: event.clientY - rect.top - 30
        });
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        setDraggedItem(null);
        setDragPosition(null);

        try {
            const furnitureData = JSON.parse(event.dataTransfer.getData('application/json'));
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

            // Convert pixel position to cm
            const x = (event.clientX - rect.left - 20) / settings.scale; // Offset for margin
            const y = (event.clientY - rect.top - 20) / settings.scale;

            const newFurniture: FurnitureItemType = {
                ...furnitureData,
                x: Math.max(0, x),
                y: Math.max(0, y)
            };

            // Auto-assign to zone
            const zoneAssignment = detectFurnitureZone(newFurniture, zones);
            if (zoneAssignment.zoneId) {
                newFurniture.zoneId = zoneAssignment.zoneId;
            }

            setFurniture(prev => [...prev, newFurniture]);
            setSelectedFurnitureId(newFurniture.id);
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    }, [settings.scale, zones]);

    // Save function
    const handleSave = useCallback(() => {
        if (onSave) {
            onSave({
                zones,
                furniture,
                settings,
                diagramShapes
            });
        }
    }, [onSave, zones, furniture, settings, diagramShapes]);

    // Register keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't handle shortcuts when typing in inputs
            if (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement) {
                return;
            }

            const { key, ctrlKey, metaKey } = event;
            const isModifier = ctrlKey || metaKey;

            switch (key) {
                case 's':
                    if (isModifier) {
                        event.preventDefault();
                        handleSave();
                    }
                    break;
                case 'z':
                    if (isModifier && !event.shiftKey) {
                        event.preventDefault();
                        commandManagerRef.current.undo();
                    }
                    break;
                case 'y':
                    if (isModifier) {
                        event.preventDefault();
                        commandManagerRef.current.redo();
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    if (selectedFurnitureId) {
                        event.preventDefault();
                        deleteFurniture(selectedFurnitureId);
                    } else if (selectedZoneId) {
                        event.preventDefault();
                        deleteZone(selectedZoneId);
                    }
                    break;
                case 'Escape':
                    setSelectedFurnitureId(null);
                    setSelectedZoneId(null);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, selectedFurnitureId, selectedZoneId, deleteFurniture, deleteZone]);

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Floor Plan Editor</h1>
                <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <UserButton />
                </div>
            </div>

            {/* Top Toolbar */}
            <EditorToolbar
                editorMode={editorMode}
                onModeChange={setEditorMode}
                selectedFurniture={selectedFurniture}
                selectedZone={selectedZone}
                canUndo={commandManagerRef.current.canUndo()}
                canRedo={commandManagerRef.current.canRedo()}
                onUndo={() => commandManagerRef.current.undo()}
                onRedo={() => commandManagerRef.current.redo()}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomFit={handleZoomFit}
                onExport={() => setIsExportModalOpen(true)}
                onCalibrate={() => setIsCalibrationModalOpen(true)}
                onBackgroundImage={() => setIsBackgroundModalOpen(true)}
                onAutoAssign={autoAssignAllFurniture}
                onSave={handleSave}
                onResetLayout={resetLayout}
                onFurnitureUpdate={updateFurniture}
                onFurnitureDelete={deleteFurniture}
                onZoneUpdate={updateZone}
                onZoneDelete={deleteZone}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white border-r flex flex-col">
                    {/* Tab Header */}
                    <div className="border-b p-4">
                        <div className="flex space-x-2">
                            <Button
                                variant={activeTab === 'library' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('library')}
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Library
                            </Button>
                            <Button
                                variant={activeTab === 'inspector' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('inspector')}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Inspector
                            </Button>
                            <Button
                                variant={activeTab === 'layers' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTab('layers')}
                            >
                                <Layers className="w-4 h-4 mr-2" />
                                Layers
                            </Button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'library' && (
                            <LibraryTab
                                onAddFurniture={addFurniture}
                                furnitureCount={furniture.length}
                                onDragStart={handleDragStart}
                            />
                        )}
                        {activeTab === 'inspector' && (
                            <div className="p-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Inspector</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">
                                            Inspector panel for selected items
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {activeTab === 'layers' && (
                            <div className="p-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Layers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">
                                            Layer management panel
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Upload Section */}
                    <div className="border-t p-4">
                        <FloorPlanUploader onAnalysisComplete={handleAIAnalysis} />
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 relative bg-gray-100">
                    {/* Canvas Container */}
                    <div
                        className="absolute inset-0 overflow-auto p-8"
                        style={{
                            backgroundColor: '#f8fafc',
                            backgroundImage: settings.showGrid ?
                                `radial-gradient(circle, #e2e8f0 1px, transparent 1px)` : undefined,
                            backgroundSize: settings.showGrid ?
                                `${toPx(settings.snap)}px ${toPx(settings.snap)}px` : undefined
                        }}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Centered Canvas Wrapper */}
                        <div className="flex items-center justify-center min-h-full">
                            <div className="relative shadow-lg border border-gray-200"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px'
                                }}
                            >
                                {/* Background Image Layer */}
                                {backgroundImage && (
                                    <BackgroundLayer
                                        url={backgroundImage.url}
                                        opacity={backgroundImage.opacity}
                                        scale={backgroundImage.scale}
                                        offsetX={backgroundImage.offsetX}
                                        offsetY={backgroundImage.offsetY}
                                        locked={backgroundImage.locked}
                                        canvasWidth={canvasWidth}
                                        canvasHeight={canvasHeight}
                                        editorScale={settings.scale}
                                        onImageUpdate={(updates) =>
                                            setBackgroundImage(prev => prev ? { ...prev, ...updates } : null)
                                        }
                                    />
                                )}

                                {/* Main Canvas */}
                                <div
                                    className="relative bg-white border-2 border-gray-300"
                                    style={{
                                        width: canvasWidth,
                                        height: canvasHeight,
                                        margin: '20px',
                                    }}
                                >
                                    {/* Zones Layer */}
                                    {zones.map(zone => (
                                        <div
                                            key={zone.id}
                                            className={`absolute border-2 border-dashed cursor-pointer transition-all ${selectedZoneId === zone.id
                                                    ? 'border-blue-500 bg-blue-100 bg-opacity-30'
                                                    : 'border-gray-400 hover:border-gray-600'
                                                }`}
                                            style={{
                                                left: toPx(zone.x),
                                                top: toPx(zone.y),
                                                width: toPx(zone.w),
                                                height: toPx(zone.h),
                                                backgroundColor: zone.color ? zone.color + '20' : undefined,
                                            }}
                                            onClick={() => {
                                                setEditorMode('zones');
                                                setSelectedZoneId(zone.id);
                                                setSelectedFurnitureId(null);
                                            }}
                                        >
                                            <div className="absolute top-2 left-2 text-xs font-medium text-gray-700 bg-white bg-opacity-80 px-1 rounded">
                                                {zone.name}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Furniture Layer */}
                                    {furniture.map(item => (
                                        <div
                                            key={item.id}
                                            className={`absolute border cursor-pointer transition-all ${selectedFurnitureId === item.id
                                                    ? 'border-blue-500 shadow-lg z-20'
                                                    : 'border-gray-300 hover:border-gray-500 z-10'
                                                }`}
                                            style={{
                                                left: toPx(item.x),
                                                top: toPx(item.y),
                                                width: toPx(item.w),
                                                height: toPx(item.h),
                                                backgroundColor: item.color,
                                                transform: `rotate(${item.r}deg)`,
                                                transformOrigin: 'center',
                                            }}
                                            onClick={() => {
                                                setEditorMode('furniture');
                                                setSelectedFurnitureId(item.id);
                                                setSelectedZoneId(null);
                                            }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-medium text-white text-center px-1">
                                                    {item.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Diagram Layer */}
                                    {editorMode === 'diagrams' && (
                                        <div className="absolute inset-0">
                                            <KonvaDiagramCanvas
                                                width={canvasWidth}
                                                height={canvasHeight}
                                                shapes={diagramShapes}
                                                onShapeAdd={handleShapeAdd}
                                                onShapeUpdate={handleShapeUpdate}
                                                onShapeDelete={handleShapeDelete}
                                                onExport={(dataUrl, format) => console.log('Diagram export:', format)}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Selection Overlay */}
                                <SelectionOverlay
                                    width={canvasWidth}
                                    height={canvasHeight}
                                    scale={settings.scale}
                                    selectedFurniture={selectedFurniture}
                                    selectedZone={selectedZone}
                                    editorMode={editorMode}
                                    onFurnitureUpdate={updateFurniture}
                                    onZoneUpdate={updateZone}
                                    onRotationChange={(rotation) => {
                                        if (selectedFurniture) {
                                            updateFurniture(selectedFurniture.id, { r: rotation });
                                        }
                                    }}
                                    snapEnabled={true}
                                    snapGrid={settings.snap}
                                />

                                {/* Drag Feedback */}
                                <DragFeedback
                                    isDragging={isDragging}
                                    draggedItem={draggedItem}
                                    dragPosition={dragPosition}
                                    canvasWidth={canvasWidth}
                                    canvasHeight={canvasHeight}
                                    scale={settings.scale}
                                    zones={zones}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={handleExport}
                zones={zones}
                furniture={furniture}
                settings={settings}
                diagramShapes={diagramShapes}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
            />

            <CalibrationModal
                isOpen={isCalibrationModalOpen}
                onClose={() => setIsCalibrationModalOpen(false)}
                settings={settings}
                onSettingsUpdate={setSettings}
            />

            <BackgroundImportModal
                isOpen={isBackgroundModalOpen}
                onClose={() => setIsBackgroundModalOpen(false)}
                onImageImport={(imageData) => {
                    setBackgroundImage({
                        url: imageData.url,
                        opacity: 0.6,
                        scale: 1.0,
                        offsetX: 0,
                        offsetY: 0,
                        locked: false
                    });
                }}
            />
        </div>
    );
}

// Main component
export default function FloorPlanEditor(props: FloorPlanEditorProps) {
    return <FloorPlanEditorInner {...props} />;
}
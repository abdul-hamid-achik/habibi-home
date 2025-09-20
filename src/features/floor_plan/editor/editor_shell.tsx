"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from "@/types";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { FloatingSettingsPanel } from "./settings/floating_settings_panel";
import { DiagramShape } from "../canvas/tools/diagram_schemas";
import { ModeToggle } from "./header/mode_toggle";
import { ActionsBar } from "./header/actions_bar";
import { AIImportToggle } from "./header/ai_import_toggle";
import { ZoneList } from "./sidebar/zone_list";
import { FurnitureCatalog } from "./sidebar/furniture_catalog";
import { SelectedFurniturePanel } from "./sidebar/selected_furniture_panel";
import { KonvaStage } from "../canvas/konva_stage";
import { useEditorStore, EditorMode } from "../state/editor_store";
import { cm2px, px2cm, snapToGrid } from "../utils/units";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { analyzeFloorPlan } from "../services/analysis";

interface EditorShellProps {
    projectId?: string;
    initialZones?: FloorPlanZone[];
    initialFurniture?: FurnitureItemType[];
    initialSettings?: Partial<FloorPlanSettings>;
    onSave?: (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings; diagrams?: DiagramShape[] }) => void;
}


function EditorShell({
    initialZones,
    initialFurniture,
    initialSettings,
    onSave
}: EditorShellProps) {
    // Get state and actions from store
    const {
        zones,
        furniture,
        settings,
        editorMode,
        selectedZoneId,
        selectedFurnitureId,
        showAIImport,
        showKeyboardShortcuts,
        setEditorMode,
        setSelectedZoneId,
        setSelectedFurnitureId,
        setShowAIImport,
        setShowKeyboardShortcuts,
        updateFurniture,
        deleteFurniture,
        addFurniture,
        updateZone,
        deleteZone,
        addZone,
        updateSettings,
        resetToDefaults,
        loadData,
        validateAndSaveData,
    } = useEditorStore();

    // Ref for canvas container to calculate viewport size
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Initialize store with initial data on mount
    useEffect(() => {
        if (initialZones || initialFurniture || initialSettings) {
            loadData({
                zones: initialZones,
                furniture: initialFurniture,
                settings: initialSettings,
            });
        } else {
            // Load defaults if no initial data
            resetToDefaults();
        }
    }, []); // Only run on mount

    // Helper function for generating IDs
    const generateId = () => Math.random().toString(36).slice(2, 9);

    // Computed values
    const selectedFurniture = furniture.find(f => f.id === selectedFurnitureId) || null;


    // Utility functions (using shared utils)
    const toPx = (cm: number) => cm2px(cm, settings.scale);
    const toCm = (px: number) => px2cm(px, settings.scale);
    const snapCm = (value: number) => snapToGrid(value, settings.snap);

    // Header handlers
    const handleModeChange = (mode: EditorMode) => {
        setEditorMode(mode);
        // Clear selections when switching modes
        switch (mode) {
            case 'zones':
                setSelectedFurnitureId(null);
                break;
            case 'furniture':
                setSelectedZoneId(null);
                break;
            case 'diagrams':
                setSelectedZoneId(null);
                setSelectedFurnitureId(null);
                break;
        }
    };

    const handleAIImportToggle = () => {
        setShowAIImport(!showAIImport);
        setEditorMode('zones');
        setSelectedFurnitureId(null);
        setSelectedZoneId(null);
    };

    // Actions
    const resetLayout = () => {
        resetToDefaults();
    };

    const handleAIAnalysis = (analysis: { dimensions?: { width: number; height: number }; zones?: Array<{ zoneId?: string; name: string; x: number; y: number; w: number; h: number }> }) => {
        const dimensions = analysis.dimensions;
        if (dimensions && dimensions.width && dimensions.height) {
            updateSettings({
                apartmentWidth: Math.round(dimensions.width * 100),
                apartmentHeight: Math.round(dimensions.height * 100),
                canvasMode: 'fit-to-screen',
                scale: 0.8,
            });
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

            loadData({ zones: importedZones, furniture: [] });
        }

        setSelectedZoneId(null);
        setSelectedFurnitureId(null);
        setShowAIImport(false);
    };

    const addFurnitureFromCatalog = (catalogName: string) => {
        const catalogItem = DEFAULT_FURNITURE_CATALOG.find(cat => cat.name === catalogName);
        if (!catalogItem) return;

        const newItem = {
            name: catalogItem.name,
            x: 50,
            y: 50,
            w: catalogItem.width,
            h: catalogItem.height,
            r: 0,
            color: catalogItem.color,
        };

        addFurniture(newItem);
    };

    const duplicateFurniture = () => {
        if (!selectedFurniture) return;

        const newItem = {
            ...selectedFurniture,
            x: selectedFurniture.x + 20,
            y: selectedFurniture.y + 20,
        };

        addFurniture(newItem);
        // Note: addFurniture will generate a new ID and we can't easily get it back
        // For now, we'll leave the selection as is
    };

    const deleteFurnitureItem = () => {
        if (!selectedFurnitureId) return;
        deleteFurniture(selectedFurnitureId);
    };

    // Zone handlers
    const handleZoneDelete = (zoneId: string) => {
        deleteZone(zoneId);
    };

    const handleZoneAdd = () => {
        const newZone = {
            zoneId: `zone_${zones.length + 1}`,
            name: `Zone ${zones.length + 1}`,
            x: 100,
            y: 100,
            w: 200,
            h: 150,
        };
        addZone(newZone);
    };

    const rotateFurniture = (degrees: number) => {
        if (!selectedFurniture || !selectedFurnitureId) return;

        updateFurniture(selectedFurnitureId, {
            r: (selectedFurniture.r + degrees) % 360
        });
    };

    const handleSave = () => {
        if (onSave) {
            const validatedData = validateAndSaveData();
            if (validatedData) {
                onSave(validatedData);
            } else {
                console.error('Failed to validate data for save');
            }
        }
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

                    <ModeToggle
                        currentMode={editorMode}
                        onModeChange={handleModeChange}
                    />

                    <AIImportToggle
                        isActive={showAIImport}
                        onToggle={handleAIImportToggle}
                    />
                </div>

                <ActionsBar
                    showKeyboardShortcuts={showKeyboardShortcuts}
                    onToggleKeyboardShortcuts={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                    onReset={resetLayout}
                    onSave={handleSave}
                />
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar */}
                <div className="w-96 bg-white overflow-y-auto">
                    <div className="p-4">
                        {showAIImport ? (
                            <AIImportPanel onAnalysisComplete={handleAIAnalysis} />
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
                            <ZoneList
                                zones={zones}
                                selectedZoneId={selectedZoneId}
                                onZoneSelect={setSelectedZoneId}
                                onZoneUpdate={updateZone}
                                onZoneDelete={handleZoneDelete}
                                onZoneAdd={handleZoneAdd}
                            />
                        ) : (
                            <div className="space-y-4">
                                <FurnitureCatalog
                                    furnitureCount={furniture.length}
                                    onAddFurniture={addFurnitureFromCatalog}
                                />

                                {selectedFurniture && (
                                    <SelectedFurniturePanel
                                        selectedFurniture={selectedFurniture}
                                        onUpdateFurniture={updateFurniture}
                                        onDuplicateFurniture={duplicateFurniture}
                                        onDeleteFurniture={deleteFurnitureItem}
                                        onRotateFurniture={rotateFurniture}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div ref={canvasContainerRef} className="flex-1 bg-gray-100 p-4 overflow-auto">
                    <KonvaStage
                        zones={zones}
                        furniture={furniture}
                        settings={settings}
                        editorMode={editorMode}
                        selectedZoneId={selectedZoneId}
                        selectedFurnitureId={selectedFurnitureId}
                        onZoneSelect={setSelectedZoneId}
                        onFurnitureSelect={setSelectedFurnitureId}
                        onFurnitureUpdate={updateFurniture}
                        onDiagramExport={handleDiagramExport}
                        containerRef={canvasContainerRef as React.RefObject<HTMLDivElement>}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* Floating Settings Panel */}
            <FloatingSettingsPanel
                settings={settings}
                onSettingsChange={(updates) => updateSettings(updates)}
            />
        </div>
    );
}

// Main export - EditorShell component as default
export default EditorShell;
export type { EditorShellProps };

// Named export for consistency
export { EditorShell };

// Temporary compatibility export - will be removed in future tasks
export { EditorShell as FloorPlanEditor };
export type { EditorShellProps as FloorPlanEditorProps };

// Sidebar inline panel to replace legacy FloorPlanUploader
function AIImportPanel({ onAnalysisComplete }: { onAnalysisComplete: (analysis: { dimensions?: { width: number; height: number }; zones?: Array<{ zoneId?: string; name: string; x: number; y: number; w: number; h: number }> }) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeFloorPlan({ file });
            onAnalysisComplete(result);
        } catch (e) {
            console.error('AI analysis failed:', e);
            setError('Analysis failed. Please try another image.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">AI Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-xs text-gray-600">Upload a floor plan image. We will detect dimensions and zones.</p>
                    <div className="space-y-2">
                        <Label className="text-xs">Image</Label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="block w-full text-xs"
                        />
                    </div>
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleAnalyze} disabled={!file || isAnalyzing}>
                            {isAnalyzing ? 'Analyzing…' : 'Analyze'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
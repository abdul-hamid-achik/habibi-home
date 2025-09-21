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
import { EditorToolbar } from "./header/editor_toolbar";
import { InspectorTab } from "./sidebar/inspector_tab";
import { LibraryTab } from "./sidebar/library_tab";
import { LayersTab } from "./sidebar/layers_tab";
import { KonvaStage } from "../canvas/konva_stage";
import { useEditorStore, EditorMode } from "../state/editor_store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { analyzeFloorPlan } from "../services/analysis";
import { exportFloorPlan } from "../utils/export_utils";
import { CommandManager, UpdateZoneCommand, UpdateFurnitureCommand, AddZoneCommand } from "../state/command_manager";
import { BackgroundImportModal } from "./overlays/background_import_modal";
import { CalibrationModal } from "./overlays/calibration_modal";
import { ExportModal } from "./overlays/export_modal";

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
        diagrams,
        editorMode,
        selectedZoneId,
        selectedFurnitureId,
        selectedDiagramId,
        showAIImport,
        showKeyboardShortcuts,
        currentDiagramTool,
        setEditorMode,
        setSelectedZoneId,
        setSelectedFurnitureId,
        setSelectedDiagramId,
        setShowAIImport,
        setShowKeyboardShortcuts,
        setCurrentDiagramTool,
        setDiagramStrokeColor,
        setDiagramFillColor,
        setDiagramStrokeWidth,
        setZones,
        setFurniture,
        updateFurniture,
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

    // Command manager
    const commandManagerRef = useRef(new CommandManager());

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
    }, [initialZones, initialFurniture, initialSettings, loadData, resetToDefaults]); // Include dependencies for proper linting

    // Helper function for generating IDs
    const generateId = () => Math.random().toString(36).slice(2, 9);

    // Computed values
    const selectedFurniture = furniture.find(f => f.id === selectedFurnitureId) || null;


    // Utility functions (using shared utils)

    // Overlays state
    const [isBgModalOpen, setBgModalOpen] = useState(false);
    const [isCalibrateOpen, setCalibrateOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);

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
        commandManagerRef.current.clear();
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

        setFurniture((prev: FurnitureItemType[]) => [...prev, newItem]);
    };

    const duplicateFurniture = () => {
        if (!selectedFurniture) return;

        const newItem: FurnitureItemType = {
            ...selectedFurniture,
            id: generateId(),
            x: selectedFurniture.x + 20,
            y: selectedFurniture.y + 20,
        };

        setFurniture((prev: FurnitureItemType[]) => [...prev, newItem]);
    };

    const deleteFurnitureItem = () => {
        if (!selectedFurnitureId) return;
        setFurniture((prev: FurnitureItemType[]) => prev.filter((f: FurnitureItemType) => f.id !== selectedFurnitureId));
    };

    // Zone handlers

    const handleZoneAdd = () => {
        const newZone: FloorPlanZone = {
            id: generateId(),
            zoneId: `zone_${zones.length + 1}`,
            name: `Zone ${zones.length + 1}`,
            x: 100,
            y: 100,
            w: 200,
            h: 150,
        };
        commandManagerRef.current.executeCommand(
            new AddZoneCommand(
                newZone,
                setZones as unknown as React.Dispatch<React.SetStateAction<FloorPlanZone[]>>
            )
        );
        setZones((prev: FloorPlanZone[]) => [...prev, newZone]);
    };

    const rotateFurniture = (degrees: number) => {
        if (!selectedFurniture || !selectedFurnitureId) return;
        const newR = (selectedFurniture.r + degrees) % 360;
        const oldVals = { r: selectedFurniture.r };
        const newVals = { r: newR };
        commandManagerRef.current.executeCommand(
            new UpdateFurnitureCommand(
                selectedFurnitureId,
                oldVals,
                newVals,
                setFurniture as unknown as React.Dispatch<React.SetStateAction<FurnitureItemType[]>>
            )
        );
        setFurniture((prev: FurnitureItemType[]) => prev.map((f: FurnitureItemType) => f.id === selectedFurnitureId ? { ...f, r: newR } : f));
    };

    // Commandized wrappers for inspector edits
    const updateFurnitureCmd = (id: string, updates: Partial<FurnitureItemType>) => {
        const existing = furniture.find(f => f.id === id);
        if (!existing) return updateFurniture(id, updates);
        const oldVals: Partial<FurnitureItemType> = {};
        Object.keys(updates).forEach(k => {
            const key = k as keyof FurnitureItemType;
            if (existing[key] !== undefined) {
                (oldVals as Record<string, unknown>)[key] = existing[key];
            }
        });
        commandManagerRef.current.executeCommand(
            new UpdateFurnitureCommand(
                id,
                oldVals,
                updates,
                setFurniture
            )
        );
        setFurniture((prev: FurnitureItemType[]) => prev.map((f: FurnitureItemType) => f.id === id ? { ...f, ...updates } : f));
    };

    const updateZoneCmd = (id: string, updates: Partial<FloorPlanZone>) => {
        const existing = zones.find(z => z.id === id);
        if (!existing) return updateZone(id, updates);
        const oldVals: Partial<FloorPlanZone> = {};
        Object.keys(updates).forEach(k => {
            const key = k as keyof FloorPlanZone;
            if (existing[key] !== undefined) {
                (oldVals as Record<string, unknown>)[key] = existing[key];
            }
        });
        commandManagerRef.current.executeCommand(
            new UpdateZoneCommand(
                id,
                oldVals,
                updates,
                setZones
            )
        );
        setZones((prev: FloorPlanZone[]) => prev.map((z: FloorPlanZone) => z.id === id ? { ...z, ...updates } : z));
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

    // Toolbar undo/redo
    const handleUndo = () => {
        if (commandManagerRef.current.undo()) {
            // store already updated in commands
        }
    };
    const handleRedo = () => {
        if (commandManagerRef.current.redo()) {
            // store updated
        }
    };

    // Export specific formats
    const handleExportSpecific = (format: 'png' | 'svg' | 'pdf' | 'json' | 'csv') => {
        const exportOptions = {
            format,
            quality: 1,
            scale: 1,
            includeGrid: settings.showGrid,
            includeDimensions: settings.showDimensions,
            includeLabels: true,
            includeBackground: !!settings.background,
            includeFurniture: true,
            includeZones: true,
            includeDiagrams: false,
            title: 'Floor Plan Export'
        };

        exportFloorPlan(
            { zones, furniture, settings, diagramShapes: [] },
            exportOptions
        );
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
                        <Link href="/">Floor Plan Editor</Link>
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
            <EditorToolbar
                editorMode={editorMode}
                canvasMode={settings.canvasMode}
                scale={settings.scale}
                showGrid={settings.showGrid}
                snapEnabled={settings.snap > 0}
                selectedZone={zones.find(z => z.id === selectedZoneId) || null}
                selectedFurniture={selectedFurniture}
                selectedDiagramShapes={[]}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onZoomIn={() => updateSettings({ scale: Math.min(1.4, settings.scale + 0.05) })}
                onZoomOut={() => updateSettings({ scale: Math.max(0.4, settings.scale - 0.05) })}
                onZoomFit={() => updateSettings({ canvasMode: 'fit-to-screen' })}
                onToggleGrid={() => updateSettings({ showGrid: !settings.showGrid })}
                onToggleSnap={() => updateSettings({ snap: settings.snap > 0 ? 0 : 5 })}
                onCanvasModeChange={(mode) => updateSettings({ canvasMode: mode })}
                onCalibrateScale={() => setCalibrateOpen(true)}
                onImportBackground={() => setBgModalOpen(true)}
                onExportPNG={() => handleExportSpecific('png')}
                onExportSVG={() => handleExportSpecific('svg')}
                onExportPDF={() => handleExportSpecific('pdf')}
                onExportJSON={() => handleExportSpecific('json')}
                onExportCSV={() => handleExportSpecific('csv')}
                onAddZone={handleZoneAdd}
                onDeleteZone={() => selectedZoneId && deleteZone(selectedZoneId)}
                onBringZoneForward={() => { }}
                onSendZoneBack={() => { }}
                onAddFromLibrary={() => { }}
                onDuplicateFurniture={duplicateFurniture}
                onDeleteFurniture={deleteFurnitureItem}
                onRotateFurniture={rotateFurniture}
                onFurnitureRotationChange={(r) => selectedFurnitureId && updateFurnitureCmd(selectedFurnitureId, { r })}
                onAssignToZone={(zoneId) => selectedFurnitureId && updateFurnitureCmd(selectedFurnitureId, { zoneId: zoneId || undefined })}
                onSelectDiagramTool={setCurrentDiagramTool}
                onSetDiagramStroke={setDiagramStrokeColor}
                onSetDiagramFill={setDiagramFillColor}
                onSetDiagramStrokeWidth={setDiagramStrokeWidth}
                onDeleteDiagramShapes={() => { }}
                onExportDiagramPNG={() => setExportOpen(true)}
                onExportDiagramJSON={() => setExportOpen(true)}
                zones={zones}
                canUndo={commandManagerRef.current.canUndo()}
                canRedo={commandManagerRef.current.canRedo()}
                currentDiagramTool={currentDiagramTool}
            />

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
                        ) : (
                            <div className="space-y-4">
                                <LibraryTab
                                    furnitureCount={furniture.length}
                                    onAddFurniture={addFurnitureFromCatalog}
                                />
                                <InspectorTab
                                    editorMode={editorMode}
                                    selectedZone={zones.find(z => z.id === selectedZoneId) || null}
                                    selectedFurniture={selectedFurniture}
                                    selectedDiagramShape={diagrams.find(d => d.id === selectedDiagramId) || null}
                                    zones={zones}
                                    onUpdateZone={updateZoneCmd}
                                    onDeleteZone={() => selectedZoneId && deleteZone(selectedZoneId)}
                                    onUpdateFurniture={updateFurnitureCmd}
                                    onDeleteFurniture={deleteFurnitureItem}
                                    onDuplicateFurniture={duplicateFurniture}
                                    onRotateFurniture={rotateFurniture}
                                    onReplaceFurniture={addFurnitureFromCatalog}
                                    onAssignToZone={(zoneId) => selectedFurnitureId && updateFurnitureCmd(selectedFurnitureId, { zoneId: zoneId || undefined })}
                                    onUpdateDiagramShape={(id, updates) => {
                                        // TODO: Implement diagram update
                                        console.log('Update diagram shape:', id, updates);
                                    }}
                                    onDeleteDiagramShape={() => {
                                        if (selectedDiagramId) {
                                            // TODO: Implement diagram deletion
                                            console.log('Delete diagram shape:', selectedDiagramId);
                                        }
                                    }}
                                    onDuplicateDiagramShape={() => {
                                        if (selectedDiagramId) {
                                            // TODO: Implement diagram duplication
                                            console.log('Duplicate diagram shape:', selectedDiagramId);
                                        }
                                    }}
                                />
                                <LayersTab
                                    zones={zones}
                                    furniture={furniture}
                                    diagramShapes={diagrams}
                                    showGrid={settings.showGrid}
                                    showZones={settings.showZones ?? true}
                                    showFurniture={settings.showFurniture ?? true}
                                    showDiagrams={settings.showDiagrams ?? true}
                                    backgroundImage={settings.background ? { visible: settings.background.visible ?? true, locked: !!settings.background.locked, opacity: settings.background.opacity ?? 0.6 } : undefined}
                                    onToggleLayerVisibility={(layer) => {
                                        if (layer === 'grid') updateSettings({ showGrid: !settings.showGrid });
                                        if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), visible: !settings.background?.visible } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                                        if (layer === 'zones') updateSettings({ showZones: !settings.showZones });
                                        if (layer === 'furniture') updateSettings({ showFurniture: !settings.showFurniture });
                                        if (layer === 'diagrams') updateSettings({ showDiagrams: !settings.showDiagrams });
                                    }}
                                    onToggleLayerLock={(layer) => {
                                        if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), locked: !settings.background?.locked } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                                    }}
                                    onSetLayerOpacity={(layer, opacity) => {
                                        if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), opacity } } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
                                    }}
                                    onMoveLayerUp={() => { }}
                                    onMoveLayerDown={() => { }}
                                    onConfigureLayer={(layer) => {
                                        if (layer === 'background') setBgModalOpen(true);
                                    }}
                                />
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
                        onDiagramSelect={setSelectedDiagramId}
                        onFurnitureUpdate={(id, updates) => {
                            // Commandize furniture updates
                            const existing = furniture.find(f => f.id === id);
                            if (!existing) return updateFurniture(id, updates);
                            const oldVals: Partial<FurnitureItemType> = {};
                            Object.keys(updates).forEach(k => { (oldVals as Record<string, unknown>)[k as keyof FurnitureItemType] = existing[k as keyof FurnitureItemType]; });
                            commandManagerRef.current.executeCommand(new UpdateFurnitureCommand(id, oldVals, updates, setFurniture));
                            setFurniture((prev: FurnitureItemType[]) => prev.map((f: FurnitureItemType) => f.id === id ? { ...f, ...updates } : f));
                        }}
                        onBackgroundUpdate={(bg) => updateSettings({ background: { ...(settings.background || {}), ...bg } } as FloorPlanSettings)}
                        onDiagramExport={handleDiagramExport}
                        showZones={settings.showZones ?? true}
                        showFurniture={settings.showFurniture ?? true}
                        showDiagrams={settings.showDiagrams ?? true}
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

            {/* Background import */}
            <BackgroundImportModal
                isOpen={isBgModalOpen}
                onClose={() => setBgModalOpen(false)}
                onImport={(bg) => updateSettings({ background: bg })}
                currentSettings={settings.background}
            />

            {/* Calibration */}
            <CalibrationModal
                isOpen={isCalibrateOpen}
                onClose={() => setCalibrateOpen(false)}
                canvasWidth={settings.apartmentWidth}
                canvasHeight={settings.apartmentHeight}
                currentScale={settings.scale}
                onScaleChange={(newScale) => updateSettings({ scale: newScale })}
            />

            {/* Export modal using export_utils */}
            <ExportModal
                isOpen={isExportOpen}
                onClose={() => setExportOpen(false)}
                onExport={(opts) => {
                    exportFloorPlan({ zones, furniture, settings, diagramShapes: [] }, opts);
                }}
                zones={zones}
                furniture={furniture}
                settings={settings}
                canvasWidth={settings.apartmentWidth * settings.scale}
                canvasHeight={settings.apartmentHeight * settings.scale}
            />
        </div>
    );
}

// Main export - EditorShell component as default
export default EditorShell;
export type { EditorShellProps };

// Named export for consistency
export { EditorShell };

// Removed legacy compatibility exports

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
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from "@/types";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { FloatingSettingsPanel } from "./settings/floating_settings_panel";
import { DiagramShape } from "../canvas/tools/diagram_schemas";
import { ModeToggle } from "./header/mode_toggle";
import { ActionsBar } from "./header/actions_bar";
import { AIImportToggle } from "./header/ai_import_toggle";
import { EditorToolbar } from "./header/editor_toolbar";
import { EditorSidebar } from "./sidebar";
import { KonvaStage } from "../canvas/konva_stage";
import { useEditorStore, EditorMode } from "../state/editor_store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { exportFloorPlan } from "../utils/export_utils";
import { CommandManager, UpdateZoneCommand, UpdateFurnitureCommand, AddZoneCommand } from "../state/command_manager";
import { duplicateShape } from "../canvas/tools/drawing_tools";
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
        sidebarCollapsed,
        currentDiagramTool,
        diagramStrokeColor,
        diagramFillColor,
        diagramStrokeWidth,
        setEditorMode,
        setSelectedZoneId,
        setSelectedFurnitureId,
        setSelectedDiagramId,
        setShowAIImport,
        setShowKeyboardShortcuts,
        setSidebarCollapsed,
        setCurrentDiagramTool,
        setDiagramStrokeColor,
        setDiagramFillColor,
        setDiagramStrokeWidth,
        setFurniture,
        setDiagrams,
        updateFurniture,
        updateZone,
        deleteZone,
        updateSettings,
        resetToDefaults,
        loadData,
        validateAndSaveData,
    } = useEditorStore();

    // Ref for canvas container to calculate viewport size
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Command manager
    const commandManagerRef = useRef(new CommandManager());

    // Initialize command manager with store reference
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = useEditorStore as { getState: () => any; setState: (state: any) => void };
        if (store && commandManagerRef.current) {
            commandManagerRef.current.setStore(store);
        }
    }, []);

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

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    // Actions
    const resetLayout = () => {
        resetToDefaults();
        commandManagerRef.current.clear();
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
                newZone
            )
        );
        // Command manager handles state update, no need for duplicate update
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
                newVals
            )
        );
        // Command manager handles state update, no need for duplicate update
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
                updates
            )
        );
        // Command manager handles state update, no need for duplicate update
    };

    const handleZoneUpdate = (id: string, updates: Partial<FloorPlanZone>) => {
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
                updates
            )
        );
        // Command manager handles state update, no need for duplicate update
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
        return commandManagerRef.current.undo();
    };
    const handleRedo = () => {
        return commandManagerRef.current.redo();
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

                    {/* Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSidebarToggle}
                        className="h-8 px-2"
                        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {sidebarCollapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                            )}
                        </svg>
                    </Button>
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
                selectedDiagramShapes={selectedDiagramId ? [selectedDiagramId] : []}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onZoomIn={() => updateSettings({ scale: Math.min(1.4, settings.scale + 0.05) })}
                onZoomOut={() => updateSettings({ scale: Math.max(0.4, settings.scale - 0.05) })}
                onZoomFit={() => updateSettings({ canvasMode: 'fit-to-screen' })}
                onToggleGrid={() => updateSettings({ showGrid: !settings.showGrid })}
                onToggleSnap={() => updateSettings({ snap: settings.snap > 0 ? 0 : 5 })}
                onCanvasModeChange={(mode) => updateSettings({ canvasMode: mode })}
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
                onDeleteDiagramShapes={() => {
                    if (selectedDiagramId) {
                        const newDiagrams = diagrams.filter(d => d.id !== selectedDiagramId);
                        setDiagrams(newDiagrams);
                        setSelectedDiagramId(null);
                    }
                }}
                onExportDiagramPNG={() => setExportOpen(true)}
                onExportDiagramJSON={() => setExportOpen(true)}
                zones={zones}
                canUndo={commandManagerRef.current.canUndo()}
                canRedo={commandManagerRef.current.canRedo()}
                currentDiagramTool={currentDiagramTool}
            />

            <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Sidebar */}
                <EditorSidebar
                    showAIImport={showAIImport}
                    editorMode={editorMode}
                    sidebarCollapsed={sidebarCollapsed}
                    zones={zones}
                    furniture={furniture}
                    diagrams={diagrams}
                    selectedZoneId={selectedZoneId}
                    selectedFurnitureId={selectedFurnitureId}
                    selectedDiagramId={selectedDiagramId}
                    selectedFurniture={selectedFurniture}
                    settings={settings}
                    currentDiagramTool={currentDiagramTool}
                    handleZoneUpdate={handleZoneUpdate}
                    addFurnitureFromCatalog={addFurnitureFromCatalog}
                    duplicateFurniture={duplicateFurniture}
                    deleteFurnitureItem={deleteFurnitureItem}
                    rotateFurniture={rotateFurniture}
                    updateFurnitureCmd={updateFurnitureCmd}
                    deleteZone={deleteZone}
                    updateSettings={updateSettings}
                    setSelectedDiagramId={setSelectedDiagramId}
                    setDiagrams={setDiagrams}
                    setBgModalOpen={setBgModalOpen}
                    onUpdateDiagramShape={(id, updates) => {
                        const newDiagrams = diagrams.map(d => d.id === id ? { ...d, ...updates } : d);
                        setDiagrams(newDiagrams);
                    }}
                    onDeleteDiagramShape={() => {
                        if (selectedDiagramId) {
                            const newDiagrams = diagrams.filter(d => d.id !== selectedDiagramId);
                            setDiagrams(newDiagrams);
                            setSelectedDiagramId(null);
                        }
                    }}
                    onDuplicateDiagramShape={() => {
                        if (selectedDiagramId) {
                            const selectedShape = diagrams.find(d => d.id === selectedDiagramId);
                            if (selectedShape) {
                                const newShape = duplicateShape(selectedShape);
                                const newDiagrams = [...diagrams, newShape];
                                setDiagrams(newDiagrams);
                                setSelectedDiagramId(newShape.id);
                            }
                        }
                    }}
                />

                {/* Main Canvas Area */}
                <div ref={canvasContainerRef} className="flex-1 bg-gray-200 p-4 overflow-auto">
                    <KonvaStage
                        zones={zones}
                        furniture={furniture}
                        settings={settings}
                        editorMode={editorMode}
                        selectedZoneId={selectedZoneId}
                        selectedFurnitureId={selectedFurnitureId}
                        diagrams={diagrams}
                        selectedDiagramId={selectedDiagramId}
                        diagramTool={currentDiagramTool}
                        diagramStrokeColor={diagramStrokeColor}
                        diagramFillColor={diagramFillColor}
                        diagramStrokeWidth={diagramStrokeWidth}
                        onZoneSelect={setSelectedZoneId}
                        onZoneUpdate={handleZoneUpdate}
                        onFurnitureSelect={setSelectedFurnitureId}
                        onDiagramSelect={setSelectedDiagramId}
                        onFurnitureUpdate={(id, updates) => {
                            // Commandize furniture updates
                            const existing = furniture.find(f => f.id === id);
                            if (!existing) return updateFurniture(id, updates);
                            const oldVals: Partial<FurnitureItemType> = {};
                            Object.keys(updates).forEach(k => { (oldVals as Record<string, unknown>)[k as keyof FurnitureItemType] = existing[k as keyof FurnitureItemType]; });
                            commandManagerRef.current.executeCommand(new UpdateFurnitureCommand(id, oldVals, updates));
                            // Command manager handles state update, no need for duplicate update
                        }}
                        onDiagramAdd={(shape) => {
                            const newDiagrams = [...diagrams, shape];
                            setDiagrams(newDiagrams);
                        }}
                        onDiagramUpdate={(id, updates) => {
                            const newDiagrams = diagrams.map(d => d.id === id ? { ...d, ...updates } : d);
                            setDiagrams(newDiagrams as DiagramShape[]);
                        }}
                        onDiagramDelete={(id) => {
                            const newDiagrams = diagrams.filter(d => d.id !== id);
                            setDiagrams(newDiagrams);
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
                onCalibrateScale={() => setCalibrateOpen(true)}
                onImportBackground={() => setBgModalOpen(true)}
            />

            {/* Background import */}
            <BackgroundImportModal
                isOpen={isBgModalOpen}
                onClose={() => setBgModalOpen(false)}
                onImport={(bg) => updateSettings({ background: bg })}
                currentSettings={settings.background}
                canvasWidth={settings.apartmentWidth * settings.scale}
                canvasHeight={settings.apartmentHeight * settings.scale}
            />

            {/* Calibration */}
            <CalibrationModal
                isOpen={isCalibrateOpen}
                onClose={() => setCalibrateOpen(false)}
                canvasWidth={settings.apartmentWidth}
                canvasHeight={settings.apartmentHeight}
                currentScale={settings.scale}
                onScaleChange={(newScale) => updateSettings({ scale: newScale })}
                unitSystem={settings.unitSystem}
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
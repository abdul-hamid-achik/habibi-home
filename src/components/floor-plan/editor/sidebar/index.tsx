"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Layers } from "lucide-react";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from "@/types";
import { InspectorTab } from "./inspector_tab";
import { LibraryTab } from "./library_tab";
import { LayersTab } from "./layers_tab";
import { DiagramShape } from "../../canvas/tools/diagram_schemas";
import { EditorMode } from "../../state/editor_store";
import { analyzeFloorPlan as analyzeFloorPlanService } from "../../services/analysis";

interface EditorSidebarProps {
    // State
    showAIImport: boolean;
    editorMode: EditorMode;
    sidebarCollapsed: boolean;
    zones: FloorPlanZone[];
    furniture: FurnitureItemType[];
    diagrams: DiagramShape[];
    selectedZoneId: string | null;
    selectedFurnitureId: string | null;
    selectedDiagramId: string | null;
    selectedFurniture: FurnitureItemType | null;
    settings: FloorPlanSettings;
    currentDiagramTool: string;

    // Handlers
    handleZoneUpdate: (id: string, updates: Partial<FloorPlanZone>) => void;
    addFurnitureFromCatalog: (catalogName: string) => void;
    duplicateFurniture: () => void;
    deleteFurnitureItem: () => void;
    rotateFurniture: (degrees: number) => void;
    updateFurnitureCmd: (id: string, updates: Partial<FurnitureItemType>) => void;
    deleteZone: (id: string) => void;
    updateSettings: (updates: Partial<FloorPlanSettings>) => void;
    setSelectedDiagramId: (id: string | null) => void;
    setDiagrams: (diagrams: DiagramShape[]) => void;
    setBgModalOpen: (open: boolean) => void;

    // Diagram handlers
    onUpdateDiagramShape: (id: string, updates: Record<string, unknown>) => void;
    onDeleteDiagramShape: () => void;
    onDuplicateDiagramShape: () => void;
}

function AIImportPanel({ onAnalysisComplete }: { onAnalysisComplete: (analysis: { dimensions?: { width: number; height: number }; zones?: Array<{ zoneId?: string; name: string; x: number; y: number; w: number; h: number }> }) => void }) {
    const [file, setFile] = React.useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeFloorPlanService({ file });
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

export function EditorSidebar(props: EditorSidebarProps) {
    const {
        showAIImport,
        editorMode,
        sidebarCollapsed,
        zones,
        furniture,
        diagrams,
        selectedZoneId,
        selectedFurnitureId,
        selectedDiagramId,
        selectedFurniture,
        settings,
        currentDiagramTool,
        handleZoneUpdate,
        addFurnitureFromCatalog,
        duplicateFurniture,
        deleteFurnitureItem,
        rotateFurniture,
        updateFurnitureCmd,
        deleteZone,
        updateSettings,
        setBgModalOpen,
        onUpdateDiagramShape,
        onDeleteDiagramShape,
        onDuplicateDiagramShape,
    } = props;

    return (
        <div className={`${sidebarCollapsed ? 'w-12' : 'w-96'} bg-white overflow-y-auto transition-all duration-300`}>
            <div className="p-4">
                {showAIImport ? (
                    <AIImportPanel onAnalysisComplete={() => { }} />
                ) : (
                    <div className="space-y-4">
                        {/* Mode-specific helpful tips */}
                        {editorMode === 'zones' && (
                            <Card className="border-blue-200 bg-blue-50">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-blue-800">
                                        <strong>💡 Room Planning Mode</strong>
                                        <div className="text-xs mt-1 text-blue-600">
                                            Define your room layouts and zones. Start by clicking &quot;Add Zone&quot; in the toolbar to create room boundaries.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {editorMode === 'furniture' && (
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-green-800">
                                        <strong>🛋️ Furniture Mode</strong>
                                        <div className="text-xs mt-1 text-green-600">
                                            Add and arrange furniture in your planned rooms. Use the furniture catalog below to add items.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {editorMode === 'diagrams' && (
                            <Card className="border-purple-200 bg-purple-50">
                                <CardContent className="pt-4">
                                    <div className="text-sm text-purple-800">
                                        <strong>📏 Measure & Draw Mode</strong>
                                        <div className="text-xs mt-1 text-purple-600">
                                            Measure spaces, add dimensions, and create notes. Your drawings stay visible when you switch modes.
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Diagram Tools Info - only show in diagrams mode */}
                        {editorMode === 'diagrams' && (
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
                        )}

                        {/* Furniture Library - only show in furniture mode */}
                        {editorMode === 'furniture' && (
                            <LibraryTab
                                furnitureCount={furniture.length}
                                onAddFurniture={addFurnitureFromCatalog}
                                unitSystem={settings.unitSystem}
                            />
                        )}

                        {/* Inspector - show when there's a selection or when mode-specific content is available */}
                        {(selectedZoneId || selectedFurnitureId || selectedDiagramId || editorMode === 'diagrams') && (
                            <InspectorTab
                                editorMode={editorMode}
                                selectedZone={zones.find(z => z.id === selectedZoneId) || null}
                                selectedFurniture={selectedFurniture}
                                selectedDiagramShape={diagrams.find(d => d.id === selectedDiagramId) || null}
                                zones={zones}
                                onUpdateZone={handleZoneUpdate}
                                onDeleteZone={() => selectedZoneId && deleteZone(selectedZoneId)}
                                onUpdateFurniture={updateFurnitureCmd}
                                onDeleteFurniture={deleteFurnitureItem}
                                onDuplicateFurniture={duplicateFurniture}
                                onRotateFurniture={rotateFurniture}
                                onReplaceFurniture={addFurnitureFromCatalog}
                                onAssignToZone={(zoneId) => selectedFurnitureId && updateFurnitureCmd(selectedFurnitureId, { zoneId: zoneId || undefined })}
                                onUpdateDiagramShape={onUpdateDiagramShape}
                                onDeleteDiagramShape={onDeleteDiagramShape}
                                onDuplicateDiagramShape={onDuplicateDiagramShape}
                            />
                        )}

                        {/* Layers - always show for all modes */}
                        <LayersTab
                            zones={zones}
                            furniture={furniture}
                            diagramShapes={diagrams}
                            showGrid={settings.showGrid}
                            showZones={settings.showZones ?? true}
                            showFurniture={settings.showFurniture ?? true}
                            showDiagrams={settings.showDiagrams ?? true}
                            backgroundImage={settings.background ? { visible: settings.background.visible ?? true, locked: !!settings.background.locked, opacity: settings.background.opacity ?? 0.6 } : undefined}
                            currentDiagramTool={currentDiagramTool}
                            onToggleLayerVisibility={(layer) => {
                                if (layer === 'grid') updateSettings({ showGrid: !settings.showGrid });
                                if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), visible: !settings.background?.visible } } as FloorPlanSettings);
                                if (layer === 'zones') updateSettings({ showZones: !settings.showZones });
                                if (layer === 'furniture') updateSettings({ showFurniture: !settings.showFurniture });
                                if (layer === 'diagrams') updateSettings({ showDiagrams: !settings.showDiagrams });
                            }}
                            onToggleLayerLock={(layer) => {
                                if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), locked: !settings.background?.locked } } as FloorPlanSettings);
                            }}
                            onSetLayerOpacity={(layer, opacity) => {
                                if (layer === 'background') updateSettings({ background: { ...(settings.background || {}), opacity } } as FloorPlanSettings);
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
    );
}


export type { EditorSidebarProps };

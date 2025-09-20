"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FloorPlanEditor } from "@/components/floor-plan/floor-plan-editor";
import { ImportedFloorPlanData, FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { DEFAULT_FURNITURE_CATALOG } from '@/lib/furniture-catalog';

interface ImportedFloorPlanResponse extends ImportedFloorPlanData {
    // Additional computed properties
    [key: string]: unknown;
}

export default function ImportedEditorPage() {
    const params = useParams();
    const shortId = params.shortId as string;

    const [importedData, setImportedData] = useState<ImportedFloorPlanResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!shortId) return;

        const fetchImportedFloorPlan = async () => {
            try {
                const response = await fetch(`/api/import/${shortId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch imported floor plan');
                }
                const data = await response.json();
                setImportedData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchImportedFloorPlan();
    }, [shortId]);

    const handleSave = (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings }) => {
        console.log("Saving project data:", data);
        // TODO: Implement actual save functionality
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading imported floor plan...</p>
                </div>
            </div>
        );
    }

    if (error || !importedData) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-600 mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Floor Plan</h2>
                    <p className="text-gray-600">{error || 'Imported floor plan not found'}</p>
                    <button
                        onClick={() => window.location.href = '/editor'}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Editor
                    </button>
                </div>
            </div>
        );
    }

    // Convert imported zones to the format expected by the editor
    const zones: FloorPlanZone[] = importedData.zones.map((zone, index) => ({
        id: `zone_${index}`,
        zoneId: zone.zoneId,
        name: zone.name,
        x: zone.x,
        y: zone.y,
        w: zone.w,
        h: zone.h,
        color: undefined,
    }));

    // Create settings from imported dimensions
    const settings: FloorPlanSettings = {
        scale: 0.8,
        snap: 5,
        showGrid: true,
        showDimensions: true,
        apartmentWidth: Math.round(importedData.dimensions.width * 100), // Convert meters to cm
        apartmentHeight: Math.round(importedData.dimensions.height * 100),
        canvasMode: 'fit-to-screen',
        maxCanvasWidth: 1200,
        maxCanvasHeight: 800,
    };

    // Generate all available furniture from the catalog
    const furniture: FurnitureItemType[] = DEFAULT_FURNITURE_CATALOG.map((item, index) => ({
        id: `furniture_${index}`,
        name: item.name,
        x: 50 + (index * 10), // Stagger positions
        y: 50 + (index * 10),
        w: item.width,
        h: item.height,
        r: 0,
        color: item.color,
        catalogId: item.id,
    }));

    return (
        <FloorPlanEditor
            initialZones={zones}
            initialFurniture={furniture}
            initialSettings={settings}
            onSave={handleSave}
        />
    );
}

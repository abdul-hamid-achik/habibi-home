"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { z } from 'zod';
import { EditorShell } from "@/features/floor_plan/editor/editor_shell";
import { DiagramShape } from "@/components/floor-plan/konva-diagram-canvas";
import { ImportedFloorPlanData, FloorPlanZone, FurnitureItemType, FloorPlanSettings, floorPlanZoneSchema, furnitureItemSchema, floorPlanSettingsSchema } from '@/types';
import { DEFAULT_FURNITURE_CATALOG } from '@/lib/furniture-catalog';

interface ImportedFloorPlanResponse extends ImportedFloorPlanData {
    // Additional computed properties
    [key: string]: unknown;
}

export default function ImportedEditorPage() {
    const params = useParams();
    const rawShortId = params.shortId as string;

    // Client-side validation and sanitization
    const shortIdSchema = z.object({
        shortId: z.string()
            .min(1, "ShortId is required")
            .length(8, "ShortId must be exactly 8 characters")
            .regex(/^[a-zA-Z0-9]+$/, "ShortId must contain only alphanumeric characters")
    });

    // Sanitize the shortId
    const sanitizedShortId = rawShortId?.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim() || '';

    // Validate the sanitized shortId
    const validationResult = shortIdSchema.safeParse({ shortId: sanitizedShortId });

    const shortId = validationResult.success ? sanitizedShortId : null;

    const [importedData, setImportedData] = useState<ImportedFloorPlanResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!shortId || !validationResult.success) {
            setError('Invalid shortId format');
            setLoading(false);
            return;
        }

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
    }, [shortId, validationResult.success]);

    const handleSave = async (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings; diagrams?: DiagramShape[] }) => {
        try {
            // Validate data before saving
            const zonesValidation = z.array(floorPlanZoneSchema).safeParse(data.zones);
            if (!zonesValidation.success) {
                throw new Error(`Invalid zones data: ${zonesValidation.error.issues.map(issue => issue.message).join(', ')}`);
            }

            const furnitureValidation = z.array(furnitureItemSchema).safeParse(data.furniture);
            if (!furnitureValidation.success) {
                throw new Error(`Invalid furniture data: ${furnitureValidation.error.issues.map(issue => issue.message).join(', ')}`);
            }

            const settingsValidation = floorPlanSettingsSchema.safeParse(data.settings);
            if (!settingsValidation.success) {
                throw new Error(`Invalid settings data: ${settingsValidation.error.issues.map(issue => issue.message).join(', ')}`);
            }
            // First, we need to create a project for this imported floor plan
            // The imported floor plan data will be converted to a project
            const createProjectResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: `Floor Plan ${importedData?.shortId || shortId}`,
                    description: `Project created from imported floor plan ${importedData?.shortId || shortId}`,
                    apartmentType: 'type_7',
                }),
            });

            if (!createProjectResponse.ok) {
                const errorData = await createProjectResponse.json();
                throw new Error(errorData.details || errorData.error || 'Failed to create project');
            }

            const createdProject = await createProjectResponse.json();

            // Now save the project data (zones, furniture, settings)
            const saveResponse = await fetch(`/api/projects/${createdProject.id}/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    zones: data.zones.map(zone => ({
                        zoneId: zone.zoneId,
                        name: zone.name,
                        x: zone.x,
                        y: zone.y,
                        w: zone.w,
                        h: zone.h,
                        color: zone.color,
                        suggestedFurniture: zone.suggestedFurniture,
                    })),
                    furniture: data.furniture.map(item => ({
                        name: item.name,
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h,
                        r: item.r,
                        color: item.color,
                        catalogId: item.catalogId,
                        zoneId: item.zoneId,
                    })),
                    settings: {
                        apartmentWidth: data.settings.apartmentWidth,
                        apartmentHeight: data.settings.apartmentHeight,
                        scale: data.settings.scale,
                        snap: data.settings.snap,
                        showGrid: data.settings.showGrid,
                        showDimensions: data.settings.showDimensions,
                    },
                }),
            });

            if (!saveResponse.ok) {
                const errorData = await saveResponse.json();
                throw new Error(errorData.details || errorData.error || 'Failed to save project data');
            }

            // Show success message
            alert(`Project saved successfully! Project ID: ${createdProject.id}`);

            // Optionally redirect to the project page
            // window.location.href = `/editor/${createdProject.id}`;

        } catch (error) {
            console.error('Save error:', error);
            alert(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
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
        // Add default suggested furniture if not provided
        suggestedFurniture: zone.suggestedFurniture || getDefaultFurnitureForZone(zone.name, zone.zoneId),
    }));

    // Helper function to get default furniture suggestions based on zone type
    function getDefaultFurnitureForZone(zoneName: string, zoneId: string): string[] {
        const name = zoneName.toLowerCase();
        const type = zoneId.toLowerCase();

        // Living room
        if (name.includes('living') || type === 'living') {
            return ['sofa', 'coffee table', 'side table', 'armchair'];
        }

        // Kitchen
        if (name.includes('kitchen') || type === 'kitchen') {
            return ['dining table', 'stove', 'refrigerator'];
        }

        // Bedroom
        if (name.includes('bedroom') || type === 'bedroom') {
            return ['bed', 'nightstand', 'dresser'];
        }

        // Bathroom
        if (name.includes('bathroom') || type === 'bathroom') {
            return ['storage'];
        }

        // Dining room
        if (name.includes('dining') || type === 'dining') {
            return ['dining table', 'chair'];
        }

        // Office/Study
        if (name.includes('office') || name.includes('study') || type === 'office') {
            return ['desk', 'chair'];
        }

        // Default suggestions
        return ['table', 'chair'];
    }

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

    // Generate intelligent furniture placement based on zones and their types
    const furniture: FurnitureItemType[] = [];

    // Helper function to find furniture items by category
    const getFurnitureByCategory = (category: string) => {
        return DEFAULT_FURNITURE_CATALOG.filter(item => item.category === category);
    };

    // Helper function to place furniture in a zone with smart positioning
    const placeFurnitureInZone = (zone: FloorPlanZone, furnitureId: number = 0) => {
        const furnitureList: FurnitureItemType[] = [];

        if (!zone.suggestedFurniture || zone.suggestedFurniture.length === 0) {
            return furnitureList;
        }

        // Calculate zone center and boundaries
        const zoneCenterX = zone.x + (zone.w / 2);
        const zoneCenterY = zone.y + (zone.h / 2);
        const zoneLeft = zone.x;
        const zoneTop = zone.y;
        const zoneRight = zone.x + zone.w;
        const zoneBottom = zone.y + zone.h;

        // Place furniture based on zone type
        zone.suggestedFurniture.forEach((furnitureType, index) => {
            // Find matching furniture in catalog
            let catalogItems: typeof DEFAULT_FURNITURE_CATALOG = [];

            switch (furnitureType.toLowerCase()) {
                case 'sofa':
                    catalogItems = getFurnitureByCategory('sofa');
                    break;
                case 'bed':
                    catalogItems = getFurnitureByCategory('bed');
                    break;
                case 'table':
                case 'dining table':
                case 'coffee table':
                case 'side table':
                    catalogItems = getFurnitureByCategory('table');
                    break;
                case 'chair':
                case 'armchair':
                    catalogItems = getFurnitureByCategory('chair');
                    break;
                case 'storage':
                case 'dresser':
                case 'wardrobe':
                case 'bookshelf':
                    catalogItems = getFurnitureByCategory('storage');
                    break;
                case 'appliance':
                case 'refrigerator':
                case 'stove':
                case 'dishwasher':
                    catalogItems = getFurnitureByCategory('appliance');
                    break;
                case 'desk':
                    catalogItems = getFurnitureByCategory('desk');
                    break;
                case 'decor':
                    catalogItems = getFurnitureByCategory('decor');
                    break;
                default:
                    // Try to find by name
                    catalogItems = DEFAULT_FURNITURE_CATALOG.filter(item =>
                        item.name.toLowerCase().includes(furnitureType.toLowerCase())
                    );
                    break;
            }

            if (catalogItems.length > 0) {
                const catalogItem = catalogItems[0]; // Take first match

                // Smart positioning within the zone
                let itemX = zoneCenterX - (catalogItem.width / 2);
                let itemY = zoneCenterY - (catalogItem.height / 2);

                // Ensure furniture stays within zone boundaries
                itemX = Math.max(zoneLeft + 20, Math.min(zoneRight - catalogItem.width - 20, itemX));
                itemY = Math.max(zoneTop + 20, Math.min(zoneBottom - catalogItem.height - 20, itemY));

                // Stagger multiple items slightly
                if (index > 0) {
                    itemX += (index % 2 === 0 ? 1 : -1) * 30;
                    itemY += (index % 3 === 0 ? 1 : -1) * 20;
                }

                furnitureList.push({
                    id: `furniture_${furnitureId + furnitureList.length}`,
                    name: catalogItem.name,
                    x: Math.round(itemX),
                    y: Math.round(itemY),
                    w: catalogItem.width,
                    h: catalogItem.height,
                    r: 0,
                    color: catalogItem.color,
                    catalogId: catalogItem.id,
                    zoneId: zone.zoneId,
                });
            }
        });

        return furnitureList;
    };

    // Place furniture for each zone
    let furnitureId = 0;
    zones.forEach((zone) => {
        const zoneFurniture = placeFurnitureInZone(zone, furnitureId);
        furniture.push(...zoneFurniture);
        furnitureId += zoneFurniture.length;
    });

    // If no furniture was placed, add some basic furniture for demonstration
    if (furniture.length === 0) {
        const basicFurniture = [
            { name: "large sofa", x: 100, y: 100 },
            { name: "coffee table", x: 300, y: 200 },
            { name: "dining table 121×245", x: 500, y: 100 },
        ];

        basicFurniture.forEach((item, index) => {
            const catalogItem = DEFAULT_FURNITURE_CATALOG.find(cat => cat.name === item.name);
            if (catalogItem) {
                furniture.push({
                    id: `furniture_demo_${index}`,
                    name: catalogItem.name,
                    x: item.x,
                    y: item.y,
                    w: catalogItem.width,
                    h: catalogItem.height,
                    r: 0,
                    color: catalogItem.color,
                    catalogId: catalogItem.id,
                });
            }
        });
    }

    return (
        <EditorShell
            initialZones={zones}
            initialFurniture={furniture}
            initialSettings={settings}
            onSave={handleSave}
        />
    );
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { FloorPlanZone } from "@/types";

interface ZoneListProps {
    zones: FloorPlanZone[];
    selectedZoneId: string | null;
    onZoneSelect: (zoneId: string | null) => void;
    onZoneUpdate: (id: string, updates: Partial<FloorPlanZone>) => void;
    onZoneDelete: (id: string) => void;
    onZoneAdd: () => void;
}

export function ZoneList({
    zones,
    selectedZoneId,
    onZoneSelect,
    onZoneUpdate,
    onZoneDelete,
    onZoneAdd
}: ZoneListProps) {
    return (
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
                        onClick={() => onZoneSelect(zone.id)}
                    >
                        <div className="flex-shrink-0 w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center text-xs font-medium bg-white">
                            {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                            <Input
                                value={zone.name}
                                onChange={(e) => onZoneUpdate(zone.id, { name: e.target.value })}
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
                                            onZoneUpdate(zone.id, { w: newW, h: newH });
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
                                    onZoneDelete(zone.id);
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
                onClick={onZoneAdd}
            >
                + Add Zone
            </Button>
        </div>
    );
}
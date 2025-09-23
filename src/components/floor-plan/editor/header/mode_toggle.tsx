import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Sofa, Ruler } from "lucide-react";

export type EditorMode = 'zones' | 'furniture' | 'diagrams';

interface ModeToggleProps {
    currentMode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
    return (
        <div className="flex border rounded-lg overflow-hidden bg-white">
            <Button
                size="sm"
                variant={currentMode === 'zones' ? 'default' : 'ghost'}
                onClick={() => onModeChange('zones')}
                className="rounded-none px-3"
                title="Plan and define room layouts and zones"
            >
                <MapPin className="w-4 h-4 mr-1" />
                Plan Rooms
            </Button>
            <Button
                size="sm"
                variant={currentMode === 'furniture' ? 'default' : 'ghost'}
                onClick={() => onModeChange('furniture')}
                className="rounded-none px-3"
                title="Add and arrange furniture in your space"
            >
                <Sofa className="w-4 h-4 mr-1" />
                Add Furniture
            </Button>
            <Button
                size="sm"
                variant={currentMode === 'diagrams' ? 'default' : 'ghost'}
                onClick={() => onModeChange('diagrams')}
                className="rounded-none px-3"
                title="Measure spaces and add notes or drawings"
            >
                <Ruler className="w-4 h-4 mr-1" />
                Measure & Draw
            </Button>
        </div>
    );
}
import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Sofa, Pencil } from "lucide-react";

export type EditorMode = 'zones' | 'furniture' | 'diagrams';

interface ModeToggleProps {
    currentMode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
    return (
        <div className="flex border rounded-lg overflow-hidden">
            <Button
                size="sm"
                variant={currentMode === 'zones' ? 'default' : 'ghost'}
                onClick={() => onModeChange('zones')}
                className="rounded-none"
            >
                <Settings className="w-4 h-4 mr-2" />
                Zones
            </Button>
            <Button
                size="sm"
                variant={currentMode === 'furniture' ? 'default' : 'ghost'}
                onClick={() => onModeChange('furniture')}
                className="rounded-none"
            >
                <Sofa className="w-4 h-4 mr-2" />
                Furniture
            </Button>
            <Button
                size="sm"
                variant={currentMode === 'diagrams' ? 'default' : 'ghost'}
                onClick={() => onModeChange('diagrams')}
                className="rounded-none"
            >
                <Pencil className="w-4 h-4 mr-2" />
                Diagrams
            </Button>
        </div>
    );
}
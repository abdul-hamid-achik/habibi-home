import React from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@stackframe/stack";
import { Keyboard, Undo, Save } from "lucide-react";

interface ActionsBarProps {
    showKeyboardShortcuts: boolean;
    onToggleKeyboardShortcuts: () => void;
    onReset: () => void;
    onSave: () => void;
}

export function ActionsBar({
    showKeyboardShortcuts: _showKeyboardShortcuts,
    onToggleKeyboardShortcuts,
    onReset,
    onSave
}: ActionsBarProps) {
    return (
        <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={onToggleKeyboardShortcuts}
            >
                <Keyboard className="w-4 h-4 mr-2" />
                Shortcuts
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={onReset}
            >
                <Undo className="w-4 h-4 mr-2" />
                Reset
            </Button>
            <Button
                size="sm"
                onClick={onSave}
            >
                <Save className="w-4 h-4 mr-2" />
                Save
            </Button>
            <UserButton />
        </div>
    );
}
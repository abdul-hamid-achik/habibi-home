import React from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface AIImportToggleProps {
    isActive: boolean;
    onToggle: () => void;
}

export function AIImportToggle({ isActive, onToggle }: AIImportToggleProps) {
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={onToggle}
        >
            <Zap className="w-4 h-4 mr-2" />
            AI Import
        </Button>
    );
}
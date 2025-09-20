import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, RotateCw, Copy, Trash2 } from "lucide-react";
import { FurnitureItemType } from "@/types";

interface SelectedFurniturePanelProps {
    selectedFurniture: FurnitureItemType;
    onUpdateFurniture: (id: string, updates: Partial<FurnitureItemType>) => void;
    onDuplicateFurniture: () => void;
    onDeleteFurniture: () => void;
    onRotateFurniture: (degrees: number) => void;
}

export function SelectedFurniturePanel({
    selectedFurniture,
    onUpdateFurniture,
    onDuplicateFurniture,
    onDeleteFurniture,
    onRotateFurniture
}: SelectedFurniturePanelProps) {
    return (
        <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center">
                    <div
                        className="w-3 h-3 rounded-sm border mr-3"
                        style={{ backgroundColor: selectedFurniture.color }}
                    />
                    {selectedFurniture.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs">X</Label>
                        <Input
                            type="number"
                            value={selectedFurniture.x}
                            onChange={(e) => onUpdateFurniture(selectedFurniture.id, { x: Number(e.target.value) })}
                            className="h-7 text-xs"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Y</Label>
                        <Input
                            type="number"
                            value={selectedFurniture.y}
                            onChange={(e) => onUpdateFurniture(selectedFurniture.id, { y: Number(e.target.value) })}
                            className="h-7 text-xs"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                            type="number"
                            value={selectedFurniture.w}
                            onChange={(e) => onUpdateFurniture(selectedFurniture.id, { w: Number(e.target.value) })}
                            className="h-7 text-xs"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                            type="number"
                            value={selectedFurniture.h}
                            onChange={(e) => onUpdateFurniture(selectedFurniture.id, { h: Number(e.target.value) })}
                            className="h-7 text-xs"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs">Rotation: {selectedFurniture.r}°</Label>
                    <Input
                        type="number"
                        value={selectedFurniture.r}
                        onChange={(e) => onUpdateFurniture(selectedFurniture.id, { r: Number(e.target.value) })}
                        className="h-7 text-xs mt-1"
                    />
                </div>

                <div className="flex space-x-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRotateFurniture(-90)}
                        className="h-7 px-2 flex-1"
                    >
                        <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRotateFurniture(90)}
                        className="h-7 px-2 flex-1"
                    >
                        <RotateCw className="w-3 h-3" />
                    </Button>
                </div>

                <div className="flex space-x-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onDuplicateFurniture}
                        className="h-7 px-2 flex-1"
                    >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onDeleteFurniture}
                        className="h-7 px-2 flex-1"
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
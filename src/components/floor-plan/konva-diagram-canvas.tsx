"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, Group } from 'react-konva';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    Square,
    Circle as CircleIcon,
    Minus,
    Edit3,
    MousePointer,
    Download,
    Trash2,
    Copy,
} from 'lucide-react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { FloorPlanZone, FurnitureItemType } from '@/types';
import { cm2px } from '@/features/floor_plan/utils/units';

// Drawing tool types
export type DrawingTool = 'select' | 'rectangle' | 'circle' | 'line' | 'freehand' | 'text';

// Shape interface for Konva shapes
export interface DiagramShape {
    id: string;
    type: 'rectangle' | 'circle' | 'line' | 'freehand' | 'text';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: number[];
    text?: string;
    fill: string;
    stroke: string;
    strokeWidth: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
}

interface KonvaDiagramCanvasProps {
    width: number;
    height: number;
    scale: number;
    showGrid?: boolean;
    zones?: FloorPlanZone[];
    furniture?: FurnitureItemType[];
    onShapeAdd?: (shape: DiagramShape) => void;
    onShapeUpdate?: (id: string, updates: Partial<DiagramShape>) => void;
    onShapeDelete?: (id: string) => void;
    onExport?: (dataUrl: string, format: 'png' | 'json') => void;
    className?: string;
}

const COLORS = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
];

export function KonvaDiagramCanvas({
    width,
    height,
    scale,
    showGrid = true,
    zones = [],
    furniture = [],
    onShapeAdd,
    onShapeUpdate,
    onShapeDelete,
    onExport,
    className
}: KonvaDiagramCanvasProps) {
    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    const [tool, setTool] = useState<DrawingTool>('select');
    const [shapes, setShapes] = useState<DiagramShape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<number[]>([]);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [fillColor, setFillColor] = useState('#transparent');
    const [strokeWidth, setStrokeWidth] = useState(2);

    // Generate unique ID for shapes
    const generateId = () => Math.random().toString(36).slice(2, 9);

    // Grid pattern
    const renderGrid = () => {
        if (!showGrid) return null;

        const gridSize = cm2px(25, scale);
        const lines = [];

        // Vertical lines
        for (let i = 0; i < width; i += gridSize) {
            lines.push(
                <Line
                    key={`v${i}`}
                    points={[i, 0, i, height]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    listening={false}
                />
            );
        }

        // Horizontal lines
        for (let i = 0; i < height; i += gridSize) {
            lines.push(
                <Line
                    key={`h${i}`}
                    points={[0, i, width, i]}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    listening={false}
                />
            );
        }

        return lines;
    };

    // Render zones as background rectangles
    const renderZones = () => {
        return zones.map(zone => (
            <Rect
                key={`zone-${zone.id}`}
                x={cm2px(zone.x, scale)}
                y={cm2px(zone.y, scale)}
                width={cm2px(zone.w, scale)}
                height={cm2px(zone.h, scale)}
                fill={zone.color || '#f3f4f6'}
                stroke="#d1d5db"
                strokeWidth={1}
                opacity={0.3}
                listening={false}
            />
        ));
    };

    // Render furniture as rectangles
    const renderFurniture = () => {
        return furniture.map(item => (
            <Group
                key={`furniture-${item.id}`}
                x={cm2px(item.x, scale)}
                y={cm2px(item.y, scale)}
                rotation={item.r}
                listening={false}
            >
                <Rect
                    width={cm2px(item.w, scale)}
                    height={cm2px(item.h, scale)}
                    fill={item.color}
                    stroke="#374151"
                    strokeWidth={1}
                    opacity={0.7}
                />
                <Text
                    text={item.name}
                    x={0}
                    y={cm2px(item.h, scale) / 2 - 8}
                    width={cm2px(item.w, scale)}
                    fontSize={10}
                    fill="white"
                    align="center"
                    verticalAlign="middle"
                />
            </Group>
        ));
    };

    // Handle mouse down for drawing
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        if (tool === 'select') {
            // Handle selection
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
                setSelectedShapeId(null);
                transformerRef.current?.nodes([]);
            }
            return;
        }

        const stage = e.target.getStage();
        const point = stage?.getPointerPosition();
        if (!point) return;

        setIsDrawing(true);
        const newShape: DiagramShape = {
            id: generateId(),
            type: tool as DiagramShape['type'],
            x: point.x,
            y: point.y,
            fill: fillColor === '#transparent' ? 'transparent' : fillColor,
            stroke: strokeColor,
            strokeWidth,
        };

        switch (tool) {
            case 'rectangle':
                newShape.width = 0;
                newShape.height = 0;
                break;
            case 'circle':
                newShape.radius = 0;
                break;
            case 'line':
                newShape.points = [0, 0, 0, 0];
                break;
            case 'freehand':
                newShape.points = [0, 0];
                setCurrentPath([0, 0]);
                break;
            case 'text':
                newShape.text = 'Double click to edit';
                newShape.width = 100;
                newShape.height = 20;
                setIsDrawing(false);
                break;
        }

        setShapes(prev => [...prev, newShape]);
        onShapeAdd?.(newShape);
    };

    // Handle mouse move for drawing
    const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        if (!isDrawing) return;

        const stage = e.target.getStage();
        const point = stage?.getPointerPosition();
        if (!point) return;

        setShapes(prev => {
            const newShapes = [...prev];
            const currentShape = newShapes[newShapes.length - 1];

            switch (currentShape.type) {
                case 'rectangle':
                    currentShape.width = point.x - currentShape.x;
                    currentShape.height = point.y - currentShape.y;
                    break;
                case 'circle':
                    const dx = point.x - currentShape.x;
                    const dy = point.y - currentShape.y;
                    currentShape.radius = Math.sqrt(dx * dx + dy * dy);
                    break;
                case 'line':
                    currentShape.points = [0, 0, point.x - currentShape.x, point.y - currentShape.y];
                    break;
                case 'freehand':
                    const newPoints = [...(currentPath || []), point.x - currentShape.x, point.y - currentShape.y];
                    currentShape.points = newPoints;
                    setCurrentPath(newPoints);
                    break;
            }

            return newShapes;
        });
    };

    // Handle mouse up for drawing
    const handleMouseUp = () => {
        setIsDrawing(false);
        setCurrentPath([]);
    };

    // Handle shape selection
    const handleShapeClick = (e: KonvaEventObject<MouseEvent>, shapeId: string) => {
        e.cancelBubble = true;
        if (tool !== 'select') return;

        setSelectedShapeId(shapeId);
        const node = e.target;
        transformerRef.current?.nodes([node]);
    };

    // Handle shape transformation
    const handleTransformEnd = (e: KonvaEventObject<Event>) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale and update dimensions
        node.scaleX(1);
        node.scaleY(1);

        const shapeId = node.id();
        const updates: Partial<DiagramShape> = {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        };

        if (node.className === 'Rect') {
            updates.width = Math.max(5, node.width() * scaleX);
            updates.height = Math.max(5, node.height() * scaleY);
        } else if (node.className === 'Circle') {
            updates.radius = Math.max(5, (node as Konva.Circle).radius() * Math.abs(scaleX));
        }

        setShapes(prev => prev.map(shape =>
            shape.id === shapeId ? { ...shape, ...updates } : shape
        ));

        onShapeUpdate?.(shapeId, updates);
    };

    // Delete selected shape
    const deleteSelected = useCallback(() => {
        if (!selectedShapeId) return;

        setShapes(prev => prev.filter(shape => shape.id !== selectedShapeId));
        setSelectedShapeId(null);
        transformerRef.current?.nodes([]);
        onShapeDelete?.(selectedShapeId);
    }, [selectedShapeId, onShapeDelete]);

    // Duplicate selected shape
    const duplicateSelected = useCallback(() => {
        if (!selectedShapeId) return;

        const selectedShape = shapes.find(s => s.id === selectedShapeId);
        if (!selectedShape) return;

        const newShape: DiagramShape = {
            ...selectedShape,
            id: generateId(),
            x: selectedShape.x + 20,
            y: selectedShape.y + 20,
        };

        setShapes(prev => [...prev, newShape]);
        onShapeAdd?.(newShape);
    }, [selectedShapeId, shapes, onShapeAdd]);

    // Export functions
    const exportToPNG = () => {
        const stage = stageRef.current;
        if (!stage) return;

        const dataURL = stage.toDataURL({ mimeType: 'image/png', quality: 1 });
        onExport?.(dataURL, 'png');

        // Download automatically
        const link = document.createElement('a');
        link.download = 'floor-plan-diagram.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToJSON = () => {
        const data = {
            shapes,
            zones,
            furniture,
            settings: { width, height, scale }
        };

        const jsonString = JSON.stringify(data, null, 2);
        onExport?.(jsonString, 'json');

        // Download automatically
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'floor-plan-diagram.json';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    if (selectedShapeId) {
                        e.preventDefault();
                        deleteSelected();
                    }
                    break;
                case 'd':
                case 'D':
                    if ((e.ctrlKey || e.metaKey) && selectedShapeId) {
                        e.preventDefault();
                        duplicateSelected();
                    }
                    break;
                case 'Escape':
                    setSelectedShapeId(null);
                    transformerRef.current?.nodes([]);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedShapeId, deleteSelected, duplicateSelected]);

    // Render shape components
    const renderShape = (shape: DiagramShape) => {
        const commonProps = {
            id: shape.id,
            x: shape.type === 'freehand' ? shape.x : undefined,
            y: shape.type === 'freehand' ? shape.y : undefined,
            fill: shape.fill,
            stroke: shape.stroke,
            strokeWidth: shape.strokeWidth,
            onClick: (e: KonvaEventObject<MouseEvent>) => handleShapeClick(e, shape.id),
            onTransformEnd: handleTransformEnd,
            draggable: tool === 'select',
        };

        switch (shape.type) {
            case 'rectangle':
                return (
                    <Rect
                        key={shape.id}
                        {...commonProps}
                        x={shape.x}
                        y={shape.y}
                        width={shape.width || 0}
                        height={shape.height || 0}
                        rotation={shape.rotation}
                    />
                );
            case 'circle':
                return (
                    <Circle
                        key={shape.id}
                        {...commonProps}
                        x={shape.x}
                        y={shape.y}
                        radius={shape.radius || 0}
                    />
                );
            case 'line':
                return (
                    <Line
                        key={shape.id}
                        {...commonProps}
                        x={shape.x}
                        y={shape.y}
                        points={shape.points || []}
                        lineCap="round"
                        lineJoin="round"
                    />
                );
            case 'freehand':
                return (
                    <Line
                        key={shape.id}
                        {...commonProps}
                        points={shape.points || []}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                    />
                );
            case 'text':
                return (
                    <Text
                        key={shape.id}
                        {...commonProps}
                        x={shape.x}
                        y={shape.y}
                        text={shape.text || ''}
                        fontSize={16}
                        width={shape.width}
                        onDblClick={() => {
                            // Handle text editing
                            const newText = prompt('Edit text:', shape.text || '');
                            if (newText !== null) {
                                const updates = { text: newText };
                                setShapes(prev => prev.map(s =>
                                    s.id === shape.id ? { ...s, ...updates } : s
                                ));
                                onShapeUpdate?.(shape.id, updates);
                            }
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Toolbar */}
            <Card className="mb-4">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Tool Selection */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={tool === 'select' ? 'default' : 'outline'}
                            onClick={() => setTool('select')}
                        >
                            <MousePointer className="w-4 h-4 mr-1" />
                            Select
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === 'rectangle' ? 'default' : 'outline'}
                            onClick={() => setTool('rectangle')}
                        >
                            <Square className="w-4 h-4 mr-1" />
                            Rectangle
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === 'circle' ? 'default' : 'outline'}
                            onClick={() => setTool('circle')}
                        >
                            <CircleIcon className="w-4 h-4 mr-1" />
                            Circle
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === 'line' ? 'default' : 'outline'}
                            onClick={() => setTool('line')}
                        >
                            <Minus className="w-4 h-4 mr-1" />
                            Line
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === 'freehand' ? 'default' : 'outline'}
                            onClick={() => setTool('freehand')}
                        >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Draw
                        </Button>
                        <Button
                            size="sm"
                            variant={tool === 'text' ? 'default' : 'outline'}
                            onClick={() => setTool('text')}
                        >
                            <span className="mr-1">T</span>
                            Text
                        </Button>
                    </div>

                    <Separator />

                    {/* Color and Style Controls */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-2 block">Stroke Color</label>
                            <div className="flex flex-wrap gap-1">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-6 h-6 rounded border-2 ${strokeColor === color ? 'border-gray-900' : 'border-gray-300'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setStrokeColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-2 block">Fill Color</label>
                            <div className="flex flex-wrap gap-1">
                                <button
                                    className={`w-6 h-6 rounded border-2 bg-white ${fillColor === '#transparent' ? 'border-gray-900' : 'border-gray-300'}`}
                                    onClick={() => setFillColor('#transparent')}
                                    style={{
                                        background: 'linear-gradient(-45deg, transparent 40%, red 40%, red 60%, transparent 60%)'
                                    }}
                                />
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`w-6 h-6 rounded border-2 ${fillColor === color ? 'border-gray-900' : 'border-gray-300'}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFillColor(color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-700 mb-2 block">
                                Stroke Width: {strokeWidth}px
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={duplicateSelected}
                            disabled={!selectedShapeId}
                        >
                            <Copy className="w-4 h-4 mr-1" />
                            Duplicate
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={deleteSelected}
                            disabled={!selectedShapeId}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </Button>
                    </div>

                    <Separator />

                    {/* Export */}
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={exportToPNG}>
                            <Download className="w-4 h-4 mr-1" />
                            PNG
                        </Button>
                        <Button size="sm" variant="outline" onClick={exportToJSON}>
                            <Download className="w-4 h-4 mr-1" />
                            JSON
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="text-xs text-gray-500 space-y-1">
                        <div>Shapes: {shapes.length}</div>
                        {selectedShapeId && (
                            <Badge variant="outline" className="text-xs">
                                Selected: {shapes.find(s => s.id === selectedShapeId)?.type}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <Stage
                    ref={stageRef}
                    width={width}
                    height={height}
                    onMouseDown={handleMouseDown}
                    onMousemove={handleMouseMove}
                    onMouseup={handleMouseUp}
                >
                    <Layer ref={layerRef}>
                        {/* Grid */}
                        {renderGrid()}

                        {/* Background zones */}
                        {renderZones()}

                        {/* Furniture */}
                        {renderFurniture()}

                        {/* User-drawn shapes */}
                        {shapes.map(renderShape)}

                        {/* Transformer for selected shapes */}
                        <Transformer
                            ref={transformerRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // Limit resize
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                        />
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}

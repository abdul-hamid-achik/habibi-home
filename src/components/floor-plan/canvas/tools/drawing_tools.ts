import { KonvaEventObject } from 'konva/lib/Node';
import {
  DrawingTool,
  DiagramShape,
  createRectangleShape,
  createCircleShape,
  createLineShape,
  createFreehandShape,
  createTextShape,
} from './diagram_schemas';

export interface DrawingState {
  tool: DrawingTool;
  isDrawing: boolean;
  currentPath: number[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
}

export interface DrawingCallbacks {
  onShapeAdd: (shape: DiagramShape) => void;
  onShapeUpdate: (id: string, updates: Partial<DiagramShape>) => void;
  onShapeDelete: (id: string) => void;
}

export class DrawingToolManager {
  private generateId = () => Math.random().toString(36).slice(2, 9);

  handleMouseDown(
    e: KonvaEventObject<MouseEvent>,
    state: DrawingState,
    callbacks: DrawingCallbacks,
  ): Partial<DrawingState> {
    if (state.tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        return {};
      }
      return {};
    }

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return {};

    const newShape = this.createShapeFromTool(
      state.tool,
      point.x,
      point.y,
      state.strokeColor,
      state.fillColor,
      state.strokeWidth
    );

    if (newShape) {
      callbacks.onShapeAdd(newShape);
      return {
        isDrawing: true,
        currentPath: state.tool === 'freehand' ? [0, 0] : [],
      };
    }

    return {};
  }

  handleMouseMove(
    e: KonvaEventObject<MouseEvent>,
    state: DrawingState,
    callbacks: DrawingCallbacks,
    shapes: DiagramShape[]
  ): Partial<DrawingState> {
    if (!state.isDrawing) return {};

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return {};

    const currentShape = shapes[shapes.length - 1];
    if (!currentShape) return {};

    switch (state.tool) {
      case 'rectangle':
        const dx = point.x - currentShape.x;
        const dy = point.y - currentShape.y;
        callbacks.onShapeUpdate(currentShape.id, {
          width: Math.abs(dx),
          height: Math.abs(dy),
        });
        break;

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(point.x - currentShape.x, 2) + Math.pow(point.y - currentShape.y, 2)
        );
        callbacks.onShapeUpdate(currentShape.id, { radius });
        break;

      case 'line':
        callbacks.onShapeUpdate(currentShape.id, {
          points: [currentShape.x, currentShape.y, point.x, point.y],
        });
        break;

      case 'freehand':
        const newPoints = [
          ...(state.currentPath || []),
          point.x - currentShape.x,
          point.y - currentShape.y,
        ];
        callbacks.onShapeUpdate(currentShape.id, { points: newPoints });
        return { currentPath: newPoints };
    }

    return {};
  }

  handleMouseUp(): Partial<DrawingState> {
    return {
      isDrawing: false,
      currentPath: [],
    };
  }

  private createShapeFromTool(
    tool: DrawingTool,
    x: number,
    y: number,
    strokeColor: string,
    fillColor: string,
    strokeWidth: number
  ): DiagramShape | null {
    const id = this.generateId();
    const options = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    };

    switch (tool) {
      case 'rectangle':
        return createRectangleShape(id, x, y, 1, 1, options);

      case 'circle':
        return createCircleShape(id, x, y, 1, options);

      case 'line':
        // Create a line with minimum valid points (will be updated as user drags)
        return createLineShape(id, [x, y, x + 1, y + 1], options);

      case 'freehand':
        // Create freehand with minimum valid points (will be updated as user draws)
        return createFreehandShape(id, x, y, [0, 0, 1, 1], options);

      case 'text':
        const text = prompt('Enter text:') || 'Text';
        return createTextShape(id, x, y, text, options);

      default:
        return null;
    }
  }
}

export const DRAWING_COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
];

export function duplicateShape(shape: DiagramShape, offsetX = 20, offsetY = 20): DiagramShape {
  const generateId = () => Math.random().toString(36).slice(2, 9);

  return {
    ...shape,
    id: generateId(),
    x: shape.x + offsetX,
    y: shape.y + offsetY,
  };
}

export function deleteShape(shapes: DiagramShape[], shapeId: string): DiagramShape[] {
  return shapes.filter(s => s.id !== shapeId);
}
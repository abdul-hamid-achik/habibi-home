"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Ruler, Target, RotateCcw, Minus } from 'lucide-react';

interface CalibrationPoint {
  x: number;
  y: number;
  id: number;
}

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasWidth: number;
  canvasHeight: number;
  currentScale: number;
  onScaleChange: (newScale: number) => void;
  unitSystem?: 'cm' | 'm';
}

export function CalibrationModal({
  isOpen,
  onClose,
  canvasWidth,
  canvasHeight,
  currentScale,
  onScaleChange,
  unitSystem = 'cm'
}: CalibrationModalProps) {

  const [step, setStep] = useState<'instructions' | 'measuring' | 'input' | 'confirm'>('instructions');
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [realDistance, setRealDistance] = useState<string>('');
  const [unit, setUnit] = useState<'cm' | 'm'>(unitSystem);
  const [straightLineMode, setStraightLineMode] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Calculate distance between two points in pixels
  const calculatePixelDistance = () => {
    if (points.length !== 2) return 0;
    const dx = points[1].x - points[0].x;
    const dy = points[1].y - points[0].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get formatted distance display
  const getFormattedDistance = (distance: number, unit: 'cm' | 'm') => {
    if (unit === 'm') {
      return `${(distance / 100).toFixed(1)} m`;
    }
    return `${distance.toFixed(1)} cm`;
  };

  // Calculate new scale
  const calculateNewScale = () => {
    const pixelDistance = calculatePixelDistance();
    const realDistanceCm = unit === 'cm' ? Number(realDistance) : Number(realDistance) * 100;

    if (pixelDistance === 0 || realDistanceCm === 0) return currentScale;

    return pixelDistance / realDistanceCm;
  };

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (step !== 'measuring') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (points.length === 0) {
      // First point
      setPoints([{ x, y, id: Date.now() }]);
    } else if (points.length === 1) {
      // Second point
      const firstPoint = points[0];

      if (straightLineMode || event.shiftKey) {
        // Snap to horizontal or vertical
        const dx = x - firstPoint.x;
        const dy = y - firstPoint.y;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Snap to horizontal
          setPoints(prev => [...prev, { x, y: firstPoint.y, id: Date.now() }]);
        } else {
          // Snap to vertical
          setPoints(prev => [...prev, { x: firstPoint.x, y, id: Date.now() }]);
        }
      } else {
        setPoints(prev => [...prev, { x, y, id: Date.now() }]);
      }

      setStep('input');
    }
  }, [step, points, straightLineMode]);

  // Reset calibration
  const resetCalibration = () => {
    setPoints([]);
    setRealDistance('');
    setStep('instructions');
    setStraightLineMode(false);
  };

  // Apply calibration
  const applyCalibration = () => {
    const newScale = calculateNewScale();
    onScaleChange(newScale);
    onClose();
    resetCalibration();
  };

  // Close and reset
  const handleClose = () => {
    resetCalibration();
    onClose();
  };

  const pixelDistance = calculatePixelDistance();
  const newScale = calculateNewScale();
  const scaleChange = ((newScale / currentScale - 1) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="flex space-x-4 max-w-6xl w-full mx-4">

        {/* Calibration Canvas */}
        <div className="flex-1">
          <Card className="h-[600px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  {step === 'instructions' && 'Click two points to measure'}
                  {step === 'measuring' && `Point ${points.length + 1} of 2`}
                  {(step === 'input' || step === 'confirm') && 'Measurement Complete'}
                </div>
                {step === 'measuring' && (
                  <Button
                    variant={straightLineMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStraightLineMode(!straightLineMode)}
                    className="ml-2"
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Straight Lines
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] p-0 relative overflow-hidden">
              <div
                ref={canvasRef}
                className={`w-full h-full border-2 border-dashed border-gray-300 relative ${step === 'measuring' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                onClick={handleCanvasClick}
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
                    ${straightLineMode && points.length === 1 ? ', linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)' : ''}
                  `,
                  backgroundSize: '20px 20px, 20px 20px'
                }}
              >
                {/* Instructions overlay */}
                {step === 'instructions' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6 bg-white rounded-lg shadow-lg border-2 border-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                      <h3 className="text-lg font-medium mb-2">Calibrate Scale</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Click two points on your floor plan that you know the real distance between.
                        This could be a wall, door, or any known measurement.
                      </p>
                      <div className="text-xs text-gray-500 mb-4 space-y-1">
                        <div>• <strong>Hold Shift</strong> while clicking second point for straight lines</div>
                        <div>• Use <strong>Straight Lines mode</strong> for horizontal/vertical measurements</div>
                        <div>• Blue guides appear when straight line mode is active</div>
                      </div>
                      <Button onClick={() => setStep('measuring')}>
                        Start Measuring
                      </Button>
                    </div>
                  </div>
                )}

                {/* Measurement points */}
                {points.map((point, index) => (
                  <div
                    key={point.id}
                    className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-2 z-10"
                    style={{ left: point.x, top: point.y }}
                  >
                    <div className="absolute -top-6 -left-1 text-xs font-bold text-blue-800 bg-white border-2 border-blue-400 px-2 py-1 rounded shadow-md">
                      {index + 1}
                    </div>
                  </div>
                ))}

                {/* Straight line guides */}
                {straightLineMode && points.length === 1 && (
                  <svg className="absolute inset-0 pointer-events-none z-5">
                    {/* Horizontal guide */}
                    <line
                      x1={0}
                      y1={points[0].y}
                      x2={canvasWidth}
                      y2={points[0].y}
                      stroke="#3b82f6"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                    {/* Vertical guide */}
                    <line
                      x1={points[0].x}
                      y1={0}
                      x2={points[0].x}
                      y2={canvasHeight}
                      stroke="#3b82f6"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      opacity="0.6"
                    />
                    {/* Guide labels */}
                    <text
                      x={10}
                      y={points[0].y - 10}
                      className="text-xs font-medium fill-blue-600"
                      style={{ filter: 'drop-shadow(1px 1px 1px white)' }}
                    >
                      Horizontal
                    </text>
                    <text
                      x={points[0].x + 10}
                      y={20}
                      className="text-xs font-medium fill-blue-600"
                      style={{ filter: 'drop-shadow(1px 1px 1px white)' }}
                    >
                      Vertical
                    </text>
                  </svg>
                )}

                {/* Measurement line */}
                {points.length === 2 && (
                  <svg className="absolute inset-0 pointer-events-none z-5">
                    <line
                      x1={points[0].x}
                      y1={points[0].y}
                      x2={points[1].x}
                      y2={points[1].y}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                    {/* Distance label */}
                    <text
                      x={(points[0].x + points[1].x) / 2}
                      y={(points[0].y + points[1].y) / 2 - 10}
                      textAnchor="middle"
                      className="text-xs font-bold fill-blue-600"
                      style={{ filter: 'drop-shadow(1px 1px 1px white)' }}
                    >
                      {pixelDistance.toFixed(0)} px ({getFormattedDistance(pixelDistance / currentScale, unit)})
                    </text>
                  </svg>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="w-80">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <div className="flex items-center">
                <Ruler className="w-5 h-5 mr-2" />
                Scale Calibration
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Step {Math.max(1, ['instructions', 'measuring', 'input', 'confirm'].indexOf(step) + 1)} of 3</span>
                <span>{points.length}/2 points</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(step === 'instructions' ? 0 : step === 'measuring' ? 33 : step === 'input' ? 66 : 100)}%`
                  }}
                />
              </div>
            </div>

            {/* Current measurement */}
            {points.length > 0 && (
              <div className="space-y-3 p-3 bg-gray-200 border border-gray-400 rounded">
                <div className="text-sm font-medium">Current Measurement</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-600">Points</div>
                    <div>{points.length}/2 placed</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Distance</div>
                    <div>{pixelDistance.toFixed(0)} pixels</div>
                    <div className="text-xs text-gray-500">
                      {points.length === 2 && getFormattedDistance(pixelDistance / currentScale, unit)}
                    </div>
                  </div>
                </div>
                {straightLineMode && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Straight Line Mode:</strong> Second point will snap to horizontal or vertical
                  </div>
                )}
                {points.length === 2 && (
                  <div className="text-xs text-gray-600">
                    <strong>Tip:</strong> {straightLineMode ? 'Disable' : 'Enable'} straight lines or hold Shift for one-time use
                  </div>
                )}
              </div>
            )}

            {/* Real distance input */}
            {(step === 'input' || step === 'confirm') && points.length === 2 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Real Distance</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Enter distance"
                    value={realDistance}
                    onChange={(e) => setRealDistance(e.target.value)}
                    className="flex-1"
                    min="0.1"
                    step="0.1"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as 'cm' | 'm')}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="cm">cm</option>
                    <option value="m">m</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  Enter the real-world distance between the two points you clicked.
                </p>
              </div>
            )}

            {/* Calibration preview */}
            {realDistance && Number(realDistance) > 0 && (
              <div className="space-y-3 p-3 bg-blue-200 border border-blue-400 rounded">
                <div className="text-sm font-medium text-blue-800">Calibration Preview</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-blue-600">Current Scale</div>
                    <div>{currentScale.toFixed(3)} px/cm</div>
                  </div>
                  <div>
                    <div className="text-blue-600">New Scale</div>
                    <div>{newScale.toFixed(3)} px/cm</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-blue-600">Scale Change</div>
                    <div className={scaleChange > 0 ? 'text-green-600' : 'text-red-600'}>
                      {scaleChange > 0 ? '+' : ''}{scaleChange.toFixed(1)}%
                      {scaleChange > 0 ? ' (zoom in)' : ' (zoom out)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {step === 'instructions' && (
                <Button onClick={() => setStep('measuring')} className="w-full">
                  Start Calibration
                </Button>
              )}

              {step === 'measuring' && points.length > 0 && (
                <Button
                  variant="outline"
                  onClick={resetCalibration}
                  className="w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Points
                </Button>
              )}

              {(step === 'input' || step === 'confirm') && (
                <div className="space-y-2">
                  <Button
                    onClick={applyCalibration}
                    disabled={!realDistance || Number(realDistance) <= 0}
                    className="w-full"
                  >
                    Apply Calibration
                  </Button>
                  <Button variant="outline" onClick={resetCalibration} className="w-full">
                    Start Over
                  </Button>
                </div>
              )}

              <Button variant="ghost" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
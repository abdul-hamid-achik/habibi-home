"use client";

import React, { useState, useRef } from 'react';

interface BackgroundLayerProps {
  // Image properties
  url?: string;
  opacity?: number;
  scale?: number; // image-local scale
  rotation?: number;
  offsetX?: number; // in cm
  offsetY?: number; // in cm
  locked?: boolean;
  
  // Canvas properties
  canvasWidth: number;
  canvasHeight: number;
  editorScale: number; // px per cm
  
  // Callbacks
  onImageUpdate?: (updates: {
    opacity?: number;
    scale?: number;
    rotation?: number;
    offsetX?: number;
    offsetY?: number;
    locked?: boolean;
  }) => void;
  onImageLoad?: (dimensions: { width: number; height: number }) => void;
}

export function BackgroundLayer({
  url,
  opacity = 0.6,
  scale = 1.0,
  rotation = 0,
  offsetX = 0,
  offsetY = 0,
  locked = false,
  canvasWidth,
  canvasHeight,
  editorScale,
  onImageUpdate,
  onImageLoad
}: BackgroundLayerProps) {
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Convert cm to pixels
  const cm2px = (cm: number) => cm * editorScale;
  const px2cm = (px: number) => px / editorScale;
  
  // Handle image load
  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
      onImageLoad?.({ width: naturalWidth, height: naturalHeight });
    }
  };
  
  // Calculate display dimensions
  const getDisplayDimensions = () => {
    if (!imageNaturalSize) return { width: 0, height: 0 };
    
    const displayWidth = imageNaturalSize.width * scale;
    const displayHeight = imageNaturalSize.height * scale;
    
    return { width: displayWidth, height: displayHeight };
  };
  
  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (locked) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  // Handle drag move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || locked) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newOffsetX = offsetX + px2cm(deltaX);
    const newOffsetY = offsetY + px2cm(deltaY);
    
    onImageUpdate?.({
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  // Handle wheel event for scaling
  const handleWheel = (e: React.WheelEvent) => {
    if (locked) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5.0, scale * delta));
    
    onImageUpdate?.({ scale: newScale });
  };
  
  if (!url) {
    return null;
  }
  
  const displayDimensions = getDisplayDimensions();
  
  return (
    <div
      className="absolute top-0 left-0 pointer-events-auto select-none"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        overflow: 'hidden'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        ref={imageRef}
        src={url}
        alt="Floor plan background"
        className={`absolute transition-opacity duration-200 ${
          isDragging ? 'cursor-grabbing' : locked ? 'cursor-default' : 'cursor-grab'
        }`}
        style={{
          left: cm2px(offsetX),
          top: cm2px(offsetY),
          width: displayDimensions.width,
          height: displayDimensions.height,
          opacity: opacity,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'top left',
          userSelect: 'none',
          pointerEvents: locked ? 'none' : 'auto'
        }}
        onLoad={handleImageLoad}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        draggable={false}
      />
      
      {/* Lock indicator */}
      {locked && (
        <div className="absolute top-2 left-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-2 py-1 rounded text-xs">
          Background Locked
        </div>
      )}
      
      {/* Scale indicator */}
      {!locked && imageNaturalSize && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
          Scale: {(scale * 100).toFixed(0)}%
          <br />
          Size: {Math.round(displayDimensions.width)} × {Math.round(displayDimensions.height)}px
        </div>
      )}
      
      {/* Rotation handle */}
      {!locked && (
        <div
          className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full cursor-pointer shadow-lg"
          style={{
            left: cm2px(offsetX) + displayDimensions.width + 10,
            top: cm2px(offsetY) + displayDimensions.height / 2 - 12,
            transform: `rotate(${rotation}deg)`
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            // TODO: Implement rotation handle logic
          }}
          title="Drag to rotate"
        >
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
            ↻
          </div>
        </div>
      )}
    </div>
  );
}
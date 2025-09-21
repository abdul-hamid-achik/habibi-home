"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Image, ExternalLink } from 'lucide-react';

interface BackgroundSettings {
  url: string;
  opacity: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  locked: boolean;
}

interface BackgroundImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (settings: BackgroundSettings) => void;
  currentSettings?: Partial<BackgroundSettings>;
}

export function BackgroundImportModal({
  isOpen,
  onClose,
  onImport,
  currentSettings
}: BackgroundImportModalProps) {
  
  const [importMethod, setImportMethod] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState<string>(currentSettings?.url || '');
  const [opacity, setOpacity] = useState<number>(currentSettings?.opacity || 0.6);
  const [scale, setScale] = useState<number>(currentSettings?.scale || 1.0);
  const [rotation, setRotation] = useState<number>(currentSettings?.rotation || 0);
  const [locked, setLocked] = useState<boolean>(currentSettings?.locked || true);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // For demo purposes, create a local object URL
    // In a real app, you'd upload to your server/cloud storage
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Apply import
  const handleImport = () => {
    if (!imageUrl) {
      alert('Please provide an image URL or upload a file');
      return;
    }
    
    const settings: BackgroundSettings = {
      url: imageUrl,
      opacity,
      scale,
      rotation,
      offsetX: 0,
      offsetY: 0,
      locked
    };
    
    onImport(settings);
    onClose();
  };
  
  // Reset form
  const handleReset = () => {
    setImageUrl('');
    setOpacity(0.6);
    setScale(1.0);
    setRotation(0);
    setLocked(true);
    setUploadProgress(0);
    setIsUploading(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-96 max-h-[80vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <div className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Import Background
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Import Method */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Import Method</Label>
            <div className="flex space-x-2">
              <Button
                variant={importMethod === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMethod('upload')}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant={importMethod === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImportMethod('url')}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                From URL
              </Button>
            </div>
          </div>
          
          {/* File Upload */}
          {importMethod === 'upload' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Upload Image</Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* URL Input */}
          {importMethod === 'url' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Image URL</Label>
              <Input
                placeholder="https://example.com/floorplan.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Direct link to an image file (JPG, PNG, GIF)
              </p>
            </div>
          )}
          
          {/* Image Preview */}
          {imageUrl && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={imageUrl}
                  alt="Background preview"
                  className="w-full h-32 object-contain rounded"
                  style={{ opacity }}
                />
              </div>
            </div>
          )}
          
          {/* Settings */}
          {imageUrl && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Background Settings</Label>
              
              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Opacity</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <Slider
                  value={[opacity]}
                  onValueChange={([value]) => setOpacity(value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              {/* Scale */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Scale</span>
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                <Slider
                  value={[scale]}
                  onValueChange={([value]) => setScale(value)}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Rotation</span>
                  <span>{rotation}°</span>
                </div>
                <Slider
                  value={[rotation]}
                  onValueChange={([value]) => setRotation(value)}
                  min={-180}
                  max={180}
                  step={15}
                  className="w-full"
                />
              </div>
              
              {/* Lock Background */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Lock Background</Label>
                  <p className="text-xs text-gray-500">Prevent accidental moving</p>
                </div>
                <Switch
                  checked={locked}
                  onCheckedChange={setLocked}
                />
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {imageUrl && (
              <Button variant="ghost" onClick={handleReset} className="flex-1">
                Reset
              </Button>
            )}
            <Button 
              onClick={handleImport} 
              disabled={!imageUrl || isUploading}
              className="flex-1"
            >
              Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
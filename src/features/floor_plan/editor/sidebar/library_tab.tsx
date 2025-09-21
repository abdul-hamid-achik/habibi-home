"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  Search,
  X,
  Sofa,
  Armchair,
  Table,
  Monitor,
  Bed,
  Zap,
  Leaf,
  RefreshCw,
  Plus
} from 'lucide-react';
import { getAllFurnitureLegacy } from '@/features/floor_plan/furniture';

interface LibraryTabProps {
  onAddFurniture: (catalogName: string) => void;
  onReplaceFurniture?: (catalogName: string) => void;
  furnitureCount: number;
  isReplaceMode?: boolean;
  selectedFurnitureName?: string;
  onDragStart?: (furnitureName: string, event: React.DragEvent) => void;
}

export function LibraryTab({
  onAddFurniture,
  onReplaceFurniture,
  furnitureCount,
  isReplaceMode = false,
  selectedFurnitureName,
  onDragStart
}: LibraryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    sofa: <Sofa className="w-4 h-4" />,
    chair: <Armchair className="w-4 h-4" />,
    table: <Table className="w-4 h-4" />,
    desk: <Monitor className="w-4 h-4" />,
    bed: <Bed className="w-4 h-4" />,
    storage: <Package className="w-4 h-4" />,
    appliance: <Zap className="w-4 h-4" />,
    electronics: <Monitor className="w-4 h-4" />,
    decor: <Leaf className="w-4 h-4" />,
  };

  // Get furniture from registry
  const furnitureCatalog = useMemo(() => getAllFurnitureLegacy(), []);

  // Filter furniture based on search and category
  const filteredFurniture = useMemo(() => {
    return furnitureCatalog.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;

      // In replace mode, exclude the currently selected furniture
      const isNotCurrentItem = !isReplaceMode || item.name !== selectedFurnitureName;

      return matchesSearch && matchesCategory && isNotCurrentItem;
    });
  }, [searchTerm, selectedCategory, isReplaceMode, selectedFurnitureName, furnitureCatalog]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = [...new Set(furnitureCatalog.map(item => item.category))];
    return categories.map(category => {
      const categoryData = {
        sofa: { name: "Sofas", icon: <Sofa className="w-4 h-4" /> },
        chair: { name: "Chairs", icon: <Armchair className="w-4 h-4" /> },
        table: { name: "Tables", icon: <Table className="w-4 h-4" /> },
        desk: { name: "Desks", icon: <Monitor className="w-4 h-4" /> },
        bed: { name: "Beds", icon: <Bed className="w-4 h-4" /> },
        storage: { name: "Storage", icon: <Package className="w-4 h-4" /> },
        appliance: { name: "Appliances", icon: <Zap className="w-4 h-4" /> },
        electronics: { name: "Electronics", icon: <Monitor className="w-4 h-4" /> },
        decor: { name: "Decor", icon: <Leaf className="w-4 h-4" /> },
      }[category] || { name: category, icon: <Package className="w-4 h-4" /> };
      return { id: category, ...categoryData };
    });
  }, [furnitureCatalog]);

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center">
              {isReplaceMode ? (
                <RefreshCw className="w-4 h-4 mr-2" />
              ) : (
                <Package className="w-4 h-4 mr-2" />
              )}
              {isReplaceMode ? 'Replace Furniture' : 'Furniture Library'}
            </div>
            <div className="text-xs text-gray-500">
              {isReplaceMode ? 'Choose replacement' : `${furnitureCount} placed`}
            </div>
          </CardTitle>
          <div className="relative mt-2">
            <Input
              placeholder="Search furniture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-10 h-8 text-xs"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-10">
              {searchTerm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <div className="flex items-center justify-center w-6 h-6">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 flex flex-col h-full">
          {/* Replace Mode Notice */}
          {isReplaceMode && selectedFurnitureName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
              <div className="text-xs font-medium mb-1">Replacing: {selectedFurnitureName}</div>
              <div className="text-xs">Click any item below to replace the selected furniture. Position and rotation will be preserved.</div>
            </div>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs h-7 px-2"
            >
              All
            </Button>
            {availableCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs h-7 px-2"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Furniture Items */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {filteredFurniture.map(item => (
              <div
                key={item.name}
                className="group flex items-center justify-between p-2.5 border rounded hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-grab"
                draggable={!!onDragStart}
                onDragStart={(e) => onDragStart?.(item.name, e)}
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded border"
                    style={{ backgroundColor: item.color + '30', borderColor: item.color }}>
                    {categoryIcons[item.category]}
                  </div>
                  <div className="flex-1 min-w-0 ml-2">
                    <div className="text-xs font-medium text-gray-900 truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.width}×{item.height} cm
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: item.color, borderColor: item.color }}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (isReplaceMode && onReplaceFurniture) {
                      onReplaceFurniture(item.name);
                    } else {
                      onAddFurniture(item.name);
                    }
                  }}
                  className="h-6 px-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity mr-2"
                >
                  {isReplaceMode ? (
                    <RefreshCw className="w-3 h-3" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          {filteredFurniture.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No furniture found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, X, Package, Sofa, Armchair, Table, Monitor, Bed, Zap, Leaf } from "lucide-react";
import { DEFAULT_FURNITURE_CATALOG } from "@/lib/furniture-catalog";
import { FURNITURE_CATEGORIES } from "@/components/floor-plan/data/categories";
import { format_dimension } from "../../utils/units";

interface FurnitureCatalogProps {
    furnitureCount: number;
    onAddFurniture: (catalogName: string) => void;
    unitSystem?: 'cm' | 'm';
}

export function FurnitureCatalog({ furnitureCount, onAddFurniture, unitSystem = 'cm' }: FurnitureCatalogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

    const filteredFurniture = useMemo(() => {
        return DEFAULT_FURNITURE_CATALOG.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = !selectedCategory || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory]);

    const getCategoryIcon = (categoryId: string) => {
        const iconMap = {
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
        return iconMap[categoryId as keyof typeof iconMap] || <Package className="w-4 h-4" />;
    };

    const availableCategories = useMemo(() => {
        return FURNITURE_CATEGORIES.map(category => ({
            ...category,
            icon: getCategoryIcon(category.id)
        }));
    }, []);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center">
                        <Sofa className="w-4 h-4 mr-2" />
                        Furniture Catalog
                    </div>
                    <div className="text-xs text-gray-500">{furnitureCount} items</div>
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
            <CardContent className="space-y-3 pt-0">
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

                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredFurniture.map(item => (
                        <div
                            key={item.name}
                            className="group flex items-center justify-between p-2.5 border rounded hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
                        >
                            <div className="flex items-center space-x-2.5 flex-1 min-w-0 mr-2">
                                <div className="flex items-center justify-center w-6 h-6 rounded border"
                                    style={{ backgroundColor: item.color + '30', borderColor: item.color }}>
                                    {categoryIcons[item.category]}
                                </div>
                                <div className="flex-1 min-w-0 ml-2">
                                    <div className="text-xs font-medium text-gray-900 truncate">{item.name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {format_dimension(item.width, unitSystem)}×{format_dimension(item.height, unitSystem)}
                                    </div>
                                </div>
                                <div
                                    className="w-3 h-3 rounded border"
                                    style={{ backgroundColor: item.color, borderColor: item.color }}
                                />
                            </div>
                            <Button
                                size="sm"
                                onClick={() => onAddFurniture(item.name)}
                                className="h-6 px-2 text-xs opacity-70 group-hover:opacity-100 transition-opacity mr-2"
                            >
                                +
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
    );
}
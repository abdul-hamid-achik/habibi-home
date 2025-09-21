import { create } from 'zustand';
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings, saveProjectDataSchema, zoneSchema, furnitureItemSchema } from '@/types';
import { DiagramShape, DrawingTool, validateShapes } from '../canvas/tools/diagram_schemas';

// Editor mode type
export type EditorMode = 'zones' | 'furniture' | 'diagrams';

// Store state interface
export interface EditorState {
  // Core data
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  diagrams: DiagramShape[];

  // Diagram selection
  selectedDiagramId: string | null;

  // Actions for diagram selection
  setSelectedDiagramId: (id: string | null) => void;

  // UI state
  editorMode: EditorMode;
  selectedZoneId: string | null;
  selectedFurnitureId: string | null;
  showAIImport: boolean;
  showKeyboardShortcuts: boolean;
  sidebarCollapsed: boolean;

  // Drawing state
  currentDiagramTool: DrawingTool;
  diagramStrokeColor: string;
  diagramFillColor: string;
  diagramStrokeWidth: number;

  // Actions for drawing state
  setCurrentDiagramTool: (tool: DrawingTool) => void;
  setDiagramStrokeColor: (color: string) => void;
  setDiagramFillColor: (color: string) => void;
  setDiagramStrokeWidth: (width: number) => void;

  // Actions
  setZones: (zones: FloorPlanZone[] | ((prev: FloorPlanZone[]) => FloorPlanZone[])) => void;
  setFurniture: (furniture: FurnitureItemType[] | ((prev: FurnitureItemType[]) => FurnitureItemType[])) => void;
  setSettings: (settings: FloorPlanSettings | ((prev: FloorPlanSettings) => FloorPlanSettings)) => void;
  setDiagrams: (diagrams: DiagramShape[] | ((prev: DiagramShape[]) => DiagramShape[])) => void;

  setEditorMode: (mode: EditorMode) => void;
  setSelectedZoneId: (id: string | null) => void;
  setSelectedFurnitureId: (id: string | null) => void;
  setShowAIImport: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Composite actions
  updateZone: (id: string, updates: Partial<FloorPlanZone>) => void;
  deleteZone: (id: string) => void;
  addZone: (zone: Omit<FloorPlanZone, 'id'>) => void;

  updateFurniture: (id: string, updates: Partial<FurnitureItemType>) => void;
  deleteFurniture: (id: string) => void;
  addFurniture: (furniture: Omit<FurnitureItemType, 'id'>) => void;

  updateSettings: (updates: Partial<FloorPlanSettings>) => void;

  // Bulk operations with validation
  loadData: (data: {
    zones?: FloorPlanZone[];
    furniture?: FurnitureItemType[];
    settings?: Partial<FloorPlanSettings>;
    diagrams?: unknown[];
  }) => void;

  resetToDefaults: () => void;

  // Validation helpers
  validateAndSaveData: () => {
    zones: FloorPlanZone[];
    furniture: FurnitureItemType[];
    settings: FloorPlanSettings;
    diagrams: DiagramShape[];
  } | null;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).slice(2, 9);

// Default settings
const DEFAULT_SETTINGS: FloorPlanSettings = {
  scale: 0.9,
  snap: 5,
  showGrid: true,
  showDimensions: true,
  apartmentWidth: 1050,
  apartmentHeight: 800,
  canvasMode: 'adaptive',
  maxCanvasWidth: 1200,
  maxCanvasHeight: 800,
  showZones: true,
  showFurniture: true,
  showDiagrams: true,
  unitSystem: 'cm',
};

// Create the store
export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  zones: [],
  furniture: [],
  settings: DEFAULT_SETTINGS,
  diagrams: [],

  editorMode: 'zones',
  selectedZoneId: null,
  selectedFurnitureId: null,
  selectedDiagramId: null,
  showAIImport: false,
  showKeyboardShortcuts: false,
  sidebarCollapsed: false,

  // Drawing state
  currentDiagramTool: 'select' as DrawingTool,
  diagramStrokeColor: '#000000',
  diagramFillColor: 'transparent',
  diagramStrokeWidth: 2,

  // Basic setters with function support
  setZones: (zones) => set((state) => ({
    zones: typeof zones === 'function' ? zones(state.zones) : zones
  })),

  setFurniture: (furniture) => set((state) => ({
    furniture: typeof furniture === 'function' ? furniture(state.furniture) : furniture
  })),

  setSettings: (settings) => set((state) => ({
    settings: typeof settings === 'function' ? settings(state.settings) : settings
  })),

  setDiagrams: (diagrams) => set((state) => ({
    diagrams: typeof diagrams === 'function' ? diagrams(state.diagrams) : diagrams
  })),

  // UI state setters
  setEditorMode: (editorMode) => set({ editorMode }),
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  setSelectedFurnitureId: (selectedFurnitureId) => set({ selectedFurnitureId }),
  setSelectedDiagramId: (selectedDiagramId) => set({ selectedDiagramId }),
  setShowAIImport: (showAIImport) => set({ showAIImport }),
  setShowKeyboardShortcuts: (showKeyboardShortcuts) => set({ showKeyboardShortcuts }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  // Drawing state setters
  setCurrentDiagramTool: (tool) => set({ currentDiagramTool: tool }),
  setDiagramStrokeColor: (color) => set({ diagramStrokeColor: color }),
  setDiagramFillColor: (color) => set({ diagramFillColor: color }),
  setDiagramStrokeWidth: (width) => set({ diagramStrokeWidth: width }),

  // Zone operations
  updateZone: (id, updates) => set((state) => ({
    zones: state.zones.map(zone => zone.id === id ? { ...zone, ...updates } : zone)
  })),

  deleteZone: (id) => set((state) => ({
    zones: state.zones.filter(zone => zone.id !== id)
  })),

  addZone: (zone) => set((state) => ({
    zones: [...state.zones, { ...zone, id: generateId() }]
  })),

  // Furniture operations
  updateFurniture: (id, updates) => set((state) => ({
    furniture: state.furniture.map(item => item.id === id ? { ...item, ...updates } : item)
  })),

  deleteFurniture: (id) => set((state) => ({
    furniture: state.furniture.filter(item => item.id !== id)
  })),

  addFurniture: (furniture) => set((state) => ({
    furniture: [...state.furniture, { ...furniture, id: generateId() }]
  })),

  // Settings operations
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),

  // Bulk operations with validation
  loadData: (data) => {
    const state = get();
    const updates: Partial<EditorState> = {};

    // Validate and load zones
    if (data.zones) {
      try {
        const validatedZones = data.zones.map(zone => zoneSchema.parse(zone));
        updates.zones = validatedZones;
      } catch (error) {
        console.warn('Invalid zones data, keeping current zones:', error);
      }
    }

    // Validate and load furniture
    if (data.furniture) {
      try {
        const validatedFurniture = data.furniture.map(item => furnitureItemSchema.parse(item));
        updates.furniture = validatedFurniture;
      } catch (error) {
        console.warn('Invalid furniture data, keeping current furniture:', error);
      }
    }

    // Validate and load settings
    if (data.settings) {
      try {
        // Merge with current settings to ensure all required fields
        const mergedSettings = { ...state.settings, ...data.settings };
        updates.settings = mergedSettings;
      } catch (error) {
        console.warn('Invalid settings data, keeping current settings:', error);
      }
    }

    // Validate and load diagrams
    if (data.diagrams && Array.isArray(data.diagrams)) {
      try {
        const validatedDiagrams = validateShapes(data.diagrams);
        updates.diagrams = validatedDiagrams;
      } catch (error) {
        console.warn('Invalid diagrams data, keeping current diagrams:', error);
      }
    }

    // Apply updates
    set(updates);
  },

  resetToDefaults: () => {
    // For now, provide minimal defaults - this can be enhanced later
    set({
      zones: [],
      furniture: [],
      settings: DEFAULT_SETTINGS,
      diagrams: [],
      editorMode: 'zones',
    });
  },

  // Validation for save operations
  validateAndSaveData: () => {
    const state = get();

    try {
      // Validate the complete data structure
      const validationResult = saveProjectDataSchema.safeParse({
        zones: state.zones,
        furniture: state.furniture,
        settings: state.settings
      });

      if (validationResult.success) {
        return {
          zones: state.zones,
          furniture: state.furniture,
          settings: state.settings,
          diagrams: state.diagrams,
        };
      } else {
        console.warn('Data validation failed:', validationResult.error);
        return null;
      }
    } catch (error) {
      console.warn('Data validation error:', error);
      return null;
    }
  },
}));
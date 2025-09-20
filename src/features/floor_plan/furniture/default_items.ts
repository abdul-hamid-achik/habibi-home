import { FurnitureRegistryEntry } from "./registry";

// Default furniture items with snake_case IDs and comprehensive metadata
export const DEFAULT_FURNITURE_ITEMS: Record<string, FurnitureRegistryEntry> = {
  // Sofas / Seating
  large_sofa: {
    id: "large_sofa",
    name: "Large Sofa",
    category: "sofa",
    dimensions: {
      width: 205,
      height: 100,
      depth: 90,
    },
    appearance: {
      color: "#2b5db9",
      opacity: 1,
    },
    metadata: {
      description: "Spacious 3-seater sofa perfect for living rooms",
      tags: ["3-seater", "family", "comfortable"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    placement: {
      allowedZones: ["living", "study"],
      requiredClearance: {
        front: 80, // Space for people to walk around
        back: 20,
        left: 30,
        right: 30,
      },
    },
    renderer: {
      type: "basic",
      config: {
        cornerRadius: 8,
        showLabel: true,
      },
    },
  },

  small_sofa: {
    id: "small_sofa",
    name: "Small Sofa",
    category: "sofa",
    dimensions: {
      width: 107,
      height: 100,
      depth: 85,
    },
    appearance: {
      color: "#2b9b6b",
      opacity: 1,
    },
    metadata: {
      description: "Compact 2-seater sofa for smaller spaces",
      tags: ["2-seater", "compact", "apartment"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    placement: {
      allowedZones: ["living", "study", "bedroom2"],
      requiredClearance: {
        front: 60,
        back: 15,
        left: 25,
        right: 25,
      },
    },
    renderer: {
      type: "basic",
      config: {
        cornerRadius: 6,
        showLabel: true,
      },
    },
  },

  medium_sofa: {
    id: "medium_sofa",
    name: "Medium Sofa",
    category: "sofa",
    dimensions: {
      width: 160,
      height: 100,
      depth: 88,
    },
    appearance: {
      color: "#6a8bd7",
      opacity: 1,
    },
    metadata: {
      description: "Versatile medium-sized sofa",
      tags: ["2.5-seater", "versatile", "modern"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    renderer: {
      type: "basic",
    },
  },

  armchair: {
    id: "armchair",
    name: "Armchair",
    category: "chair",
    dimensions: {
      width: 80,
      height: 85,
      depth: 75,
    },
    appearance: {
      color: "#7c5f3e",
      opacity: 1,
    },
    metadata: {
      description: "Comfortable single-seat armchair",
      tags: ["single-seat", "reading", "accent"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 45, // More flexible rotation for chairs
    },
    renderer: {
      type: "basic",
    },
  },

  // Tables
  dining_table_large: {
    id: "dining_table_large",
    name: "Dining Table (Large)",
    category: "table",
    dimensions: {
      width: 121,
      height: 245,
      depth: 90,
    },
    appearance: {
      color: "#b98a2b",
      opacity: 1,
    },
    metadata: {
      description: "Large dining table for 6-8 people",
      tags: ["dining", "large", "family", "6-8-seats"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["dining", "living"],
      requiredClearance: {
        front: 90, // Chair space
        back: 90,
        left: 90,
        right: 90,
      },
    },
    renderer: {
      type: "basic",
      config: {
        showLabel: true,
        labelSize: "small",
      },
    },
  },

  coffee_table: {
    id: "coffee_table",
    name: "Coffee Table",
    category: "table",
    dimensions: {
      width: 120,
      height: 60,
      depth: 50,
    },
    appearance: {
      color: "#8b6914",
      opacity: 1,
    },
    metadata: {
      description: "Low table for living room center",
      tags: ["coffee", "living-room", "center"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["living", "study"],
      requiredClearance: {
        front: 40,
        back: 40,
        left: 50,
        right: 50,
      },
    },
    renderer: {
      type: "basic",
    },
  },

  // Beds
  queen_bed: {
    id: "queen_bed",
    name: "Queen Bed",
    category: "bed",
    dimensions: {
      width: 213,
      height: 158,
      depth: 200,
    },
    appearance: {
      color: "#b92b2b",
      opacity: 1,
    },
    metadata: {
      description: "Standard queen size bed",
      tags: ["queen", "double", "bedroom"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["master_bedroom", "bedroom2"],
      requiredClearance: {
        front: 70, // Space to get out of bed
        back: 30,
        left: 60,
        right: 60,
      },
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    renderer: {
      type: "basic",
      config: {
        showLabel: true,
        cornerRadius: 4,
      },
    },
  },

  single_bed: {
    id: "single_bed",
    name: "Single Bed",
    category: "bed",
    dimensions: {
      width: 90,
      height: 190,
      depth: 200,
    },
    appearance: {
      color: "#c53030",
      opacity: 1,
    },
    metadata: {
      description: "Single bed for guest rooms or children",
      tags: ["single", "guest", "children"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["bedroom2", "study"],
    },
    renderer: {
      type: "basic",
    },
  },

  // Storage
  dresser: {
    id: "dresser",
    name: "Dresser",
    category: "storage",
    dimensions: {
      width: 112,
      height: 45,
      depth: 50,
    },
    appearance: {
      color: "#5a5a5a",
      opacity: 1,
    },
    metadata: {
      description: "Bedroom storage dresser",
      tags: ["storage", "bedroom", "clothes"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["master_bedroom", "bedroom2"],
      wallDistance: {
        min: 0, // Can be against wall
        max: 20,
      },
    },
    renderer: {
      type: "basic",
    },
  },

  // Appliances
  refrigerator: {
    id: "refrigerator",
    name: "Refrigerator",
    category: "appliance",
    dimensions: {
      width: 60,
      height: 70,
      depth: 65,
    },
    appearance: {
      color: "#e6e6e6",
      opacity: 1,
    },
    metadata: {
      description: "Standard kitchen refrigerator",
      tags: ["kitchen", "appliance", "essential"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["kitchen"],
      wallDistance: {
        min: 0,
        max: 5, // Should be near wall for electrical
      },
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: false, // Appliances typically don't rotate
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    renderer: {
      type: "basic",
      config: {
        cornerRadius: 2,
      },
    },
  },

  tv_55_inch: {
    id: "tv_55_inch",
    name: "55\" TV",
    category: "electronics",
    dimensions: {
      width: 123,
      height: 7,
      depth: 25,
    },
    appearance: {
      color: "#1a1a1a",
      opacity: 1,
    },
    metadata: {
      description: "55-inch flat screen television",
      tags: ["tv", "entertainment", "55-inch"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    placement: {
      allowedZones: ["living", "study", "master_bedroom"],
      wallDistance: {
        min: 0, // Wall-mounted or against wall
        max: 10,
      },
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: true,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    renderer: {
      type: "basic",
      config: {
        cornerRadius: 1,
        showLabel: true,
      },
    },
  },

  // Decor
  large_plant: {
    id: "large_plant",
    name: "Large Plant",
    category: "decor",
    dimensions: {
      width: 40,
      height: 40,
      depth: 40,
    },
    appearance: {
      color: "#228b22",
      opacity: 1,
    },
    metadata: {
      description: "Large decorative plant",
      tags: ["decor", "plant", "natural"],
      isDefault: true,
      version: "1.0.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    behavior: {
      isMovable: true,
      isResizable: false,
      isRotatable: false,
      snapToGrid: true,
      minRotation: 0,
      maxRotation: 360,
      rotationStep: 90,
    },
    renderer: {
      type: "basic",
      config: {
        cornerRadius: 20, // Circular plant pot
      },
    },
  },
};
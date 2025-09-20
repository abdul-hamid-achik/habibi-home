/**
 * Seed data for floor plan editor
 * Provides default apartment zones and furniture layouts
 */

export interface SeedZone {
  zoneId: string;
  name: string;
  x: number;    // cm
  y: number;    // cm  
  w: number;    // cm
  h: number;    // cm
  color?: string;
}

export interface SeedFurniture {
  name: string;
  x: number;    // cm
  y: number;    // cm
  r: number;    // rotation in degrees
  zoneId: string;
}

// Default apartment zones (based on a typical 2-bedroom layout)
export const DEFAULT_APARTMENT_ZONES: SeedZone[] = [
  {
    zoneId: "living_room",
    name: "Living Room",
    x: 50,
    y: 50,
    w: 400,
    h: 300,
    color: "#e3f2fd"
  },
  {
    zoneId: "kitchen",
    name: "Kitchen", 
    x: 460,
    y: 50,
    w: 250,
    h: 200,
    color: "#f3e5f5"
  },
  {
    zoneId: "dining",
    name: "Dining Area",
    x: 460,
    y: 260,
    w: 250,
    h: 140,
    color: "#fff3e0"
  },
  {
    zoneId: "master_bedroom",
    name: "Master Bedroom",
    x: 50,
    y: 360,
    w: 300,
    h: 250,
    color: "#e8f5e8"
  },
  {
    zoneId: "bedroom2",
    name: "Bedroom 2", 
    x: 360,
    y: 410,
    w: 250,
    h: 200,
    color: "#fce4ec"
  },
  {
    zoneId: "bathroom1",
    name: "Main Bathroom",
    x: 720,
    y: 50,
    w: 150,
    h: 180,
    color: "#e0f2f1"
  },
  {
    zoneId: "bathroom2", 
    name: "En-suite",
    x: 720,
    y: 240,
    w: 120,
    h: 160,
    color: "#e0f2f1"
  },
  {
    zoneId: "hallway",
    name: "Hallway",
    x: 620,
    y: 410,
    w: 80,
    h: 200,
    color: "#f5f5f5"
  },
  {
    zoneId: "balcony",
    name: "Balcony",
    x: 710,
    y: 410,
    w: 160,
    h: 120,
    color: "#e1f5fe"
  },
  {
    zoneId: "study",
    name: "Study/Office",
    x: 720,
    y: 540,
    w: 150,
    h: 100,
    color: "#fff8e1"
  }
];

// Default furniture layout matching the zones
export const DEFAULT_FURNITURE_LAYOUT: SeedFurniture[] = [
  // Living Room
  {
    name: "large sofa",
    x: 100,
    y: 100,
    r: 0,
    zoneId: "living_room"
  },
  {
    name: "coffee table",
    x: 180,
    y: 180, 
    r: 0,
    zoneId: "living_room"
  },
  {
    name: "armchair",
    x: 350,
    y: 120,
    r: 270,
    zoneId: "living_room"
  },
  {
    name: "tv stand",
    x: 80,
    y: 300,
    r: 0,
    zoneId: "living_room"
  },

  // Kitchen
  {
    name: "refrigerator",
    x: 480,
    y: 70,
    r: 0,
    zoneId: "kitchen"
  },
  {
    name: "kitchen island",
    x: 550,
    y: 140,
    r: 0,
    zoneId: "kitchen"
  },

  // Dining
  {
    name: "dining table",
    x: 520,
    y: 300,
    r: 0,
    zoneId: "dining"
  },
  {
    name: "dining chair",
    x: 490,
    y: 320,
    r: 0,
    zoneId: "dining"
  },
  {
    name: "dining chair", 
    x: 550,
    y: 320,
    r: 0,
    zoneId: "dining"
  },

  // Master Bedroom
  {
    name: "queen bed",
    x: 120,
    y: 420,
    r: 0,
    zoneId: "master_bedroom"
  },
  {
    name: "nightstand",
    x: 80,
    y: 450,
    r: 0,
    zoneId: "master_bedroom"
  },
  {
    name: "dresser",
    x: 280,
    y: 380,
    r: 90,
    zoneId: "master_bedroom"
  },

  // Bedroom 2
  {
    name: "twin bed",
    x: 400,
    y: 450,
    r: 0,
    zoneId: "bedroom2"
  },
  {
    name: "desk",
    x: 550,
    y: 430,
    r: 90,
    zoneId: "bedroom2"
  },
  {
    name: "office chair",
    x: 520,
    y: 460,
    r: 90,
    zoneId: "bedroom2"
  },

  // Study
  {
    name: "desk",
    x: 750,
    y: 560,
    r: 0,
    zoneId: "study"
  },
  {
    name: "office chair",
    x: 780,
    y: 590,
    r: 180,
    zoneId: "study"
  },

  // Balcony
  {
    name: "outdoor chair",
    x: 750,
    y: 450,
    r: 0,
    zoneId: "balcony"
  },
  {
    name: "small table",
    x: 800,
    y: 470,
    r: 0,
    zoneId: "balcony"
  }
];
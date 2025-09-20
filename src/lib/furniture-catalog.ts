export interface FurnitureSpec {
  name: string;
  category: string;
  width: number; // cm
  height: number; // cm
  depth?: number; // cm (for 3D representation)
  color: string;
}

export const DEFAULT_FURNITURE_CATALOG: FurnitureSpec[] = [
  // Sofas / Seating
  { name: "large sofa", category: "sofa", width: 205, height: 100, color: "#2b5db9" },
  { name: "small sofa", category: "sofa", width: 107, height: 100, color: "#2b9b6b" },
  { name: "medium sofa", category: "sofa", width: 160, height: 100, color: "#6a8bd7" },
  { name: "blue sofa", category: "sofa", width: 201, height: 100, color: "#1f6f52" },
  { name: "armchair", category: "chair", width: 80, height: 85, color: "#7c5f3e" },
  { name: "ottoman", category: "chair", width: 50, height: 40, color: "#a67c5a" },

  // Tables
  { name: "dining table 121×245", category: "table", width: 121, height: 245, color: "#b98a2b" },
  { name: "coffee table", category: "table", width: 120, height: 60, color: "#8b6914" },
  { name: "side table", category: "table", width: 50, height: 50, color: "#9d7b1f" },
  { name: "desk", category: "desk", width: 140, height: 70, color: "#654321" },
  { name: "nightstand", category: "table", width: 50, height: 40, color: "#8b4513" },

  // Beds
  { name: "queen bed", category: "bed", width: 213, height: 158, color: "#b92b2b" },
  { name: "king bed", category: "bed", width: 193, height: 203, color: "#a02020" },
  { name: "single bed", category: "bed", width: 90, height: 190, color: "#c53030" },
  { name: "double bed", category: "bed", width: 140, height: 190, color: "#9f1239" },

  // Storage
  { name: "sideboard", category: "storage", width: 121, height: 41, color: "#7c7c7c" },
  { name: "dresser", category: "storage", width: 112, height: 45, color: "#5a5a5a" },
  { name: "wardrobe", category: "storage", width: 150, height: 60, color: "#4a4a4a" },
  { name: "bookshelf", category: "storage", width: 80, height: 30, color: "#696969" },
  { name: "chest of drawers", category: "storage", width: 100, height: 50, color: "#555555" },

  // Appliances
  { name: "refrigerator", category: "appliance", width: 60, height: 70, color: "#e6e6e6" },
  { name: "stove", category: "appliance", width: 60, height: 60, color: "#d4d4d4" },
  { name: "washing machine", category: "appliance", width: 60, height: 60, color: "#b8b8b8" },
  { name: "dishwasher", category: "appliance", width: 60, height: 60, color: "#c0c0c0" },
  { name: "55\" TV", category: "electronics", width: 123, height: 7, color: "#1a1a1a" },

  // Decor
  { name: "large plant", category: "decor", width: 40, height: 40, color: "#228b22" },
  { name: "small plant", category: "decor", width: 25, height: 25, color: "#32cd32" },
  { name: "large rug", category: "decor", width: 200, height: 150, color: "#deb887" },
  { name: "small rug", category: "decor", width: 120, height: 80, color: "#d2b48c" },
];

export const FURNITURE_CATEGORIES = [
  { id: "sofa", name: "Sofas", icon: "🛋️" },
  { id: "chair", name: "Chairs", icon: "🪑" },
  { id: "table", name: "Tables", icon: "🪨" },
  { id: "desk", name: "Desks", icon: "🖥️" },
  { id: "bed", name: "Beds", icon: "🛏️" },
  { id: "storage", name: "Storage", icon: "🗄️" },
  { id: "appliance", name: "Appliances", icon: "🏠" },
  { id: "electronics", name: "Electronics", icon: "📺" },
  { id: "decor", name: "Decor", icon: "🪴" },
];

// Default apartment zones for Tipo 7
export const DEFAULT_APARTMENT_ZONES = [
  // Left column
  { id: "balcony", zoneId: "balcony", name: "balcony", x: 0, y: 720, w: 420, h: 80 },
  { id: "living", zoneId: "living", name: "living room", x: 0, y: 560, w: 420, h: 160 },
  { id: "dining", zoneId: "dining", name: "dining room", x: 0, y: 440, w: 420, h: 120 },
  { id: "kitchen", zoneId: "kitchen", name: "L-shaped kitchen", x: 0, y: 260, w: 420, h: 180 },
  { id: "entry", zoneId: "entry", name: "ENTRY", x: 0, y: 300, w: 120, h: 70 },
  { id: "vestibule", zoneId: "vestibule", name: "vestibule / hallway", x: 120, y: 260, w: 300, h: 180 },
  // Central column
  { id: "hallway", zoneId: "hallway", name: "hallway / core", x: 420, y: 0, w: 230, h: 800 },
  { id: "laundry", zoneId: "laundry", name: "laundry", x: 420, y: 140, w: 230, h: 140 },
  { id: "bathroom1", zoneId: "bathroom1", name: "bathroom 1", x: 420, y: 280, w: 230, h: 160 },
  { id: "bathroom2", zoneId: "bathroom2", name: "bathroom 2", x: 420, y: 440, w: 230, h: 200 },
  // Right column
  { id: "bedroom2", zoneId: "bedroom2", name: "bedroom 2/visits", x: 650, y: 0, w: 400, h: 260 },
  { id: "study", zoneId: "study", name: "study / TV", x: 650, y: 260, w: 400, h: 240 },
  { id: "master_bedroom", zoneId: "master_bedroom", name: "master bedroom", x: 650, y: 500, w: 400, h: 300 },
];

export const DEFAULT_FURNITURE_LAYOUT = [
  // Living room (upper left column)
  { name: "large sofa", x: 30, y: 585, r: 0, zoneId: "living" },
  { name: "medium sofa", x: 245, y: 545, r: 90, zoneId: "living" },
  { name: "sideboard", x: 260, y: 705, r: 0, zoneId: "balcon" },
  { name: "coffee table", x: 150, y: 600, r: 0, zoneId: "living" },
  // Dining room
  { name: "dining table 121×245", x: 80, y: 450, r: 0, zoneId: "dining" },
  // TV room (middle right column)
  { name: "blue sofa", x: 680, y: 300, r: 0, zoneId: "tv" },
  { name: "small sofa", x: 680, y: 410, r: 0, zoneId: "tv" },
  { name: "55\" TV", x: 750, y: 270, r: 0, zoneId: "tv" },
  // Master bedroom (lower right)
  { name: "queen bed", x: 700, y: 540, r: 0, zoneId: "master" },
  { name: "dresser", x: 938, y: 555, r: 0, zoneId: "master" },
  { name: "nightstand", x: 650, y: 580, r: 0, zoneId: "master" },
  { name: "nightstand", x: 913, y: 580, r: 0, zoneId: "master" },
  // Bedroom 2
  { name: "single bed", x: 700, y: 50, r: 0, zoneId: "rec2" },
  { name: "desk", x: 850, y: 150, r: 0, zoneId: "rec2" },
];
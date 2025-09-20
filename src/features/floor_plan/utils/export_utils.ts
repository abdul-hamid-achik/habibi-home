/**
 * Export utilities for floor plan editor
 * Handles various export formats and options
 */

import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from '@/types';
import { DiagramShape } from '../editor/schemas';

export interface ExportData {
  zones: FloorPlanZone[];
  furniture: FurnitureItemType[];
  settings: FloorPlanSettings;
  diagramShapes?: DiagramShape[];
  metadata?: {
    title?: string;
    description?: string;
    exportedAt: string;
    version: string;
  };
}

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'csv';
  quality: number;
  scale: number;
  width?: number;
  height?: number;
  includeGrid: boolean;
  includeDimensions: boolean;
  includeLabels: boolean;
  includeBackground: boolean;
  includeFurniture: boolean;
  includeZones: boolean;
  includeDiagrams: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  margins?: number;
  title?: string;
  description?: string;
}

// Download file helper
function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename with timestamp
function generateFilename(title: string, format: string): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const safeName = title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${safeName}_${timestamp}.${format}`;
}

// Export as JSON
export function exportAsJSON(data: ExportData, options: ExportOptions): void {
  const exportData = {
    ...data,
    metadata: {
      title: options.title || 'Floor Plan',
      description: options.description || '',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      exportOptions: {
        includeFurniture: options.includeFurniture,
        includeZones: options.includeZones,
        includeDiagrams: options.includeDiagrams
      }
    }
  };

  // Filter data based on options
  if (!options.includeFurniture) {
    delete exportData.furniture;
  }
  if (!options.includeZones) {
    delete exportData.zones;
  }
  if (!options.includeDiagrams) {
    delete exportData.diagramShapes;
  }

  const json = JSON.stringify(exportData, null, 2);
  const filename = generateFilename(options.title || 'floor_plan', 'json');
  downloadFile(json, filename, 'application/json');
}

// Export as CSV
export function exportAsCSV(data: ExportData, options: ExportOptions): void {
  const csvData: string[] = [];
  
  // Add metadata
  csvData.push(`Title,${options.title || 'Floor Plan'}`);
  csvData.push(`Description,${options.description || ''}`);
  csvData.push(`Exported At,${new Date().toISOString()}`);
  csvData.push(''); // Empty line
  
  // Export zones if included
  if (options.includeZones && data.zones.length > 0) {
    csvData.push('ZONES');
    csvData.push('ID,Zone ID,Name,X (cm),Y (cm),Width (cm),Height (cm),Color');
    data.zones.forEach(zone => {
      csvData.push(`${zone.id},${zone.zoneId},${zone.name},${zone.x},${zone.y},${zone.w},${zone.h},${zone.color || ''}`);
    });
    csvData.push(''); // Empty line
  }
  
  // Export furniture if included
  if (options.includeFurniture && data.furniture.length > 0) {
    csvData.push('FURNITURE');
    csvData.push('ID,Name,X (cm),Y (cm),Width (cm),Height (cm),Rotation (deg),Color,Zone ID');
    data.furniture.forEach(item => {
      csvData.push(`${item.id},${item.name},${item.x},${item.y},${item.w},${item.h},${item.r},${item.color},${item.zoneId || ''}`);
    });
    csvData.push(''); // Empty line
  }
  
  // Export settings
  csvData.push('SETTINGS');
  csvData.push('Property,Value');
  csvData.push(`Apartment Width (cm),${data.settings.apartmentWidth}`);
  csvData.push(`Apartment Height (cm),${data.settings.apartmentHeight}`);
  csvData.push(`Scale (px/cm),${data.settings.scale}`);
  csvData.push(`Snap Grid (cm),${data.settings.snap}`);
  csvData.push(`Show Grid,${data.settings.showGrid}`);
  csvData.push(`Show Dimensions,${data.settings.showDimensions}`);
  csvData.push(`Canvas Mode,${data.settings.canvasMode}`);
  
  const csv = csvData.join('\n');
  const filename = generateFilename(options.title || 'floor_plan', 'csv');
  downloadFile(csv, filename, 'text/csv');
}

// Export as SVG
export function exportAsSVG(
  data: ExportData,
  options: ExportOptions,
  _canvasElement?: HTMLElement
): void {
  const width = options.width || 800;
  const height = options.height || 600;
  const scale = data.settings.scale * options.scale;
  
  const cm2px = (cm: number) => cm * scale;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .zone { fill-opacity: 0.3; stroke-width: 2; }
      .furniture { stroke-width: 1; stroke: #333; }
      .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
      .dimension { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
    </style>
  </defs>
`;

  // Add title if provided
  if (options.title) {
    svg += `  <title>${options.title}</title>\n`;
  }

  // Add background
  svg += `  <rect width="100%" height="100%" fill="white"/>\n`;

  // Add grid if enabled
  if (options.includeGrid) {
    const gridSize = cm2px(25); // 25cm grid
    svg += `  <defs>
    <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
      <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#e2e8f0" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>\n`;
  }

  // Add zones if included
  if (options.includeZones) {
    data.zones.forEach(zone => {
      const x = cm2px(zone.x);
      const y = cm2px(zone.y);
      const w = cm2px(zone.w);
      const h = cm2px(zone.h);
      const color = zone.color || '#e3f2fd';
      
      svg += `  <rect class="zone" x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${color}"/>\n`;
      
      if (options.includeLabels) {
        svg += `  <text class="label" x="${x + w/2}" y="${y + h/2}" dominant-baseline="middle">${zone.name}</text>\n`;
        
        if (options.includeDimensions) {
          svg += `  <text class="dimension" x="${x + w/2}" y="${y + h/2 + 15}" text-anchor="middle">${zone.w}×${zone.h} cm</text>\n`;
        }
      }
    });
  }

  // Add furniture if included
  if (options.includeFurniture) {
    data.furniture.forEach(item => {
      const x = cm2px(item.x);
      const y = cm2px(item.y);
      const w = cm2px(item.w);
      const h = cm2px(item.h);
      
      const transform = item.r !== 0 ? ` transform="rotate(${item.r} ${x + w/2} ${y + h/2})"` : '';
      
      svg += `  <rect class="furniture" x="${x}" y="${y}" width="${w}" height="${h}" fill="${item.color}"${transform}/>\n`;
      
      if (options.includeLabels) {
        svg += `  <text class="label" x="${x + w/2}" y="${y + h/2}" dominant-baseline="middle" fill="white"${transform}>${item.name}</text>\n`;
        
        if (options.includeDimensions) {
          svg += `  <text class="dimension" x="${x + w/2}" y="${y + h/2 + 15}" text-anchor="middle" fill="white"${transform}>${item.w}×${item.h} cm</text>\n`;
        }
      }
    });
  }

  svg += '</svg>';
  
  const filename = generateFilename(options.title || 'floor_plan', 'svg');
  downloadFile(svg, filename, 'image/svg+xml');
}

// Export as image (PNG/JPG)
export function exportAsImage(
  data: ExportData,
  options: ExportOptions,
  _canvasElement: HTMLCanvasElement
): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = options.width || 800;
  canvas.height = options.height || 600;

  // Fill background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid if enabled
  if (options.includeGrid) {
    const gridSize = 25 * data.settings.scale * options.scale;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  const scale = data.settings.scale * options.scale;
  const cm2px = (cm: number) => cm * scale;

  // Draw zones
  if (options.includeZones) {
    data.zones.forEach(zone => {
      const x = cm2px(zone.x);
      const y = cm2px(zone.y);
      const w = cm2px(zone.w);
      const h = cm2px(zone.h);
      
      ctx.fillStyle = zone.color || '#e3f2fd';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x, y, w, h);
      
      ctx.globalAlpha = 1;
      ctx.strokeStyle = zone.color || '#e3f2fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      
      if (options.includeLabels) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, x + w/2, y + h/2);
        
        if (options.includeDimensions) {
          ctx.font = '10px Arial';
          ctx.fillStyle = '#666';
          ctx.fillText(`${zone.w}×${zone.h} cm`, x + w/2, y + h/2 + 15);
        }
      }
    });
  }

  // Draw furniture
  if (options.includeFurniture) {
    data.furniture.forEach(item => {
      const x = cm2px(item.x);
      const y = cm2px(item.y);
      const w = cm2px(item.w);
      const h = cm2px(item.h);
      
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(item.r * Math.PI / 180);
      ctx.translate(-w/2, -h/2);
      
      ctx.fillStyle = item.color;
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, w, h);
      
      if (options.includeLabels) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, w/2, h/2);
        
        if (options.includeDimensions) {
          ctx.font = '10px Arial';
          ctx.fillText(`${item.w}×${item.h} cm`, w/2, h/2 + 15);
        }
      }
      
      ctx.restore();
    });
  }

  // Convert to blob and download
  const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
  const filename = generateFilename(options.title || 'floor_plan', options.format);
  
  canvas.toBlob((blob) => {
    if (blob) {
      downloadFile(blob, filename, mimeType);
    }
  }, mimeType, options.quality);
}

// Main export function
export function exportFloorPlan(
  data: ExportData,
  options: ExportOptions,
  canvasElement?: HTMLCanvasElement | HTMLElement
): void {
  try {
    switch (options.format) {
      case 'json':
        exportAsJSON(data, options);
        break;
      case 'csv':
        exportAsCSV(data, options);
        break;
      case 'svg':
        exportAsSVG(data, options, canvasElement);
        break;
      case 'png':
      case 'jpg':
        if (canvasElement instanceof HTMLCanvasElement) {
          exportAsImage(data, options, canvasElement);
        } else {
          throw new Error('Canvas element required for image export');
        }
        break;
      case 'pdf':
        // PDF export would require a library like jsPDF
        console.warn('PDF export not implemented yet');
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
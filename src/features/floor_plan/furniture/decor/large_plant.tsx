import React from 'react';
import { Rect, Group, Text, Circle } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for large plant
const metadata = {
  id: "large_plant",
  name: "Large Plant",
  category: "decor" as const,
  default_size: {
    w: 40,
    h: 40,
  },
  default_color: "#228b22",
  constraints: {
    min_size: {
      w: 30,
      h: 30,
    },
    lock_aspect_ratio: true,
    rotation_step_deg: 45,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for large plant
function render_konva(props: FurnitureRenderProps): React.ReactNode {
  const {
    id,
    x,
    y,
    w,
    h,
    r = 0,
    scale_px_per_cm,
    name,
    color = metadata.default_color,
    is_selected = false,
  } = props;

  const pixelWidth = w * scale_px_per_cm;
  const pixelHeight = h * scale_px_per_cm;

  return (
    <Group
      key={id}
      x={x * scale_px_per_cm}
      y={y * scale_px_per_cm}
      rotation={r}
    >
      {/* Plant pot */}
      <Rect
        width={pixelWidth * 0.7}
        height={pixelHeight * 0.4}
        x={pixelWidth * 0.15}
        y={pixelHeight * 0.6}
        fill="#8B4513"
        stroke={is_selected ? "#007bff" : "#654321"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={3}
      />

      {/* Soil */}
      <Rect
        width={pixelWidth * 0.6}
        height={pixelHeight * 0.1}
        x={pixelWidth * 0.2}
        y={pixelHeight * 0.6}
        fill="#4a4a4a"
        cornerRadius={2}
      />

      {/* Main foliage (circular) */}
      <Circle
        radius={pixelWidth * 0.35}
        x={pixelWidth * 0.5}
        y={pixelHeight * 0.35}
        fill={color}
        stroke="#1a6b1a"
        strokeWidth={1}
        opacity={0.9}
      />

      {/* Secondary foliage clusters */}
      <Circle
        radius={pixelWidth * 0.2}
        x={pixelWidth * 0.25}
        y={pixelHeight * 0.25}
        fill={color}
        opacity={0.8}
      />
      <Circle
        radius={pixelWidth * 0.15}
        x={pixelWidth * 0.75}
        y={pixelHeight * 0.2}
        fill={color}
        opacity={0.8}
      />
      <Circle
        radius={pixelWidth * 0.18}
        x={pixelWidth * 0.7}
        y={pixelHeight * 0.5}
        fill={color}
        opacity={0.7}
      />

      {/* Stem/trunk */}
      <Rect
        width={pixelWidth * 0.08}
        height={pixelHeight * 0.3}
        x={pixelWidth * 0.46}
        y={pixelHeight * 0.5}
        fill="#654321"
        cornerRadius={2}
      />

      {/* Label */}
      {name && (
        <Text
          text={name}
          fontSize={8}
          fontFamily="Arial"
          fill="#333"
          align="center"
          verticalAlign="middle"
          width={pixelWidth}
          height={20}
          x={0}
          y={pixelHeight * 0.85}
        />
      )}

      {/* Selection indicator */}
      {is_selected && (
        <Rect
          width={pixelWidth + 6}
          height={pixelHeight + 6}
          x={-3}
          y={-3}
          fill="transparent"
          stroke="#007bff"
          strokeWidth={2}
          dash={[5, 5]}
          opacity={0.8}
        />
      )}
    </Group>
  );
}

// Export the furniture definition
export const large_plant: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
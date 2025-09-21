import React from 'react';
import { Rect, Group, Text, Line } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for refrigerator
const metadata = {
  id: "refrigerator",
  name: "Refrigerator",
  category: "appliance" as const,
  default_size: {
    w: 60,
    h: 70,
  },
  default_color: "#e6e6e6",
  constraints: {
    min_size: {
      w: 55,
      h: 65,
    },
    lock_aspect_ratio: true,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for refrigerator
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
      {/* Main refrigerator body */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        x={0}
        y={0}
        fill={color}
        stroke={is_selected ? "#007bff" : "#ccc"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={3}
      />

      {/* Freezer section (top) */}
      <Rect
        width={pixelWidth * 0.95}
        height={pixelHeight * 0.35}
        x={pixelWidth * 0.025}
        y={pixelWidth * 0.025}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        cornerRadius={2}
      />

      {/* Fridge section (bottom) */}
      <Rect
        width={pixelWidth * 0.95}
        height={pixelHeight * 0.58}
        x={pixelWidth * 0.025}
        y={pixelHeight * 0.4}
        fill="#f8f8f8"
        stroke="#ccc"
        strokeWidth={1}
        cornerRadius={2}
      />

      {/* Door line */}
      <Line
        points={[pixelWidth * 0.4, 0, pixelWidth * 0.4, pixelHeight]}
        stroke="#bbb"
        strokeWidth={1}
      />

      {/* Handles */}
      <Rect
        width={3}
        height={pixelHeight * 0.15}
        x={pixelWidth * 0.85}
        y={pixelHeight * 0.15}
        fill="#999"
        cornerRadius={1}
      />
      <Rect
        width={3}
        height={pixelHeight * 0.25}
        x={pixelWidth * 0.85}
        y={pixelHeight * 0.55}
        fill="#999"
        cornerRadius={1}
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
          y={pixelHeight * 0.8}
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
export const refrigerator: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
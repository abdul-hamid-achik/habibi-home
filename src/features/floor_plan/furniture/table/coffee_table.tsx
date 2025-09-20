import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for coffee table
const metadata = {
  id: "coffee_table",
  name: "Coffee Table",
  category: "table" as const,
  default_size: {
    w: 120,
    h: 60,
  },
  default_color: "#8b6914",
  constraints: {
    min_size: {
      w: 80,
      h: 40,
    },
    lock_aspect_ratio: false,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for coffee table
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
      {/* Main table surface */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        x={0}
        y={0}
        fill={color}
        stroke={is_selected ? "#007bff" : "#000"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={4}
      />

      {/* Table legs (visual details) */}
      <Rect
        width={8}
        height={8}
        x={8}
        y={8}
        fill="#654321"
        cornerRadius={4}
      />
      <Rect
        width={8}
        height={8}
        x={pixelWidth - 16}
        y={8}
        fill="#654321"
        cornerRadius={4}
      />
      <Rect
        width={8}
        height={8}
        x={8}
        y={pixelHeight - 16}
        fill="#654321"
        cornerRadius={4}
      />
      <Rect
        width={8}
        height={8}
        x={pixelWidth - 16}
        y={pixelHeight - 16}
        fill="#654321"
        cornerRadius={4}
      />

      {/* Label */}
      {name && (
        <Text
          text={name}
          fontSize={10}
          fontFamily="Arial"
          fill="#fff"
          align="center"
          verticalAlign="middle"
          width={pixelWidth}
          height={pixelHeight}
          x={0}
          y={0}
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
export const coffee_table: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
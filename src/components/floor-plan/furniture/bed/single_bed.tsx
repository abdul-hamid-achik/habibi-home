import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for single bed
const metadata = {
  id: "single_bed",
  name: "Single Bed",
  category: "bed" as const,
  default_size: {
    w: 90,
    h: 190,
  },
  default_color: "#c53030",
  constraints: {
    min_size: {
      w: 80,
      h: 180,
    },
    lock_aspect_ratio: true,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for single bed
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
      {/* Bed frame */}
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

      {/* Mattress (slightly inset) */}
      <Rect
        width={pixelWidth * 0.85}
        height={pixelHeight * 0.9}
        x={pixelWidth * 0.075}
        y={pixelHeight * 0.05}
        fill="#f0f0f0"
        stroke="#ccc"
        strokeWidth={1}
        cornerRadius={3}
        opacity={0.8}
      />

      {/* Headboard */}
      <Rect
        width={pixelWidth}
        height={pixelHeight * 0.1}
        x={0}
        y={0}
        fill={color}
        stroke="#000"
        strokeWidth={1}
        cornerRadius={4}
        opacity={0.9}
      />

      {/* Pillow */}
      <Rect
        width={pixelWidth * 0.6}
        height={pixelHeight * 0.15}
        x={pixelWidth * 0.2}
        y={pixelHeight * 0.1}
        fill="#ffffff"
        stroke="#ddd"
        strokeWidth={1}
        cornerRadius={6}
        opacity={0.9}
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
          height={20}
          x={0}
          y={pixelHeight * 0.7}
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
export const single_bed: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
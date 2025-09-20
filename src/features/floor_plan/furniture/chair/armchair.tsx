import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for armchair
const metadata = {
  id: "armchair",
  name: "Armchair",
  category: "chair" as const,
  default_size: {
    w: 80,
    h: 85,
  },
  default_color: "#7c5f3e",
  constraints: {
    min_size: {
      w: 60,
      h: 70,
    },
    lock_aspect_ratio: false,
    rotation_step_deg: 45,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for armchair
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
      {/* Chair seat */}
      <Rect
        width={pixelWidth * 0.8}
        height={pixelHeight * 0.6}
        x={pixelWidth * 0.1}
        y={pixelHeight * 0.4}
        fill={color}
        stroke={is_selected ? "#007bff" : "#000"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={6}
      />

      {/* Backrest */}
      <Rect
        width={pixelWidth * 0.7}
        height={pixelHeight * 0.45}
        x={pixelWidth * 0.15}
        y={0}
        fill={color}
        stroke="#000"
        strokeWidth={1}
        cornerRadius={4}
        opacity={0.9}
      />

      {/* Left armrest */}
      <Rect
        width={pixelWidth * 0.15}
        height={pixelHeight * 0.5}
        x={0}
        y={pixelHeight * 0.3}
        fill={color}
        stroke="#000"
        strokeWidth={1}
        cornerRadius={3}
        opacity={0.9}
      />

      {/* Right armrest */}
      <Rect
        width={pixelWidth * 0.15}
        height={pixelHeight * 0.5}
        x={pixelWidth * 0.85}
        y={pixelHeight * 0.3}
        fill={color}
        stroke="#000"
        strokeWidth={1}
        cornerRadius={3}
        opacity={0.9}
      />

      {/* Label */}
      {name && (
        <Text
          text={name}
          fontSize={9}
          fontFamily="Arial"
          fill="#fff"
          align="center"
          verticalAlign="middle"
          width={pixelWidth * 0.8}
          height={20}
          x={pixelWidth * 0.1}
          y={pixelHeight * 0.65}
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
export const armchair: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
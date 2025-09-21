import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for 55 inch TV
const metadata = {
  id: "tv_55_inch",
  name: "55\" TV",
  category: "electronics" as const,
  default_size: {
    w: 123,
    h: 8,
  },
  default_color: "#000000",
  constraints: {
    min_size: {
      w: 100,
      h: 5,
    },
    lock_aspect_ratio: true,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for 55 inch TV
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
      {/* TV screen */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        x={0}
        y={0}
        fill={color}
        stroke={is_selected ? "#007bff" : "#333"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={2}
      />

      {/* Screen bezel */}
      <Rect
        width={pixelWidth * 0.95}
        height={pixelHeight * 0.8}
        x={pixelWidth * 0.025}
        y={pixelHeight * 0.1}
        fill="#1a1a1a"
        stroke="#444"
        strokeWidth={1}
        cornerRadius={1}
      />

      {/* Stand base */}
      <Rect
        width={pixelWidth * 0.4}
        height={pixelHeight * 0.3}
        x={pixelWidth * 0.3}
        y={pixelHeight * 0.85}
        fill="#333"
        stroke="#555"
        strokeWidth={1}
        cornerRadius={1}
      />

      {/* Brand indicator */}
      <Rect
        width={8}
        height={2}
        x={pixelWidth * 0.85}
        y={pixelHeight * 0.9}
        fill="#00ff00"
        cornerRadius={1}
      />

      {/* Label */}
      {name && (
        <Text
          text={name}
          fontSize={8}
          fontFamily="Arial"
          fill="#fff"
          align="center"
          verticalAlign="middle"
          width={pixelWidth}
          height={20}
          x={0}
          y={pixelHeight * 0.4}
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
export const tv_55_inch: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
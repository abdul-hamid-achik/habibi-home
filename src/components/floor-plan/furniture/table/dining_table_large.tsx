import React from 'react';
import { Rect, Group, Text } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for large dining table
const metadata = {
  id: "dining_table_large",
  name: "Dining Table (Large)",
  category: "table" as const,
  default_size: {
    w: 245,
    h: 121,
  },
  default_color: "#b98a2b",
  constraints: {
    min_size: {
      w: 180,
      h: 100,
    },
    lock_aspect_ratio: false,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for large dining table
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
        cornerRadius={6}
      />

      {/* Table legs (visual details) */}
      <Rect
        width={12}
        height={12}
        x={15}
        y={15}
        fill="#8b6914"
        cornerRadius={6}
      />
      <Rect
        width={12}
        height={12}
        x={pixelWidth - 27}
        y={15}
        fill="#8b6914"
        cornerRadius={6}
      />
      <Rect
        width={12}
        height={12}
        x={15}
        y={pixelHeight - 27}
        fill="#8b6914"
        cornerRadius={6}
      />
      <Rect
        width={12}
        height={12}
        x={pixelWidth - 27}
        y={pixelHeight - 27}
        fill="#8b6914"
        cornerRadius={6}
      />

      {/* Label */}
      {name && (
        <Text
          text={name}
          fontSize={12}
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
export const dining_table_large: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
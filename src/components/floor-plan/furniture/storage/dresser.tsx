import React from 'react';
import { Rect, Group, Text, Line } from 'react-konva';
import { furniture_definition_metadata_schema, type FurnitureDefinition, type FurnitureRenderProps } from '../registry/schemas';

// Metadata for dresser
const metadata = {
  id: "dresser",
  name: "Dresser",
  category: "storage" as const,
  default_size: {
    w: 112,
    h: 45,
  },
  default_color: "#5a5a5a",
  constraints: {
    min_size: {
      w: 80,
      h: 35,
    },
    lock_aspect_ratio: false,
    rotation_step_deg: 90,
  },
};

// Validate metadata
const validated_metadata = furniture_definition_metadata_schema.parse(metadata);

// Render function for dresser
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
      {/* Main dresser body */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        x={0}
        y={0}
        fill={color}
        stroke={is_selected ? "#007bff" : "#000"}
        strokeWidth={is_selected ? 2 : 1}
        cornerRadius={2}
      />

      {/* Drawer lines */}
      <Line
        points={[0, pixelHeight / 3, pixelWidth, pixelHeight / 3]}
        stroke="#333"
        strokeWidth={1}
      />
      <Line
        points={[0, (pixelHeight * 2) / 3, pixelWidth, (pixelHeight * 2) / 3]}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Vertical divider for double drawers */}
      <Line
        points={[pixelWidth / 2, 0, pixelWidth / 2, pixelHeight]}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Drawer handles */}
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.75}
        y={pixelHeight / 6 - 1.5}
        fill="#333"
        cornerRadius={1}
      />
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.25}
        y={pixelHeight / 6 - 1.5}
        fill="#333"
        cornerRadius={1}
      />
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.75}
        y={pixelHeight / 2 - 1.5}
        fill="#333"
        cornerRadius={1}
      />
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.25}
        y={pixelHeight / 2 - 1.5}
        fill="#333"
        cornerRadius={1}
      />
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.75}
        y={(pixelHeight * 5) / 6 - 1.5}
        fill="#333"
        cornerRadius={1}
      />
      <Rect
        width={6}
        height={3}
        x={pixelWidth * 0.25}
        y={(pixelHeight * 5) / 6 - 1.5}
        fill="#333"
        cornerRadius={1}
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
export const dresser: FurnitureDefinition = {
  ...validated_metadata,
  render_konva,
};
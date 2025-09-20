"use client";

import { FloorPlanEditor } from "@/components/floor-plan/floor-plan-editor";
import { FloorPlanZone, FurnitureItemType, FloorPlanSettings } from "@/types";

export default function EditorPage() {
  const handleSave = (data: { zones: FloorPlanZone[]; furniture: FurnitureItemType[]; settings: FloorPlanSettings }) => {
    console.log("Saving project data:", data);
    // TODO: Implement actual save functionality
  };

  return (
    <FloorPlanEditor
      onSave={handleSave}
    />
  );
}
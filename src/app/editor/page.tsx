"use client";

import { FloorPlanEditor } from "@/components/floor-plan/floor-plan-editor";

export default function EditorPage() {
  const handleSave = (data: any) => {
    console.log("Saving project data:", data);
    // TODO: Implement actual save functionality
  };

  return (
    <FloorPlanEditor
      onSave={handleSave}
    />
  );
}
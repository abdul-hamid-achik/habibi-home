"use client";

import { FloorPlanEditor } from "@/components/floor-plan/floor-plan-editor";

export default function EditorPage() {
    return (
        <div className="w-full h-screen">
            <FloorPlanEditor
                onSave={(data) => {
                    console.log('Saved project data:', data);
                    // Here you would typically save to your backend
                }}
            />
        </div>
    );
}
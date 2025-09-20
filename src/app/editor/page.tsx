"use client";

import { EditorShell } from "@/features/floor_plan/editor/editor_shell";

export default function EditorPage() {
    return (
        <div className="w-full h-screen">
            <EditorShell
                onSave={(data) => {
                    console.log('Saved project data:', data);
                    // Here you would typically save to your backend
                }}
            />
        </div>
    );
}
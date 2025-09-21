"use client";

import { EditorShell } from "@/components/floor-plan/editor/editor_shell";

export default function EditorPage() {
    return (
        <EditorShell
            onSave={(data) => {
                console.log('Saved project data:', data);
                // Here you would typically save to your backend
            }}
        />
    );
}
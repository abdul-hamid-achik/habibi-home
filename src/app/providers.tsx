"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "@/lib/stack-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
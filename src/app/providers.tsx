"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientApp = new StackClientApp({
    baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    tokenStore: "nextjs-cookie",
    urls: {
      signIn: "/auth/signin",
      signUp: "/auth/signup",
      signOut: "/auth/signout",
      afterSignIn: "/editor",
      afterSignUp: "/editor",
      afterSignOut: "/",
    },
  });

  return (
    <StackProvider app={clientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
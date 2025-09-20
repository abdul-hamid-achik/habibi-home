import { StackServerApp } from "@stackframe/stack";
import { StackClientApp } from "@stackframe/stack";

// Server-side app (only used in server components)
export const stackServerApp = new StackServerApp({
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

// Client-side app configuration (only needs public keys)
export const stackClientApp = new StackClientApp({
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

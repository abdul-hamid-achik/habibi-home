import { StackServerApp } from "@stackframe/stack";

// Server-side app (only used in server components and API routes)
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

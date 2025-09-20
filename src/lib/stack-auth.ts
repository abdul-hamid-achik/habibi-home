import { StackServerApp } from "@stackframe/stack";

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

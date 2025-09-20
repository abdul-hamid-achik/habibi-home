import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack-auth";

export async function GET(request: Request) {
    return await StackHandler({
        app: stackServerApp,
        fullPage: true,
        routeProps: { request }
    });
}

export async function POST(request: Request) {
    return await StackHandler({
        app: stackServerApp,
        fullPage: true,
        routeProps: { request }
    });
}

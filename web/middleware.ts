import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const enabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);
const handler = enabled ? clerkMiddleware() : null;

export default function middleware(req: NextRequest) {
  if (!handler) return NextResponse.next();
  return handler(req, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
    "/(api|trpc)(.*)",
  ],
};

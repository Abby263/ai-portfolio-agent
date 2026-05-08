"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function SSOCallbackPage() {
  if (!CLERK_ENABLED) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-xl font-semibold text-neutral-100">
          Clerk is not configured
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Add Clerk keys to the web Vercel project and redeploy before using
          GitHub sign-in.
        </p>
      </main>
    );
  }
  return <AuthenticateWithRedirectCallback />;
}

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const metadata: Metadata = {
  title: "AI Portfolio Agent",
  description:
    "AI-powered developer portfolio that builds your story from GitHub, your resume, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const document = (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
  if (CLERK_ENABLED) {
    return <ClerkProvider>{document}</ClerkProvider>;
  }
  return document;
}

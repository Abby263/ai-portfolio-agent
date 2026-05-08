import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const metadata: Metadata = {
  title: "AI Developer Portfolio Manager Agent",
  description:
    "Share a developer portfolio recruiters can chat with across GitHub projects, deployed apps, resume experience, and tech stack.",
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

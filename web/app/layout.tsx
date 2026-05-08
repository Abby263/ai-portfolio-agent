import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai-portfolio-agent",
  description:
    "AI-powered developer portfolio that builds your story from GitHub, Vercel, resume, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

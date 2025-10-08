import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { AuthSessionProvider } from "@/components/providers/session-provider";
// @ts-expect-error - css
import "./globals.css";

export const metadata: Metadata = {
  title: "Fellowship Platform - Manage Your Educational Programs",
  description:
    "A modern platform for managing fellowship programs, sessions, and content",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Toaster />
          <Analytics />
        </AuthSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";

// Self-hosted so production builds do not fetch Google Fonts at compile time.
// Barlow Condensed over Barlow is the system's pairing: condensed headings
// against a normal-width body, which is what gives the drawing-sheet voice.
const barlow = localFont({
  src: [
    { path: "./fonts/barlow-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const barlowCondensed = localFont({
  src: [
    { path: "./fonts/barlow-condensed-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-condensed-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
});

export const metadata: Metadata = {
  title: {
    default: "SF Contacts",
    template: "%s · SF Contacts",
  },
  description: "Add, search, and manage contacts backed by the Contacts API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable}`}
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-200"
        suppressHydrationWarning
      >
        {/* No Suspense boundary around the shell: it would let Next flush the
            HTML before a page calls notFound(), and the 404 status would be
            lost. Route-level loading.tsx supplies the streaming boundary. */}
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "driver.js/dist/driver.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Summitodoro", template: "%s · Summitodoro" },
  description: "Climb a virtual Philippine mountain trail while you focus.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

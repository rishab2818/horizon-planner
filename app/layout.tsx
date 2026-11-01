import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horizon — A calmer way to plan",
  description: "Plan your day, week, month and year without the clutter.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.svg",
  },
};
export const viewport: Viewport = { themeColor: "#f5f1e9", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

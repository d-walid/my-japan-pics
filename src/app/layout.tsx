import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Japan Pics",
  description: "Pictures of my travel in Japan, november 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}

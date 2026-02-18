import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Subtracker",
  description: "Track personal subscriptions and monthly costs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

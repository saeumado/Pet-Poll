import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dachshund Roll Call",
  description: "Collect dachshund household submissions and manage them in one admin view.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

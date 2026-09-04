import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicLens | City Issue Management",
  description: "Official civic issue reporting and management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}

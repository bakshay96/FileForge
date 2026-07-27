import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FileForge — Secure Image & PDF Processing",
  description:
    "Convert, resize, edit, and compress images and PDFs instantly. " +
    "Secure, private, and fast — your files are auto-deleted after 30 minutes.",
  keywords: ["image converter", "pdf compressor", "resize image", "file format converter"],
  authors: [{ name: "FileForge" }],
  openGraph: {
    title: "FileForge — Secure Image & PDF Processing",
    description: "Free, secure tool to convert & compress images and PDFs.",
    type: "website",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

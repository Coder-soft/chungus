import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../components/LogoLoop.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChungusFX",
  description: "Professional video editor crafting high-impact edits and viral content.",
  icons: {
    icon: "/image.png",
  },
  openGraph: {
    title: "ChungusFX",
    description: "Professional video editor crafting high-impact edits and viral content.",
    images: [
      {
        url: "/hyperlink.png",
        width: 1200,
        height: 630,
        alt: "ChungusFX Cover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChungusFX",
    description: "Professional video editor crafting high-impact edits and viral content.",
    images: ["/imagecopy.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

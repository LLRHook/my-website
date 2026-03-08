import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import AuroraBackground from "./components/ui/AuroraBackground";
import JsonLd from "./components/JsonLd";
import NoiseOverlay from "./components/ui/NoiseOverlay";
import ParticlesBackground from "./components/ui/ParticlesBackground";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-syne",
});

import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "./lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body>
        <JsonLd />
        <AuroraBackground />
        <NoiseOverlay />
        <ParticlesBackground />
        <main className="relative z-[5]">
          {children}
        </main>
      </body>
    </html>
  );
}

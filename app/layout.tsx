import type { Metadata } from "next";
import { DM_Serif_Display, Caveat } from "next/font/google";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import "./room.css";

const serif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-room-serif" });
const handwriting = Caveat({ subsets: ["latin"], weight: "500", variable: "--font-handwriting", preload: false });

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
    <html lang="en" className={`${serif.variable} ${handwriting.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <JsonLd />
          <main id="main">
            {children}
          </main>
      </body>
    </html>
  );
}

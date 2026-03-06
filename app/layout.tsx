import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import AuroraBackground from "./components/ui/AuroraBackground";
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

export const metadata: Metadata = {
  title: "Victor Ivanov — Portfolio",
  description:
    "Software engineer portfolio — projects, skills, and experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body>
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

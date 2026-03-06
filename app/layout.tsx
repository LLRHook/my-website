import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import MeshGradient from "./components/ui/MeshGradient";

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
        <MeshGradient />
        {children}
      </body>
    </html>
  );
}

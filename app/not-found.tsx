import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <section className="room-not-found">
      <p className="eyebrow">404 / A LITTLE OFF THE MAP</p>
      <h1>This room doesn&apos;t exist.</h1>
      <p>The page may have moved. My desk is still right here.</p>
      <Link href="/" className="primary-link">Back to the workspace ↗</Link>
    </section>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
      <p className="text-xs uppercase tracking-widest text-text-muted mb-4">
        Error 404
      </p>
      <h1 className="text-6xl sm:text-7xl lg:text-8xl display-heading text-text-primary">
        Page Not Found
      </h1>
      <p className="text-lg text-text-secondary mt-6 max-w-xl">
        The page you&apos;re looking for moved, was renamed, or never existed.
      </p>
      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <Link href="/" className="btn-outline">
          Back to Home
        </Link>
        <Link href="/#work" className="btn-outline">
          View Work
        </Link>
      </div>
    </section>
  );
}

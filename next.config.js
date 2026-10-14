/* eslint-disable @typescript-eslint/no-require-imports -- Next config uses CommonJS. */
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

// WebKit checks the header-delivered speculation rules fetch against script-src (Chromium
// does not), so pages allow exactly that URL. It is JSON served with
// nosniff, so it can never run as a script. SITE_ORIGIN overrides the production
// origin for local and CI builds.
const SITE_ORIGIN = process.env.SITE_ORIGIN ?? "https://victorivanov.engineer";
const SCRIPT_SRC = `script-src ${SITE_ORIGIN}/speculation-rules`;

// The stylesheet is inlined in every page, so first paint never waits on a CSS request.
// CSP allows exactly this text through its hash.
const STYLE_CSS = readFileSync(join(__dirname, "public", "retro.css"), "utf8").replace(/\r\n/g, "\n").trim();
if (STYLE_CSS.includes("</")) {
  throw new Error("public/retro.css must not contain \"</\": it is inlined in a <style> element");
}
const STYLE_HASH = createHash("sha256").update(STYLE_CSS).digest("base64");

const securityHeaders = [
  { key: "Content-Security-Policy", value: `default-src 'self'; ${SCRIPT_SRC}; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'sha256-${STYLE_HASH}'` },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  env: {
    STYLE_CSS,
  },
  async redirects() {
    return [{ source: "/interests", destination: "/off-the-clock", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Instant navigation: Chromium prerenders hovered links (see app/speculation-rules).
      ...["/", "/about", "/projects", "/resume", "/off-the-clock", "/contact"].map((source) => ({
        source,
        headers: [{ key: "Speculation-Rules", value: '"/speculation-rules"' }],
      })),
      ...(process.env.NODE_ENV === "production" ? [
        {
          source: "/:file*\\.(jpg|webp|png|svg|ico|pdf)",
          headers: [...securityHeaders, {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          }],
        },
      ] : []),
    ];
  },
};

module.exports = nextConfig;

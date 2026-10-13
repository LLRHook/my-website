/* eslint-disable @typescript-eslint/no-require-imports -- Next config uses CommonJS. */
const { createHash } = require("node:crypto");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

function assetUrl(path) {
  const file = join(__dirname, "public", path);
  if (!existsSync(file)) {
    return `/${path}`;
  }
  const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 10);
  return `/${path}?v=${hash}`;
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; img-src 'self'; style-src 'self'" },
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
    STYLE_HREF: assetUrl("retro.css"),
    GAME_SCRIPT: assetUrl("game/main.js"),
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
      {
        source: "/projects",
        headers: securityHeaders.map((header) => header.key === "Content-Security-Policy"
          ? { ...header, value: header.value.replace("script-src 'none'", "script-src 'self'") }
          : header),
      },
      ...(process.env.NODE_ENV === "production" ? [
        ...["/retro.css", "/game/main.js"].map((source) => ({
          source,
          headers: [...securityHeaders, {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          }],
        })),
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

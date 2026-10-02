/** @type {import('next').NextConfig} */
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

const nextConfig = {
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/interests", destination: "/off-the-clock", permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

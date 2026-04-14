import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options",            value: "nosniff" },
      { key: "X-Frame-Options",                   value: "DENY" },
      { key: "X-XSS-Protection",                  value: "1; mode=block" },
      { key: "Referrer-Policy",                   value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",                value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security",         value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-DNS-Prefetch-Control",            value: "on" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",   // unsafe-eval needed by Next.js dev; tighten in prod if possible
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https://*.amazonaws.com",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
    ];
  },
};

export default nextConfig;

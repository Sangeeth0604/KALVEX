import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob: https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net",
      "connect-src 'self' blob: data: https://generativelanguage.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com https://cdn.jsdelivr.net https://tessdata.projectnaptha.com https://*.tessdata.projectnaptha.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://cdn.jsdelivr.net https://unpkg.com",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const flutterDevOrigins = isDev
  ? " http://127.0.0.1:53601 http://localhost:53601 http://127.0.0.1:3000 http://localhost:3000"
  : "";

const securityHeaders = [
  // Prevent clickjacking — only same-origin iframes allowed (presentation + Flutter iframe are same-origin/dev-allowlisted)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin on cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limit DNS prefetch leakage
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Isolate browsing context from cross-origin popups
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Permissions Policy — allow camera, microphone, and geolocation for face recognition, video verification, and GIS
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(self), display-capture=(self)",
  },
  // Content Security Policy — defense against XSS while allowing MediaPipe WASM and MapLibre GL tiles
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Next.js inline chunks + CDN for MediaPipe/MapLibre + wasm
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      // Styles: self + inline (required by Next.js, MapLibre, Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: self + Supabase storage + Unsplash + Google Storage + OpenStreetMap + CartoDB tiles
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://storage.googleapis.com https://unpkg.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://api.maptiler.com https://*.tiles.mapbox.com",
      // Media (video/audio evidence streams, webcam blob)
      "media-src 'self' blob: data: https://*.supabase.co",
      // API + WebSocket connections + tile servers + AI models + local Flutter bridge
      `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.maptiler.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://storage.googleapis.com https://cdn.jsdelivr.net https://unpkg.com http://localhost:11434 http://localhost:3000 http://localhost:8000 http://localhost:8080 http://localhost:9000${flutterDevOrigins}`,
      // Map tiles + GL workers + MediaPipe workers
      "worker-src 'self' blob:",
      // Child frames: self + local Flutter web-server (dev only)
      `frame-src 'self'${flutterDevOrigins}`,
      // Forms may only post to self — blocks exfiltration
      "form-action 'self'",
      // Only self may embed us — blocks clickjacking
      "frame-ancestors 'self'",
      // Object embeds
      "object-src 'none'",
      // Base URI locked to self
      "base-uri 'self'",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
  },
  // HSTS must be a separate header (never inside CSP)
  ...(!isDev
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  turbopack: {},

  // ─── HTTP Security Headers ────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ─── Image domains for evidence / demo ───────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "unpkg.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // ─── Reverse Proxy Rewrites ──────────────────────────────────────────────
  async rewrites() {
    const aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:8000";
    const govCoreUrl = process.env.GOV_CORE_URL || "http://localhost:8080";
    return [
      {
        source: "/api/ai/v1/:path*",
        destination: `${aiEngineUrl}/api/v1/:path*`,
      },
      {
        source: "/api/gov/v1/:path*",
        destination: `${govCoreUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

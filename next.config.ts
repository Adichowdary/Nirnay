import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // Prevent clickjacking — only same-origin iframes allowed
  { key: "X-Frame-Options",        value: "SAMEORIGIN" },
  // Stop MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin on cross-origin requests
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  // Permissions Policy — allow camera, microphone, and geolocation for face recognition, video verification, and GIS
  {
    key: "Permissions-Policy",
    value: "camera=*, microphone=*, geolocation=*, display-capture=*",
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
      // API + WebSocket connections + tile servers + AI models
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.maptiler.com https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://a.basemaps.cartocdn.com https://b.basemaps.cartocdn.com https://c.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://storage.googleapis.com https://cdn.jsdelivr.net https://unpkg.com http://localhost:11434 http://localhost:3000 http://localhost:8000 http://localhost:8080 http://localhost:9000",
      // Map tiles + GL workers + MediaPipe workers
      "worker-src 'self' blob:",
      // Child frames
      "frame-src 'self'",
      // Object embeds
      "object-src 'none'",
      // Base URI locked to self
      "base-uri 'self'",
      ...(isDev ? [] : ["upgrade-insecure-requests", "Strict-Transport-Security: max-age=31536000; includeSubDomains"]),
    ].join("; "),
  },
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
};

export default nextConfig;

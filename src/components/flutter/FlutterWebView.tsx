"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Smartphone, RefreshCw, ExternalLink } from "lucide-react";

// ─── Flutter WebView bridge ───
// Embeds a Flutter Web module (inspection forms, offline capture,
// biometric helpers) inside Next.js via sandboxed iframe + postMessage.
// Set NEXT_PUBLIC_FLUTTER_URL to your `flutter run -d web-server` URL.
// Falls back to a graceful offline placeholder when unreachable.

interface FlutterMessage {
  type: string;
  source?: string;
  payload?: unknown;
}

interface FlutterWebViewProps {
  url?: string;
  title?: string;
  height?: number | string;
  onMessage?: (msg: FlutterMessage) => void;
  fallback?: React.ReactNode;
}

const DEFAULT_URL =
  process.env.NEXT_PUBLIC_FLUTTER_URL ?? "http://127.0.0.1:53601/";

export function FlutterWebView({
  url = DEFAULT_URL,
  title = "Flutter field module",
  height = 480,
  onMessage,
  fallback,
}: FlutterWebViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [nonce, setNonce] = useState(0);

  const postToFlutter = useCallback((msg: FlutterMessage) => {
    iframeRef.current?.contentWindow?.postMessage(
      { ...msg, source: "niyantra-web" },
      "*"
    );
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data as FlutterMessage | null;
      if (!data || typeof data !== "object") return;
      if (data.source !== "niyantra-flutter" && data.source !== "flutter") return;
      if (data.type === "flutter-ready") setStatus("ready");
      onMessage?.(data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMessage]);

  // Timeout: if Flutter never signals ready, show fallback affordance
  useEffect(() => {
    if (status !== "loading") return;
    const t = setTimeout(() => setStatus((s) => (s === "loading" ? "error" : s)), 8000);
    return () => clearTimeout(t);
  }, [status, nonce]);

  return (
    <div className="card-premium overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-light bg-secondary/60">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Smartphone size={15} className="text-blue-base" />
          <span>{title}</span>
          <span
            className={`badge ${
              status === "ready"
                ? "bg-green-tint text-green-strong"
                : status === "error"
                  ? "bg-red-tint text-red-strong"
                  : "bg-amber-tint text-amber-strong"
            }`}
          >
            {status === "ready" ? "● LIVE" : status === "error" ? "● OFFLINE" : "● LOADING"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setNonce((n) => n + 1);
            }}
            className="micro-press btn-secondary btn-sm flex items-center gap-1"
            aria-label="Reload Flutter module"
          >
            <RefreshCw size={13} /> Reload
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="micro-press btn-secondary btn-sm flex items-center gap-1"
          >
            <ExternalLink size={13} /> Open
          </a>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card">
            <Loader2 size={26} className="animate-spin text-blue-base" />
            <p className="text-xs text-muted font-medium">
              Loading Flutter field module…
            </p>
          </div>
        )}

        {status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-card">
            {fallback ?? (
              <>
                <Smartphone size={30} className="text-muted" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    Flutter module unreachable
                  </p>
                  <p className="text-xs text-muted mt-1 max-w-sm">
                    Start it with{" "}
                    <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
                      flutter run -d web-server --web-port=53601
                    </code>{" "}
                    or set{" "}
                    <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">
                      NEXT_PUBLIC_FLUTTER_URL
                    </code>
                    . Web app remains fully usable.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setNonce((n) => n + 1);
                    // Nudge flutter if it loads late
                    setTimeout(() => postToFlutter({ type: "host-ready" }), 800);
                  }}
                  className="btn-premium btn-sm px-4 py-2 rounded-lg text-xs font-bold"
                >
                  Retry connection
                </button>
              </>
            )}
          </div>
        ) : (
          <iframe
            key={nonce}
            ref={iframeRef}
            src={url}
            title={title}
            className="w-full h-full border-0"
            allow="camera; microphone; geolocation; display-capture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => postToFlutter({ type: "host-ready" })}
            onError={() => setStatus("error")}
          />
        )}
      </div>
    </div>
  );
}

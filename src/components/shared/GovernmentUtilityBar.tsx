"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Accessibility, Sun, Moon, ZoomIn, RotateCcw } from "lucide-react";
import { useApp } from "@/components/shell/Providers";

interface AccessibilitySettings {
  fontSize: number;
  contrast: "normal" | "high";
  lineHeight: number;
  letterSpacing: number;
  hideImages: boolean;
  dyslexiaFriendly: boolean;
}

const DEFAULTS: AccessibilitySettings = {
  fontSize: 100,
  contrast: "normal",
  lineHeight: 1.5,
  letterSpacing: 0,
  hideImages: false,
  dyslexiaFriendly: false,
};

function getSavedSettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem("insight_a11y_settings");
    return saved ? JSON.parse(saved) : DEFAULTS;
  } catch { return DEFAULTS; }
}

export function GovernmentUtilityBar() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [showA11y, setShowA11y] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(getSavedSettings);
  // Theme is owned by Providers (single authority) — no local copy.
  const { isDarkMode: isDark, setDarkMode: setIsDark } = useApp();

  const applySettings = useCallback((s: AccessibilitySettings) => {
    const root = document.documentElement;
    root.style.fontSize = `${s.fontSize}%`;
    root.style.lineHeight = `${s.lineHeight}`;
    root.style.letterSpacing = `${s.letterSpacing}em`;
    root.classList.toggle("high-contrast", s.contrast === "high");
    root.classList.toggle("dyslexia-friendly", s.dyslexiaFriendly);
    root.classList.toggle("hide-images", s.hideImages);
    try { localStorage.setItem("insight_a11y_settings", JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  // Apply settings to document
  useEffect(() => {
    applySettings(settings);
  }, [settings, applySettings]);

  const toggleDark = () => setIsDark(!isDark);

  const reset = () => setSettings(DEFAULTS);

  return (
    <>
      {/* Skip to main content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold">
        Skip to main content
      </a>

      {/* Government Utility Bar — premium navy + tricolor accent */}
      <div className="w-full text-white text-xs" style={{ fontSize: "11px", background: "linear-gradient(135deg, #07111e 0%, #0b1e36 55%, #143765 100%)" }}>
        <div className="tricolor-strip" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
          {/* Left: Government of India */}
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ letterSpacing: "0.03em" }}>
              Government of India
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/60">Ministry of Social Justice & Empowerment</span>
          </div>

          {/* Right: Language + Accessibility */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="micro-press flex items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/10"
              aria-label="Toggle language"
            >
              <Globe size={12} />
              <span className="font-medium">{lang === "en" ? "हिन्दी" : "English"}</span>
            </button>

            <span className="text-white/20">|</span>

            {/* Dark/Light Mode */}
            <button
              onClick={toggleDark}
              className="micro-press flex items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/10"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={12} /> : <Moon size={12} />}
              <span className="font-medium">{isDark ? "Light" : "Dark"}</span>
            </button>

            <span className="text-white/20">|</span>

            {/* Accessibility Widget Toggle */}
            <button
              onClick={() => setShowA11y(!showA11y)}
              className="micro-press flex items-center gap-1 text-white/70 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/10"
              aria-label="Accessibility options"
              aria-expanded={showA11y}
            >
              <Accessibility size={12} />
              <span className="font-medium">Accessibility</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility Panel */}
      {showA11y && (
        <div className="fixed top-10 right-4 z-[9998] w-72 bg-card border border-base rounded-xl shadow-xl p-4 space-y-4 animate-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              <Accessibility size={16} className="text-blue-strong" />
              Accessibility Options
            </h3>
            <button onClick={() => setShowA11y(false)} className="text-muted hover:text-primary text-lg cursor-pointer">&times;</button>
          </div>

          {/* Font Size */}
          <div>
            <label className="section-label mb-2 block">Text Size</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(80, s.fontSize - 10) }))}
                className="btn-secondary btn-sm px-2 cursor-pointer" aria-label="Decrease text size">
                <ZoomIn size={14} className="rotate-180" />
              </button>
              <div className="flex-1 text-center text-xs font-semibold text-primary">{settings.fontSize}%</div>
              <button onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(150, s.fontSize + 10) }))}
                className="btn-secondary btn-sm px-2 cursor-pointer" aria-label="Increase text size">
                <ZoomIn size={14} />
              </button>
            </div>
          </div>

          {/* Contrast */}
          <div>
            <label className="section-label mb-2 block">Contrast</label>
            <div className="flex gap-2">
              <button onClick={() => setSettings(s => ({ ...s, contrast: "normal" }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${settings.contrast === "normal" ? "bg-blue-base text-white" : "bg-secondary text-primary border border-base"}`}>
                Normal
              </button>
              <button onClick={() => setSettings(s => ({ ...s, contrast: "high" }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${settings.contrast === "high" ? "bg-blue-base text-white" : "bg-secondary text-primary border border-base"}`}>
                High Contrast
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div>
            <label className="section-label mb-2 block">Line Height</label>
            <div className="flex gap-2">
              {[1.5, 1.75, 2.0].map(lh => (
                <button key={lh} onClick={() => setSettings(s => ({ ...s, lineHeight: lh }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${settings.lineHeight === lh ? "bg-blue-base text-white" : "bg-secondary text-primary border border-base"}`}>
                  {lh}x
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-primary font-medium">Dyslexia Friendly</span>
              <input type="checkbox" checked={settings.dyslexiaFriendly}
                onChange={e => setSettings(s => ({ ...s, dyslexiaFriendly: e.target.checked }))}
                className="w-4 h-4 cursor-pointer accent-blue-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-primary font-medium">Hide Images</span>
              <input type="checkbox" checked={settings.hideImages}
                onChange={e => setSettings(s => ({ ...s, hideImages: e.target.checked }))}
                className="w-4 h-4 cursor-pointer accent-blue-600" />
            </label>
          </div>

          {/* Reset */}
          <button onClick={reset} className="btn-secondary w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer">
            <RotateCcw size={12} /> Reset All Settings
          </button>
        </div>
      )}
    </>
  );
}

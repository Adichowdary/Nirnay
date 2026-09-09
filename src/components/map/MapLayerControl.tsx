"use client";

import { useState } from "react";
import {
  Layers,
  ChevronUp,
  MapPin,
  Shield,
  Radio,
  Camera,
  Circle,
  Globe2,
} from "lucide-react";

export interface MapLayers {
  projects: boolean;
  risk: boolean;
  inspectors: boolean;
  cctv: boolean;
  geofence: boolean;
  bhuvanCadastral?: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  projects: true,
  risk: true,
  inspectors: true,
  cctv: true,
  geofence: false,
  bhuvanCadastral: true,
};

const LAYER_CONFIG = [
  { key: "bhuvanCadastral" as const, label: "ISRO Bhuvan Cadastre", icon: Globe2, color: "#F59E0B" },
  { key: "projects" as const, label: "Project Facilities", icon: MapPin, color: "var(--blue-600)" },
  { key: "risk" as const, label: "Predictive Risk Badges", icon: Shield, color: "var(--red-600)" },
  { key: "inspectors" as const, label: "Live Field Squads (GNSS)", icon: Radio, color: "#2563EB" },
  { key: "cctv" as const, label: "CCTV Surveillance Grid", icon: Camera, color: "var(--green-600)" },
  { key: "geofence" as const, label: "100m Geofence Perimeter", icon: Circle, color: "#8B5CF6" },
];

interface MapLayerControlProps {
  layers: MapLayers;
  onLayersChange: (layers: MapLayers) => void;
}

export function MapLayerControl({ layers, onLayersChange }: MapLayerControlProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggle = (key: keyof MapLayers) => {
    onLayersChange({ ...layers, [key]: !layers[key] });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all shadow-md bg-slate-900/90 text-white border border-slate-700 backdrop-blur-md hover:bg-slate-800 text-xs font-bold"
      >
        <Layers size={14} className="text-amber-400" />
        Layers &amp; Bhuvan GIS
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl bg-slate-900/95 border border-slate-700 text-white backdrop-blur-md"
      style={{ width: 235 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-amber-400" />
          <span className="font-extrabold text-xs text-white">
            Geospatial Overlays
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="p-1 rounded-lg cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronUp size={14} />
        </button>
      </div>

      {/* Layer toggles */}
      <div className="p-2 space-y-1">
        {LAYER_CONFIG.map(({ key, label, icon: Icon, color }) => {
          const isActive = Boolean(layers[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all text-left"
              style={{
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center transition-all shrink-0"
                style={{
                  background: isActive ? color : "rgba(255,255,255,0.1)",
                  border: `1.5px solid ${isActive ? color : "rgba(255,255,255,0.2)"}`,
                }}
              >
                {isActive && (
                  <svg width="8" height="7" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <Icon size={13} style={{ color: isActive ? color : "var(--text-muted, #94a3b8)" }} />
              <span
                className="text-[11px] font-semibold truncate"
                style={{
                  color: isActive ? "#FFFFFF" : "#94a3b8",
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

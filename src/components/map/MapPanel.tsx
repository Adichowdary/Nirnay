"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEMO_PROJECTS, DEMO_INSPECTORS, DEMO_CCTV_CAMERAS } from "@/lib/demo-data";
import { Maximize2, Minimize2, MapPin, Video } from "lucide-react";
import { CCTVMatrixModal } from "@/components/cctv/CCTVMatrixModal";
import { ExplainableRiskModal } from "@/components/ai/ExplainableRiskModal";
import { MapFilterPanel, type MapFilters } from "./MapFilterPanel";
import { MapLayerControl, type MapLayers } from "./MapLayerControl";

declare global {
  interface Window {
    maplibregl: typeof import("maplibre-gl");
  }
}

interface MapPanelProps {
  onProjectClick?: (projectId: string) => void;
  projects?: Array<(typeof DEMO_PROJECTS)[0]> | any[];
  filteredProjectIds?: string[];
  layers?: MapLayers;
  onLayersChange?: (layers: MapLayers) => void;
  filters?: MapFilters;
  onFiltersChange?: (filters: MapFilters) => void;
  totalCount?: number;
  filteredCount?: number;
  showControls?: boolean;
}

async function loadMaplibre(): Promise<typeof import("maplibre-gl")> {
  if (typeof window !== "undefined" && window.maplibregl) {
    return window.maplibregl;
  }
  try {
    const ml = await import("maplibre-gl");
    if (typeof window !== "undefined") {
      window.maplibregl = ml as unknown as typeof import("maplibre-gl");
    }
    return ml as unknown as typeof import("maplibre-gl");
  } catch {
    return new Promise((resolve, reject) => {
      if (!document.getElementById("maplibre-css")) {
        const link = document.createElement("link");
        link.id = "maplibre-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }
      if (!document.getElementById("maplibre-js")) {
        const script = document.createElement("script");
        script.id = "maplibre-js";
        script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
        script.onload = () => resolve(window.maplibregl);
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      } else {
        const check = setInterval(() => {
          if (window.maplibregl) {
            clearInterval(check);
            resolve(window.maplibregl);
          }
        }, 80);
      }
    });
  }
}

function getRiskColor(score: number): string {
  if (score >= 80) return "#E23B3B";
  if (score >= 60) return "#E0A100";
  if (score >= 35) return "#F59E0B";
  return "#1FA957";
}

function getRiskTier(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

function createProjectMarker(
  project: (typeof DEMO_PROJECTS)[0],
  ml: typeof import("maplibre-gl")
): HTMLElement {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.style.position = "relative";

  const color = getRiskColor(project.ai_risk_score);
  const tier = getRiskTier(project.ai_risk_score);
  const shouldPulse = project.ai_risk_score >= 80;

  el.innerHTML = `
    <div class="map-marker-group" style="display:flex;flex-direction:column;align-items:center;transform-origin:bottom center;transition:transform 150ms cubic-bezier(0.16,1,0.3,1)">
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${shouldPulse ? `<div style="position:absolute;width:30px;height:30px;border-radius:50%;border:2px solid ${color};animation:pulse-ring 2s ease-out infinite;"></div>` : ""}
        <div style="width:26px;height:26px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
          ${project.ai_risk_score >= 60
            ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
            : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
          }
        </div>
      </div>
      <div style="width:2px;height:10px;background:linear-gradient(to bottom,${color}cc,${color}22);margin-top:-1px;"></div>
      <div style="width:6px;height:3px;border-radius:50%;background:rgba(0,0,0,0.2);"></div>
    </div>
    <div style="
      position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);
      background:rgba(15,23,42,0.92);color:white;padding:4px 8px;border-radius:6px;
      font-size:10px;font-weight:700;white-space:nowrap;letter-spacing:0.5px;
      pointer-events:none;opacity:0;transition:opacity 150ms;
      display:flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,0.2);
      box-shadow:0 4px 12px rgba(0,0,0,0.5);
    " class="map-marker-tooltip">
      <span style="color:${color};font-weight:800;">${tier}</span>
      <span style="opacity:0.4">|</span>
      <span>${project.ai_risk_score}/100 Risk</span>
    </div>
    <style>
      @keyframes pulse-ring{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.5);opacity:0}}
      .map-marker-group:hover{transform:scale(1.18)}
      .map-marker-group:hover + .map-marker-tooltip,.map-marker-group:hover .map-marker-tooltip{opacity:1!important}
    </style>
  `;

  el.addEventListener("mouseenter", () => {
    const tooltip = el.querySelector(".map-marker-tooltip") as HTMLElement;
    if (tooltip) tooltip.style.opacity = "1";
  });
  el.addEventListener("mouseleave", () => {
    const tooltip = el.querySelector(".map-marker-tooltip") as HTMLElement;
    if (tooltip) tooltip.style.opacity = "0";
  });

  return el;
}

function createInspectorMarker(
  inspector: (typeof DEMO_INSPECTORS)[0],
  ml: typeof import("maplibre-gl")
): HTMLElement {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(37,99,235,0.35);animation:inspector-pulse 2s ease-in-out infinite;"></div>
      <div style="width:14px;height:14px;border-radius:50%;background:#2563EB;border:2px solid white;box-shadow:0 2px 6px rgba(37,99,235,0.8);display:flex;align-items:center;justify-content:center;">
        <div style="width:4px;height:4px;border-radius:50%;background:white;"></div>
      </div>
    </div>
    <div style="
      position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);
      background:rgba(15,23,42,0.92);color:#93C5FD;padding:2px 6px;border-radius:4px;
      font-size:9px;font-weight:700;white-space:nowrap;border:1px solid rgba(59,130,246,0.5);
      pointer-events:none;
    ">
      ${inspector.name.replace("Officer ", "")}
    </div>
    <style>@keyframes inspector-pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(2.2);opacity:0}}</style>
  `;
  return el;
}

function createGeofenceMarker(
  project: (typeof DEMO_PROJECTS)[0],
  ml: typeof import("maplibre-gl")
): HTMLElement {
  const el = document.createElement("div");
  el.style.pointerEvents = "none";
  el.innerHTML = `
    <div style="
      width: 56px; height: 56px; border-radius: 50%;
      border: 1.5px dashed #8B5CF6; background: rgba(139, 92, 246, 0.12);
      animation: geofence-pulse 3s infinite ease-in-out;
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="width: 6px; height: 6px; border-radius: 50%; background: #8B5CF6;"></div>
    </div>
    <style>@keyframes geofence-pulse{0%,100%{transform:scale(0.95);opacity:0.6}50%{transform:scale(1.15);opacity:0.95}}</style>
  `;
  return el;
}

function createCCTVMarker(
  online: boolean,
  total: number,
  ml: typeof import("maplibre-gl")
): HTMLElement {
  const el = document.createElement("div");
  const color = online ? "#10B981" : "#EF4444";
  el.innerHTML = `
    <div style="
      display:flex;align-items:center;gap:4px;
      background:rgba(15,23,42,0.88);padding:3px 6px;border-radius:6px;
      border:1px solid ${color}60;box-shadow:0 2px 8px rgba(0,0,0,0.4);
    ">
      <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
      <span style="color:white;font-size:9px;font-weight:700;">${online ? "CCTV LIVE" : "CCTV OFF"}</span>
    </div>
  `;
  return el;
}

export function MapPanel({
  onProjectClick,
  projects: customProjects,
  filteredProjectIds,
  layers: externalLayers,
  onLayersChange,
  filters: externalFilters,
  onFiltersChange,
  totalCount,
  filteredCount,
  showControls = true,
}: MapPanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCCTVCam, setActiveCCTVCam] = useState<{ id: string; name: string; project: string; status: string } | null>(null);
  const [showCCTVMatrix, setShowCCTVMatrix] = useState(false);
  const [explainRiskProjectId, setExplainRiskProjectId] = useState<string | null>(null);
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Fallback internal layers state
  const [localLayers, setLocalLayers] = useState<MapLayers>({
    projects: true,
    risk: true,
    inspectors: true,
    cctv: true,
    geofence: false,
  });

  const activeLayers = externalLayers ?? localLayers;
  const handleLayersChange = onLayersChange ?? setLocalLayers;

  const handleRandomDispatch = (projectName: string) => {
    setDispatchAlert(`⚡ Audit Squad dispatched to ${projectName}`);
    setTimeout(() => setDispatchAlert(null), 4000);
  };

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  const addMarkers = useCallback(
    (map: import("maplibre-gl").Map, ml: typeof import("maplibre-gl")) => {
      clearMarkers();

      const sourceProjects = customProjects && customProjects.length > 0 ? customProjects : DEMO_PROJECTS;
      const visibleProjects = filteredProjectIds
        ? sourceProjects.filter((p: any) => filteredProjectIds.includes(p.id))
        : sourceProjects;

      // Project & Risk markers
      if (activeLayers.projects || activeLayers.risk) {
        for (const project of visibleProjects) {
          const marker = new ml.Marker({ element: createProjectMarker(project, ml), anchor: "bottom" })
            .setLngLat([project.location.longitude, project.location.latitude])
            .addTo(map);

          const popupHtml = `
            <div style="padding:12px;font-family:sans-serif;max-width:240px;">
              <div style="font-size:10px;font-weight:800;color:#2563EB;text-transform:uppercase;letter-spacing:0.05em;">${project.scheme_name || "FACILITY"}</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:4px;line-height:1.3;">${project.name}</div>
              <div style="font-size:11px;color:#64748B;margin-bottom:8px;">${project.district_name}, ${project.state}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;background:#F8FAFC;padding:8px;border-radius:8px;margin-bottom:10px;border:1px solid #E2E8F0;">
                <span style="font-size:11px;font-weight:600;color:#475569;">Risk Score:</span>
                <span style="font-size:12px;font-weight:900;color:${getRiskColor(project.ai_risk_score)};">${project.ai_risk_score}/100</span>
              </div>
              <button id="dispatch-btn-${project.id}" style="width:100%;padding:8px;background:linear-gradient(135deg,#E11D48,#BE123C);color:white;border:none;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">
                ⚡ Dispatch Audit Squad
              </button>
            </div>
          `;

          const popup = new ml.Popup({ offset: 25 }).setHTML(popupHtml);
          marker.setPopup(popup);

          popup.on("open", () => {
            const btn = document.getElementById(`dispatch-btn-${project.id}`);
            btn?.addEventListener("click", () => handleRandomDispatch(project.name));
          });

          marker.getElement().addEventListener("click", () => {
            map.flyTo({
              center: [project.location.longitude, project.location.latitude],
              zoom: 11,
              duration: 800,
            });
            onProjectClick?.(project.id);
          });

          markersRef.current.push(marker);
        }
      }

      // Inspector Locations Layer
      if (activeLayers.inspectors) {
        for (const inspector of DEMO_INSPECTORS) {
          const lng = inspector.current_longitude ?? 78.9629;
          const lat = inspector.current_latitude ?? 20.5937;
          const markerElement = createInspectorMarker(inspector, ml);
          const marker = new ml.Marker({ element: markerElement, anchor: "center" })
            .setLngLat([lng, lat])
            .addTo(map);

          const popupHtml = `
            <div style="padding:10px;font-family:sans-serif;max-width:220px;">
              <div style="font-size:9px;font-weight:800;color:#2563EB;text-transform:uppercase;">FIELD AUDIT SQUAD</div>
              <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:2px;">${inspector.name}</div>
              <div style="font-size:11px;color:#64748B;margin-bottom:6px;">${inspector.district_name} • ID: ${inspector.employee_id}</div>
              <div style="display:flex;justify-content:space-between;background:#F1F5F9;padding:6px;border-radius:6px;font-size:11px;margin-bottom:8px;">
                <span>Audits: <b>${inspector.total_inspections}</b></span>
                <span style="color:${inspector.is_available ? '#10B981' : '#F59E0B'};font-weight:bold;">${inspector.is_available ? '● Available' : '● On Audit'}</span>
              </div>
              <a href="/dashboard/inspections/assign" style="display:block;text-align:center;padding:6px;background:#2563EB;color:white;text-decoration:none;border-radius:6px;font-size:10px;font-weight:bold;">
                Assign Inspection
              </a>
            </div>
          `;
          marker.setPopup(new ml.Popup({ offset: 15 }).setHTML(popupHtml));
          markersRef.current.push(marker);
        }
      }

      // Geofence Zones Layer
      if (activeLayers.geofence) {
        for (const project of visibleProjects) {
          const markerElement = createGeofenceMarker(project, ml);
          const marker = new ml.Marker({ element: markerElement, anchor: "center" })
            .setLngLat([project.location.longitude, project.location.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        }
      }

      // CCTV Markers Layer
      if (activeLayers.cctv) {
        for (const project of visibleProjects) {
          const markerElement = createCCTVMarker(project.cctv_online > 0, project.cctv_total, ml);
          markerElement.style.cursor = "pointer";
          markerElement.addEventListener("click", (e) => {
            e.stopPropagation();
            setActiveCCTVCam({
              id: `CAM-${project.id}`,
              name: `Live Feed — ${project.name}`,
              project: project.name,
              status: project.cctv_online > 0 ? "ONLINE" : "OFFLINE",
            });
          });

          const marker = new ml.Marker({ element: markerElement, anchor: "bottom-left" })
            .setLngLat([project.location.longitude + 0.003, project.location.latitude + 0.0015])
            .addTo(map);
          markersRef.current.push(marker);
        }
      }
    },
    [filteredProjectIds, activeLayers, onProjectClick, clearMarkers, customProjects]
  );

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapContainer.current) return;
      const ml = await loadMaplibre();
      if (!mounted || !mapContainer.current || mapRef.current || !ml) return;

      const map = new ml.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "carto-voyager": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
                "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© CartoDB, © OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "carto-layer",
              type: "raster",
              source: "carto-voyager",
              paint: {
                "raster-opacity": 1.0,
              },
            },
          ],
        },
        center: [78.9629, 20.5937],
        zoom: 4.8,
        pitch: is3D ? 58 : 0,
        bearing: is3D ? -18 : 0,
        maxPitch: 85,
        dragRotate: true,
        pitchWithRotate: true,
      });

      // 3D Navigation Control with Compass and Tilt Visualizer
      const nav = new ml.NavigationControl({
        visualizePitch: true,
        showCompass: true,
        showZoom: true,
      });
      map.addControl(nav, "bottom-right");

      // Sync 3D indicator with gestures / pitch changes
      map.on("pitch", () => {
        setIs3D(map.getPitch() > 15);
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!mounted) return;
        setIsLoaded(true);
        addMarkers(map, ml);
      });
    }

    initMap();

    return () => {
      mounted = false;
      clearMarkers();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const ml = window.maplibregl;
    if (!ml) return;
    addMarkers(mapRef.current, ml);
  }, [isLoaded, filteredProjectIds, activeLayers, addMarkers]);

  // Robust loop-safe ResizeObserver for automatic Map canvas recalculation without visual artifacts
  useEffect(() => {
    if (!mapContainer.current) return;

    let rafId: number | null = null;
    let prevWidth = 0;
    let prevHeight = 0;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (Math.abs(width - prevWidth) > 2 || Math.abs(height - prevHeight) > 2) {
          prevWidth = width;
          prevHeight = height;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            mapRef.current?.resize();
          });
        }
      }
    });

    observer.observe(mapContainer.current);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Listen to native fullscreen events & Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(isDocFullscreen);

      // Perform staggered canvas resizes to match transition frames
      const triggerResize = () => mapRef.current?.resize();
      requestAnimationFrame(triggerResize);
      setTimeout(triggerResize, 60);
      setTimeout(triggerResize, 180);
      setTimeout(triggerResize, 350);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          setIsFullscreen(false);
        }
      }
      if ((e.key === "3" || e.key === "t" || e.key === "T") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        toggle3D();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );

      if (!isCurrentlyFullscreen && !isFullscreen) {
        if (wrapperRef.current?.requestFullscreen) {
          await wrapperRef.current.requestFullscreen();
        } else if ((wrapperRef.current as unknown as { webkitRequestFullscreen?: () => Promise<void> })?.webkitRequestFullscreen) {
          await (wrapperRef.current as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> })?.webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  const setPerspective = useCallback((pitchAngle: number, bearingAngle: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      pitch: pitchAngle,
      bearing: bearingAngle,
      duration: 1000,
    });
    setIs3D(pitchAngle > 15);
  }, []);

  const toggle3D = useCallback(() => {
    if (!is3D) {
      setPerspective(60, -20);
    } else {
      setPerspective(0, 0);
    }
  }, [is3D, setPerspective]);

  function flyToIndia() {
    mapRef.current?.flyTo({ center: [80.5, 20.5], zoom: 4.8, pitch: 0, bearing: 0, duration: 750 });
  }

  return (
    <div
      ref={wrapperRef}
      className={`map-wrapper select-none ${
        isFullscreen
          ? "fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 overflow-hidden"
          : "relative w-full h-full overflow-hidden"
      }`}
      style={{
        width: isFullscreen ? "100vw" : "100%",
        height: isFullscreen ? "100vh" : "100%",
      }}
    >
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" style={{ width: "100%", height: "100%" }} />

      {/* Dispatch Toast */}
      {dispatchAlert && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[100001] px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xl animate-bounce flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #E11D48, #991B1B)", border: "1px solid rgba(255,255,255,0.4)" }}
        >
          {dispatchAlert}
        </div>
      )}

      {/* CCTV Modal */}
      {activeCCTVCam && (
        <div className="absolute inset-0 z-[100002] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setActiveCCTVCam(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white text-sm font-bold"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-emerald-400">
                CCTV STREAM — {activeCCTVCam.status}
              </span>
            </div>
            <div className="relative aspect-video rounded-xl bg-black border border-slate-800 flex items-center justify-center overflow-hidden mb-3">
              <div className="text-center p-4">
                <Video size={36} className="mx-auto text-emerald-400 opacity-80 mb-2 animate-pulse" />
                <p className="text-xs font-mono text-slate-300 font-bold mb-1">{activeCCTVCam.name}</p>
                <p className="text-[10px] text-slate-500">Live Secure RTSP/WebRTC Video Channel</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-medium">{activeCCTVCam.project}</p>
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-white z-10">
          <div className="text-center">
            <MapPin size={36} className="mx-auto text-blue-500 animate-bounce mb-2" />
            <p className="text-xs font-mono text-slate-400">Loading NIRNAY Full-Screen GIS Engine…</p>
          </div>
        </div>
      )}

      {isLoaded && (
        <>
          {/* Top Left Floating Filter & Layer Overlay */}
          {showControls && (
            <div
              className={`absolute flex items-start gap-2 ${
                isFullscreen ? "top-16 left-4" : "top-3 left-3"
              }`}
              style={{ zIndex: isFullscreen ? 100000 : 20 }}
            >
              {externalFilters && onFiltersChange && (
                <MapFilterPanel
                  filters={externalFilters}
                  onFiltersChange={onFiltersChange}
                  totalCount={totalCount ?? DEMO_PROJECTS.length}
                  filteredCount={filteredCount ?? (filteredProjectIds?.length ?? DEMO_PROJECTS.length)}
                />
              )}
              <MapLayerControl layers={activeLayers} onLayersChange={handleLayersChange} />
            </div>
          )}

          {/* Fullscreen Title Badge (when in Fullscreen mode) */}
          {isFullscreen && (
            <div
              className="absolute top-4 left-4 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 text-white border border-slate-700/80 backdrop-blur-md shadow-2xl pointer-events-none"
              style={{ zIndex: 100000 }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-xs font-extrabold tracking-wide block">NIRNAY Tactical GIS Command</span>
                <span className="text-[10px] text-slate-400 font-mono">Press ESC or click button to exit</span>
              </div>
            </div>
          )}

          {/* Top Right Floating Toolbar: 2D/3D, Recenter, CCTV Matrix & Fullscreen */}
          <div
            className="absolute top-3 right-3 flex items-center gap-2"
            style={{ zIndex: isFullscreen ? 100000 : 20 }}
          >
            <button
              type="button"
              onClick={() => setShowCCTVMatrix(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 bg-rose-600/90 text-white border border-rose-500/40 backdrop-blur-md hover:bg-rose-600"
              title="Open 4-Camera Live Surveillance Matrix"
            >
              <Video size={14} />
              <span className="hidden sm:inline">CCTV Matrix</span>
            </button>

            {/* 2D / 3D Mode Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-700 backdrop-blur-md shadow-lg gap-0.5">
              <button
                type="button"
                onClick={() => setPerspective(0, 0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !is3D
                    ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400/50"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
                title="Switch to 2D Plan (Top-Down Orthogonal View)"
              >
                <span>🗺️ 2D Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setPerspective(62, -22)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  is3D
                    ? "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/50"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
                title="Switch to 3D Tactical Perspective (62° Tilt — Hold Right-Click / Ctrl+Drag to Rotate)"
              >
                <span>🌐 3D View</span>
              </button>
            </div>

            <button
              type="button"
              onClick={flyToIndia}
              className="px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer bg-slate-900/90 text-white border border-slate-700 backdrop-blur-md hover:bg-slate-800"
            >
              ⊙ Recenter
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className={`px-3 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                isFullscreen
                  ? "bg-rose-600 hover:bg-rose-700 text-white border border-rose-400/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title={isFullscreen ? "Exit Fullscreen Map (ESC)" : "Full Screen GIS Mode"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={15} />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 size={15} />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          </div>

          {/* Render CCTV Matrix Modal */}
          {showCCTVMatrix && (
            <CCTVMatrixModal
              onClose={() => setShowCCTVMatrix(false)}
              initialProjectId={filteredProjectIds?.[0] || DEMO_PROJECTS[0]?.id}
            />
          )}

          {/* Render Explainable Risk Modal */}
          {explainRiskProjectId && (
            <ExplainableRiskModal
              projectId={explainRiskProjectId}
              onClose={() => setExplainRiskProjectId(null)}
              onDispatchInspection={(pId) => {
                setExplainRiskProjectId(null);
                handleRandomDispatch(pId);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}


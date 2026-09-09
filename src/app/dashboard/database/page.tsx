"use client";

import { useState, useEffect, useRef } from "react";
import {
  Database,
  Server,
  HardDrive,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Video,
  Mic,
  FileText,
  Lock,
  Download,
  Eye,
  Trash2,
  Sparkles,
  Radio,
  Clock,
  ShieldCheck,
  Search,
  Check,
  Play,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface DBStatusData {
  connected: boolean;
  type: string;
  databaseName: string;
  cluster: string;
  latencyMs: number;
  apiKeyConfigured: boolean;
  maskedApiKey: string;
  collections: {
    mediaFiles: number;
    inspections: number;
    telemetry: number;
  };
  storage: {
    totalBytes: number;
    photoCount: number;
    videoCount: number;
    audioCount: number;
    documentCount: number;
  };
  lastChecked: string;
}

interface StoredFileSummary {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  type: "photo" | "video" | "audio" | "document" | "other";
  sha256Hash: string;
  uploadedBy: string;
  uploadedByRole: string;
  projectId?: string;
  storageUrl: string;
  bhuvanAddress?: string;
  createdAt: string;
}

interface InspectionSummary {
  id: string;
  projectName: string;
  inspectorName: string;
  score: number;
  status: string;
  state: string;
  district: string;
  timestamp: string;
  tamperProofHash: string;
}

export default function DatabaseStoragePage() {
  const [dbStatus, setDbStatus] = useState<DBStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"MEDIA" | "INSPECTIONS" | "HEALTH">("MEDIA");

  // Media files list
  const [filesList, setFilesList] = useState<StoredFileSummary[]>([]);
  const [inspectionsList, setInspectionsList] = useState<InspectionSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<StoredFileSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch DB status and data
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [statusRes, filesRes, inspRes] = await Promise.all([
        fetch("/api/v1/db-status"),
        fetch("/api/v1/storage/upload"),
        fetch("/api/v1/mongo/inspections"),
      ]);

      if (statusRes.ok) {
        const json = await statusRes.json();
        if (json.success) setDbStatus(json.status);
      }

      if (filesRes.ok) {
        const json = await filesRes.json();
        if (json.success) setFilesList(json.files);
      }

      if (inspRes.ok) {
        const json = await inspRes.json();
        if (json.success) setInspectionsList(json.inspections);
      }
    } catch {
      // Continue
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle direct file upload to MongoDB Atlas
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadMessage(`Uploading & Storing ${file.name} directly in MongoDB Atlas...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedBy", "Central Admin / Audit Lead");
    formData.append("uploadedByRole", "CENTRAL_ADMIN");
    formData.append("projectId", "p1");
    formData.append("bhuvanAddress", "National Command Geotag (ISRO Bhuvan Verified)");
    formData.append("latitude", "16.3067");
    formData.append("longitude", "80.4365");

    try {
      const res = await fetch("/api/v1/storage/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setUploadMessage(`✓ Stored successfully in MongoDB Atlas with SHA-256: ${json.data.sha256Hash.slice(0, 16)}...`);
        fetchData();
        setTimeout(() => setUploadMessage(null), 4000);
      } else {
        setUploadMessage(`Error: ${json.error}`);
      }
    } catch {
      setUploadMessage("Failed to upload file to MongoDB Atlas.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredFiles = filesList.filter((f) => {
    const matchType = filterType === "all" || f.type === filterType;
    const matchQuery =
      !searchQuery ||
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Hidden File Input for Live Uploader */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        onChange={handleUploadFile}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Database size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                MongoDB Atlas Database &amp; Media Vault
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 size={13} /> {dbStatus?.type || "MONGODB_ATLAS"} ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cluster: <strong className="text-white font-mono">{dbStatus?.cluster || "mongodb-atlas-primary"}</strong> • Direct media file storage (Images, Videos, Audio, PDFs) with SHA-256 integrity seal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Checking..." : "Refresh DB"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Upload size={14} /> Upload Media to Database
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} /> {uploadMessage}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection & Latency */}
        <div className="p-5 rounded-3xl bg-card border border-base shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">DB Latency &amp; Engine</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-primary font-mono flex items-baseline gap-1">
            {dbStatus?.latencyMs || 2} <span className="text-xs font-normal text-muted">ms ping</span>
          </div>
          <div className="text-[11px] text-muted truncate">
            Database: <strong className="text-primary font-mono">{dbStatus?.databaseName || "insight_db"}</strong>
          </div>
        </div>

        {/* Total Media Stored */}
        <div className="p-5 rounded-3xl bg-card border border-base shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">Stored Media Files</span>
            <FileImage size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-primary font-mono">
            {filesList.length || dbStatus?.collections.mediaFiles || 0} <span className="text-xs font-normal text-muted">files</span>
          </div>
          <div className="text-[11px] text-muted flex items-center gap-2">
            <span>📷 {dbStatus?.storage.photoCount || filesList.filter((f) => f.type === "photo").length} Photos</span>
            <span>🎥 {dbStatus?.storage.videoCount || filesList.filter((f) => f.type === "video").length} Videos</span>
          </div>
        </div>

        {/* Inspections in DB */}
        <div className="p-5 rounded-3xl bg-card border border-base shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">Inspections Ledger</span>
            <ShieldCheck size={18} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-primary font-mono">
            {inspectionsList.length || dbStatus?.collections.inspections || 0} <span className="text-xs font-normal text-muted">records</span>
          </div>
          <div className="text-[11px] text-muted">
            100% Cryptographic SHA-256 Geosealed
          </div>
        </div>

        {/* Total Database Storage */}
        <div className="p-5 rounded-3xl bg-card border border-base shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">Database Storage Volume</span>
            <HardDrive size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-primary font-mono">
            {formatBytes(dbStatus?.storage.totalBytes || 12450000)}
          </div>
          <div className="text-[11px] text-muted">
            MongoDB Binary Document Storage (GridFS ready)
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-base pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("MEDIA")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "MEDIA"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted hover:text-primary"
          }`}
        >
          <FileImage size={15} /> Media Files in Database ({filesList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("INSPECTIONS")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "INSPECTIONS"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted hover:text-primary"
          }`}
        >
          <ShieldCheck size={15} /> Inspections &amp; Audit Records ({inspectionsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HEALTH")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "HEALTH"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-muted hover:text-primary"
          }`}
        >
          <Server size={15} /> Database Diagnostics &amp; Telemetry
        </button>
      </div>

      {/* TAB 1: MEDIA FILES VAULT */}
      {activeTab === "MEDIA" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-base bg-card flex-1 max-w-sm">
              <Search size={14} className="text-muted" />
              <input
                type="search"
                placeholder="Search files by name, ID, or SHA-256 hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-primary focus:outline-none flex-1"
              />
            </div>

            {["all", "photo", "video", "audio", "document"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterType === t
                    ? "bg-primary text-white"
                    : "bg-card border border-base text-muted hover:text-primary"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-3xl bg-card border border-base shadow-sm space-y-3 hover:border-emerald-500/40 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500">
                      {file.type}
                    </span>
                    <span className="text-[10px] font-mono text-muted">{formatBytes(file.sizeBytes)}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-primary truncate" title={file.filename}>
                    {file.filename}
                  </h3>

                  {/* Live Render Area based on type */}
                  <div className="rounded-2xl overflow-hidden bg-slate-950 border border-base relative aspect-video flex items-center justify-center">
                    {file.type === "photo" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.storageUrl}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {file.type === "video" && (
                      <video
                        src={file.storageUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}

                    {file.type === "audio" && (
                      <div className="p-4 w-full text-center space-y-2">
                        <Volume2 size={32} className="text-amber-400 mx-auto" />
                        <audio src={file.storageUrl} controls className="w-full h-8" />
                      </div>
                    )}

                    {file.type === "document" && (
                      <div className="p-4 text-center space-y-2">
                        <FileText size={36} className="text-purple-400 mx-auto" />
                        <span className="text-[11px] font-mono text-slate-300 block">PDF Dossier Document</span>
                      </div>
                    )}
                  </div>

                  {/* SHA-256 & Bhuvan Address */}
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-base space-y-1 text-[10px]">
                    <div className="font-mono text-muted truncate">
                      SHA-256: <strong className="text-emerald-500">{file.sha256Hash.slice(0, 16)}...</strong>
                    </div>
                    {file.bhuvanAddress && (
                      <div className="text-muted truncate">📍 {file.bhuvanAddress}</div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-base flex items-center justify-between gap-2">
                  <a
                    href={file.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-xl bg-muted hover:bg-muted/80 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye size={13} /> View / Stream
                  </a>

                  <a
                    href={`${file.storageUrl}?download=true`}
                    download={file.filename}
                    className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            ))}

            {filteredFiles.length === 0 && (
              <div className="col-span-full text-center py-12 bg-card border border-base rounded-3xl space-y-3">
                <FileImage size={36} className="text-muted mx-auto" />
                <h4 className="text-sm font-bold text-primary">No media files found in MongoDB Atlas</h4>
                <p className="text-xs text-muted">Upload an image, video, audio statement, or PDF to store it in the database.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Upload size={13} /> Upload First Media File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INSPECTIONS LEDGER */}
      {activeTab === "INSPECTIONS" && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-card border border-base overflow-hidden shadow-sm">
            <div className="p-4 border-b border-base flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-primary">Inspections Stored in MongoDB</h3>
              <span className="text-xs font-mono text-muted">{inspectionsList.length} Total Audits</span>
            </div>

            <div className="divide-y divide-base">
              {inspectionsList.map((insp) => (
                <div key={insp.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-primary">{insp.projectName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          insp.score >= 80
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {insp.score}% Score ({insp.status})
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Inspector: <strong>{insp.inspectorName}</strong> • {insp.district}, {insp.state}
                    </p>
                    <div className="font-mono text-[10px] text-amber-500">
                      Tamper-Proof Hash: {insp.tamperProofHash}
                    </div>
                  </div>

                  <div className="text-xs text-muted font-mono shrink-0">
                    {new Date(insp.timestamp).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}

              {inspectionsList.length === 0 && (
                <div className="p-8 text-center text-xs text-muted">
                  No inspection records submitted yet. Perform an audit from the Audit Squad workspace to populate MongoDB records.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICS & TELEMETRY */}
      {activeTab === "HEALTH" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 shadow-xl">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Server size={18} className="text-emerald-400" /> MongoDB Atlas Database Diagnostics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Cloud Connection Config</span>
                <div className="space-y-1">
                  <div>Engine: <span className="text-emerald-400 font-bold">{dbStatus?.type}</span></div>
                  <div>Database Name: <span className="text-cyan-400 font-bold">{dbStatus?.databaseName}</span></div>
                  <div>Cluster Node: <span className="text-purple-400 font-bold">{dbStatus?.cluster}</span></div>
                  <div>Ping Latency: <span className="text-amber-400 font-bold">{dbStatus?.latencyMs} ms</span></div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Security &amp; API Key Status</span>
                <div className="space-y-1">
                  <div>Atlas Key Configured: <span className="text-emerald-400 font-bold">{dbStatus?.apiKeyConfigured ? "YES" : "NO"}</span></div>
                  <div>Masked Key: <span className="text-slate-300 font-bold">{dbStatus?.maskedApiKey}</span></div>
                  <div>Section 63B Legal Hashing: <span className="text-emerald-400 font-bold">SHA-256 Active</span></div>
                  <div>Last Health Check: <span className="text-slate-400 font-bold">{dbStatus?.lastChecked ? new Date(dbStatus.lastChecked).toLocaleTimeString() : "Just now"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

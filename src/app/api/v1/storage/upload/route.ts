import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { mongoServerAtlasClient } from "@/lib/db/mongodb.server";
import { MediaFileRecord } from "@/lib/db/mongodb";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // 1. Handle multipart/form-data (direct file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided in form data" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

      const mimeType = file.type || "application/octet-stream";
      let type: MediaFileRecord["type"] = "other";
      if (mimeType.startsWith("image/")) type = "photo";
      else if (mimeType.startsWith("video/")) type = "video";
      else if (mimeType.startsWith("audio/")) type = "audio";
      else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("word")) type = "document";

      const uploadedBy = (formData.get("uploadedBy") as string) || "u_officer_priya";
      const uploadedByRole = (formData.get("uploadedByRole") as string) || "AUDIT_SQUAD";
      const projectId = (formData.get("projectId") as string) || "p1";
      const auditId = (formData.get("auditId") as string) || "AUD-2026-0094";
      const bhuvanAddress = (formData.get("bhuvanAddress") as string) || "ISRO Bhuvan Cadastral Verified";
      const lat = Number(formData.get("latitude")) || 16.3067;
      const lng = Number(formData.get("longitude")) || 80.4365;

      const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const record: MediaFileRecord = {
        id: fileId,
        filename: file.name,
        mimeType,
        sizeBytes: buffer.length,
        type,
        dataBase64: `data:${mimeType};base64,${base64}`,
        sha256Hash,
        uploadedBy,
        uploadedByRole,
        projectId,
        auditId,
        gps: {
          latitude: lat,
          longitude: lng,
          accuracy: 4.8,
        },
        bhuvanAddress,
        createdAt: new Date().toISOString(),
      };

      const result = await mongoServerAtlasClient.saveMediaFile(record);

      return NextResponse.json({
        success: true,
        message: "File stored successfully in MongoDB Atlas",
        data: {
          id: record.id,
          filename: record.filename,
          type: record.type,
          mimeType: record.mimeType,
          sizeBytes: record.sizeBytes,
          sha256Hash: record.sha256Hash,
          storageUrl: result.storageUrl,
          bhuvanAddress: record.bhuvanAddress,
          createdAt: record.createdAt,
        },
      });
    }

    // 2. Handle JSON payload (base64 data URL upload)
    const body = await request.json();
    const {
      filename = `upload_${Date.now()}`,
      mimeType = "image/jpeg",
      type = "photo",
      dataBase64,
      uploadedBy = "u_officer_priya",
      uploadedByRole = "AUDIT_SQUAD",
      projectId = "p1",
      auditId = "AUD-2026-0094",
      gps,
      bhuvanAddress = "ISRO Bhuvan Cadastral Verified",
      metadata,
    } = body;

    if (!dataBase64) {
      return NextResponse.json({ success: false, error: "dataBase64 is required" }, { status: 400 });
    }

    // Extract raw base64 string
    const base64Data = dataBase64.includes(",") ? dataBase64.split(",")[1] : dataBase64;
    const buffer = Buffer.from(base64Data, "base64");
    const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const fileId = `FILE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const record: MediaFileRecord = {
      id: fileId,
      filename,
      mimeType,
      sizeBytes: buffer.length,
      type,
      dataBase64: dataBase64.startsWith("data:") ? dataBase64 : `data:${mimeType};base64,${dataBase64}`,
      sha256Hash,
      uploadedBy,
      uploadedByRole,
      projectId,
      auditId,
      gps: gps || { latitude: 16.3067, longitude: 80.4365, accuracy: 4.8 },
      bhuvanAddress,
      createdAt: new Date().toISOString(),
      metadata,
    };

    const result = await mongoServerAtlasClient.saveMediaFile(record);

    return NextResponse.json({
      success: true,
      message: "File stored successfully in MongoDB Atlas",
      data: {
        id: record.id,
        filename: record.filename,
        type: record.type,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        sha256Hash: record.sha256Hash,
        storageUrl: result.storageUrl,
        bhuvanAddress: record.bhuvanAddress,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal storage error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || undefined;
  const projectId = url.searchParams.get("projectId") || undefined;

  const files = await mongoServerAtlasClient.listMediaFiles({ type, projectId });

  // Return file list without the massive dataBase64 payload for fast response
  const summary = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    type: f.type,
    sha256Hash: f.sha256Hash,
    uploadedBy: f.uploadedBy,
    uploadedByRole: f.uploadedByRole,
    projectId: f.projectId,
    auditId: f.auditId,
    gps: f.gps,
    bhuvanAddress: f.bhuvanAddress,
    storageUrl: `/api/v1/storage/file/${f.id}`,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({
    success: true,
    count: summary.length,
    files: summary,
  });
}

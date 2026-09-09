import { describe, it, expect, beforeEach } from "vitest";
import { mongoAtlasClient, MediaFileRecord } from "@/lib/db/mongodb";
import { evidenceVault } from "@/lib/evidence/evidence-vault";

describe("MongoDB Atlas Database & Full Media Storage Engine", () => {
  it("tests database connection and retrieves storage telemetry", async () => {
    const status = await mongoAtlasClient.testConnection();
    expect(status).toBeDefined();
    expect(status.connected).toBe(true);
    expect(status.databaseName).toBe("insight_platform_db");
    expect(status.latencyMs).toBeGreaterThanOrEqual(0);
    expect(status.collections).toBeDefined();
    expect(status.storage).toBeDefined();
  });

  it("stores and retrieves a photographic proof in MongoDB Atlas", async () => {
    const photoRecord: MediaFileRecord = {
      id: "FILE-TEST-PHOTO-001",
      filename: "test_cctv_audit.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 154200,
      type: "photo",
      dataBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
      sha256Hash: "8f4b52c79a9e3d81b24e6501a2d718b560195e26c6d231940989fba7541b2c45",
      uploadedBy: "u_officer_priya",
      uploadedByRole: "AUDIT_SQUAD",
      projectId: "p1",
      bhuvanAddress: "Guntur Rural Cadastral Verified",
      createdAt: new Date().toISOString(),
    };

    const saveRes = await mongoAtlasClient.saveMediaFile(photoRecord);
    expect(saveRes.success).toBe(true);
    expect(saveRes.fileId).toBe("FILE-TEST-PHOTO-001");
    expect(saveRes.storageUrl).toBe("/api/v1/storage/file/FILE-TEST-PHOTO-001");

    const retrieved = await mongoAtlasClient.getMediaFile("FILE-TEST-PHOTO-001");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.filename).toBe("test_cctv_audit.jpg");
    expect(retrieved?.sha256Hash).toBe("8f4b52c79a9e3d81b24e6501a2d718b560195e26c6d231940989fba7541b2c45");
  });

  it("stores and retrieves a video proof record in MongoDB Atlas", async () => {
    const videoRecord: MediaFileRecord = {
      id: "FILE-TEST-VIDEO-001",
      filename: "cctv_footage_anomaly.mp4",
      mimeType: "video/mp4",
      sizeBytes: 8400200,
      type: "video",
      dataBase64: "data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29t...",
      sha256Hash: "3a7c91e4f2081d59ba2e6501a2d718b560195e26c6d231940989fba7541e98d1",
      uploadedBy: "u_officer_priya",
      uploadedByRole: "AUDIT_SQUAD",
      projectId: "p1",
      createdAt: new Date().toISOString(),
    };

    const saveRes = await mongoAtlasClient.saveMediaFile(videoRecord);
    expect(saveRes.success).toBe(true);

    const retrieved = await mongoAtlasClient.getMediaFile("FILE-TEST-VIDEO-001");
    expect(retrieved?.type).toBe("video");
  });

  it("stores and retrieves an audio statement in MongoDB Atlas", async () => {
    const audioRecord: MediaFileRecord = {
      id: "FILE-TEST-AUDIO-001",
      filename: "incharge_statement.wav",
      mimeType: "audio/wav",
      sizeBytes: 420100,
      type: "audio",
      dataBase64: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA...",
      sha256Hash: "11e9f4c82b0931d87f4c9103e62a84b29104c8f37105a9e623b091fca820491e",
      uploadedBy: "u_officer_priya",
      uploadedByRole: "AUDIT_SQUAD",
      projectId: "p1",
      createdAt: new Date().toISOString(),
    };

    const saveRes = await mongoAtlasClient.saveMediaFile(audioRecord);
    expect(saveRes.success).toBe(true);

    const retrieved = await mongoAtlasClient.getMediaFile("FILE-TEST-AUDIO-001");
    expect(retrieved?.type).toBe("audio");
  });

  it("saves a 10-point field inspection audit to MongoDB Atlas", async () => {
    const inspectionRes = await mongoAtlasClient.saveInspection({
      id: "INS-TEST-001",
      projectId: "p1",
      projectName: "Asha Rehabilitation Centre",
      inspectorName: "Priya Mehta",
      inspectorRole: "Inspection Officer",
      state: "Andhra Pradesh",
      district: "Guntur",
      timestamp: new Date().toISOString(),
      score: 90,
      status: "COMPLETED",
      location: {
        latitude: 16.3067,
        longitude: 80.4365,
        accuracy: 4.8,
        bhuvanAddress: "Plot #44/2A, Guntur Rural",
      },
      checklist: {
        cctv: { pass: true, notes: "All 8 cameras functional" },
      },
      mediaFileIds: ["FILE-TEST-PHOTO-001"],
      tamperProofHash: "SHA256-TEST-HASH-998877",
    });

    expect(inspectionRes.success).toBe(true);
    expect(inspectionRes.recordId).toBe("INS-TEST-001");

    const list = await mongoAtlasClient.getInspections("Guntur");
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((i) => i.id === "INS-TEST-001")).toBe(true);
  });

  it("integrates EvidenceVault with MongoDB media persistence", async () => {
    const evidence = await evidenceVault.storeEvidence({
      audit_id: "AUD-2026-9999",
      inspection_id: "INSP-9999",
      project_id: "p1",
      owner_type: "AUDIT_SQUAD",
      owner_id: "SQUAD-07",
      owner_user_id: "u_officer_priya",
      uploaded_by: "u_officer_priya",
      uploaded_by_role: "AUDIT_SQUAD",
      state_id: "AP",
      district_id: "Guntur",
      type: "photo",
      filename: "tamper_photo.jpg",
      mime_type: "image/jpeg",
      file_size_bytes: 45000,
      storage_path: "/evidence/test.jpg",
      storage_url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...",
      version: 1,
      visibility: "STATE_AUTHORIZED",
      captured_at: new Date().toISOString(),
      gps: { latitude: 16.3067, longitude: 80.4365, accuracy: 4.8, timestamp: new Date().toISOString() },
      bhuvan_address: "Guntur Cadastre",
    });

    expect(evidence.uuid).toBeDefined();
    expect(evidence.sha256_hash).toBeDefined();
    expect(evidence.tamper_status).toBe("AUTHENTIC");
    expect(evidence.storage_url).toContain("/api/v1/storage/file/");
  });
});

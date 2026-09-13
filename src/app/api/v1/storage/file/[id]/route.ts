import { NextRequest, NextResponse } from "next/server";
import { mongoServerAtlasClient } from "@/lib/db/mongodb.server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const file = await mongoServerAtlasClient.getMediaFile(id);

    if (!file || !file.dataBase64) {
      return NextResponse.json({ success: false, error: "File not found in MongoDB database" }, { status: 404 });
    }

    // Check if client requests JSON metadata instead of binary stream
    const url = new URL(request.url);
    if (url.searchParams.get("format") === "json") {
      return NextResponse.json({
        success: true,
        file: {
          id: file.id,
          filename: file.filename,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          type: file.type,
          sha256Hash: file.sha256Hash,
          uploadedBy: file.uploadedBy,
          uploadedByRole: file.uploadedByRole,
          projectId: file.projectId,
          auditId: file.auditId,
          gps: file.gps,
          bhuvanAddress: file.bhuvanAddress,
          createdAt: file.createdAt,
          metadata: file.metadata,
        },
      });
    }

    // Decode base64 to binary buffer
    const base64Data = file.dataBase64.includes(",") ? file.dataBase64.split(",")[1] : file.dataBase64;
    const buffer = Buffer.from(base64Data, "base64");

    const headers = new Headers();
    headers.set("Content-Type", file.mimeType || "application/octet-stream");
    headers.set("Content-Length", buffer.length.toString());
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Sha256-Checksum", file.sha256Hash);

    // Sanitize filename to prevent HTTP header injection (CRLF / quotes)
    const sanitizedFilename = (file.filename || "file")
      .replace(/[\r\n"\\;]/g, "_")
      .slice(0, 150);
    const encodedFilename = encodeURIComponent(file.filename || "file");
    const dispositionType = url.searchParams.get("download") === "true" ? "attachment" : "inline";

    headers.set(
      "Content-Disposition",
      `${dispositionType}; filename="${sanitizedFilename}"; filename*=UTF-8''${encodedFilename}`
    );

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error streaming file";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

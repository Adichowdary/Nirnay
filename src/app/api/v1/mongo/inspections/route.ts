import { NextRequest, NextResponse } from "next/server";
import { mongoServerAtlasClient } from "@/lib/db/mongodb.server";
import { InspectionRecord } from "@/lib/db/mongodb";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const district = url.searchParams.get("district") || undefined;
  const list = await mongoServerAtlasClient.getInspections(district);

  return NextResponse.json({
    success: true,
    count: list.length,
    inspections: list,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InspectionRecord;

    if (!body.projectId || !body.inspectorName) {
      return NextResponse.json({ success: false, error: "projectId and inspectorName are required" }, { status: 400 });
    }

    const id = body.id || `INS-AUD-${Date.now()}`;
    const record: InspectionRecord = {
      ...body,
      id,
      timestamp: body.timestamp || new Date().toISOString(),
      status: body.status || (body.score >= 80 ? "COMPLETED" : "FLAGGED"),
    };

    const res = await mongoServerAtlasClient.saveInspection(record);

    return NextResponse.json({
      success: true,
      message: "Inspection saved to MongoDB Atlas",
      data: res,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error saving inspection";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

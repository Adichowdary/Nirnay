import { NextResponse } from "next/server";
import { mongoServerAtlasClient } from "@/lib/db/mongodb.server";

export async function GET() {
  try {
    const status = await mongoServerAtlasClient.testConnection();

    const apiKey = process.env.MONGODB_ATLAS_KEY || "al-0PSpD2ypvtd4sgsinwYbWk8Ho7HxRI5gAN9DD1rdAnC";
    const maskedKey = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : "None";

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        apiKeyConfigured: Boolean(apiKey),
        maskedApiKey: maskedKey,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database check error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

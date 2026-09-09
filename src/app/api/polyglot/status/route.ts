import { NextResponse } from "next/server";
import { checkPolyglotServices } from "@/lib/polyglot-client";

export async function GET() {
  try {
    const services = await checkPolyglotServices();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      serviceCount: services.length,
      services,
      orchestration: {
        engine: "Docker Compose v2",
        meshNetwork: "nirnay-net",
        dnsBridge: "Internal Docker Embedded DNS",
        readyForSihDemo: true
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to query polyglot services", details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getAllStatesPerformance,
  getAllStateAdmins,
  createStateAdmin,
} from "@/lib/admin/state-management";
import { verifyAdminRequest, APEX_ADMIN_ROLES, DEFAULT_ADMIN_ROLES } from "@/lib/auth/admin-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request, DEFAULT_ADMIN_ROLES);
    if (!auth.authorized && auth.errorResponse) return auth.errorResponse;

    const states = getAllStatesPerformance();
    const admins = getAllStateAdmins();

    return NextResponse.json({
      success: true,
      data: {
        states,
        admins,
      },
    });
  } catch (error) {
    console.error("GET states API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request, APEX_ADMIN_ROLES);
    if (!auth.authorized && auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { name, officialId, email, phone, stateId, permissions } = body;

    if (!name || !email || !stateId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, stateId" },
        { status: 400 }
      );
    }

    const newAdmin = createStateAdmin({
      name,
      officialId,
      email,
      phone,
      stateId,
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: "State Admin created and assigned successfully",
      data: newAdmin,
    }, { status: 201 });
  } catch (error) {
    console.error("POST state admin API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

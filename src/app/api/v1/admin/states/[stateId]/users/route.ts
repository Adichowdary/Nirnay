import { NextRequest, NextResponse } from "next/server";
import {
  getStateOperationalUsers,
  createStateOperationalUser,
  deactivateStateOperationalUser,
} from "@/lib/admin/state-management";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await context.params;
    const url = new URL(request.url);
    const districtFilter = url.searchParams.get("district") || undefined;

    const users = getStateOperationalUsers(stateId, districtFilter);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("GET state users API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ stateId: string }> }
) {
  try {
    const { stateId } = await context.params;
    const body = await request.json();
    const { name, email, phone, role, districtId, organizationName } = body;

    if (!name || !email || !districtId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, districtId" },
        { status: 400 }
      );
    }

    const newUser = createStateOperationalUser({
      name,
      email,
      phone: phone || "+91 00000 00000",
      role: role || "INSPECTION_OFFICER",
      stateId,
      districtId,
      organizationName,
    });

    return NextResponse.json({
      success: true,
      message: "State operational user created successfully",
      data: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error("POST state user API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const success = deactivateStateOperationalUser(userId);
    return NextResponse.json({ success, message: "User deactivated" });
  } catch (error) {
    console.error("DELETE state user API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

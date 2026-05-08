import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, approvedMessage, daysActive = 14 } = await req.json();

  if (!["approve", "ignore"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const now = new Date();
  const ref = adminDb.collection("trendAlerts").doc(id);

  if (action === "approve") {
    const activeTo = new Date(now.getTime() + daysActive * 24 * 60 * 60 * 1000).toISOString();
    await ref.update({
      status: "approved",
      isActive: true,
      approvedMessage: approvedMessage ?? null,
      activeFrom: now.toISOString(),
      activeTo,
      reviewedBy: adminUser.uid,
      reviewedAt: now.toISOString(),
    });
  } else {
    await ref.update({
      status: "ignored",
      reviewedBy: adminUser.uid,
      reviewedAt: now.toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}

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
  const { action } = await req.json();

  if (!["hide_content", "dismiss", "warn_user"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const reportRef = adminDb.collection("reports").doc(id);
  const reportSnap = await reportRef.get();
  if (!reportSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const report = reportSnap.data()!;
  const now = new Date().toISOString();

  await reportRef.update({
    status: action === "dismiss" ? "dismissed" : "resolved",
    resolvedBy: adminUser.uid,
    resolvedAt: now,
    resolvedAction: action,
  });

  // If hiding content, update the target document
  if (action === "hide_content") {
    if (report.targetType === "comment") {
      await adminDb.collection("comments").doc(report.targetId).update({ isPublic: false });
    } else if (report.targetType === "photo") {
      await adminDb.collection("oreumVisuals").doc(report.targetId).update({ isApproved: false });
    }
  }

  return NextResponse.json({ success: true });
}

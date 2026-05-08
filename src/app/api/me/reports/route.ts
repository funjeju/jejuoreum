import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetType, targetId, reason, detail } = await req.json();

  if (!["comment", "photo", "user"].includes(targetType)) {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }
  if (!targetId || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Prevent duplicate reports from same user
  const existing = await adminDb
    .collection("reports")
    .where("reporterId", "==", decoded.uid)
    .where("targetId", "==", targetId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Already reported" }, { status: 409 });
  }

  await adminDb.collection("reports").add({
    reporterId: decoded.uid,
    targetType,
    targetId,
    reason,
    detail: detail ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}

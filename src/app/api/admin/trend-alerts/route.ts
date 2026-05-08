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

export async function GET(req: NextRequest) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  let q = adminDb.collection("trendAlerts").orderBy("detectedAt", "desc");
  if (status !== "all") {
    q = q.where("status", "==", status) as typeof q;
  }

  const snap = await q.limit(50).get();
  const alerts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return NextResponse.json({ alerts });
}

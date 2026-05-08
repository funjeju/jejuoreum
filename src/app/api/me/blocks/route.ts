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

export async function GET(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("blockedUsers")
    .get();

  const blocked = snap.docs.map((d) => d.id);
  return NextResponse.json({ blocked });
}

export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUid, unblock } = await req.json();
  if (!targetUid || targetUid === decoded.uid) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const ref = adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("blockedUsers")
    .doc(targetUid);

  if (unblock) {
    await ref.delete();
  } else {
    await ref.set({ blockedAt: new Date().toISOString() });
  }

  return NextResponse.json({ success: true, blocked: !unblock });
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// Save push subscription
export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const sub = { endpoint, keys, createdAt: new Date().toISOString() };
  const id = Buffer.from(endpoint).toString("base64").slice(0, 64);

  await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("pushSubscriptions")
    .doc(id)
    .set(sub, { merge: true });

  return NextResponse.json({ ok: true });
}

// Remove push subscription
export async function DELETE(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  const id = Buffer.from(endpoint).toString("base64").slice(0, 64);
  await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("pushSubscriptions")
    .doc(id)
    .delete();

  return NextResponse.json({ ok: true });
}

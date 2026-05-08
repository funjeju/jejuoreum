import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { const d = await adminAuth.verifyIdToken(h.slice(7)); return d.admin ? d : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const snap = await adminDb.collection("goods").orderBy("createdAt", "desc").get();
  return NextResponse.json({ goods: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const now = new Date().toISOString();
  const ref = await adminDb.collection("goods").add({ ...body, createdAt: now, updatedAt: now });
  return NextResponse.json({ id: ref.id });
}

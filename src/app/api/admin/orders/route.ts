import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { const d = await adminAuth.verifyIdToken(h.slice(7)); return d.admin ? d : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let q = adminDb.collection("orders").orderBy("createdAt", "desc").limit(100) as FirebaseFirestore.Query;
  if (status) q = adminDb.collection("orders").where("status", "==", status).orderBy("createdAt", "desc").limit(100);

  const snap = await q.get();
  return NextResponse.json({ orders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
}

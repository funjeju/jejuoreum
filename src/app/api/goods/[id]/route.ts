import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const snap = await adminDb.collection("goods").doc(id).get();
  if (!snap.exists || !snap.data()?.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ goods: { id: snap.id, ...snap.data() } });
}

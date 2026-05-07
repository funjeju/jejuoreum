import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const snap = await adminDb
    .collectionGroup("discoveries")
    .where("oreumSlug", "==", slug)
    .count()
    .get();

  return NextResponse.json({ totalVisitors: snap.data().count });
}

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Get recent public feed events for this oreum (last 30 days)
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const snap = await adminDb
    .collection("feed")
    .where("oreumSlug", "==", slug)
    .where("eventType", "==", "discovery")
    .where("visibility", "==", "public")
    .where("occurredAt", ">=", since)
    .orderBy("occurredAt", "desc")
    .limit(12)
    .get();

  const visitors = snap.docs.map((d) => ({
    uid:           d.data().uid,
    userNickname:  d.data().userNickname,
    userAvatarUrl: d.data().userAvatarUrl ?? null,
    occurredAt:    d.data().occurredAt,
  }));

  return NextResponse.json({ visitors, total: snap.size });
}

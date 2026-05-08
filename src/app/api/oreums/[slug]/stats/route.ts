import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [totalSnap, weekSnap] = await Promise.all([
    adminDb.collectionGroup("discoveries").where("oreumSlug", "==", slug).count().get(),
    adminDb.collectionGroup("discoveries")
      .where("oreumSlug", "==", slug)
      .where("discoveredAt", ">=", sevenDaysAgo)
      .count()
      .get(),
  ]);

  return NextResponse.json({
    totalVisitors: totalSnap.data().count,
    weeklyVisitors: weekSnap.data().count,
  });
}

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const merchantSnap = await adminDb.collection("merchants").doc(id).get();
  if (!merchantSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merchant = merchantSnap.data()!;
  const relatedSlugs: string[] = merchant.relatedOreumSlugs ?? [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get discovery counts for all related oreums
  const oreumStats = await Promise.all(
    relatedSlugs.map(async (slug) => {
      const [weekSnap, monthSnap, totalSnap] = await Promise.all([
        adminDb.collectionGroup("discoveries")
          .where("oreumSlug", "==", slug)
          .where("discoveredAt", ">=", sevenDaysAgo)
          .count().get(),
        adminDb.collectionGroup("discoveries")
          .where("oreumSlug", "==", slug)
          .where("discoveredAt", ">=", thirtyDaysAgo)
          .count().get(),
        adminDb.collectionGroup("discoveries")
          .where("oreumSlug", "==", slug)
          .count().get(),
      ]);
      return {
        slug,
        weeklyVisitors: weekSnap.data().count,
        monthlyVisitors: monthSnap.data().count,
        totalVisitors: totalSnap.data().count,
      };
    })
  );

  const totalWeekly = oreumStats.reduce((s, o) => s + o.weeklyVisitors, 0);
  const totalMonthly = oreumStats.reduce((s, o) => s + o.monthlyVisitors, 0);

  return NextResponse.json({
    merchantId: id,
    merchantName: merchant.name,
    relatedOreumCount: relatedSlugs.length,
    estimatedReach: { weekly: totalWeekly, monthly: totalMonthly },
    oreumStats,
    reportedAt: new Date().toISOString(),
  });
}

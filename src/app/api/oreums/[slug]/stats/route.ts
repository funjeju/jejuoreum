import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const now = new Date().toISOString();

  const [totalSnap, weekSnap, monthSnap, alertsSnap] = await Promise.all([
    adminDb.collectionGroup("discoveries").where("oreumSlug", "==", slug).count().get(),
    adminDb.collectionGroup("discoveries")
      .where("oreumSlug", "==", slug)
      .where("discoveredAt", ">=", sevenDaysAgo)
      .count()
      .get(),
    adminDb.collectionGroup("discoveries")
      .where("oreumSlug", "==", slug)
      .where("discoveredAt", ">=", thirtyDaysAgo)
      .count()
      .get(),
    adminDb
      .collection("trendAlerts")
      .where("oreumSlug", "==", slug)
      .where("isActive", "==", true)
      .where("activeTo", ">=", now)
      .limit(3)
      .get(),
  ]);

  const totalVisitors   = totalSnap.data().count;
  const weeklyVisitors  = weekSnap.data().count;
  const monthlyVisitors = monthSnap.data().count;
  const trendAlerts = alertsSnap.docs.map((d) => ({
    id: d.id,
    alertType: d.data().alertType,
    message: d.data().approvedMessage ?? d.data().autoMessage,
  }));

  // Tiered companionship message (docs/20 section 3.3)
  let companionshipMessage: string | null = null;
  if (weeklyVisitors >= 50) {
    companionshipMessage = `이번 주 ${weeklyVisitors.toLocaleString()}명이 다녀갔어요`;
  } else if (monthlyVisitors >= 100) {
    companionshipMessage = `지난 30일간 ${monthlyVisitors.toLocaleString()}명이 다녀갔어요`;
  } else if (monthlyVisitors >= 10) {
    companionshipMessage = `최근 ${monthlyVisitors.toLocaleString()}명이 다녀갔어요`;
  } else if (totalVisitors >= 100) {
    companionshipMessage = `지금까지 ${totalVisitors.toLocaleString()}명이 다녀간 곳이에요`;
  }

  return NextResponse.json({
    totalVisitors,
    weeklyVisitors,
    monthlyVisitors,
    companionshipMessage,
    trendAlerts,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyAdmin(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { const d = await adminAuth.verifyIdToken(h.slice(7)); return d.admin ? d : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Last 6 months keys
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

  // Discovery feed events in last 6 months
  const feedSnap = await adminDb
    .collection("feed")
    .where("eventType", "==", "discovery")
    .where("occurredAt", ">=", sixMonthsAgo)
    .get();

  const monthlyMap: Record<string, number> = {};
  const regionMap: Record<string, number> = {};
  const hourMap: Record<number, number> = {};

  for (const doc of feedSnap.docs) {
    const data = doc.data();
    const monthKey = (data.occurredAt as string).slice(0, 7);
    monthlyMap[monthKey] = (monthlyMap[monthKey] ?? 0) + 1;

    const region = data.oreumRegion as string | undefined;
    if (region) regionMap[region] = (regionMap[region] ?? 0) + 1;

    const hour = new Date(data.occurredAt as string).getHours();
    hourMap[hour] = (hourMap[hour] ?? 0) + 1;
  }

  const monthlyActivity = months.map((m) => ({ month: m.slice(5), count: monthlyMap[m] ?? 0 }));
  const regionActivity = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .map(([region, count]) => ({ region, count }));

  const peakHour = Object.entries(hourMap).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  // New users in last 6 months
  const usersSnap = await adminDb
    .collection("users")
    .where("createdAt", ">=", sixMonthsAgo)
    .get();

  const newUserMonthMap: Record<string, number> = {};
  for (const doc of usersSnap.docs) {
    const key = (doc.data().createdAt as string).slice(0, 7);
    newUserMonthMap[key] = (newUserMonthMap[key] ?? 0) + 1;
  }
  const monthlyNewUsers = months.map((m) => ({ month: m.slice(5), count: newUserMonthMap[m] ?? 0 }));

  // Top 5 most discovered oreums in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const recentFeedSnap = await adminDb
    .collection("feed")
    .where("eventType", "==", "discovery")
    .where("occurredAt", ">=", thirtyDaysAgo)
    .get();

  const oreumPopMap: Record<string, { name: string; count: number }> = {};
  for (const doc of recentFeedSnap.docs) {
    const data = doc.data();
    const slug = data.oreumSlug as string;
    if (!slug) continue;
    if (!oreumPopMap[slug]) oreumPopMap[slug] = { name: data.oreumNameKo as string, count: 0 };
    oreumPopMap[slug].count++;
  }
  const topOreums = Object.entries(oreumPopMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([slug, { name, count }]) => ({ slug, name, count }));

  return NextResponse.json({
    monthlyActivity,
    regionActivity,
    monthlyNewUsers,
    topOreums,
    peakHour: peakHour ? { hour: Number(peakHour[0]), count: peakHour[1] } : null,
    totalDiscoveriesInPeriod: feedSnap.size,
  });
}

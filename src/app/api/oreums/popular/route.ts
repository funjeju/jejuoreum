import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // collectionGroup: 최근 500개 발견 기록 가져온 뒤 메모리 필터 (인덱스 불필요)
  const snap = await adminDb
    .collectionGroup("discoveries")
    .orderBy("discoveredAt", "desc")
    .limit(500)
    .get();

  // Count by oreumSlug (메모리에서 7일 이내만 필터)
  const counts = new Map<string, { count: number; nameKo: string; thumbnailUrl: string | null; slug: string }>();
  for (const d of snap.docs) {
    const data = d.data();
    if ((data.discoveredAt as string) < sevenDaysAgo) continue;
    const slug: string = data.oreumSlug;
    if (!slug) continue;
    const existing = counts.get(slug);
    if (existing) {
      existing.count++;
    } else {
      counts.set(slug, {
        count: 1,
        nameKo: data.oreumNameKo ?? slug,
        thumbnailUrl: data.oreumThumbnailUrl ?? null,
        slug,
      });
    }
  }

  // Sort and return top 8
  const popular = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => ({
      slug: item.slug,
      nameKo: item.nameKo,
      thumbnailUrl: item.thumbnailUrl,
      weeklyVisitors: item.count,
    }));

  return NextResponse.json(popular);
}

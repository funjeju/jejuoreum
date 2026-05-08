import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return NextResponse.json({ recommendations: [] }, { status: 401 });
  let uid: string;
  try {
    const d = await adminAuth.verifyIdToken(h.slice(7));
    uid = d.uid;
  } catch {
    return NextResponse.json({ recommendations: [] }, { status: 401 });
  }

  // Get following uids (up to 30)
  const followingSnap = await adminDb
    .collection("users").doc(uid)
    .collection("following")
    .orderBy("followedAt", "desc")
    .limit(30)
    .get();
  const followingUids = followingSnap.docs.map((d) => d.id);
  if (followingUids.length === 0) return NextResponse.json({ recommendations: [] });

  // Get user's own discovered slugs
  const myDiscSnap = await adminDb
    .collection("users").doc(uid)
    .collection("discoveries")
    .get();
  const myDiscoveredSlugs = new Set(myDiscSnap.docs.map((d) => d.data().oreumSlug as string));

  // Get recent discoveries from friends (last 14 days)
  const since = new Date(Date.now() - 14 * 864e5).toISOString();

  type DiscEntry = { slug: string; nameKo: string; thumbnailUrl: string | null; friendNickname: string; friendAvatarUrl: string | null; discoveredAt: string; count: number };
  const oreumMap = new Map<string, DiscEntry>();

  for (const fUid of followingUids) {
    const [discSnap, profileSnap] = await Promise.all([
      adminDb.collection("users").doc(fUid).collection("discoveries")
        .where("discoveredAt", ">=", since)
        .where("visibility", "!=", "private")
        .orderBy("discoveredAt", "desc")
        .limit(10)
        .get(),
      adminDb.collection("users").doc(fUid).get(),
    ]);

    const profile = profileSnap.data();
    const friendNickname = (profile?.nickname as string | undefined) ?? "친구";
    const friendAvatarUrl = (profile?.avatarUrl as string | undefined) ?? null;

    for (const disc of discSnap.docs) {
      const data = disc.data();
      const slug = data.oreumSlug as string;
      if (myDiscoveredSlugs.has(slug)) continue;  // already discovered

      if (oreumMap.has(slug)) {
        oreumMap.get(slug)!.count++;
      } else {
        oreumMap.set(slug, {
          slug,
          nameKo: data.oreumNameKo as string,
          thumbnailUrl: (data.oreumThumbnailUrl as string | null) ?? null,
          friendNickname,
          friendAvatarUrl,
          discoveredAt: data.discoveredAt as string,
          count: 1,
        });
      }
    }
  }

  // Sort by friend discovery count desc, take top 6
  const recommendations = [...oreumMap.values()]
    .sort((a, b) => b.count - a.count || b.discoveredAt.localeCompare(a.discoveredAt))
    .slice(0, 6);

  return NextResponse.json({ recommendations });
}

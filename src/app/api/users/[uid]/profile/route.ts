import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;

  const [userSnap, discovSnap, badgeSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("users").doc(uid).collection("discoveries")
      .orderBy("discoveredAt", "desc").get(),
    adminDb.collection("users").doc(uid).collection("badges")
      .orderBy("earnedAt", "desc").limit(6).get(),
  ]);

  if (!userSnap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const u = userSnap.data()!;
  return NextResponse.json({
    uid,
    nickname:      u.nickname ?? "탐험가",
    avatarUrl:     u.avatarUrl ?? null,
    oreumMbti:     u.oreumMbti ?? null,
    bio:           u.bio ?? null,
    followerCount: u.followerCount ?? 0,
    followingCount: u.followingCount ?? 0,
    discoveryCount: discovSnap.size,
    discoveries:   discovSnap.docs.map((d) => ({
      oreumSlug:   d.data().oreumSlug,
      oreumNameKo: d.data().oreumNameKo,
      oreumTier:   d.data().oreumTier ?? null,
      oreumRegion: d.data().oreumRegion ?? null,
      discoveredAt: d.data().discoveredAt,
    })),
    recentBadges: badgeSnap.docs.map((d) => ({
      badgeCode:   d.id,
      badgeNameKo: d.data().badgeNameKo ?? null,
      earnedAt:    d.data().earnedAt,
    })),
  });
}

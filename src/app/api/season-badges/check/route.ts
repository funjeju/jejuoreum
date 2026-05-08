import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { SeasonBadge } from "@/types";

export async function POST(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(h.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  // Get all active season badges whose window includes now
  const badgesSnap = await adminDb
    .collection("seasonBadges")
    .where("isActive", "==", true)
    .where("seasonStart", "<=", now)
    .get();

  const activeBadges = badgesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as SeasonBadge))
    .filter((b) => b.seasonEnd >= now);

  if (activeBadges.length === 0) return NextResponse.json({ awarded: [] });

  // Get already earned season badges for this user
  const earnedSnap = await adminDb
    .collection("users").doc(uid)
    .collection("badges")
    .get();
  const earnedCodes = new Set(earnedSnap.docs.map((d) => d.data().badgeCode as string));

  const awarded: string[] = [];

  for (const badge of activeBadges) {
    if (earnedCodes.has(badge.code)) continue;

    // Get user's discoveries within the season window
    const discSnap = await adminDb
      .collection("users").doc(uid)
      .collection("discoveries")
      .where("discoveredAt", ">=", badge.seasonStart)
      .where("discoveredAt", "<=", badge.seasonEnd)
      .get();

    const seasonDiscoveries = discSnap.docs.map((d) => d.data());
    const { condition } = badge;
    let qualifies = false;

    if (condition.type === "any_discovery") {
      qualifies = seasonDiscoveries.length >= 1;
    } else if (condition.type === "discovery_count") {
      qualifies = seasonDiscoveries.length >= (condition.count ?? 1);
    } else if (condition.type === "region_count") {
      const inRegion = seasonDiscoveries.filter((d) => d.oreumRegion === condition.region);
      qualifies = inRegion.length >= (condition.count ?? 1);
    } else if (condition.type === "specific_oreums") {
      const slugsDiscovered = new Set(seasonDiscoveries.map((d) => d.oreumSlug));
      qualifies = (condition.oreumSlugs ?? []).every((s) => slugsDiscovered.has(s));
    }

    if (!qualifies) continue;

    // Award the badge
    const badgeRef = adminDb.collection("users").doc(uid).collection("badges").doc(badge.code);
    await badgeRef.set({
      badgeCode: badge.code,
      badgeNameKo: badge.nameKo,
      badgeTier: badge.tier,
      iconEmoji: badge.iconEmoji,
      earnedAt: now,
    });

    // Increment earnedCount on the badge document
    await adminDb.collection("seasonBadges").doc(badge.id).update({
      earnedCount: FieldValue.increment(1),
    });

    awarded.push(badge.code);
  }

  return NextResponse.json({ awarded });
}

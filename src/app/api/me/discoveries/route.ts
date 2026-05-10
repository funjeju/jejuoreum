import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { BADGE_SEED } from "@/lib/firestore/badges";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// ── 배지 조건 평가 (서버 사이드) ─────────────────────────────
type DiscRow = { oreumSlug: string; oreumTier?: string | null; oreumRegion?: string | null; discoveredAt: string };

function checkCondition(
  cond: Record<string, unknown>,
  discs: DiscRow[],
  earned: Set<string>,
  photoCount: number,
): boolean {
  switch (cond.type) {
    case "discovery_count":
      return discs.length >= (cond.value as number);
    case "tier_complete": {
      const totals: Record<string, number> = { beginner: 30, explorer: 70 };
      return discs.filter((d) => d.oreumTier === cond.tier).length >= (totals[cond.tier as string] ?? 9999);
    }
    case "region_complete":
      return discs.filter((d) => d.oreumRegion === cond.region).length >= 5;
    case "season_count": {
      const months: Record<string, number[]> = {
        spring: [3,4,5], summer: [6,7,8], autumn: [9,10,11], winter: [12,1,2],
      };
      const m = months[cond.season as string] ?? [];
      return discs.filter((d) => m.includes(new Date(d.discoveredAt).getMonth() + 1)).length >= (cond.value as number);
    }
    case "time_count": {
      const ranges: Record<string, [number, number]> = {
        dawn: [5,7], morning: [7,12], afternoon: [12,17], evening: [17,20], night: [20,28],
      };
      const [s, e] = ranges[cond.timeKey as string] ?? [0,24];
      return discs.filter((d) => {
        const h = new Date(d.discoveredAt).getHours();
        return e > 24 ? (h >= s || h < e - 24) : (h >= s && h < e);
      }).length >= (cond.value as number);
    }
    case "meta_badges":
      return (cond.required as string[]).every((c) => earned.has(c));
    case "photo_count":
      return photoCount >= (cond.value as number);
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = decoded.uid;

  const body = await req.json();
  const {
    oreumId, oreumSlug, oreumNameKo, oreumRegion, oreumTier,
    oreumThumbnailUrl, verificationDistanceM, visibility,
  } = body;

  if (!oreumId || !oreumSlug || !oreumNameKo) {
    return NextResponse.json({ error: "oreumId, oreumSlug, oreumNameKo required" }, { status: 400 });
  }

  const userRef = adminDb.collection("users").doc(uid);
  const discCol = userRef.collection("discoveries");
  const now = new Date().toISOString();

  // ── 이미 발견한 오름인지 확인 ─────────────────────────────
  const existingSnap = await discCol.where("oreumSlug", "==", oreumSlug).limit(1).get();
  if (!existingSnap.empty) {
    // 재방문 — 저장 없이 현재 달 발견 수만 반환
    const monthSnap = await discCol
      .where("discoveredAt", ">=", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .get();
    return NextResponse.json({ alreadyDiscovered: true, monthCount: monthSnap.size, newBadges: [] });
  }

  // ── 발견 저장 ─────────────────────────────────────────────
  const discRef = discCol.doc();
  await discRef.set({
    id: discRef.id,
    oreumId, oreumSlug, oreumNameKo,
    oreumRegion: oreumRegion ?? null,
    oreumTier: oreumTier ?? null,
    oreumThumbnailUrl: oreumThumbnailUrl ?? null,
    discoveredAt: now,
    verificationMethod: "gps",
    verificationDistanceM: verificationDistanceM ?? null,
    userNote: null,
    visibility: visibility === "private" ? "private" : "public",
  });

  // ── 이번 달 발견 수 ───────────────────────────────────────
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const monthSnap = await discCol.where("discoveredAt", ">=", monthStart).get();
  const monthCount = monthSnap.size;

  // ── 배지 평가 ─────────────────────────────────────────────
  const allDiscsSnap = await discCol.get();
  const allDiscs = allDiscsSnap.docs.map((d) => d.data() as DiscRow);

  const existingBadgesSnap = await userRef.collection("badges").get();
  const earnedCodes = new Set(existingBadgesSnap.docs.map((d) => d.data().badgeCode as string));
  const newBadges: { code: string; nameKo: string; tier: string }[] = [];

  for (const seed of BADGE_SEED) {
    if (earnedCodes.has(seed.code)) continue;
    if (!checkCondition(seed.condition as Record<string, unknown>, allDiscs, earnedCodes, 0)) continue;
    await userRef.collection("badges").add({
      badgeCode:   seed.code,
      badgeNameKo: seed.nameKo,
      badgeTier:   seed.tier,
      earnedAt:    now,
    });
    earnedCodes.add(seed.code);
    newBadges.push({ code: seed.code, nameKo: seed.nameKo, tier: seed.tier });
  }

  // ── 피드 이벤트 ──────────────────────────────────────────
  if (visibility !== "private") {
    const profileSnap = await userRef.get();
    const profile = profileSnap.data();
    const delayMin = visibility === "delay_10min" ? 10 : 0;
    const publishAt = new Date(Date.now() + delayMin * 60 * 1000).toISOString();

    await adminDb.collection("feedEvents").add({
      uid,
      userNickname:  profile?.nickname ?? "탐험가",
      userAvatarUrl: profile?.avatarUrl ?? null,
      eventType:     "discovery",
      oreumId,
      oreumSlug,
      oreumNameKo,
      oreumRegion:   oreumRegion ?? null,
      visibility:    "public",
      occurredAt:    now,
      publishAt,
      expiresAt:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // ── 챌린지 업데이트 ───────────────────────────────────────
  const challengesSnap = await userRef.collection("challenges")
    .where("isCompleted", "==", false).get();
  for (const ch of challengesSnap.docs) {
    const data = ch.data();

    // specific_set: 지정된 오름 slug 중 발견한 것만 카운트
    let newProgress: number;
    if (data.conditionType === "specific_set") {
      const masterSnap = await adminDb.collection("challenges").doc(data.challengeId).get();
      const masterData = masterSnap.data();
      const requiredSlugs: string[] =
        (masterData?.conditionValue as { oreumSlugs?: string[] })?.oreumSlugs ?? [];
      const discSlugSet = new Set(allDiscs.map((d) => d.oreumSlug));
      newProgress = requiredSlugs.filter((s) => discSlugSet.has(s)).length;
    } else {
      newProgress = allDiscs.length;
    }

    if (newProgress > (data.progress ?? 0)) {
      const update: Record<string, unknown> = { progress: newProgress, updatedAt: now };
      if (newProgress >= data.goal) {
        update.isCompleted = true;
        update.completedAt = now;
      }
      await ch.ref.update(update);
    }
  }

  // ── 위시리스트 자동 제거 ──────────────────────────────────
  const wishlistSnap = await userRef.collection("wishlist")
    .where("oreumSlug", "==", oreumSlug).limit(1).get();
  if (!wishlistSnap.empty) {
    await wishlistSnap.docs[0].ref.delete();
  }

  // ── 협력감 카운트 (최근 30일 발견자 수) ──────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const companionSnap = await adminDb
    .collectionGroup("discoveries")
    .where("oreumSlug", "==", oreumSlug)
    .where("discoveredAt", ">=", thirtyDaysAgo)
    .count()
    .get();
  const companionCount = companionSnap.data().count;

  let companionshipMessage: string | null = null;
  if (companionCount >= 10) {
    companionshipMessage = `최근 30일 ${companionCount.toLocaleString()}명이 함께 다녀간 오름이에요`;
  }

  return NextResponse.json({
    alreadyDiscovered: false,
    discoveryId: discRef.id,
    newBadges,
    monthCount,
    companionshipMessage,
  });
}

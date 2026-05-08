import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const BADGE_CODE = "oreum_master_complete";

export async function POST(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return NextResponse.json({ awarded: false }, { status: 401 });
  let uid: string;
  try {
    const d = await adminAuth.verifyIdToken(h.slice(7));
    uid = d.uid;
  } catch {
    return NextResponse.json({ awarded: false }, { status: 401 });
  }

  // Already earned?
  const existing = await adminDb.collection("users").doc(uid).collection("badges").doc(BADGE_CODE).get();
  if (existing.exists) return NextResponse.json({ awarded: false, alreadyHeld: true });

  // Get all published master oreums
  const masterSnap = await adminDb
    .collection("oreums")
    .where("tier", "==", "master")
    .where("isPublished", "==", true)
    .get();
  const masterSlugs = new Set(masterSnap.docs.map((d) => d.data().slug as string));
  if (masterSlugs.size === 0) return NextResponse.json({ awarded: false });

  // Get user's discoveries of master oreums
  const discSnap = await adminDb
    .collection("users").doc(uid)
    .collection("discoveries")
    .where("oreumTier", "==", "master")
    .get();
  const discoveredMasterSlugs = new Set(discSnap.docs.map((d) => d.data().oreumSlug as string));

  const allDiscovered = [...masterSlugs].every((s) => discoveredMasterSlugs.has(s));
  if (!allDiscovered) return NextResponse.json({ awarded: false });

  await adminDb.collection("users").doc(uid).collection("badges").doc(BADGE_CODE).set({
    badgeCode:   BADGE_CODE,
    badgeNameKo: "제주 오름 마스터",
    badgeTier:   "platinum",
    iconType:    "crown_master",
    earnedAt:    new Date().toISOString(),
  });

  return NextResponse.json({ awarded: true, badgeName: "제주 오름 마스터" });
}

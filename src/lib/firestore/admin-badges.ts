import { adminDb } from "@/lib/firebase/admin";

export async function adminAwardBadge(
  uid: string,
  code: string,
  nameKo: string,
  tier: "bronze" | "silver" | "gold" | "platinum",
): Promise<boolean> {
  const existing = await adminDb
    .collection(`users/${uid}/badges`)
    .where("badgeCode", "==", code)
    .limit(1)
    .get();
  if (!existing.empty) return false;

  await adminDb.collection(`users/${uid}/badges`).add({
    badgeCode: code,
    badgeNameKo: nameKo,
    badgeTier: tier,
    earnedAt: new Date().toISOString(),
  });
  return true;
}

// 사진 승인 시 pioneer (오름 첫 사진) 체크
export async function checkAndAwardPioneer(uid: string, oreumSlug: string): Promise<void> {
  const existing = await adminDb
    .collection("photos")
    .where("oreumSlug", "==", oreumSlug)
    .where("isApproved", "==", true)
    .where("userId", "!=", uid)
    .limit(1)
    .get();

  if (existing.empty) {
    // 이 유저가 해당 오름의 첫 사진 기록자
    await adminAwardBadge(uid, "pioneer", "선구자", "gold");
  }
}

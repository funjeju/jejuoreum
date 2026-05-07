import { collection, getDocs, query, where, addDoc, orderBy, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Badge, UserBadge, UserDiscovery } from "@/types";

export async function getUserBadges(uid: string): Promise<UserBadge[]> {
  const q = query(
    collection(db, `users/${uid}/badges`),
    orderBy("earnedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserBadge));
}

export async function getAllBadges(): Promise<Badge[]> {
  const snap = await getDocs(collection(db, "badges"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Badge));
}

export async function awardBadge(uid: string, badge: Badge): Promise<void> {
  const existing = await getDocs(
    query(collection(db, `users/${uid}/badges`), where("badgeCode", "==", badge.code))
  );
  if (!existing.empty) return;

  await addDoc(collection(db, `users/${uid}/badges`), {
    badgeCode:   badge.code,
    badgeNameKo: badge.nameKo,
    badgeTier:   badge.tier,
    earnedAt:    new Date().toISOString(),
  });
}

async function getApprovedPhotoCount(uid: string): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, "photos"), where("userId", "==", uid), where("isApproved", "==", true))
  );
  return snap.data().count;
}

function checkBadgeCondition(
  condition: Record<string, unknown>,
  discoveries: UserDiscovery[],
  earnedCodes: Set<string>,
  approvedPhotoCount: number,
): boolean {
  const { type } = condition;

  if (type === "discovery_count") {
    return discoveries.length >= (condition.value as number);
  }

  if (type === "tier_complete") {
    const tier = condition.tier as string;
    const totals: Record<string, number> = { beginner: 30, explorer: 70 };
    const count = discoveries.filter((d) => d.oreumTier === tier).length;
    return count >= (totals[tier] ?? 9999);
  }

  if (type === "region_complete") {
    const region = condition.region as string;
    const count = discoveries.filter((d) => d.oreumRegion === region).length;
    return count >= 5;
  }

  if (type === "season_count") {
    const seasonMonths: Record<string, number[]> = {
      spring: [3, 4, 5], summer: [6, 7, 8],
      autumn: [9, 10, 11], winter: [12, 1, 2],
    };
    const months = seasonMonths[condition.season as string] ?? [];
    const count = discoveries.filter((d) =>
      months.includes(new Date(d.discoveredAt).getMonth() + 1)
    ).length;
    return count >= (condition.value as number);
  }

  if (type === "time_count") {
    const timeKey = condition.timeKey as string;
    const timeRanges: Record<string, [number, number]> = {
      dawn:      [5, 7],
      morning:   [7, 12],
      afternoon: [12, 17],
      evening:   [17, 20],
      night:     [20, 28], // 20~04시 (28=next day 04)
    };
    const [startH, endH] = timeRanges[timeKey] ?? [0, 24];
    const count = discoveries.filter((d) => {
      const h = new Date(d.discoveredAt).getHours();
      return endH > 24 ? (h >= startH || h < endH - 24) : (h >= startH && h < endH);
    }).length;
    return count >= (condition.value as number);
  }

  if (type === "meta_badges") {
    const required = condition.required as string[];
    return required.every((code) => earnedCodes.has(code));
  }

  if (type === "photo_count") {
    return approvedPhotoCount >= (condition.value as number);
  }

  return false;
}

export async function evaluateAndAwardBadges(
  uid: string,
  discoveries: UserDiscovery[]
): Promise<Badge[]> {
  const [existing, photoCount] = await Promise.all([
    getUserBadges(uid),
    getApprovedPhotoCount(uid).catch(() => 0),
  ]);
  const earnedCodes = new Set(existing.map((b) => b.badgeCode));
  const newBadges: Badge[] = [];

  for (const seed of BADGE_SEED) {
    if (earnedCodes.has(seed.code)) continue;
    if (!checkBadgeCondition(seed.condition, discoveries, earnedCodes, photoCount)) continue;
    const badge: Badge = { id: seed.code, ...seed };
    await awardBadge(uid, badge);
    earnedCodes.add(seed.code); // 메타 배지 연쇄 처리를 위해 즉시 추가
    newBadges.push(badge);
  }

  return newBadges;
}

export const BADGE_SEED: Omit<Badge, "id">[] = [
  // 입문
  { code: "first_discovery",       nameKo: "첫 걸음",             descriptionKo: "첫 오름을 발견했어요",                      iconType: "footprint",  condition: { type: "discovery_count", value: 1 },                              tier: "bronze" },
  // 수집
  { code: "collector_10",          nameKo: "수집가",               descriptionKo: "오름 10개를 발견했어요",                    iconType: "collection", condition: { type: "discovery_count", value: 10 },                             tier: "silver" },
  { code: "beginner_master",       nameKo: "비기너 마스터",         descriptionKo: "비기너 30개를 모두 발견했어요",             iconType: "star",       condition: { type: "tier_complete", tier: "beginner" },                        tier: "gold" },
  { code: "explorer_master",       nameKo: "익스플로러 마스터",     descriptionKo: "익스플로러 70개를 모두 발견했어요",         iconType: "compass",    condition: { type: "tier_complete", tier: "explorer" },                        tier: "gold" },
  { code: "centurion",             nameKo: "100선 마스터",          descriptionKo: "오름 100선을 모두 발견했어요",              iconType: "crown",      condition: { type: "discovery_count", value: 100 },                            tier: "platinum" },
  // 지역
  { code: "region_master_east",    nameKo: "동부 마스터",           descriptionKo: "동부 오름을 모두 발견했어요",               iconType: "map",        condition: { type: "region_complete", region: "east" },                        tier: "gold" },
  { code: "region_master_west",    nameKo: "서부 마스터",           descriptionKo: "서부 오름을 모두 발견했어요",               iconType: "map",        condition: { type: "region_complete", region: "west" },                        tier: "gold" },
  { code: "region_master_south",   nameKo: "남부 마스터",           descriptionKo: "남부 오름을 모두 발견했어요",               iconType: "map",        condition: { type: "region_complete", region: "south" },                       tier: "gold" },
  { code: "region_master_north",   nameKo: "북부 마스터",           descriptionKo: "북부 오름을 모두 발견했어요",               iconType: "map",        condition: { type: "region_complete", region: "north" },                       tier: "gold" },
  { code: "region_master_central", nameKo: "중산간 마스터",         descriptionKo: "중산간 오름을 모두 발견했어요",             iconType: "map",        condition: { type: "region_complete", region: "central" },                     tier: "gold" },
  { code: "jeju_master",           nameKo: "제주 마스터",           descriptionKo: "제주 모든 지역을 마스터했어요",             iconType: "island",     condition: { type: "meta_badges", required: ["region_master_east", "region_master_west", "region_master_south", "region_master_north", "region_master_central"] }, tier: "platinum" },
  // 시즌
  { code: "spring_explorer",       nameKo: "봄의 탐험가",           descriptionKo: "봄에 오름 5개를 발견했어요",               iconType: "flower",     condition: { type: "season_count", season: "spring", value: 5 },               tier: "silver" },
  { code: "summer_explorer",       nameKo: "여름의 탐험가",         descriptionKo: "여름에 오름 5개를 발견했어요",             iconType: "sun",        condition: { type: "season_count", season: "summer", value: 5 },               tier: "silver" },
  { code: "autumn_explorer",       nameKo: "가을의 탐험가",         descriptionKo: "가을에 오름 5개를 발견했어요",             iconType: "leaf",       condition: { type: "season_count", season: "autumn", value: 5 },               tier: "silver" },
  { code: "winter_explorer",       nameKo: "겨울의 탐험가",         descriptionKo: "겨울에 오름 5개를 발견했어요",             iconType: "snowflake",  condition: { type: "season_count", season: "winter", value: 5 },               tier: "silver" },
  { code: "four_seasons",          nameKo: "사계절",               descriptionKo: "사계절 모두 탐험했어요",                   iconType: "seasons",    condition: { type: "meta_badges", required: ["spring_explorer", "summer_explorer", "autumn_explorer", "winter_explorer"] }, tier: "gold" },
  // 시간대
  { code: "sunrise_chaser",        nameKo: "일출 추적자",           descriptionKo: "일출 시간대에 오름 3개를 발견했어요",      iconType: "sunrise",    condition: { type: "time_count", timeKey: "dawn", value: 3 },                  tier: "gold" },
  { code: "sunset_lover",          nameKo: "일몰 애호가",           descriptionKo: "일몰 시간대에 오름 3개를 발견했어요",      iconType: "sunset",     condition: { type: "time_count", timeKey: "evening", value: 3 },              tier: "gold" },
  { code: "night_walker",          nameKo: "야간 산책자",           descriptionKo: "야간에 오름을 발견했어요",                 iconType: "moon",       condition: { type: "time_count", timeKey: "night", value: 1 },                 tier: "silver" },
  // 기여
  { code: "recorder",              nameKo: "기록자",               descriptionKo: "사진 10장이 승인됐어요",                   iconType: "camera",     condition: { type: "photo_count", value: 10 },                                  tier: "bronze" },
  { code: "archivist",             nameKo: "아카이비스트",          descriptionKo: "사진 50장이 승인됐어요",                   iconType: "archive",    condition: { type: "photo_count", value: 50 },                                  tier: "silver" },
  { code: "master_archivist",      nameKo: "마스터 아카이비스트",   descriptionKo: "사진 200장이 승인됐어요",                  iconType: "archive",    condition: { type: "photo_count", value: 200 },                                 tier: "gold" },
];

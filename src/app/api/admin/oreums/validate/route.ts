import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { Oreum } from "@/types";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

const JEJU_BOUNDS = { latMin: 33.1, latMax: 33.65, lngMin: 126.1, lngMax: 127.0 };

export interface OreumIssue {
  id: string;
  slug: string;
  nameKo: string;
  region: string;
  isPublished: boolean;
  issues: string[];
  warnings: string[];
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("oreums").orderBy("tierOrder", "asc").get();
  const oreums = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Oreum));

  const results: OreumIssue[] = [];
  const slugSet = new Map<string, string[]>();

  for (const o of oreums) {
    const issues: string[] = [];
    const warnings: string[] = [];

    // slug 중복 체크
    if (!slugSet.has(o.slug)) slugSet.set(o.slug, []);
    slugSet.get(o.slug)!.push(o.id);

    // 필수 필드
    if (!o.nameKo) issues.push("nameKo 누락");
    if (!o.slug)   issues.push("slug 누락");
    if (!o.region) issues.push("region 누락");

    // 좌표
    const lat = o.location?.lat;
    const lng = o.location?.lng;
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      issues.push("좌표 없음 (lat/lng = 0 또는 null)");
    } else if (
      lat < JEJU_BOUNDS.latMin || lat > JEJU_BOUNDS.latMax ||
      lng < JEJU_BOUNDS.lngMin || lng > JEJU_BOUNDS.lngMax
    ) {
      issues.push(`좌표 이상치 — 제주 범위 벗어남 (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }

    // 주소
    if (!o.location?.address && !o.location?.dongAddress) {
      warnings.push("주소 없음");
    }

    // 썸네일
    if (!o.thumbnailUrl) {
      warnings.push("썸네일 없음");
    }

    // MBTI
    if (!o.mbti) {
      warnings.push("MBTI 미매핑");
    }

    // 타이어 (발행된 오름은 필수)
    if (o.isPublished && !o.tier) {
      warnings.push("발행됐으나 tier 없음");
    }

    // 한줄 소개
    if (!o.oneLinerKo) {
      warnings.push("한줄 소개 없음");
    }

    // 난이도
    if (o.isPublished && !o.difficulty) {
      warnings.push("발행됐으나 난이도 없음");
    }

    if (issues.length > 0 || warnings.length > 0) {
      results.push({
        id: o.id,
        slug: o.slug || "(없음)",
        nameKo: o.nameKo || "(없음)",
        region: o.region || "(없음)",
        isPublished: o.isPublished,
        issues,
        warnings,
      });
    }
  }

  // 슬러그 중복 처리
  for (const [slug, ids] of slugSet.entries()) {
    if (ids.length > 1) {
      for (const id of ids) {
        const existing = results.find((r) => r.id === id);
        const msg = `슬러그 중복 — "${slug}" (${ids.length}개)`;
        if (existing) {
          existing.issues.push(msg);
        } else {
          const o = oreums.find((x) => x.id === id)!;
          results.push({ id, slug, nameKo: o.nameKo, region: o.region, isPublished: o.isPublished, issues: [msg], warnings: [] });
        }
      }
    }
  }

  const summary = {
    total: oreums.length,
    withIssues: results.filter((r) => r.issues.length > 0).length,
    withWarnings: results.filter((r) => r.warnings.length > 0 && r.issues.length === 0).length,
    noCoords: results.filter((r) => r.issues.some((i) => i.includes("좌표"))).length,
    noThumbnail: results.filter((r) => r.warnings.includes("썸네일 없음") || r.issues.includes("썸네일 없음")).length,
    noMbti: results.filter((r) => r.warnings.includes("MBTI 미매핑")).length,
  };

  return NextResponse.json({ summary, results });
}

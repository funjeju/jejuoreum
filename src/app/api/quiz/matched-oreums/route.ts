import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const revalidate = 300;

// MBTI 유사 그룹 (같은 그룹 내 유형도 함께 반환)
const MBTI_GROUPS: Record<string, string[]> = {
  NT: ["INTJ", "INTP", "ENTJ", "ENTP"],
  NF: ["INFJ", "INFP", "ENFJ", "ENFP"],
  SJ: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  SP: ["ISTP", "ISFP", "ESTP", "ESFP"],
};

function getSimilarTypes(mbti: string): string[] {
  const group = Object.values(MBTI_GROUPS).find((g) => g.includes(mbti));
  return group ?? [mbti];
}

export async function GET(req: NextRequest) {
  const mbti = req.nextUrl.searchParams.get("mbti")?.toUpperCase();
  if (!mbti) return NextResponse.json({ error: "mbti required" }, { status: 400 });

  const similarTypes = getSimilarTypes(mbti);

  // 정확히 일치하는 오름 먼저 조회
  const exactSnap = await adminDb
    .collection("oreums")
    .where("mbti", "==", mbti)
    .where("isPublished", "==", true)
    .limit(20)
    .get();

  const exactIds = new Set(exactSnap.docs.map((d) => d.id));
  const results = exactSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      nameKo: data.nameKo as string,
      slug: data.slug as string,
      oneLinerKo: data.oneLinerKo as string | null,
      thumbnailUrl: data.thumbnailUrl as string | null,
      illustrationUrl: data.illustrationUrl as string | null,
      mbti: data.mbti as string,
      region: data.region as string,
      elevationM: data.elevationM as number | null,
    };
  });

  // 동일 그룹 유형도 추가 (최대 9개까지)
  if (results.length < 9) {
    const sibling = similarTypes.filter((t) => t !== mbti);
    for (const t of sibling) {
      if (results.length >= 9) break;
      const snap = await adminDb
        .collection("oreums")
        .where("mbti", "==", t)
        .where("isPublished", "==", true)
        .limit(3)
        .get();
      for (const d of snap.docs) {
        if (exactIds.has(d.id)) continue;
        const data = d.data();
        results.push({
          id: d.id,
          nameKo: data.nameKo as string,
          slug: data.slug as string,
          oneLinerKo: data.oneLinerKo as string | null,
          thumbnailUrl: data.thumbnailUrl as string | null,
          illustrationUrl: data.illustrationUrl as string | null,
          mbti: data.mbti as string,
          region: data.region as string,
          elevationM: data.elevationM as number | null,
        });
      }
    }
  }

  return NextResponse.json({ oreums: results, mbti });
}

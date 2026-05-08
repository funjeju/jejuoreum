import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const KEYWORD_GROUPS: Array<{ type: string; keywords: string[]; message: string }> = [
  {
    type: "미끄러움",
    keywords: ["미끄럽", "미끄러워", "미끄러", "진흙", "질퍽"],
    message: "최근 방문자들이 미끄러움을 주의하라고 해요",
  },
  {
    type: "통제",
    keywords: ["통제", "폐쇄", "잠금", "접근 금지", "출입 금지", "입장 불가"],
    message: "현재 입장이 통제 중일 수 있어요. 방문 전 확인하세요",
  },
  {
    type: "공사",
    keywords: ["공사", "정비", "보수", "복원"],
    message: "탐방로 정비 공사가 진행 중일 수 있어요",
  },
  {
    type: "산불",
    keywords: ["산불", "화재", "불"],
    message: "주변 산불 위험이 있을 수 있어요. 방문 전 확인하세요",
  },
  {
    type: "위험",
    keywords: ["위험", "조심", "주의", "다쳤", "부상"],
    message: "최근 위험 주의 의견이 있어요. 안전하게 탐방하세요",
  },
  {
    type: "주차",
    keywords: ["주차", "차량", "주차장 만차", "주차 불가"],
    message: "주차 공간이 부족할 수 있어요",
  },
];

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const commentsSnap = await adminDb
    .collection("comments")
    .where("isPublic", "==", true)
    .where("createdAt", ">=", sevenDaysAgo)
    .get();

  // Group comments by oreumSlug
  const byOreum = new Map<string, { nameKo: string; texts: string[] }>();
  for (const doc of commentsSnap.docs) {
    const d = doc.data();
    const slug = d.oreumSlug as string;
    if (!slug || !d.content) continue;
    if (!byOreum.has(slug)) {
      byOreum.set(slug, { nameKo: d.oreumNameKo ?? slug, texts: [] });
    }
    byOreum.get(slug)!.texts.push((d.content as string).toLowerCase());
  }

  let created = 0;
  const now = new Date().toISOString();

  for (const [slug, { nameKo, texts }] of byOreum) {
    for (const group of KEYWORD_GROUPS) {
      const matchedComments: string[] = [];
      const matchedKeywords = new Set<string>();

      for (const text of texts) {
        const hit = group.keywords.find((kw) => text.includes(kw));
        if (hit) {
          matchedComments.push(text);
          matchedKeywords.add(hit);
        }
      }

      if (matchedComments.length < 2) continue;

      const confidence = Math.min(0.99, 0.4 + matchedComments.length * 0.15);

      // Check if there's already a pending/approved alert for this oreum+type
      const existing = await adminDb
        .collection("trendAlerts")
        .where("oreumSlug", "==", slug)
        .where("alertType", "==", group.type)
        .where("status", "in", ["pending", "approved"])
        .limit(1)
        .get();

      if (!existing.empty) continue;

      await adminDb.collection("trendAlerts").add({
        oreumSlug: slug,
        oreumNameKo: nameKo,
        alertType: group.type,
        detectedKeywords: [...matchedKeywords],
        relatedCommentCount: matchedComments.length,
        confidence,
        autoMessage: group.message,
        approvedMessage: null,
        status: "pending",
        isActive: false,
        activeFrom: null,
        activeTo: null,
        reviewedBy: null,
        reviewedAt: null,
        detectedAt: now,
      });
      created++;
    }
  }

  return NextResponse.json({ created, scannedOreums: byOreum.size });
}

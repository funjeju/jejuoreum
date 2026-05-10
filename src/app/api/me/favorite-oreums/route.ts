import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(h.slice(7));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const favoriteOreumIds: string[] = profileSnap.data()?.favoriteOreumIds ?? [];

  if (favoriteOreumIds.length === 0) return NextResponse.json({ oreums: [] });

  const oreumDocs = await Promise.all(
    favoriteOreumIds.map((id) => adminDb.collection("oreums").doc(id).get())
  );

  const oreums = oreumDocs
    .filter((d) => d.exists)
    .map((d) => {
      const data = d.data()!;
      return {
        id: d.id,
        nameKo: data.nameKo as string,
        slug: data.slug as string,
        oneLinerKo: data.oneLinerKo as string | null,
        thumbnailUrl: data.thumbnailUrl as string | null,
        illustrationUrl: data.illustrationUrl as string | null,
        mbti: data.mbti as string | null,
        region: data.region as string,
      };
    });

  return NextResponse.json({ oreums });
}

export async function PUT(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { favoriteOreumIds } = await req.json();
  if (!Array.isArray(favoriteOreumIds) || favoriteOreumIds.length > 3)
    return NextResponse.json({ error: "최대 3개까지 선택 가능합니다" }, { status: 400 });

  await adminDb.collection("users").doc(decoded.uid).set(
    { favoriteOreumIds, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}

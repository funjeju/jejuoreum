import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const snap = await adminDb
    .collection("oreums")
    .where("isPublished", "==", true)
    .get();

  const oreums = snap.docs
    .map((d) => {
      const data = d.data();
      const lat = data.location?.lat ?? data.lat;
      const lng = data.location?.lng ?? data.lng;
      if (!lat || !lng) return null;
      return {
        id: d.id,
        slug: data.slug,
        nameKo: data.nameKo,
        lat,
        lng,
        recommendedLevel: data.recommendedLevel ?? null,
        isTop100: data.isTop100 ?? (data.tier != null),
        thumbnailUrl: data.thumbnailUrl ?? null,
        tier: data.tier ?? null,
        region: data.region,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ oreums });
}

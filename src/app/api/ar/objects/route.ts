import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { STATIC_LANDMARKS } from "@/lib/ar/landmarks";
import type { ArObject } from "@/types/ar";

const MAX_DISTANCE_KM = 25; // 25km 이내 오름만

function distKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const uid = searchParams.get("uid") ?? null;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "lat,lng required" }, { status: 400 });
  }

  // 사용자 발견 목록 (로그인 시)
  let discoveredSlugs = new Set<string>();
  if (uid) {
    try {
      const snap = await adminDb
        .collection("users").doc(uid)
        .collection("discoveries")
        .select("oreumSlug")
        .get();
      discoveredSlugs = new Set(snap.docs.map((d) => d.data().oreumSlug as string));
    } catch { /* 무시 */ }
  }

  // 오름 목록 (isPublished + 위치 있음)
  const oreumSnap = await adminDb
    .collection("oreums")
    .where("isPublished", "==", true)
    .get();

  const oreumObjects: ArObject[] = [];
  for (const doc of oreumSnap.docs) {
    const d = doc.data();
    const oLat = d.location?.lat ?? d.lat;
    const oLng = d.location?.lng ?? d.lng;
    if (!oLat || !oLng) continue;
    if (distKm(lat, lng, oLat, oLng) > MAX_DISTANCE_KM) continue;

    oreumObjects.push({
      id:           doc.id,
      type:         "oreum",
      name:         d.nameKo,
      lat:          oLat,
      lng:          oLng,
      elevation:    d.elevation ?? 0,
      isTop100:     d.tier != null,
      isDiscovered: discoveredSlugs.has(d.slug),
      slug:         d.slug,
      tier:         d.tier ?? null,
      thumbnailUrl: d.thumbnailUrl ?? null,
    });
  }

  // 근처 상권 (25km)
  const merchantSnap = await adminDb
    .collection("merchants")
    .where("isPublished", "==", true)
    .get();

  const merchantObjects: ArObject[] = [];
  for (const doc of merchantSnap.docs) {
    const d = doc.data();
    if (!d.lat || !d.lng) continue;
    if (distKm(lat, lng, d.lat, d.lng) > MAX_DISTANCE_KM) continue;
    merchantObjects.push({
      id:           doc.id,
      type:         "merchant",
      name:         d.name,
      lat:          d.lat,
      lng:          d.lng,
      elevation:    50,
      merchantType: d.merchantType,
      coverImageUrl: d.coverImageUrl ?? null,
    });
  }

  return NextResponse.json({
    oreums:    oreumObjects,
    landmarks: STATIC_LANDMARKS,
    merchants: merchantObjects,
  });
}

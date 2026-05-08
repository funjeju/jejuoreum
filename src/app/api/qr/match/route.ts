import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { GpsMatchResult, NearbyOreum } from "@/types";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, accuracy } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    // Pull all published oreums with location data
    const snap = await adminDb
      .collection("oreums")
      .where("isPublished", "==", true)
      .select("slug", "nameKo", "region", "tier", "tierOrder", "thumbnailUrl", "difficulty", "emotionalKeywords", "location")
      .get();

    const nearby: NearbyOreum[] = [];

    for (const d of snap.docs) {
      const data = d.data();
      const loc = data.location as { lat?: number; lng?: number } | null;
      if (!loc?.lat || !loc?.lng) continue;

      const distanceM = haversineMeters(lat, lng, loc.lat, loc.lng);
      if (distanceM > 5000) continue;

      nearby.push({
        id: d.id,
        slug: data.slug as string,
        nameKo: data.nameKo as string,
        region: data.region,
        tier: data.tier ?? null,
        tierOrder: data.tierOrder ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        difficulty: data.difficulty ?? null,
        emotionalKeywords: data.emotionalKeywords ?? [],
        isPublished: true,
        distanceM,
      });
    }

    nearby.sort((a, b) => a.distanceM - b.distanceM);

    if (nearby.length === 0) {
      const result: GpsMatchResult = { status: "no_match", distance: null, matchedOreum: null, candidates: [] };
      return NextResponse.json(result);
    }

    const nearest = nearby[0];
    const acc = typeof accuracy === "number" ? accuracy : 100;
    let autoThreshold = 300;
    if (acc > 200) autoThreshold = 200;
    if (acc > 500) autoThreshold = 0;

    if (nearest.distanceM < autoThreshold) {
      const result: GpsMatchResult = {
        status: "auto",
        distance: Math.round(nearest.distanceM),
        matchedOreum: nearest,
        candidates: [],
      };
      return NextResponse.json(result);
    }

    if (nearest.distanceM < 1000) {
      const result: GpsMatchResult = {
        status: "candidates",
        distance: Math.round(nearest.distanceM),
        matchedOreum: null,
        candidates: nearby.filter((o) => o.distanceM < 1500).slice(0, 3),
      };
      return NextResponse.json(result);
    }

    const result: GpsMatchResult = {
      status: "no_match",
      distance: Math.round(nearest.distanceM),
      matchedOreum: null,
      candidates: [],
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("[qr/match]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

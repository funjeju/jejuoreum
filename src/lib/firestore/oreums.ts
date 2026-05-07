import {
  collection, doc, getDoc, getDocs, query,
  where, orderBy, limit, type QueryConstraint
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { haversineDistance } from "@/lib/utils";
import type { Oreum, OreumCard, NearbyOreum, Region, Tier } from "@/types";

const COL = "oreums";

export async function getOreumBySlug(slug: string): Promise<Oreum | null> {
  const q = query(collection(db, COL), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Oreum;
}

export async function getOreumCards(opts: {
  top100Only?: boolean;
  tier?: Tier;
  region?: Region;
  limitCount?: number;
} = {}): Promise<OreumCard[]> {
  // 복합 인덱스 없이 단순 쿼리 후 메모리 필터링
  const snap = await getDocs(
    query(collection(db, COL), where("isPublished", "==", true))
  );

  let cards = snap.docs.map((d) => {
    const data = d.data();
    return {
      id:                d.id,
      slug:              data.slug,
      nameKo:            data.nameKo,
      tier:              data.tier ?? null,
      tierOrder:         data.tierOrder ?? null,
      region:            data.region,
      difficulty:        data.difficulty ?? null,
      thumbnailUrl:      data.thumbnailUrl ?? null,
      emotionalKeywords: data.emotionalKeywords ?? [],
      isPublished:       data.isPublished,
    } as OreumCard;
  });

  if (opts.top100Only) cards = cards.filter((o) => (o as OreumCard & { isTop100?: boolean }).isTop100 !== false);
  if (opts.tier)       cards = cards.filter((o) => o.tier === opts.tier);
  if (opts.region)     cards = cards.filter((o) => o.region === opts.region);

  cards.sort((a, b) => (a.tierOrder ?? 99999) - (b.tierOrder ?? 99999));

  if (opts.limitCount) cards = cards.slice(0, opts.limitCount);

  return cards;
}

export async function getNearbyOreums(
  lat: number, lng: number, radiusKm: number
): Promise<NearbyOreum[]> {
  const all = await getOreumCards({ top100Only: true });
  return all
    .map((o) => {
      const oreum = o as OreumCard & { location?: { lat: number; lng: number } };
      return oreum;
    })
    .filter(() => true)
    .map(async (o) => {
      const full = await getDoc(doc(db, COL, o.id));
      const data = full.data();
      if (!data?.location?.lat) return null;
      const dist = haversineDistance(lat, lng, data.location.lat, data.location.lng);
      if (dist > radiusKm * 1000) return null;
      return { ...o, distanceM: Math.round(dist) } as NearbyOreum;
    })
    .reduce(async (accP, item) => {
      const acc = await accP;
      const v = await item;
      if (v) acc.push(v);
      return acc;
    }, Promise.resolve([] as NearbyOreum[]))
    .then((arr) => arr.sort((a, b) => a.distanceM - b.distanceM));
}

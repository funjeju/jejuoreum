import { adminDb } from "@/lib/firebase/admin";
import type { Oreum, Region, Tier } from "@/types";

const COL = "oreums";

export async function adminGetOreums(opts: {
  page?: number;
  pageSize?: number;
  search?: string;
  published?: boolean;
} = {}): Promise<{ oreums: Oreum[]; total: number }> {
  const { page = 1, pageSize = 20 } = opts;
  const colRef = adminDb.collection(COL).orderBy("tierOrder", "asc");
  const snap = await colRef.get();
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Oreum));

  if (opts.published !== undefined) {
    docs = docs.filter((o) => o.isPublished === opts.published);
  }

  if (opts.search) {
    const q = opts.search.toLowerCase();
    docs = docs.filter(
      (o) => o.nameKo.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }

  const total = docs.length;
  const oreums = docs.slice((page - 1) * pageSize, page * pageSize);
  return { oreums, total };
}

export async function adminGetOreum(id: string): Promise<Oreum | null> {
  const d = await adminDb.collection(COL).doc(id).get();
  if (!d.exists) return null;
  return { id: d.id, ...d.data() } as Oreum;
}

export async function adminGetOreumBySlug(slug: string): Promise<Oreum | null> {
  const snap = await adminDb.collection(COL).where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Oreum;
}

export async function adminUpdateOreum(id: string, data: Partial<Oreum>): Promise<void> {
  const { id: _id, ...rest } = data as Oreum;
  await adminDb.collection(COL).doc(id).update({
    ...rest,
    updatedAt: new Date().toISOString(),
  });
}

export async function adminTogglePublish(id: string, isPublished: boolean): Promise<void> {
  await adminDb.collection(COL).doc(id).update({
    isPublished,
    publishedAt: isPublished ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  });
}

export interface CsvOreumRow {
  slug: string;
  nameKo: string;
  nameEn?: string;
  tier?: Tier;
  tierOrder?: number;
  region: Region;
  lat?: number;
  lng?: number;
  address?: string;
  elevationM?: number;
  prominenceM?: number;
  oneLinerKo?: string;
  difficulty?: number;
  trailLengthKm?: number;
  estimatedMinutes?: number;
  emotionalKeywords?: string;
  mbti?: string;
  isPrivateLand?: boolean;
  hasAccessRestriction?: boolean;
}

export async function adminGetPublishedOreumCards(opts: {
  region?: Region;
} = {}): Promise<{ id: string; slug: string; nameKo: string; region: Region; tier: Tier | null; tierOrder: number | null; thumbnailUrl: string | null; difficulty: number | null; elevationM: number | null; oneLinerKo: string | null }[]> {
  let q = adminDb.collection(COL).where("isPublished", "==", true).orderBy("tierOrder", "asc");
  if (opts.region) q = adminDb.collection(COL).where("isPublished", "==", true).where("region", "==", opts.region).orderBy("tierOrder", "asc") as typeof q;
  const snap = await q.get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      slug: data.slug as string,
      nameKo: data.nameKo as string,
      region: data.region as Region,
      tier: (data.tier ?? null) as Tier | null,
      tierOrder: (data.tierOrder ?? null) as number | null,
      thumbnailUrl: (data.thumbnailUrl ?? null) as string | null,
      difficulty: (data.difficulty ?? null) as number | null,
      elevationM: (data.elevationM ?? null) as number | null,
      oneLinerKo: (data.oneLinerKo ?? null) as string | null,
    };
  });
}

export async function adminGetAllPublishedSlugs(): Promise<
  { slug: string; updatedAt: string; region: Region }[]
> {
  const snap = await adminDb
    .collection(COL)
    .where("isPublished", "==", true)
    .select("slug", "updatedAt", "region")
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      slug: data.slug as string,
      updatedAt: data.updatedAt as string,
      region: data.region as Region,
    };
  });
}

export async function adminBulkUpsertOreums(rows: CsvOreumRow[]): Promise<{ inserted: number; updated: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  const batch = adminDb.batch();
  let opCount = 0;

  for (const row of rows) {
    if (!row.slug || !row.nameKo || !row.region) {
      errors.push(`Missing required fields for row: ${row.slug ?? "(no slug)"}`);
      continue;
    }

    const existing = await adminDb.collection(COL).where("slug", "==", row.slug).limit(1).get();
    const now = new Date().toISOString();

    if (existing.empty) {
      const ref = adminDb.collection(COL).doc();
      const newOreum: Omit<Oreum, "id"> = {
        slug: row.slug,
        nameKo: row.nameKo,
        nameEn: row.nameEn ?? null,
        altNames: [],
        isTop100: true,
        tier: row.tier ?? null,
        tierOrder: row.tierOrder ?? null,
        region: row.region,
        district: null,
        location: {
          lat: row.lat ?? 0,
          lng: row.lng ?? 0,
          address: row.address ?? null,
          dongAddress: null,
        },
        elevationM: row.elevationM ?? null,
        prominenceM: row.prominenceM ?? null,
        oneLinerKo: row.oneLinerKo ?? null,
        oneLinerEn: null,
        descriptionKo: null,
        difficulty: row.difficulty ?? null,
        trailLengthKm: row.trailLengthKm ?? null,
        estimatedMinutes: row.estimatedMinutes ?? null,
        recommendedSeasons: [],
        recommendedTimes: [],
        emotionalKeywords: row.emotionalKeywords ? row.emotionalKeywords.split(",").map((s) => s.trim()) : [],
        mbti: row.mbti ?? null,
        photoUrls: [],
        thumbnailUrl: null,
        isPrivateLand: row.isPrivateLand ?? false,
        hasAccessRestriction: row.hasAccessRestriction ?? false,
        accessNotes: null,
        isPublished: false,
        publishedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(ref, newOreum);
      inserted++;
    } else {
      const ref = existing.docs[0].ref;
      batch.update(ref, {
        nameKo: row.nameKo,
        ...(row.nameEn && { nameEn: row.nameEn }),
        ...(row.tier && { tier: row.tier }),
        ...(row.tierOrder !== undefined && { tierOrder: row.tierOrder }),
        region: row.region,
        ...(row.elevationM !== undefined && { elevationM: row.elevationM }),
        ...(row.prominenceM !== undefined && { prominenceM: row.prominenceM }),
        ...(row.oneLinerKo && { oneLinerKo: row.oneLinerKo }),
        ...(row.difficulty !== undefined && { difficulty: row.difficulty }),
        ...((row.lat !== undefined || row.lng !== undefined || row.address) && {
          "location.lat":     row.lat ?? 0,
          "location.lng":     row.lng ?? 0,
          "location.address": row.address ?? null,
        }),
        updatedAt: now,
      });
      updated++;
    }

    opCount++;
    if (opCount >= 400) {
      await batch.commit();
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();

  return { inserted, updated, errors };
}

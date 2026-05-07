import { adminDb } from "@/lib/firebase/admin";
import type { SeoContent, SeoSection } from "@/types";

const COL = "seoContents";

export async function adminGetSeoContents(): Promise<SeoContent[]> {
  const snap = await adminDb.collection(COL).orderBy("oreumNameKo", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeoContent));
}

export async function adminGetSeoContent(oreumSlug: string): Promise<SeoContent | null> {
  const doc = await adminDb.collection(COL).doc(oreumSlug).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as SeoContent;
}

export async function adminUpsertSeoContent(
  oreumSlug: string,
  data: Partial<Omit<SeoContent, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  const ref = adminDb.collection(COL).doc(oreumSlug);
  const existing = await ref.get();
  const now = new Date().toISOString();
  if (existing.exists) {
    await ref.update({ ...data, updatedAt: now });
  } else {
    await ref.set({
      metaTitle: null,
      metaDescription: null,
      metaKeywords: [],
      ogImageUrl: null,
      sections: [] as SeoSection[],
      isPublished: false,
      publishedAt: null,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }
}

import { adminDb } from "@/lib/firebase/admin";
import type { Comment } from "@/types";

const COL = "comments";

export async function adminGetComments(limitCount = 80): Promise<Comment[]> {
  const snap = await adminDb
    .collection(COL)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comment));
}

export async function adminGetRatingSummary(oreumSlug: string): Promise<{
  average: number;
  count: number;
} | null> {
  const snap = await adminDb
    .collection(COL)
    .where("oreumSlug", "==", oreumSlug)
    .where("isPublic", "==", true)
    .select("rating")
    .get();

  const ratings = snap.docs
    .map((d) => d.data().rating as number | null)
    .filter((r): r is number => typeof r === "number" && r >= 1 && r <= 5);

  if (ratings.length === 0) return null;
  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { average: Math.round(average * 10) / 10, count: ratings.length };
}

export async function adminUpdateComment(
  id: string,
  data: Partial<Pick<Comment, "isPublic" | "isPromotedToTip" | "commentType">>,
): Promise<void> {
  await adminDb.collection(COL).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

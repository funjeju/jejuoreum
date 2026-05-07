import { adminDb } from "@/lib/firebase/admin";
import type { Photo } from "@/types";

const COL = "photos";

export async function adminGetPendingPhotos(limitCount = 50): Promise<Photo[]> {
  const snap = await adminDb
    .collection(COL)
    .where("isApproved", "==", false)
    .orderBy("createdAt", "asc")
    .limit(limitCount)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Photo));
}

export async function adminUpdatePhoto(
  id: string,
  data: Partial<Pick<Photo, "isApproved" | "isRepresentative" | "category">> & Record<string, unknown>,
): Promise<void> {
  await adminDb.collection(COL).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

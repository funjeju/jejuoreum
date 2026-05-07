import { adminDb } from "@/lib/firebase/admin";
import type { Challenge } from "@/types";

const COL = "challenges";

export async function adminGetChallenges(): Promise<Challenge[]> {
  const snap = await adminDb.collection(COL).orderBy("nameKo", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge));
}

export async function adminCreateChallenge(data: Omit<Challenge, "id">): Promise<string> {
  const ref = await adminDb.collection(COL).add({
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function adminUpdateChallenge(id: string, data: Partial<Challenge>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = data as Challenge;
  await adminDb.collection(COL).doc(id).update({
    ...rest,
    updatedAt: new Date().toISOString(),
  });
}

import { adminDb } from "@/lib/firebase/admin";
import type { Merchant } from "@/types";

const COL = "merchants";

export async function adminGetMerchants(): Promise<Merchant[]> {
  const snap = await adminDb.collection(COL).orderBy("name", "asc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Merchant));
}

export async function adminGetMerchant(id: string): Promise<Merchant | null> {
  const doc = await adminDb.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Merchant;
}

export async function adminCreateMerchant(
  data: Omit<Merchant, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await adminDb.collection(COL).add({ ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function adminUpdateMerchant(
  id: string,
  data: Partial<Omit<Merchant, "id" | "createdAt">>,
): Promise<void> {
  await adminDb.collection(COL).doc(id).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function adminDeleteMerchant(id: string): Promise<void> {
  await adminDb.collection(COL).doc(id).delete();
}

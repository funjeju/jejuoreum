import { collection, getDocs, query, where, limit as firestoreLimit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Merchant } from "@/types";

const COL = "merchants";

export async function getMerchantsForOreum(oreumSlug: string, limitCount = 10): Promise<Merchant[]> {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("relatedOreumSlugs", "array-contains", oreumSlug),
      where("isPublished", "==", true),
      where("partnershipStatus", "==", "active"),
      firestoreLimit(limitCount),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Merchant));
}

export async function getMerchant(id: string): Promise<Merchant | null> {
  const docRef = doc(db, COL, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Merchant;
}

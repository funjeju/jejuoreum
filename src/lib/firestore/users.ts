import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, orderBy, query, deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UserProfile, UserDiscovery, WishlistItem } from "@/types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    uid,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getUserDiscoveries(uid: string): Promise<UserDiscovery[]> {
  const snap = await getDocs(
    query(collection(db, "users", uid, "discoveries"), orderBy("discoveredAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDiscovery));
}

export async function getDiscovery(uid: string, slug: string): Promise<UserDiscovery | null> {
  const discoveries = await getUserDiscoveries(uid);
  return discoveries.find((d) => d.oreumSlug === slug) ?? null;
}

export async function saveDiscovery(uid: string, data: Omit<UserDiscovery, "id">) {
  const ref = doc(collection(db, "users", uid, "discoveries"));
  await setDoc(ref, { ...data, id: ref.id });
  return ref.id;
}

export async function updateDiscoveryNote(uid: string, slug: string, note: string) {
  const disc = await getDiscovery(uid, slug);
  if (!disc) return;
  await updateDoc(doc(db, "users", uid, "discoveries", disc.id), { userNote: note });
}

export async function getWishlist(uid: string): Promise<WishlistItem[]> {
  const snap = await getDocs(
    query(collection(db, "users", uid, "wishlist"), orderBy("createdAt", "desc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WishlistItem));
}

export async function addToWishlist(uid: string, data: Omit<WishlistItem, "id">) {
  const ref = doc(collection(db, "users", uid, "wishlist"));
  await setDoc(ref, { ...data, id: ref.id });
}

export async function removeFromWishlist(uid: string, itemId: string) {
  await deleteDoc(doc(db, "users", uid, "wishlist", itemId));
}

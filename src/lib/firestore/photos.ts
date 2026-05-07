import {
  collection, addDoc, getDocs, query, where,
  limit as firestoreLimit,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import type { Photo } from "@/types";

export async function getOreumPhotos(
  oreumSlug: string,
  limitCount = 30,
): Promise<Photo[]> {
  const snap = await getDocs(
    query(
      collection(db, "photos"),
      where("oreumSlug", "==", oreumSlug),
      firestoreLimit(limitCount),
    ),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Photo))
    .filter((p) => p.isApproved)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getMyOreumPhotos(
  oreumSlug: string,
  userId: string,
): Promise<Photo[]> {
  const snap = await getDocs(
    query(
      collection(db, "photos"),
      where("oreumSlug", "==", oreumSlug),
      where("userId", "==", userId),
      firestoreLimit(20),
    ),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Photo))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function uploadAndSavePhoto(
  userId: string,
  oreumSlug: string,
  oreumId: string,
  file: File,
  caption: string | null,
  userNickname: string,
): Promise<Photo> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileRef = storageRef(
    storage,
    `photos/${oreumSlug}/${userId}/${Date.now()}.${ext}`,
  );
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  const data: Omit<Photo, "id"> = {
    oreumSlug,
    oreumId,
    userId,
    userNickname,
    storageUrl: url,
    thumbnailUrl: url,
    caption,
    category: null,
    isApproved: false,
    isRepresentative: false,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, "photos"), data);

  // 백그라운드에서 AI 분류 (실패해도 무관)
  fetch("/api/photos/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoId: docRef.id, imageUrl: url }),
  }).catch(() => {});

  return { id: docRef.id, ...data };
}

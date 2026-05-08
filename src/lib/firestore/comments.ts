import {
  collection, addDoc, getDocs, query, where,
  limit as firestoreLimit, doc, updateDoc,
  arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Comment } from "@/types";

export async function getOreumComments(
  oreumSlug: string,
  limitCount = 30,
): Promise<Comment[]> {
  const snap = await getDocs(
    query(
      collection(db, "comments"),
      where("oreumSlug", "==", oreumSlug),
      firestoreLimit(limitCount),
    ),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Comment))
    .filter((c) => c.isPublic)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function toggleCommentLike(commentId: string, uid: string, liked: boolean): Promise<void> {
  const ref = doc(db, "comments", commentId);
  await updateDoc(ref, {
    likedBy: liked ? arrayUnion(uid) : arrayRemove(uid),
    likeCount: increment(liked ? 1 : -1),
  });
}

export async function addComment(data: Omit<Comment, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "comments"), data);

  // 백그라운드에서 AI 분류 (실패해도 무관)
  if (data.content) {
    fetch("/api/comments/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: ref.id, content: data.content }),
    }).catch(() => {});
  }

  return ref.id;
}

import {
  collection, getDocs, query, where, orderBy, doc, setDoc, updateDoc, increment
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Challenge, UserChallenge } from "@/types";

export async function getActiveChallenges(): Promise<Challenge[]> {
  const q = query(
    collection(db, "challenges"),
    where("isActive", "==", true),
    orderBy("nameKo", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge));
}

export async function getUserChallenges(uid: string): Promise<UserChallenge[]> {
  const q = query(
    collection(db, `users/${uid}/challenges`),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserChallenge));
}

export async function joinChallenge(uid: string, challenge: Challenge): Promise<void> {
  const ref = doc(collection(db, `users/${uid}/challenges`));

  // specific_set: goal = 선택된 오름 수
  const goal = challenge.conditionType === "specific_set"
    ? ((challenge.conditionValue as { oreumSlugs?: string[] }).oreumSlugs?.length ?? 1)
    : ((challenge.conditionValue as { value?: number }).value ?? 1);

  await setDoc(ref, {
    challengeId:      challenge.id,
    challengeNameKo:  challenge.nameKo,
    conditionType:    challenge.conditionType,
    progress:         0,
    goal,
    isCompleted:      false,
    completedAt:      null,
    startedAt:        new Date().toISOString(),
  });
  await updateDoc(doc(db, "challenges", challenge.id), {
    participantCount: increment(1),
  });
}

export async function updateChallengeProgress(
  uid: string, challengeDocId: string, progress: number, goal: number
): Promise<void> {
  const ref = doc(db, `users/${uid}/challenges`, challengeDocId);
  const isCompleted = progress >= goal;
  await updateDoc(ref, {
    progress,
    isCompleted,
    ...(isCompleted && { completedAt: new Date().toISOString() }),
  });
}

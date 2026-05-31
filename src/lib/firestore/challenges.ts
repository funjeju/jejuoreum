import {
  collection, getDocs, query, where, orderBy, limit, doc, setDoc, updateDoc, increment, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Challenge, UserChallenge, ChallengeParticipant } from "@/types";

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

export async function getActiveChallenges(): Promise<Challenge[]> {
  const q = query(
    collection(db, "challenges"),
    where("isActive", "==", true),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Challenge))
    .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
}

export async function getUserChallenges(uid: string): Promise<UserChallenge[]> {
  const q = query(
    collection(db, `users/${uid}/challenges`),
    orderBy("startedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserChallenge));
}

export async function joinChallenge(
  uid: string,
  challenge: Challenge,
  userInfo?: { nickname: string; avatarUrl: string | null },
): Promise<void> {
  const ref = doc(collection(db, `users/${uid}/challenges`));

  const goal =
    challenge.conditionType === "specific_set"
      ? ((challenge.conditionValue as { oreumSlugs?: string[] }).oreumSlugs?.length ?? 1)
      : ((challenge.conditionValue as { value?: number }).value ?? 1);

  const now = new Date().toISOString();
  await setDoc(ref, {
    challengeId:     challenge.id,
    challengeNameKo: challenge.nameKo,
    challengeType:   challenge.challengeType,
    conditionType:   challenge.conditionType,
    conditionValue:  challenge.conditionValue,
    rewardBadgeCode: challenge.rewardBadgeCode ?? null,
    startsAt:        challenge.startsAt ?? null,
    progress:        0,
    goal,
    isCompleted:     false,
    completedAt:     null,
    startedAt:       now,
  });

  // 리더보드용 participant 문서
  await setDoc(doc(db, `challenges/${challenge.id}/participants`, uid), {
    uid,
    nickname:    userInfo?.nickname ?? "탐험가",
    avatarUrl:   userInfo?.avatarUrl ?? null,
    progress:    0,
    goal,
    isCompleted: false,
    completedAt: null,
    joinedAt:    now,
  });

  await updateDoc(doc(db, "challenges", challenge.id), {
    participantCount: increment(1),
  });
}

// returns true if this call newly completed the challenge
export async function updateChallengeProgress(
  uid: string,
  challengeDocId: string,
  challengeId: string,
  progress: number,
  goal: number,
): Promise<boolean> {
  const ref = doc(db, `users/${uid}/challenges`, challengeDocId);
  const prevSnap = await getDoc(ref);
  const wasAlreadyCompleted = (prevSnap.data()?.isCompleted as boolean) ?? false;

  const isCompleted = progress >= goal;
  const completedAt = isCompleted ? new Date().toISOString() : null;

  await updateDoc(ref, {
    progress,
    isCompleted,
    ...(isCompleted && { completedAt }),
  });

  // 리더보드 participant 문서 업데이트
  updateDoc(doc(db, `challenges/${challengeId}/participants`, uid), {
    progress,
    isCompleted,
    ...(isCompleted && { completedAt }),
  }).catch(() => {});

  return isCompleted && !wasAlreadyCompleted;
}

// 챌린지 완료 시 자동 배지 발급
export async function awardChallengeBadge(
  uid: string,
  ch: UserChallenge,
): Promise<string | null> {
  let badgeName: string;
  const type = ch.challengeType;

  if ((type === "monthly" || type === "weekly") && ch.startsAt) {
    const d = new Date(ch.startsAt);
    badgeName = `${d.getFullYear()}년 ${d.getMonth() + 1}월 챌린지 달성`;
  } else if (ch.conditionType === "region_complete" && ch.conditionValue) {
    const region = (ch.conditionValue as { region?: string }).region ?? "";
    badgeName = `${REGION_KO[region] ?? region} 완주 달성`;
  } else if (ch.conditionType === "tier_complete" && ch.conditionValue) {
    const tier = (ch.conditionValue as { tier?: string }).tier ?? "";
    badgeName = `${tier === "beginner" ? "비기너" : "익스플로러"} 완주 달성`;
  } else {
    badgeName = `${ch.challengeNameKo} 달성`;
  }

  const badgeCode = `challenge_${ch.challengeId}`;

  // 중복 방지: 이미 같은 code 배지가 있으면 스킵
  const existing = await getDocs(
    query(collection(db, `users/${uid}/badges`), where("badgeCode", "==", badgeCode))
  );
  if (!existing.empty) return null;

  const ref = doc(collection(db, `users/${uid}/badges`));
  await setDoc(ref, {
    badgeCode,
    badgeNameKo: badgeName,
    badgeTier:   "silver",
    earnedAt:    new Date().toISOString(),
    source:      "challenge",
  });

  // 추가 보상 배지 (rewardBadgeCode)
  if (ch.rewardBadgeCode) {
    const rewardExisting = await getDocs(
      query(collection(db, `users/${uid}/badges`), where("badgeCode", "==", ch.rewardBadgeCode))
    );
    if (rewardExisting.empty) {
      const rewardRef = doc(collection(db, `users/${uid}/badges`));
      await setDoc(rewardRef, {
        badgeCode:   ch.rewardBadgeCode,
        badgeNameKo: `${ch.challengeNameKo} 특별 보상`,
        badgeTier:   "gold",
        earnedAt:    new Date().toISOString(),
        source:      "challenge_reward",
      });
    }
  }

  return badgeName;
}

// 리더보드 조회 (완료자 먼저, 그 다음 진행율 높은 순)
export async function getChallengeLeaderboard(
  challengeId: string,
  limitCount = 10,
): Promise<ChallengeParticipant[]> {
  const q = query(
    collection(db, `challenges/${challengeId}/participants`),
    limit(50),
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => d.data() as ChallengeParticipant);

  return all
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
      if (a.isCompleted && b.isCompleted) {
        return new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime();
      }
      return b.progress - a.progress;
    })
    .slice(0, limitCount);
}

import {
  collection, getDocs, query, where, orderBy, limit, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { FeedEvent } from "@/types";

export async function getPublicFeed(opts: { limitCount?: number } = {}): Promise<FeedEvent[]> {
  const q = query(
    collection(db, "feedEvents"),
    where("visibility", "==", "public"),
    orderBy("occurredAt", "desc"),
    limit(opts.limitCount ?? 20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedEvent));
}

export async function createDiscoveryFeedEvent(data: {
  uid: string;
  userNickname: string;
  userAvatarUrl: string | null;
  oreumId: string;
  oreumSlug: string;
  oreumNameKo: string;
  visibility: "public" | "private";
  delayMin: number;
}) {
  const occurredAt = data.delayMin > 0
    ? new Date(Date.now() + data.delayMin * 60000).toISOString()
    : new Date().toISOString();

  await addDoc(collection(db, "feedEvents"), {
    eventType:    "discovery",
    uid:          data.uid,
    userNickname: data.userNickname,
    userAvatarUrl: data.userAvatarUrl,
    oreumId:      data.oreumId,
    oreumSlug:    data.oreumSlug,
    oreumNameKo:  data.oreumNameKo,
    badgeCode:    null,
    badgeNameKo:  null,
    visibility:   data.visibility,
    occurredAt,
  });
}

import {
  collection, getDocs, query, where, orderBy, limit, startAfter,
  addDoc, type QueryDocumentSnapshot, type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { FeedEvent, Region } from "@/types";

export type FeedCursor = QueryDocumentSnapshot<DocumentData> | null;

export async function getPublicFeed(opts: {
  limitCount?: number;
  region?: Region | "all";
  followingUids?: string[];
  cursor?: FeedCursor;
} = {}): Promise<{ events: FeedEvent[]; cursor: FeedCursor }> {
  const n = opts.limitCount ?? 20;

  if (opts.followingUids && opts.followingUids.length > 0) {
    const uids = opts.followingUids.slice(0, 30);
    const constraints: Parameters<typeof query>[1][] = [
      where("uid", "in", uids),
      orderBy("occurredAt", "desc"),
    ];
    if (opts.cursor) constraints.push(startAfter(opts.cursor));
    constraints.push(limit(n));

    const snap = await getDocs(query(collection(db, "feed"), ...constraints));
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedEvent));
    return { events, cursor: snap.docs[snap.docs.length - 1] ?? null };
  }

  const constraints: Parameters<typeof query>[1][] = [
    where("visibility", "==", "public"),
    orderBy("occurredAt", "desc"),
  ];

  if (opts.region && opts.region !== "all") {
    constraints.unshift(where("oreumRegion", "==", opts.region));
  }
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(n));

  const snap = await getDocs(query(collection(db, "feed"), ...constraints));
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedEvent));
  return { events, cursor: snap.docs[snap.docs.length - 1] ?? null };
}

export async function createDiscoveryFeedEvent(data: {
  uid: string;
  userNickname: string;
  userAvatarUrl: string | null;
  oreumId: string;
  oreumSlug: string;
  oreumNameKo: string;
  oreumRegion: Region | null;
  visibility: "public" | "private";
  delayMin: number;
}) {
  const occurredAt = data.delayMin > 0
    ? new Date(Date.now() + data.delayMin * 60000).toISOString()
    : new Date().toISOString();

  await addDoc(collection(db, "feed"), {
    eventType:     "discovery",
    uid:           data.uid,
    userNickname:  data.userNickname,
    userAvatarUrl: data.userAvatarUrl,
    oreumId:       data.oreumId,
    oreumSlug:     data.oreumSlug,
    oreumNameKo:   data.oreumNameKo,
    oreumRegion:   data.oreumRegion,
    badgeCode:     null,
    badgeNameKo:   null,
    visibility:    data.visibility,
    occurredAt,
  });
}

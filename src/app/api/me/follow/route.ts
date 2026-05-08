import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { createNotification } from "@/lib/firebase/notifications";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// POST { targetUid, unfollow?: boolean, removeFollower?: boolean }
export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUid, unfollow = false, removeFollower = false } = await req.json();
  if (!targetUid || targetUid === decoded.uid) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  // Remove a follower from the current user's followers list
  if (removeFollower) {
    const myFollowerRef = adminDb
      .collection("users").doc(decoded.uid)
      .collection("followers").doc(targetUid);
    const theirFollowingRef = adminDb
      .collection("users").doc(targetUid)
      .collection("following").doc(decoded.uid);
    await Promise.all([myFollowerRef.delete(), theirFollowingRef.delete()]);
    await Promise.all([
      adminDb.collection("users").doc(decoded.uid).update({ followerCount: FieldValue.increment(-1) }),
      adminDb.collection("users").doc(targetUid).update({ followingCount: FieldValue.increment(-1) }),
    ]).catch(() => {});
    return NextResponse.json({ success: true });
  }

  const myFollowingRef = adminDb
    .collection("users").doc(decoded.uid)
    .collection("following").doc(targetUid);
  const theirFollowerRef = adminDb
    .collection("users").doc(targetUid)
    .collection("followers").doc(decoded.uid);

  if (unfollow) {
    await Promise.all([myFollowingRef.delete(), theirFollowerRef.delete()]);
    // 팔로잉 카운트 감소
    await Promise.all([
      adminDb.collection("users").doc(decoded.uid).update({ followingCount: FieldValue.increment(-1) }),
      adminDb.collection("users").doc(targetUid).update({ followerCount: FieldValue.increment(-1) }),
    ]).catch(() => {});
  } else {
    const now = new Date().toISOString();
    await Promise.all([
      myFollowingRef.set({ followedAt: now }),
      theirFollowerRef.set({ followedAt: now }),
    ]);
    await Promise.all([
      adminDb.collection("users").doc(decoded.uid).update({ followingCount: FieldValue.increment(1) }),
      adminDb.collection("users").doc(targetUid).update({ followerCount: FieldValue.increment(1) }),
    ]).catch(() => {});

    // Notify target user (fire-and-forget)
    const myProfile = await adminDb.collection("users").doc(decoded.uid).get().catch(() => null);
    const nickname = (myProfile?.data()?.nickname as string | undefined) ?? "누군가";
    createNotification({
      uid: targetUid,
      type: "new_follower",
      title: "새 팔로워",
      body: `${nickname}님이 팔로우했어요`,
      link: `/profile/${decoded.uid}`,
      imageUrl: (myProfile?.data()?.avatarUrl as string | null | undefined) ?? undefined,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, following: !unfollow });
}

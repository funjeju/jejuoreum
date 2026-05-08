import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(h.slice(7))).uid; } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const snap = await adminDb
    .collection("users").doc(uid)
    .collection("followers")
    .orderBy("followedAt", "desc")
    .limit(100)
    .get();

  const followerUids = snap.docs.map((d) => d.id);
  if (followerUids.length === 0) return NextResponse.json({ followers: [] });

  const profiles = await Promise.all(
    followerUids.map((fUid) =>
      adminDb.collection("users").doc(fUid).get()
        .then((d) => d.exists ? { uid: d.id, nickname: d.data()?.nickname, avatarUrl: d.data()?.avatarUrl ?? null, bio: d.data()?.bio ?? null } : null)
        .catch(() => null)
    )
  );

  return NextResponse.json({ followers: profiles.filter(Boolean) });
}

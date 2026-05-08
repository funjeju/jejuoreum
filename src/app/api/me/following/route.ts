import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(h.slice(7))).uid; } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { searchParams } = new URL(req.url);
  const withProfiles = searchParams.get("profiles") === "true";

  const snap = await adminDb
    .collection("users").doc(uid)
    .collection("following")
    .orderBy("followedAt", "desc")
    .limit(100)
    .get();

  const uids = snap.docs.map((d) => d.id);
  if (!withProfiles) return NextResponse.json({ following: uids });

  const profiles = await Promise.all(
    uids.map((fUid) =>
      adminDb.collection("users").doc(fUid).get()
        .then((d) => d.exists ? { uid: d.id, nickname: d.data()?.nickname, avatarUrl: d.data()?.avatarUrl ?? null, bio: d.data()?.bio ?? null } : null)
        .catch(() => null)
    )
  );

  return NextResponse.json({ following: uids, profiles: profiles.filter(Boolean) });
}

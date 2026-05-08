import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = decoded.uid;

  const [profileSnap, discoveriesSnap, wishlistSnap, commentsSnap, badgesSnap] = await Promise.all([
    adminDb.collection("users").doc(uid).get(),
    adminDb.collection("users").doc(uid).collection("discoveries").orderBy("discoveredAt", "desc").get(),
    adminDb.collection("users").doc(uid).collection("wishlist").orderBy("createdAt", "desc").get(),
    adminDb.collection("comments").where("userId", "==", uid).orderBy("createdAt", "desc").get(),
    adminDb.collection("users").doc(uid).collection("badges").orderBy("earnedAt", "desc").get(),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: profileSnap.exists ? profileSnap.data() : null,
    discoveries: discoveriesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    wishlist: wishlistSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    comments: commentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    badges: badgesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="oreum-data-${uid.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

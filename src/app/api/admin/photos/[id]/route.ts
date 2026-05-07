import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminUpdatePhoto } from "@/lib/firestore/admin-photos";
import { adminAwardBadge, checkAndAwardPioneer } from "@/lib/firestore/admin-badges";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await adminUpdatePhoto(id, body);

  // 배지 트리거 (isApproved=true 시)
  if (body.isApproved === true) {
    const photoDoc = await adminDb.collection("photos").doc(id).get();
    const photo = photoDoc.data();
    if (photo?.userId) {
      // pioneer 배지 체크 (오름의 첫 사진 기록자)
      checkAndAwardPioneer(photo.userId, photo.oreumSlug).catch(() => {});

      // curator 배지 (대표 사진 지정 시)
      if (body.isRepresentative === true) {
        adminAwardBadge(photo.userId, "curator", "큐레이터", "gold").catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { adminUpdateComment } from "@/lib/firestore/admin-comments";
import { adminAwardBadge } from "@/lib/firestore/admin-badges";

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
  await adminUpdateComment(id, body);

  // tip_writer 배지 트리거 (팁 승격 시)
  if (body.isPromotedToTip === true) {
    const commentDoc = await adminDb.collection("comments").doc(id).get();
    const comment = commentDoc.data();
    if (comment?.userId) {
      adminAwardBadge(comment.userId, "tip_writer", "팁 작성자", "silver").catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}

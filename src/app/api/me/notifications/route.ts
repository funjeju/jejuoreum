import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verify(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// GET /api/me/notifications?unreadOnly=true&limit=30
export async function GET(req: NextRequest) {
  const decoded = await verify(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 50);

  // orderBy("createdAt") 단일 필드 인덱스만 사용 — 복합 인덱스 불필요
  const snap = await adminDb
    .collection("users").doc(decoded.uid)
    .collection("notifications")
    .orderBy("createdAt", "desc")
    .limit(unreadOnly ? limit * 5 : limit)
    .get();

  let notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const totalUnread = notifications.filter((n) => !(n as { isRead?: boolean }).isRead).length;
  if (unreadOnly) notifications = notifications.filter((n) => !(n as { isRead?: boolean }).isRead).slice(0, limit);
  const unreadCount = unreadOnly ? notifications.length : totalUnread;

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH — mark all (or specific ids) as read
export async function PATCH(req: NextRequest) {
  const decoded = await verify(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.ids ?? [];

  const col = adminDb.collection("users").doc(decoded.uid).collection("notifications");

  if (ids.length > 0) {
    const batch = adminDb.batch();
    for (const id of ids) batch.update(col.doc(id), { isRead: true });
    await batch.commit();
  } else {
    // mark all unread as read
    const snap = await col.where("isRead", "==", false).limit(100).get();
    if (!snap.empty) {
      const batch = adminDb.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    }
  }

  return NextResponse.json({ success: true });
}

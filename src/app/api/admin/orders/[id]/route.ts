import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createNotification } from "@/lib/firebase/notifications";

async function verifyAdmin(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { const d = await adminAuth.verifyIdToken(h.slice(7)); return d.admin ? d : null; } catch { return null; }
}

// PATCH { status?, trackingNumber? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "trackingNumber", "deliveryMemo"];
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  await adminDb.collection("orders").doc(id).update(patch);

  // Notify buyer if status changed
  if ("status" in patch) {
    const orderDoc = await adminDb.collection("orders").doc(id).get();
    const uid = orderDoc.data()?.uid as string | undefined;
    const STATUS_MSG: Record<string, string> = {
      paid: "결제가 완료됐어요", preparing: "상품 준비 중이에요",
      shipped: "상품이 배송 출발했어요", delivered: "배송이 완료됐어요",
      cancelled: "주문이 취소됐어요", refunded: "환불이 완료됐어요",
    };
    if (uid && STATUS_MSG[patch.status as string]) {
      createNotification({
        uid,
        type: "order_status_changed",
        title: "주문 업데이트",
        body: STATUS_MSG[patch.status as string],
        link: "/profile",
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}

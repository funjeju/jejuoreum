import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// POST — 주문 생성 (결제 전 pending 상태)
export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { items, ordererName, ordererPhone, deliveryAddress, deliveryMemo } = body;

  if (!items?.length || !ordererName || !ordererPhone || !deliveryAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 재고 확인
  const goodsIds: string[] = items.map((i: { goodsId: string }) => i.goodsId);
  const goodsDocs = await Promise.all(
    goodsIds.map((id) => adminDb.collection("goods").doc(id).get())
  );
  for (const snap of goodsDocs) {
    if (!snap.exists || !snap.data()?.isPublished) {
      return NextResponse.json({ error: `Goods ${snap.id} not available` }, { status: 400 });
    }
    const stock = snap.data()?.stock;
    if (stock !== null && stock <= 0) {
      return NextResponse.json({ error: `Goods ${snap.id} out of stock` }, { status: 400 });
    }
  }

  const totalAmount = items.reduce(
    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
    0
  );

  const now = new Date().toISOString();
  const ref = await adminDb.collection("orders").add({
    uid:             decoded.uid,
    items,
    totalAmount,
    status:          "pending",
    paymentKey:      null,
    ordererName,
    ordererPhone,
    deliveryAddress,
    deliveryMemo:    deliveryMemo ?? null,
    trackingNumber:  null,
    paidAt:          null,
    createdAt:       now,
    updatedAt:       now,
  });

  return NextResponse.json({ orderId: ref.id, totalAmount });
}

// GET — 내 주문 목록
export async function GET(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await adminDb.collection("orders")
    .where("uid", "==", decoded.uid)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ orders });
}

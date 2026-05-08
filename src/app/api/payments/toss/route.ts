import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyUser(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try { return await adminAuth.verifyIdToken(h.slice(7)); } catch { return null; }
}

// POST { paymentKey, orderId, amount }
export async function POST(req: NextRequest) {
  const decoded = await verifyUser(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paymentKey, orderId, amount } = await req.json();
  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 주문 확인
  const orderSnap = await adminDb.collection("orders").doc(orderId).get();
  if (!orderSnap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = orderSnap.data()!;
  if (order.uid !== decoded.uid) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });
  if (order.totalAmount !== amount) return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });

  // 토스 결제 확인 API 호출
  const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment not configured" }, { status: 500 });

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const err = await tossRes.json();
    return NextResponse.json({ error: err.message ?? "Payment failed" }, { status: 400 });
  }

  const tossData = await tossRes.json();
  const now = new Date().toISOString();

  // 주문 상태 업데이트 + 재고 차감
  const batch = adminDb.batch();
  batch.update(adminDb.collection("orders").doc(orderId), {
    status:     "paid",
    paymentKey: tossData.paymentKey,
    paidAt:     now,
    updatedAt:  now,
  });

  for (const item of order.items) {
    const ref = adminDb.collection("goods").doc(item.goodsId);
    const snap = await ref.get();
    if (snap.exists && snap.data()?.stock !== null) {
      batch.update(ref, { stock: FieldValue.increment(-item.quantity) });
    }
  }

  await batch.commit();
  return NextResponse.json({ success: true, status: "paid" });
}

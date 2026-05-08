import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Vercel Cron: 매일 새벽 3시 (KST) 실행
// vercel.json: "0 3 * * *" (UTC) = 12:00 KST
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 90일 이상 된 피드 이벤트 삭제 (배치 500 제한)
  const cutoff = new Date(Date.now() - 90 * 864e5).toISOString();
  const snap = await adminDb
    .collection("feed")
    .where("occurredAt", "<", cutoff)
    .limit(400)
    .get();

  if (snap.empty) {
    return NextResponse.json({ deleted: 0 });
  }

  const batch = adminDb.batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
  }
  await batch.commit();

  return NextResponse.json({ deleted: snap.size, cutoff });
}

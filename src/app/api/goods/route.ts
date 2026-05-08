import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let q = adminDb.collection("goods").where("isPublished", "==", true) as FirebaseFirestore.Query;
  if (category) q = q.where("category", "==", category);
  q = q.orderBy("createdAt", "desc");

  const snap = await q.get();
  const goods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ goods });
}

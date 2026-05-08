import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const EDITABLE_FIELDS = [
  "description",
  "contactPhone",
  "websiteUrl",
  "instagramHandle",
  "naverMapUrl",
  "kakaoMapUrl",
  "businessHours",
  "coverImageUrl",
] as const;

async function getMerchantByToken(token: string) {
  const snap = await adminDb
    .collection("merchants")
    .where("portalToken", "==", token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const merchant = await getMerchantByToken(token);
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { portalToken: _, ...safe } = merchant as Record<string, unknown>;
  void _;
  return NextResponse.json({ merchant: safe });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const merchant = await getMerchantByToken(token) as Record<string, unknown> | null;
  if (!merchant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) patch[field] = body[field] ?? null;
  }

  await adminDb.collection("merchants").doc(merchant.id as string).update(patch);
  return NextResponse.json({ success: true });
}

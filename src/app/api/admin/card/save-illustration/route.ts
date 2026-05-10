import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";

export const maxDuration = 30;

async function verifyAdmin(req: NextRequest) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return false;
  try {
    const d = await adminAuth.verifyIdToken(h.slice(7));
    return !!d.admin;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oreumId, imageBase64 } = await req.json();
  if (!oreumId || !imageBase64)
    return NextResponse.json({ error: "oreumId, imageBase64 required" }, { status: 400 });

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const bucket = adminStorage.bucket();
  const filePath = `oreums/${oreumId}/illustration.png`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: { contentType: "image/png" },
    public: true,
  });

  const illustrationUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  await adminDb.collection("oreums").doc(oreumId).update({
    illustrationUrl,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ illustrationUrl });
}

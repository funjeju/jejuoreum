import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());

  const bucket = getStorage().bucket();
  const path = `thumbnails/${id}/${Date.now()}.${ext}`;
  const fileRef = bucket.file(path);

  await fileRef.save(buffer, {
    metadata: { contentType: file.type || "image/jpeg" },
  });

  // Make public and get the Firebase Storage URL
  await fileRef.makePublic();
  const thumbnailUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;

  await adminDb.collection("oreums").doc(id).update({
    thumbnailUrl,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ thumbnailUrl });
}

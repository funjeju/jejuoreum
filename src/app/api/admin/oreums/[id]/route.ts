import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminUpdateOreum, adminTogglePublish } from "@/lib/firestore/admin-oreums";

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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if ("isPublished" in body && Object.keys(body).length === 1) {
    await adminTogglePublish(id, body.isPublished);
  } else {
    await adminUpdateOreum(id, body);
  }

  return NextResponse.json({ ok: true });
}

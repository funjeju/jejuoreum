import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminListUsers, adminSetAdminClaim } from "@/lib/firestore/admin-users";

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

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await adminListUsers();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uid, isAdmin } = await req.json();
  if (!uid || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "uid and isAdmin are required" }, { status: 400 });
  }

  await adminSetAdminClaim(uid, isAdmin);
  return NextResponse.json({ ok: true });
}

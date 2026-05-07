import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const { secret, uid } = await req.json();

  if (secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  await adminAuth.setCustomUserClaims(uid, { admin: true });
  return NextResponse.json({ ok: true });
}

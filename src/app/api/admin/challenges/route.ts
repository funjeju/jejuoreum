import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminGetChallenges, adminCreateChallenge } from "@/lib/firestore/admin-challenges";

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

  const challenges = await adminGetChallenges();
  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.nameKo || !body.conditionType) {
    return NextResponse.json({ error: "nameKo and conditionType are required" }, { status: 400 });
  }

  const id = await adminCreateChallenge(body);
  return NextResponse.json({ id }, { status: 201 });
}

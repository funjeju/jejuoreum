import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { SeasonBadge } from "@/types";

export async function GET() {
  const now = new Date().toISOString();
  // isActive 단일 필드만 사용 — seasonStart 복합 인덱스 불필요
  const snap = await adminDb
    .collection("seasonBadges")
    .where("isActive", "==", true)
    .get();

  const badges = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as SeasonBadge))
    .filter((b) => b.seasonEnd >= now)
    .sort((a, b) => a.seasonEnd.localeCompare(b.seasonEnd));

  return NextResponse.json({ badges });
}

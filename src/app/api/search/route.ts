import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type") ?? "all"; // "oreums" | "users" | "all"

  if (q.length < 1) return NextResponse.json({ oreums: [], users: [] });

  const lower = q.toLowerCase();
  const results: { oreums: unknown[]; users: unknown[] } = { oreums: [], users: [] };

  // Search oreums
  if (type === "oreums" || type === "all") {
    const snap = await adminDb
      .collection("oreums")
      .where("isPublished", "==", true)
      .orderBy("tierOrder", "asc")
      .get();

    results.oreums = snap.docs
      .filter((d) => {
        const data = d.data();
        return (
          (data.nameKo as string)?.toLowerCase().includes(lower) ||
          (data.nameEn as string | null)?.toLowerCase().includes(lower) ||
          (data.slug as string)?.toLowerCase().includes(lower) ||
          ((data.altNames as string[]) ?? []).some((n) => n.toLowerCase().includes(lower))
        );
      })
      .slice(0, 15)
      .map((d) => ({
        id: d.id,
        slug: d.data().slug,
        nameKo: d.data().nameKo,
        thumbnailUrl: d.data().thumbnailUrl ?? null,
        tier: d.data().tier ?? null,
        region: d.data().region,
        difficulty: d.data().difficulty ?? null,
      }));
  }

  // Search users
  if (type === "users" || type === "all") {
    const snap = await adminDb
      .collection("users")
      .orderBy("nickname")
      .startAt(q)
      .endAt(q + "")
      .limit(10)
      .get();

    results.users = snap.docs.map((d) => ({
      uid: d.id,
      nickname: d.data().nickname,
      avatarUrl: d.data().avatarUrl ?? null,
      bio: d.data().bio ?? null,
    }));
  }

  return NextResponse.json(results);
}

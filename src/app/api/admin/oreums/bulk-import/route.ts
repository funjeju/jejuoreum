import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyAdmin(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7));
    return decoded.admin ? decoded : null;
  } catch {
    return null;
  }
}

// CSV 행을 파싱해 oreum 객체로 변환
function parseRow(headers: string[], row: string[]): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  headers.forEach((h, i) => {
    const val = row[i]?.trim() ?? "";
    switch (h) {
      case "lat":
      case "lng":
      case "elevation":
      case "difficulty":
      case "trailLengthKm":
      case "estimatedMinutes":
      case "tierOrder":
        obj[h] = val ? parseFloat(val) : null;
        break;
      case "altNames":
      case "emotionalKeywords":
      case "seasons":
      case "timesOfDay":
      case "features":
        obj[h] = val ? val.split("|").map((s) => s.trim()) : [];
        break;
      case "isPublished":
      case "isFeatured":
        obj[h] = val === "true" || val === "1";
        break;
      default:
        obj[h] = val || null;
    }
  });
  return obj;
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { csv } = await req.json();
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "Missing csv" }, { status: 400 });
  }

  const lines = csv.split("\n").map((l: string) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have header + at least 1 row" }, { status: 400 });
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur);
    return result;
  };

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1);

  const now = new Date().toISOString();
  const batch = adminDb.batch();
  const results: { slug: string; action: "created" | "updated"; error?: string }[] = [];

  for (const line of rows) {
    const row = parseCSVLine(line);
    const data = parseRow(headers, row);

    const slug = data.slug as string | null;
    if (!slug) {
      results.push({ slug: "(no slug)", action: "created", error: "slug 필드가 필요합니다" });
      continue;
    }

    try {
      const snap = await adminDb.collection("oreums").where("slug", "==", slug).limit(1).get();

      if (snap.empty) {
        const ref = adminDb.collection("oreums").doc();
        batch.set(ref, {
          ...data,
          createdAt: now,
          updatedAt: now,
          totalDiscoveries: 0,
          weeklyDiscoveries: 0,
          monthlyDiscoveries: 0,
          location: {
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            address: data.address ?? null,
            dongAddress: null,
          },
        });
        results.push({ slug, action: "created" });
      } else {
        const ref = snap.docs[0].ref;
        batch.update(ref, {
          ...data,
          updatedAt: now,
          location: {
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            address: data.address ?? null,
            dongAddress: snap.docs[0].data().location?.dongAddress ?? null,
          },
        });
        results.push({ slug, action: "updated" });
      }
    } catch (e) {
      results.push({ slug, action: "created", error: String(e) });
    }
  }

  await batch.commit();

  return NextResponse.json({
    total: rows.length,
    created: results.filter((r) => r.action === "created" && !r.error).length,
    updated: results.filter((r) => r.action === "updated" && !r.error).length,
    errors: results.filter((r) => r.error).length,
    results,
  });
}

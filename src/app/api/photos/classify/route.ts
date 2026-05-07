import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import type { PhotoCategory } from "@/types";

const client = new Anthropic();

const CLASSIFY_PROMPT = `Analyze this photo taken at a Korean volcanic hill (oreum) in Jeju Island.
Extract all metadata and respond with JSON only:

{
  "category": "parking|entrance|trail|summit_view|crater|flora|signage|selfie",
  "quality_score": 0.0-1.0,
  "season": "spring|summer|autumn|winter|unknown",
  "time_of_day": "dawn|morning|noon|afternoon|evening|night|unknown",
  "weather": "clear|cloudy|rain|snow|fog|unknown",
  "is_appropriate": true|false,
  "contains_face": true|false
}

Category guide:
- parking: parking lot or vehicle area
- entrance: trailhead, entrance gate, or sign at start
- trail: path, trail, or mid-hike scenery
- summit_view: panoramic view from top
- crater: volcanic depression or crater pond
- flora: plants, flowers, grass, trees closeup
- signage: directional signs, info boards
- selfie: person/people posing

Quality score:
5=1.0 (excellent composition, sharp, great lighting)
4=0.8 (good quality, minor flaws)
3=0.6 (acceptable, somewhat blurry or poor lighting)
2=0.4 (poor quality)
1=0.2 (very poor, unrelated, or screenshot)

is_appropriate: false if contains inappropriate/NSFW content.
contains_face: true if a recognizable human face is visible.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.photoId || !body?.imageUrl) {
    return NextResponse.json({ error: "photoId and imageUrl required" }, { status: 400 });
  }

  const { photoId, imageUrl } = body as { photoId: string; imageUrl: string };

  let category: PhotoCategory = "trail";
  let qualityScore = 3;
  let season = "unknown";
  let timeOfDay = "unknown";
  let weather = "unknown";
  let isAppropriate = true;
  let containsFace = false;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: CLASSIFY_PROMPT },
          ],
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = JSON.parse(jsonMatch[0]);
      const VALID_CATEGORIES: PhotoCategory[] = ["parking", "entrance", "trail", "summit_view", "crater", "flora", "signage", "selfie"];
      if (VALID_CATEGORIES.includes(p.category)) category = p.category;
      if (typeof p.quality_score === "number") qualityScore = Math.min(5, Math.max(1, Math.round(p.quality_score * 5)));
      if (p.season) season = p.season;
      if (p.time_of_day) timeOfDay = p.time_of_day;
      if (p.weather) weather = p.weather;
      if (typeof p.is_appropriate === "boolean") isAppropriate = p.is_appropriate;
      if (typeof p.contains_face === "boolean") containsFace = p.contains_face;
    }
  } catch {
    // AI 실패 시 기본값 유지
  }

  await adminDb.collection("photos").doc(photoId).update({
    category,
    qualityScore,
    season,
    timeOfDay,
    weather,
    aiIsAppropriate: isAppropriate,
    containsFace,
    classifiedAt: new Date().toISOString(),
    ...((!isAppropriate) && { isApproved: false }),
  });

  return NextResponse.json({ category, qualityScore, season, isAppropriate });
}

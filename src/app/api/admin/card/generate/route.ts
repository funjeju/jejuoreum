import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import OpenAI from "openai";
import { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 60;

const STYLE_PROMPTS: Record<string, string> = {
  ghibli:
    "Transform this landscape photo into Studio Ghibli animation style. Soft watercolor-like colors, lush green nature, dreamy and peaceful atmosphere, hand-drawn anime aesthetic. Keep the composition and main subject of the original photo.",
  anime:
    "Transform this photo into Japanese anime illustration style. Vibrant saturated colors, clean cel-shading, detailed outlines, dramatic sky and clouds. Keep the original composition.",
  oil:
    "Transform this photo into an impressionist oil painting. Rich textured brushstrokes, warm earthy tones, painterly style reminiscent of Monet. Keep the original composition.",
  watercolor:
    "Transform this photo into a soft watercolor painting. Delicate transparent color washes, gentle gradients, light and airy artistic quality. Keep the original composition.",
  retro:
    "Transform this photo into a vintage Korean travel poster illustration style. Limited bold color palette, flat geometric shapes, retro 1970s aesthetic. Keep the original composition.",
};

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

  const { imageBase64, style } = await req.json();
  if (!imageBase64 || !style)
    return NextResponse.json({ error: "imageBase64, style required" }, { status: 400 });

  const prompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.ghibli;

  // base64 → Buffer → OpenAI File
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const imageFile = await toFile(buffer, "oreum.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) return NextResponse.json({ error: "No image returned" }, { status: 500 });

  return NextResponse.json({ imageBase64: `data:image/png;base64,${b64}` });
}

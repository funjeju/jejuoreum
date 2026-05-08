import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminAuth } from "@/lib/firebase/admin";

const client = new Anthropic();

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if (!decoded.admin) return null;
    return decoded;
  } catch {
    return null;
  }
}

const INSTRUCTION_MAP: Record<string, string> = {
  expand:   "더 자세하고 풍부하게 설명해줘. 구체적인 정보, 감각적인 묘사, 방문자에게 유용한 내용을 추가해. 300~500자로 작성해.",
  shorten:  "핵심 내용만 남기고 간결하게 요약해줘. 150자 이내로 줄여.",
  tone_info: "정보적이고 객관적인 톤으로 다시 써줘. 사실과 수치 중심으로.",
  tone_emotion: "감성적이고 시적인 톤으로 다시 써줘. 방문자의 감동을 이끌어내는 표현 사용.",
  keyword:  "SEO 최적화를 위해 제주 오름, 제주 등산, 오름 추천, 탐방 등 관련 키워드를 자연스럽게 포함시켜 다시 써줘.",
};

export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin(req);
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { oreumNameKo, sectionTitle, currentText, instruction } = await req.json();

  if (!sectionTitle || !instruction) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const instructionText = INSTRUCTION_MAP[instruction] ?? instruction;

  const prompt = `당신은 제주 오름 여행 콘텐츠 전문 작가입니다.
오름 이름: ${oreumNameKo}
섹션: ${sectionTitle}

현재 내용:
${currentText || "(비어 있음)"}

지시사항: ${instructionText}

한국어로만 응답하고, 섹션 내용만 작성해. 앞에 제목이나 설명 없이 바로 내용을 시작해.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    return NextResponse.json({ enhanced: text });
  } catch {
    return NextResponse.json({ error: "AI enhancement failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";

const client = new Anthropic();

const ANALYZE_PROMPT = `당신은 제주 오름 후기 분류 전문가입니다.
다음 사용자 코멘트를 분석하고 JSON 형식으로만 응답하세요.

분류 카테고리:
- tip: 다음 방문자에게 유용한 실용적 정보
- review: 개인 감상, 분위기 묘사
- warning: 위험, 불편, 주의해야 할 정보
- photo_caption: 사진과 함께 올린 짧은 메모

응답 형식 (JSON만):
{
  "comment_type": "tip|review|warning|photo_caption",
  "keywords": ["키워드1", "키워드2"],
  "sentiment": "positive|neutral|negative",
  "quality_score": 0.0~1.0,
  "language": "ko|en|ja|zh",
  "is_appropriate": true|false,
  "contains_personal_info": true|false,
  "summary": "한 줄 요약"
}

품질 점수: 0.9+=매우 유용한 구체적 정보, 0.7+=유용한 정보, 0.5+=일반적 후기, 0.3+=짧은 감상, 0.0+=무의미

사용자 코멘트:
"""{content}"""`;

type CommentType = "tip" | "review" | "warning" | "photo_caption";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.commentId || !body?.content) {
    return NextResponse.json({ error: "commentId and content required" }, { status: 400 });
  }

  const { commentId, content } = body as { commentId: string; content: string };

  let commentType: CommentType = "review";
  let keywords: string[] = [];
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let qualityScore = 0.5;
  let language = "ko";
  let isAppropriate = true;
  let containsPersonalInfo = false;
  let summary = "";

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: ANALYZE_PROMPT.replace("{content}", content.slice(0, 500)),
        },
      ],
    });

    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (["tip", "review", "warning", "photo_caption"].includes(parsed.comment_type)) {
        commentType = parsed.comment_type as CommentType;
      }
      if (Array.isArray(parsed.keywords)) keywords = parsed.keywords.slice(0, 5);
      if (["positive", "neutral", "negative"].includes(parsed.sentiment)) sentiment = parsed.sentiment;
      if (typeof parsed.quality_score === "number") qualityScore = Math.min(1, Math.max(0, parsed.quality_score));
      if (["ko", "en", "ja", "zh"].includes(parsed.language)) language = parsed.language;
      if (typeof parsed.is_appropriate === "boolean") isAppropriate = parsed.is_appropriate;
      if (typeof parsed.contains_personal_info === "boolean") containsPersonalInfo = parsed.contains_personal_info;
      if (typeof parsed.summary === "string") summary = parsed.summary;
    }
  } catch {
    // AI 실패 시 기본값 유지
  }

  const isPublic = isAppropriate && !containsPersonalInfo;

  await adminDb.collection("comments").doc(commentId).update({
    commentType,
    aiKeywords: keywords,
    aiSentiment: sentiment,
    aiQualityScore: qualityScore,
    aiLanguage: language,
    aiIsAppropriate: isAppropriate,
    aiContainsPersonalInfo: containsPersonalInfo,
    aiSummary: summary,
    ...((!isPublic) && { isPublic: false }),
    classifiedAt: new Date().toISOString(),
  });

  return NextResponse.json({ commentType, qualityScore, isAppropriate });
}

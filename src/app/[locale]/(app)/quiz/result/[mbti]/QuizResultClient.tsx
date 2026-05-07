"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mountain, RotateCcw, Share2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type MbtiResult } from "@/lib/quiz/mbtiData";
import { MBTI_RESULTS, type MbtiType } from "@/lib/quiz/mbtiData";

const ALL_TYPES = Object.keys(MBTI_RESULTS) as MbtiType[];

const RELATED_GROUP: Record<string, MbtiType[]> = {
  NT: ["INTJ", "INTP", "ENTJ", "ENTP"],
  NF: ["INFJ", "INFP", "ENFJ", "ENFP"],
  SJ: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  SP: ["ISTP", "ISFP", "ESTP", "ESFP"],
};

function getRelatedTypes(type: MbtiType): MbtiType[] {
  const group = Object.entries(RELATED_GROUP).find(([, types]) => types.includes(type));
  if (!group) return [];
  return group[1].filter((t) => t !== type).slice(0, 3);
}

export default function QuizResultClient({
  result,
  locale,
}: {
  result: MbtiResult;
  locale: string;
}) {
  const router = useRouter();
  const relatedTypes = getRelatedTypes(result.type);

  const handleShare = () => {
    const url = `${window.location.origin}/${locale}/quiz/result/${result.type.toLowerCase()}`;
    const text = `나는 ${result.type} — 닮은 오름은 ${result.oreumName}이래! 오름 MBTI 테스트 해봐`;
    if (navigator.share) {
      navigator.share({ title: `오름 MBTI: ${result.type}`, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[var(--header-bg)] flex flex-col">
      {/* 헤더 */}
      <div className="p-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="ml-3 text-white font-semibold text-sm">오름 MBTI 결과</span>
      </div>

      <div className="flex-1 px-6 pb-10 flex flex-col items-center">
        {/* 결과 카드 */}
        <div className={cn(
          "w-full max-w-sm rounded-3xl p-6 mb-5 bg-gradient-to-br border border-white/10",
          result.color
        )}>
          <div className="text-white text-center mb-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
              나를 닮은 오름 MBTI
            </p>
            <p className="text-6xl font-black tracking-wider mb-2">{result.type}</p>
            <p className="text-xl font-bold">{result.title}</p>
          </div>

          <div className="flex gap-1.5 justify-center flex-wrap mb-5">
            {result.keywords.map((kw) => (
              <span
                key={kw}
                className="px-2.5 py-1 rounded-full bg-white/20 text-white/90 text-xs font-medium"
              >
                #{kw}
              </span>
            ))}
          </div>

          <p className="text-white/80 text-sm text-center leading-relaxed">{result.desc}</p>
        </div>

        {/* 추천 오름 카드 */}
        <div className="w-full max-w-sm bg-white/8 border border-white/15 rounded-2xl p-4 mb-4">
          <p className="text-white/50 text-xs mb-3">당신과 닮은 오름</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Mountain size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base">{result.oreumName}</p>
              <p className="text-white/50 text-xs mt-0.5">제주 오름 100선</p>
            </div>
            <Link href={`/${locale}/oreum/${result.oreumSlug}`}>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <ChevronRight size={16} className="text-white/60" />
              </div>
            </Link>
          </div>
        </div>

        {/* 다른 MBTI 유형 */}
        {relatedTypes.length > 0 && (
          <div className="w-full max-w-sm mb-5">
            <p className="text-white/50 text-xs mb-2.5">같은 그룹의 다른 유형</p>
            <div className="grid grid-cols-3 gap-2">
              {relatedTypes.map((t) => {
                const r = MBTI_RESULTS[t];
                return (
                  <Link
                    key={t}
                    href={`/${locale}/quiz/result/${t.toLowerCase()}`}
                    className={cn(
                      "rounded-2xl p-3 text-center bg-gradient-to-br border border-white/10 hover:opacity-90 transition-opacity",
                      r.color
                    )}
                  >
                    <p className="text-white font-bold text-sm">{t}</p>
                    <p className="text-white/70 text-[10px] mt-0.5 leading-tight line-clamp-1">{r.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="w-full max-w-sm space-y-2.5">
          <Link href={`/${locale}/oreum/${result.oreumSlug}`} className="block">
            <Button className="w-full h-12 bg-white text-primary font-semibold hover:bg-white/90">
              <Mountain size={16} className="mr-2" />
              {result.oreumName} 보러 가기
            </Button>
          </Link>

          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1 h-11 border-white/20 text-white/70 hover:bg-white/10"
              onClick={() => router.push(`/${locale}/quiz`)}
            >
              <RotateCcw size={14} className="mr-1.5" />
              다시하기
            </Button>
            <Button
              className="flex-1 h-11 bg-white/15 hover:bg-white/25 text-white border border-white/20"
              onClick={handleShare}
            >
              <Share2 size={14} className="mr-1.5" />
              공유하기
            </Button>
          </div>
        </div>

        {/* 전체 유형 보기 */}
        <div className="w-full max-w-sm mt-6">
          <p className="text-white/40 text-xs text-center mb-3">다른 오름 MBTI 유형도 보기</p>
          <div className="grid grid-cols-4 gap-1.5">
            {ALL_TYPES.map((t) => {
              const r = MBTI_RESULTS[t];
              const isCurrent = t === result.type;
              return (
                <Link
                  key={t}
                  href={`/${locale}/quiz/result/${t.toLowerCase()}`}
                  className={cn(
                    "rounded-xl py-2 text-center text-xs font-bold transition-all",
                    isCurrent
                      ? "bg-white text-primary"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  )}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

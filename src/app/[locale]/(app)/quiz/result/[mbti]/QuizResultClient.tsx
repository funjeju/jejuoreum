"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mountain, RotateCcw, Share2, ChevronRight, ArrowLeft, Heart, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type MbtiResult } from "@/lib/quiz/mbtiData";
import { MBTI_RESULTS, type MbtiType } from "@/lib/quiz/mbtiData";
import { useAuth } from "@/lib/hooks/useAuth";

interface MatchedOreum {
  id: string;
  nameKo: string;
  slug: string;
  oneLinerKo: string | null;
  thumbnailUrl: string | null;
  illustrationUrl: string | null;
  mbti: string;
  region: string;
  elevationM: number | null;
}

const ALL_TYPES = Object.keys(MBTI_RESULTS) as MbtiType[];

const RELATED_GROUP: Record<string, MbtiType[]> = {
  NT: ["INTJ", "INTP", "ENTJ", "ENTP"],
  NF: ["INFJ", "INFP", "ENFJ", "ENFP"],
  SJ: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  SP: ["ISTP", "ISFP", "ESTP", "ESFP"],
};

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
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
  const { user } = useAuth();
  const relatedTypes = getRelatedTypes(result.type);

  const [matchedOreums, setMatchedOreums]     = useState<MatchedOreum[]>([]);
  const [loadingMatch, setLoadingMatch]         = useState(true);
  const [selected, setSelected]                 = useState<string[]>([]);
  const [prevFavorites, setPrevFavorites]       = useState<string[]>([]);
  const [saving, setSaving]                     = useState(false);
  const [saved, setSaved]                       = useState(false);

  // 기존 애정 오름 로드
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/favorite-oreums", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          const ids = (d.oreums ?? []).map((o: MatchedOreum) => o.id) as string[];
          setPrevFavorites(ids);
          setSelected(ids);
        })
        .catch(() => {})
    );
  }, [user]);

  // 매칭 오름 조회
  useEffect(() => {
    setLoadingMatch(true);
    fetch(`/api/quiz/matched-oreums?mbti=${result.type}`)
      .then((r) => r.json())
      .then((d) => setMatchedOreums(d.oreums ?? []))
      .catch(() => {})
      .finally(() => setLoadingMatch(false));
  }, [result.type]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/me/favorite-oreums", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ favoriteOreumIds: selected }),
      });
      setSaved(true);
      setPrevFavorites(selected);
    } catch {
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...prevFavorites].sort());

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
    <div className="min-h-screen bg-header flex flex-col">
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

        {/* ── 나의 애정 오름 선택 ── */}
        <div className="w-full max-w-sm mb-5">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={14} className="text-rose-400 fill-rose-400" />
              <p className="text-white font-semibold text-sm">당신과 가장 비슷한 오름</p>
            </div>
            <p className="text-white/50 text-xs">
              나의 애정 오름을 3개까지 지정해보세요 — 프로필 배경에 일러스트가 반영됩니다
            </p>
          </div>

          {loadingMatch ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-white/40" />
            </div>
          ) : matchedOreums.length === 0 ? (
            <p className="text-white/40 text-xs text-center py-6">
              아직 이 유형에 매핑된 오름이 없어요.<br />어드민에서 MBTI 매핑을 완료해주세요.
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {matchedOreums.map((o) => {
                  const isSelected = selected.includes(o.id);
                  const isExact = o.mbti === result.type;
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggleSelect(o.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                        isSelected
                          ? "border-rose-400/60 bg-rose-500/15"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      )}
                    >
                      {/* 일러스트 or 썸네일 */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative">
                        {o.illustrationUrl || o.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={o.illustrationUrl ?? o.thumbnailUrl ?? ""}
                            alt={o.nameKo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            <Mountain size={20} className="text-white/40" />
                          </div>
                        )}
                        {o.illustrationUrl && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center">
                            <span className="text-[7px] text-white font-bold">AI</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-white font-semibold text-sm truncate">{o.nameKo}</p>
                          {isExact && (
                            <span className="shrink-0 text-[9px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-full">
                              {o.mbti}
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-[10px] truncate">
                          {REGION_KO[o.region] ?? o.region}
                          {o.elevationM ? ` · ${o.elevationM}m` : ""}
                        </p>
                        {o.oneLinerKo && (
                          <p className="text-white/60 text-[11px] mt-0.5 truncate">{o.oneLinerKo}</p>
                        )}
                      </div>

                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "border-rose-400 bg-rose-500"
                          : "border-white/30",
                      )}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 선택 상태 + 저장 */}
              <div className="flex items-center justify-between">
                <p className="text-white/50 text-xs">{selected.length}/3 선택됨</p>
                <button
                  onClick={handleSave}
                  disabled={saving || (!hasChanged && saved)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors",
                    saved && !hasChanged
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500 text-white hover:bg-rose-600",
                  )}
                >
                  {saving ? (
                    <><Loader2 size={11} className="animate-spin" /> 저장 중</>
                  ) : saved && !hasChanged ? (
                    <><Check size={11} /> 저장됨</>
                  ) : (
                    <><Heart size={11} className="fill-white" /> 애정 오름 저장</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 추천 오름 카드 */}
        <div className="w-full max-w-sm bg-white/8 border border-white/15 rounded-2xl p-4 mb-4">
          <p className="text-white/50 text-xs mb-3">당신과 닮은 대표 오름</p>
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

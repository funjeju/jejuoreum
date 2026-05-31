"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OreumCard } from "@/types";

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};
const TIER_LABEL: Record<string, string> = {
  beginner: "비기너", explorer: "익스플로러", master: "마스터",
};
const LEVEL_LABEL: Record<string, string> = {
  entry: "🌱 입문자", novice: "🥾 초보자", intermediate: "⛰️ 중급자", advanced: "🏔️ 숙련자",
};

interface Props {
  oreum: OreumCard;
  isDiscovered: boolean;
  locale: string;
  onClose: () => void;
}

export function OreumCardModal({ oreum, isDiscovered, locale, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* 배경 블러 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 카드 */}
      <div
        className="relative w-full max-w-sm mx-4 mb-8 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          animation: "cardReveal 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이미지 영역 */}
        <div className={cn("relative w-full", isDiscovered ? "h-72" : "h-72 grayscale brightness-75")}>
          {oreum.thumbnailUrl ? (
            <Image
              src={oreum.thumbnailUrl}
              alt={oreum.nameKo}
              fill
              className="object-cover"
              sizes="400px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
              <span className="text-5xl font-bold text-white/30">{oreum.nameKo[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* 닫기 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            <X size={15} className="text-white" />
          </button>

          {/* 발견 배지 */}
          {isDiscovered && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 backdrop-blur px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} className="text-white" />
              <span className="text-white text-[10px] font-semibold">발견 완료</span>
            </div>
          )}

          {/* 카드 번호 */}
          {oreum.tierOrder && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-mono">
              #{oreum.tierOrder}
            </div>
          )}

          {/* 하단 텍스트 */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-white text-2xl font-bold mb-1">{oreum.nameKo}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin size={10} /> {REGION_KO[oreum.region] ?? oreum.region}
              </span>
              {oreum.tier && (
                <span className="text-white/70 text-xs bg-white/15 px-2 py-0.5 rounded-full">
                  {TIER_LABEL[oreum.tier]}
                </span>
              )}
              {oreum.recommendedLevel && (
                <span className="text-white/70 text-xs bg-white/15 px-2 py-0.5 rounded-full">
                  {LEVEL_LABEL[oreum.recommendedLevel]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="bg-card px-5 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            닫기
          </button>
          <Link
            href={`/${locale}/oreum/${oreum.slug}`}
            className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center"
            onClick={onClose}
          >
            자세히 보기 →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes cardReveal {
          from { opacity: 0; transform: scale(0.82) translateY(40px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

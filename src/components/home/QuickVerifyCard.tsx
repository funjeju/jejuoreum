"use client";

import { MapPin, Footprints } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export function QuickVerifyCard() {
  const locale = useLocale();
  return (
    <Link href={`/${locale}/qr`} className="block group">
      <div className="relative flex items-center gap-4 px-4 py-4 rounded-2xl bg-secondary/70 border border-secondary hover:border-primary/30 hover:bg-secondary transition-colors overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-primary/8 to-transparent pointer-events-none" />

        {/* 아이콘 */}
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200">
          <MapPin size={22} className="text-white" strokeWidth={2} />
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">지금 오름 근처에 계신가요?</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            GPS로 자동 확인 — 발자국을 남겨보세요
          </p>
        </div>

        {/* 화살표 버튼 */}
        <div className="shrink-0 flex items-center gap-1 text-primary font-semibold text-xs">
          <Footprints size={14} />
          <span>인증</span>
        </div>
      </div>
    </Link>
  );
}

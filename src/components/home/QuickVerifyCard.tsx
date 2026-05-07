"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickVerifyCard() {
  const locale = useLocale();
  return (
    <Card className="relative overflow-hidden h-[130px] rounded-2xl border-0 bg-gradient-to-br from-primary to-primary/70">
      {/* 장식 원 */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 bottom-4 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative z-10 flex h-full flex-col justify-center px-5">
        <h3 className="text-base font-bold text-white">빠른 인증하기</h3>
        <p className="text-sm text-white/80 mt-1 leading-snug">
          오름 근처에 계신가요?<br />GPS로 자동 확인해드려요
        </p>
        <Link href={`/${locale}/qr`}>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 w-fit bg-white text-primary hover:bg-white/90 font-semibold"
          >
            <MapPin className="mr-1.5 h-4 w-4" />
            GPS 인증 시작
          </Button>
        </Link>
      </div>
    </Card>
  );
}

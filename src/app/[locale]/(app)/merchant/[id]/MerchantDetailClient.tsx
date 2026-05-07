"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Phone, Globe, Instagram, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Merchant } from "@/types";

const MERCHANT_TYPE_LABELS: Record<string, string> = {
  cafe:         "카페",
  restaurant:   "식당",
  guesthouse:   "게스트하우스",
  convenience:  "편의점",
  shop:         "잡화",
  rentcar:      "렌터카",
  experience:   "체험",
  other:        "기타",
};

const DAY_LABELS: Record<string, string> = {
  mon: "월", tue: "화", wed: "수", thu: "목",
  fri: "금", sat: "토", sun: "일",
};

function isOpenNow(hours: Record<string, string> | null): boolean {
  if (!hours) return false;
  const now = new Date();
  const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
  const dayHours = hours[dayKey];
  if (!dayHours || dayHours === "closed") return false;
  const [open, close] = dayHours.split("-");
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= open && currentTime < close;
}

export default function MerchantDetailClient({ merchant }: { merchant: Merchant }) {
  const router = useRouter();
  const openNow = isOpenNow(merchant.businessHours);

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-24">
      {/* 헤더 이미지 */}
      <div className="relative w-full h-64 bg-muted">
        {merchant.coverImageUrl ? (
          <Image
            src={merchant.coverImageUrl}
            alt={merchant.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-6xl opacity-30">
              {merchant.merchantType === "cafe" ? "☕" : merchant.merchantType === "restaurant" ? "🍽️" : "🏪"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white z-10"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* 기본 정보 */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{merchant.name}</h1>
              <Badge variant="secondary" className="text-xs mt-1">
                {MERCHANT_TYPE_LABELS[merchant.merchantType] ?? merchant.merchantType}
              </Badge>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold shrink-0 ${openNow ? "text-emerald-600" : "text-muted-foreground"}`}>
              <span className={`w-2 h-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {openNow ? "영업 중" : "영업 종료"}
            </div>
          </div>
        </div>

        {/* 설명 */}
        {merchant.description && (
          <p className="text-sm leading-relaxed text-foreground">{merchant.description}</p>
        )}

        {/* 위치 */}
        {merchant.address && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted border border-border">
            <MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">주소</p>
              <p className="text-sm">{merchant.address}</p>
            </div>
          </div>
        )}

        {/* 영업 시간 */}
        {merchant.businessHours && (
          <div className="p-3 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">영업 시간</p>
            </div>
            <div className="space-y-1">
              {(["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => {
                const hours = merchant.businessHours?.[day];
                if (!hours) return null;
                return (
                  <div key={day} className="flex justify-between text-xs">
                    <span className="text-muted-foreground w-6">{DAY_LABELS[day]}</span>
                    <span className={hours === "closed" ? "text-muted-foreground/50" : "font-medium"}>
                      {hours === "closed" ? "휴무" : hours}
                    </span>
                  </div>
                );
              })}
              {merchant.businessHours?.special_notes && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                  {merchant.businessHours.special_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 시그니처 메뉴 */}
        {merchant.signatureItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2.5">대표 메뉴</p>
            <div className="space-y-2">
              {merchant.signatureItems.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.price > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {item.price.toLocaleString()}원
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 연락처 / 링크 */}
        <div className="grid grid-cols-2 gap-2">
          {merchant.contactPhone && (
            <a href={`tel:${merchant.contactPhone}`}>
              <Button variant="outline" className="w-full h-10 text-xs gap-2">
                <Phone size={14} /> {merchant.contactPhone}
              </Button>
            </a>
          )}
          {merchant.instagramHandle && (
            <a href={`https://instagram.com/${merchant.instagramHandle}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-10 text-xs gap-2">
                <Instagram size={14} /> 인스타그램
              </Button>
            </a>
          )}
          {merchant.naverMapUrl && (
            <a href={merchant.naverMapUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-10 text-xs gap-2">
                <MapPin size={14} /> 네이버 지도
              </Button>
            </a>
          )}
          {merchant.kakaoMapUrl && (
            <a href={merchant.kakaoMapUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-10 text-xs gap-2">
                <MapPin size={14} /> 카카오 지도
              </Button>
            </a>
          )}
          {merchant.websiteUrl && (
            <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-10 text-xs gap-2 col-span-2">
                <Globe size={14} /> 홈페이지 <ExternalLink size={12} className="ml-auto opacity-50" />
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

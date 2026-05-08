import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import type { Metadata } from "next";
import { adminGetPublishedOreumCards } from "@/lib/firestore/admin-oreums";
import { Header } from "@/components/layout/Header";
import { Mountain, ChevronRight } from "lucide-react";
import type { Region } from "@/types";

const LEVEL_META = [
  { level: "beginner", label: "비기너",      desc: "초보자도 쉽게 오를 수 있는 30선", tier: "beginner" as const },
  { level: "explorer", label: "익스플로러",  desc: "깊이 있는 탐험을 위한 70선",    tier: "explorer" as const },
  { level: "master",   label: "마스터 🏆",  desc: "진정한 고수를 위한 마스터 오름", tier: "master"   as const },
] as const;

const SEASON_META = [
  { season: "spring",  label: "봄",    emoji: "🌸", desc: "진달래·벚꽃·유채꽃 오름" },
  { season: "summer",  label: "여름",  emoji: "🌊", desc: "그늘과 바람의 여름 탐방" },
  { season: "autumn",  label: "가을",  emoji: "🍁", desc: "억새·단풍 명소 오름" },
  { season: "winter",  label: "겨울",  emoji: "❄️", desc: "설경과 일출 명소" },
] as const;

const FEATURE_META = [
  { feature: "sunrise", label: "일출 명소",  emoji: "🌅", desc: "새벽빛과 함께하는 제주 일출 오름" },
  { feature: "sunset",  label: "일몰 명소",  emoji: "🌇", desc: "노을빛으로 물드는 제주 일몰 오름" },
  { feature: "crater",  label: "분화구 오름", emoji: "🌋", desc: "원형 분화구가 살아있는 제주 오름" },
] as const;

const BASE_URL = "https://jejuoreum.com";

const REGION_META: Record<Region, { label: string; desc: string }> = {
  east:    { label: "동부",  desc: "성산일출봉, 우도 인근의 동부 오름" },
  west:    { label: "서부",  desc: "한경·한림·애월 방면의 서부 오름" },
  south:   { label: "남부",  desc: "서귀포 해안선과 맞닿은 남부 오름" },
  north:   { label: "북부",  desc: "제주시 시가지와 가까운 북부 오름" },
  central: { label: "중산간", desc: "한라산 허리를 감싸는 중산간 오름" },
};

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = "제주 오름 100선 — 전체 목록 | 제주 오름 패스포트";
  const desc = "제주 오름 100선 전체 목록을 지역별로 확인하세요. 동부·서부·남부·북부·중산간 오름 탐방 정보와 난이도, 추천 시즌을 한눈에 볼 수 있습니다.";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    alternates: { canonical: `/${locale}/oreum` },
  };
}

export const dynamic = "force-dynamic";

export default async function OreumHubPage({ params }: Props) {
  const { locale } = await params;

  const oreums = await adminGetPublishedOreumCards().catch(() => []);

  const byRegion = (Object.keys(REGION_META) as Region[]).map((region) => ({
    region,
    ...REGION_META[region],
    items: oreums.filter((o) => o.region === region),
  }));

  const byLevel = LEVEL_META.map(({ level, label, desc, tier }) => ({
    level,
    label,
    desc,
    items: oreums.filter((o) => o.tier === tier),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "제주 오름 100선",
    description: "제주도의 오름(기생화산) 100선 목록",
    url: `${BASE_URL}/${locale}/oreum`,
    numberOfItems: oreums.length,
    itemListElement: oreums.slice(0, 50).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/${locale}/oreum/${o.slug}`,
      name: o.nameKo,
    })),
  };

  return (
    <>
      <Script
        id="json-ld-oreum-hub"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background pb-28">
        <Header title="제주 오름" />

        {/* 히어로 */}
        <div className="bg-header px-4 pt-4 pb-10">
          <div className="max-w-lg mx-auto">
            <p className="text-white/60 text-sm mt-1">
              제주의 {oreums.length}개 오름을 지역별·난이도별로 탐험하세요
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-4 space-y-3">
          {/* 지역 카테고리 카드 */}
          {byRegion.map(({ region, label, desc, items }) => (
            <Link key={region} href={`/${locale}/oreum/region/${region}`}>
              <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mountain size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {items.length}개
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </div>

                {/* 미리보기 썸네일 3개 */}
                {items.length > 0 && (
                  <div className="flex gap-1 px-4 pb-4">
                    {items.slice(0, 4).map((o) => (
                      <div
                        key={o.slug}
                        className="relative flex-1 h-16 rounded-lg overflow-hidden bg-muted"
                      >
                        {o.thumbnailUrl ? (
                          <Image
                            src={o.thumbnailUrl}
                            alt={o.nameKo}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary/30">{o.nameKo[0]}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <p className="absolute bottom-1 left-1 right-1 text-white text-[9px] font-medium leading-tight truncate">
                          {o.nameKo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}

          {/* 난이도 카테고리 */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">난이도별</p>
            <div className="grid grid-cols-2 gap-3">
              {byLevel.map(({ level, label, desc, items }) => (
                <Link key={level} href={`/${locale}/oreum/level/${level}`}>
                  <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Mountain size={16} className="text-primary shrink-0" />
                      <span className="font-bold text-sm text-foreground">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items.length}개</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 시즌 카테고리 */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">시즌별</p>
            <div className="grid grid-cols-2 gap-3">
              {SEASON_META.map(({ season, label, emoji, desc }) => (
                <Link key={season} href={`/${locale}/oreum/season/${season}`}>
                  <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{emoji}</span>
                      <span className="font-bold text-sm text-foreground">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 특집 카테고리 */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">특집</p>
            <div className="grid grid-cols-2 gap-3">
              {FEATURE_META.map(({ feature, label, emoji, desc }) => (
                <Link key={feature} href={`/${locale}/oreum/feature/${feature}`}>
                  <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{emoji}</span>
                      <span className="font-bold text-sm text-foreground">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* SEO 텍스트 */}
          <div className="bg-muted/40 rounded-2xl p-4 mt-2">
            <h2 className="text-sm font-bold text-foreground mb-2">제주 오름이란?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              오름은 제주도 곳곳에 분포한 기생화산입니다. 제주도에는 360여 개의 오름이 있으며,
              그 중 100선은 접근성·경관·생태적 가치를 기준으로 선정된 대표 오름입니다.
              각 오름마다 독특한 분화구, 습지, 억새밭, 숲길이 펼쳐집니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

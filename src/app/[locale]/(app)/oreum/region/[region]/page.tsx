import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminGetPublishedOreumCards } from "@/lib/firestore/admin-oreums";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, Mountain } from "lucide-react";
import type { Region } from "@/types";

const BASE_URL = "https://jejuoreum.com";

const REGION_META: Record<Region, { label: string; desc: string; longDesc: string }> = {
  east: {
    label: "동부",
    desc: "성산일출봉·우도 인근의 동부 오름",
    longDesc: "동부 오름은 성산일출봉·우도·표선 방면에 분포합니다. 해안과 가까운 오름이 많아 탁 트인 바다 전망을 즐길 수 있으며, 일출 명소로도 유명합니다.",
  },
  west: {
    label: "서부",
    desc: "한경·한림·애월 방면의 서부 오름",
    longDesc: "서부 오름은 한경·한림·애월·협재 방면에 위치합니다. 지평선 너머 차귀도를 바라보는 일몰 전망이 아름다우며, 비교적 완만한 지형이 많습니다.",
  },
  south: {
    label: "남부",
    desc: "서귀포 해안선과 맞닿은 남부 오름",
    longDesc: "남부 오름은 서귀포·중문·남원 방면에 분포합니다. 한라산 남면의 풍부한 식생과 폭포, 해안절벽을 함께 즐길 수 있는 오름이 많습니다.",
  },
  north: {
    label: "북부",
    desc: "제주시 시가지와 가까운 북부 오름",
    longDesc: "북부 오름은 제주시·조천·구좌 방면에 자리합니다. 도심에서 접근하기 편리하고 교통이 좋아 초보 탐방객에게 인기가 높습니다.",
  },
  central: {
    label: "중산간",
    desc: "한라산 허리를 감싸는 중산간 오름",
    longDesc: "중산간 오름은 해발 200~600m 사이 한라산 중턱에 분포합니다. 울창한 숲과 넓은 억새 초원, 신비로운 습지 분화구를 품은 오름이 많습니다.",
  },
};

const VALID_REGIONS = Object.keys(REGION_META) as Region[];

interface Props {
  params: Promise<{ locale: string; region: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, region } = await params;
  if (!VALID_REGIONS.includes(region as Region)) return {};
  const meta = REGION_META[region as Region];
  const title = `제주 ${meta.label} 오름 목록 — ${meta.label} 오름 100선 | 제주 오름 패스포트`;
  const desc = `${meta.longDesc} 제주 ${meta.label} 오름의 탐방 정보, 난이도, 추천 시즌을 확인하세요.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    alternates: { canonical: `/${locale}/oreum/region/${region}` },
  };
}

export const dynamic = "force-dynamic";

export default async function RegionPage({ params }: Props) {
  const { locale, region } = await params;
  if (!VALID_REGIONS.includes(region as Region)) notFound();

  const typedRegion = region as Region;
  const meta = REGION_META[typedRegion];
  const oreums = await adminGetPublishedOreumCards({ region: typedRegion }).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `제주 ${meta.label} 오름 목록`,
    description: meta.desc,
    url: `${BASE_URL}/${locale}/oreum/region/${region}`,
    numberOfItems: oreums.length,
    itemListElement: oreums.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE_URL}/${locale}/oreum/${o.slug}`,
      name: o.nameKo,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "제주 오름", item: `${BASE_URL}/${locale}/oreum` },
      { "@type": "ListItem", position: 3, name: `${meta.label} 오름`, item: `${BASE_URL}/${locale}/oreum/region/${region}` },
    ],
  };

  const DIFFICULTY_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

  return (
    <>
      <Script id="json-ld-region" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-background pb-28">
        <Header title={`${meta.label} 오름`} />

        {/* 히어로 */}
        <div className="bg-[var(--header-bg)] px-4 pt-3 pb-10">
          <div className="max-w-lg mx-auto">
            <Link href={`/${locale}/oreum`} className="inline-flex items-center gap-1 text-white/60 text-xs mb-2 hover:text-white/80">
              <ChevronLeft size={14} />
              제주 오름 전체
            </Link>
            <p className="text-white/70 text-sm">{meta.longDesc}</p>
            <p className="text-white/50 text-xs mt-2">{oreums.length}개 오름</p>
          </div>
        </div>

        {/* 오름 그리드 */}
        <div className="max-w-lg mx-auto px-4 -mt-4">
          {oreums.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <Mountain size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">등록된 오름이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {oreums.map((oreum) => (
                <Link key={oreum.slug} href={`/${locale}/oreum/${oreum.slug}`}>
                  <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors">
                    {/* 썸네일 */}
                    <div className="relative aspect-[4/3] bg-muted">
                      {oreum.thumbnailUrl ? (
                        <Image
                          src={oreum.thumbnailUrl}
                          alt={oreum.nameKo}
                          fill
                          className="object-cover"
                          sizes="(max-width: 512px) 50vw, 256px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-3xl font-bold text-primary/20">{oreum.nameKo[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {oreum.tierOrder && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full">
                          #{oreum.tierOrder}
                        </span>
                      )}
                    </div>
                    {/* 정보 */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-foreground truncate">{oreum.nameKo}</h3>
                      {oreum.oneLinerKo && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {oreum.oneLinerKo}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {oreum.elevationM && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            {oreum.elevationM}m
                          </span>
                        )}
                        {oreum.difficulty && (
                          <span className="text-[10px] text-amber-500">
                            {DIFFICULTY_LABEL[oreum.difficulty]}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* SEO 텍스트 */}
          <div className="bg-muted/40 rounded-2xl p-4 mt-6">
            <h2 className="text-sm font-bold text-foreground mb-2">제주 {meta.label} 오름 탐방 안내</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{meta.longDesc}</p>
          </div>
        </div>
      </div>
    </>
  );
}

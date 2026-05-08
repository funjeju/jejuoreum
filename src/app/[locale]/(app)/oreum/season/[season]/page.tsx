import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminGetPublishedOreumCards } from "@/lib/firestore/admin-oreums";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, Mountain } from "lucide-react";
import type { Season } from "@/types";

const BASE_URL = "https://jejuoreum.com";

const SEASON_META: Record<Season, {
  label: string;
  labelEn: string;
  emoji: string;
  desc: string;
  longDesc: string;
}> = {
  spring: {
    label: "봄",
    labelEn: "Spring",
    emoji: "🌸",
    desc: "진달래·벚꽃·유채꽃과 함께하는 봄 오름",
    longDesc: "봄의 제주 오름은 진달래, 유채꽃, 벚꽃으로 물든 장관을 선사합니다. 3~5월이 최고 시즌으로, 한라산 기슭의 색채가 가장 풍부한 시기입니다. 꽃길을 따라 가볍게 오르는 봄 탐방은 제주 오름의 정수를 느낄 수 있는 경험입니다.",
  },
  summer: {
    label: "여름",
    labelEn: "Summer",
    emoji: "🌊",
    desc: "그늘진 숲길과 시원한 바람의 여름 오름",
    longDesc: "여름 제주 오름은 초록빛 풀밭과 짙은 숲으로 가득합니다. 이른 아침 탐방이 가장 쾌적하며, 그늘진 산림 코스 위주의 오름을 추천합니다. 해안가 오름에서는 시원한 바닷바람을 맞으며 제주의 여름을 만끽할 수 있습니다.",
  },
  autumn: {
    label: "가을",
    labelEn: "Autumn",
    emoji: "🍁",
    desc: "억새와 단풍으로 물드는 가을 오름",
    longDesc: "가을은 제주 오름 탐방의 최고 시즌입니다. 9~11월에는 억새밭이 황금빛으로 물들고, 단풍이 오름을 붉게 물들입니다. 특히 억새 명소로 유명한 오름들은 가을 해질녘에 방문하면 환상적인 풍경을 선사합니다.",
  },
  winter: {
    label: "겨울",
    labelEn: "Winter",
    emoji: "❄️",
    desc: "설경과 일출이 어우러지는 겨울 오름",
    longDesc: "겨울 제주 오름은 한라산의 설경과 맑은 하늘이 어우러져 독특한 아름다움을 자랑합니다. 일출 명소로 유명한 오름들은 겨울 새벽에 특히 빛납니다. 관광객이 적어 조용하게 탐방할 수 있으며, 맑은 날 한라산 전망이 가장 선명한 계절입니다.",
  },
};

const VALID_SEASONS = Object.keys(SEASON_META) as Season[];

interface Props {
  params: Promise<{ locale: string; season: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, season } = await params;
  if (!VALID_SEASONS.includes(season as Season)) return {};
  const meta = SEASON_META[season as Season];
  const title = `제주 ${meta.label} 오름 — ${meta.desc} | 제주 오름 패스포트`;
  const desc = meta.longDesc;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    alternates: {
      canonical: `${BASE_URL}/${locale}/oreum/season/${season}`,
      languages: {
        ko: `${BASE_URL}/ko/oreum/season/${season}`,
        en: `${BASE_URL}/en/oreum/season/${season}`,
        ja: `${BASE_URL}/ja/oreum/season/${season}`,
        zh: `${BASE_URL}/zh/oreum/season/${season}`,
        "x-default": `${BASE_URL}/ko/oreum/season/${season}`,
      },
    },
  };
}

export const dynamic = "force-dynamic";

export default async function SeasonPage({ params }: Props) {
  const { locale, season } = await params;
  if (!VALID_SEASONS.includes(season as Season)) notFound();

  const typedSeason = season as Season;
  const meta = SEASON_META[typedSeason];
  const oreums = await adminGetPublishedOreumCards({ season: typedSeason }).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `제주 ${meta.label} 오름 목록`,
    description: meta.desc,
    url: `${BASE_URL}/${locale}/oreum/season/${season}`,
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
      { "@type": "ListItem", position: 3, name: `${meta.label} 오름`, item: `${BASE_URL}/${locale}/oreum/season/${season}` },
    ],
  };

  const DIFFICULTY_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

  return (
    <>
      <Script id="json-ld-season" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-background pb-28">
        <Header title={`${meta.emoji} ${meta.label} 오름`} />

        <div className="bg-header px-4 pt-3 pb-10">
          <div className="max-w-lg mx-auto">
            <Link href={`/${locale}/oreum`} className="inline-flex items-center gap-1 text-white/60 text-xs mb-2 hover:text-white/80">
              <ChevronLeft size={14} />
              제주 오름 전체
            </Link>
            <p className="text-white/70 text-sm">{meta.longDesc}</p>
            <p className="text-white/50 text-xs mt-2">{oreums.length}개 오름</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-4">
          {oreums.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <Mountain size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">등록된 오름이 없습니다</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {meta.emoji} {meta.label} 시즌 오름 데이터를 준비 중이에요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {oreums.map((oreum) => (
                <Link key={oreum.slug} href={`/${locale}/oreum/${oreum.slug}`}>
                  <article className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors">
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
                        <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white/40">{oreum.nameKo[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {oreum.tierOrder && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full">
                          #{oreum.tierOrder}
                        </span>
                      )}
                    </div>
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

          <div className="bg-muted/40 rounded-2xl p-4 mt-6">
            <h2 className="text-sm font-bold text-foreground mb-2">
              {meta.emoji} 제주 {meta.label} 오름 탐방 안내
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{meta.longDesc}</p>
          </div>
        </div>
      </div>
    </>
  );
}

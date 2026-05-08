import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminGetPublishedOreumCards } from "@/lib/firestore/admin-oreums";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, Mountain } from "lucide-react";
import type { Tier } from "@/types";

const BASE_URL = "https://jejuoreum.com";

const LEVEL_META: Record<"beginner" | "explorer", {
  label: string;
  labelEn: string;
  desc: string;
  longDesc: string;
}> = {
  beginner: {
    label: "비기너",
    labelEn: "Beginner",
    desc: "초보자도 쉽게 오를 수 있는 비기너 오름 30선",
    longDesc: "비기너 오름은 탐방로가 잘 정비되어 있고 경사가 완만해 등산 초보자·가족 여행객도 부담 없이 즐길 수 있습니다. 평균 소요 시간은 왕복 30~60분으로, 제주 오름의 첫 걸음을 내딛기에 최적의 코스입니다.",
  },
  explorer: {
    label: "익스플로러",
    labelEn: "Explorer",
    desc: "깊이 있는 탐험을 원하는 이를 위한 익스플로러 오름 70선",
    longDesc: "익스플로러 오름은 다양한 생태·지질·경관을 담은 심화 탐방 코스입니다. 일부 오름은 경사가 가파르거나 비포장 탐방로를 포함하며, 왕복 1~3시간이 소요됩니다. 제주 오름의 진수를 경험하고 싶은 탐험가에게 추천합니다.",
  },
};

const VALID_LEVELS = Object.keys(LEVEL_META) as Array<"beginner" | "explorer">;

interface Props {
  params: Promise<{ locale: string; level: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, level } = await params;
  if (!VALID_LEVELS.includes(level as "beginner" | "explorer")) return {};
  const meta = LEVEL_META[level as "beginner" | "explorer"];
  const title = `제주 ${meta.label} 오름 — ${meta.desc} | 제주 오름 패스포트`;
  const desc = meta.longDesc;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    alternates: {
      canonical: `${BASE_URL}/${locale}/oreum/level/${level}`,
      languages: {
        ko: `${BASE_URL}/ko/oreum/level/${level}`,
        en: `${BASE_URL}/en/oreum/level/${level}`,
        ja: `${BASE_URL}/ja/oreum/level/${level}`,
        zh: `${BASE_URL}/zh/oreum/level/${level}`,
        "x-default": `${BASE_URL}/ko/oreum/level/${level}`,
      },
    },
  };
}

export const dynamic = "force-dynamic";

export default async function LevelPage({ params }: Props) {
  const { locale, level } = await params;
  if (!VALID_LEVELS.includes(level as "beginner" | "explorer")) notFound();

  const typedLevel = level as "beginner" | "explorer";
  const meta = LEVEL_META[typedLevel];
  const oreums = await adminGetPublishedOreumCards({ tier: typedLevel as Tier }).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `제주 ${meta.label} 오름 목록`,
    description: meta.desc,
    url: `${BASE_URL}/${locale}/oreum/level/${level}`,
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
      { "@type": "ListItem", position: 3, name: `${meta.label} 오름`, item: `${BASE_URL}/${locale}/oreum/level/${level}` },
    ],
  };

  const DIFFICULTY_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

  return (
    <>
      <Script id="json-ld-level" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-background pb-28">
        <Header title={`${meta.label} 오름`} />

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
            <h2 className="text-sm font-bold text-foreground mb-2">제주 {meta.label} 오름 탐방 안내</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{meta.longDesc}</p>
          </div>
        </div>
      </div>
    </>
  );
}

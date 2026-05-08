import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminGetPublishedOreumCards } from "@/lib/firestore/admin-oreums";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, Mountain } from "lucide-react";
import type { TimeOfDay } from "@/types";

const BASE_URL = "https://jejuoreum.com";

type Feature = "sunrise" | "sunset" | "crater";

type FeatureFilter =
  | { type: "timeOfDay"; value: TimeOfDay }
  | { type: "crater" };

const FEATURE_META: Record<Feature, {
  label: string;
  emoji: string;
  filter: FeatureFilter;
  desc: string;
  longDesc: string;
}> = {
  sunrise: {
    label: "일출 명소",
    emoji: "🌅",
    filter: { type: "timeOfDay", value: "dawn" },
    desc: "새벽빛과 함께하는 제주 일출 오름",
    longDesc: "제주의 일출은 세계적으로 유명합니다. 새벽 4~6시에 오름에 오르면 한라산과 바다를 배경으로 떠오르는 붉은 태양을 감상할 수 있습니다. 특히 동부의 오름들은 성산일출봉과 함께 제주 일출의 정수를 보여줍니다.",
  },
  sunset: {
    label: "일몰 명소",
    emoji: "🌇",
    filter: { type: "timeOfDay", value: "evening" },
    desc: "노을빛으로 물드는 제주 일몰 오름",
    longDesc: "제주 서부의 오름들은 아름다운 일몰 명소로 유명합니다. 오후 5~7시에 오름에 오르면 수평선 너머로 사라지는 태양과 황금빛 노을을 만날 수 있습니다. 일몰 후에도 붉게 물든 하늘이 한동안 아름다운 광경을 연출합니다.",
  },
  crater: {
    label: "분화구 오름",
    emoji: "🌋",
    filter: { type: "crater" },
    desc: "원형 분화구가 살아있는 제주 오름",
    longDesc: "제주 오름 중 원형 분화구(화구호·습지·초원)를 온전히 간직한 오름들입니다. 분화구를 품은 오름은 마치 다른 행성에 온 듯한 신비로운 풍경을 선사하며, 제주 화산 지형의 역동성을 가장 직접적으로 느낄 수 있는 곳입니다. 정상에서 내려다보는 분화구의 모습은 잊을 수 없는 경험이 됩니다.",
  },
};

const VALID_FEATURES = Object.keys(FEATURE_META) as Feature[];

interface Props {
  params: Promise<{ locale: string; feature: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, feature } = await params;
  if (!VALID_FEATURES.includes(feature as Feature)) return {};
  const meta = FEATURE_META[feature as Feature];
  const title = `제주 ${meta.label} 오름 — ${meta.desc} | 제주 오름 패스포트`;
  const desc = meta.longDesc;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    alternates: {
      canonical: `${BASE_URL}/${locale}/oreum/feature/${feature}`,
      languages: {
        ko: `${BASE_URL}/ko/oreum/feature/${feature}`,
        en: `${BASE_URL}/en/oreum/feature/${feature}`,
        ja: `${BASE_URL}/ja/oreum/feature/${feature}`,
        zh: `${BASE_URL}/zh/oreum/feature/${feature}`,
        "x-default": `${BASE_URL}/ko/oreum/feature/${feature}`,
      },
    },
  };
}

export const dynamic = "force-dynamic";

export default async function FeaturePage({ params }: Props) {
  const { locale, feature } = await params;
  if (!VALID_FEATURES.includes(feature as Feature)) notFound();

  const typedFeature = feature as Feature;
  const meta = FEATURE_META[typedFeature];
  const filterOpts = meta.filter.type === "timeOfDay"
    ? { timeOfDay: meta.filter.value }
    : { crater: true };
  const oreums = await adminGetPublishedOreumCards(filterOpts).catch(() => []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `제주 ${meta.label} 오름`,
    description: meta.desc,
    url: `${BASE_URL}/${locale}/oreum/feature/${feature}`,
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
      { "@type": "ListItem", position: 3, name: meta.label, item: `${BASE_URL}/${locale}/oreum/feature/${feature}` },
    ],
  };

  const DIFFICULTY_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];

  return (
    <>
      <Script id="json-ld-feature" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="json-ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-background pb-28">
        <Header title={`${meta.emoji} ${meta.label}`} />

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
                {meta.emoji} {meta.label} 데이터를 준비 중이에요
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
            <h2 className="text-sm font-bold text-foreground mb-2">
              {meta.emoji} 제주 {meta.label} 탐방 안내
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{meta.longDesc}</p>
          </div>
        </div>
      </div>
    </>
  );
}

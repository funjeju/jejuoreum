import { notFound } from "next/navigation";
import Script from "next/script";
import { getOreumBySlug } from "@/lib/firestore/oreums";
import { adminGetRatingSummary } from "@/lib/firestore/admin-comments";
import OreumCardClient from "./OreumCardClient";
import type { Metadata } from "next";
import type { Oreum } from "@/types";

const BASE_URL = "https://jejuoreum.com";

const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const oreum = await getOreumBySlug(slug);
  if (!oreum) return {};

  const regionLabel = REGION_LABEL[oreum.region] ?? oreum.region;
  const elevStr = oreum.elevationM ? `, 표고 ${oreum.elevationM}m` : "";
  const title = `${oreum.nameKo} - 제주 ${regionLabel} 오름${elevStr} | 제주 오름 100선 | 제주 오름 패스포트`;
  const desc = oreum.oneLinerKo
    ? `${oreum.oneLinerKo} — ${oreum.nameKo} 탐방 정보, 가는 길, 난이도, 베스트 시즌을 안내합니다.`
    : `제주 ${regionLabel}의 ${oreum.nameKo}. 오름 정보, 탐방 코스, 주차장 안내를 확인하세요.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      locale: locale === "ko" ? "ko_KR" : locale,
      images: oreum.thumbnailUrl
        ? [{ url: oreum.thumbnailUrl, width: 1200, height: 630, alt: oreum.nameKo }]
        : [],
    },
    twitter: { card: "summary_large_image", title, description: desc },
    alternates: {
      canonical: `/${locale}/oreum/${slug}`,
    },
  };
}

function buildJsonLd(
  oreum: Oreum,
  locale: string,
  rating: { average: number; count: number } | null,
) {
  const regionLabel = REGION_LABEL[oreum.region] ?? oreum.region;
  const oreumUrl = `${BASE_URL}/${locale}/oreum/${oreum.slug}`;

  const touristAttraction = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: oreum.nameKo,
    ...(oreum.nameEn && { alternateName: oreum.nameEn }),
    ...(oreum.oneLinerKo && { description: oreum.oneLinerKo }),
    url: oreumUrl,
    ...(oreum.thumbnailUrl && { image: oreum.thumbnailUrl }),
    ...(oreum.location?.lat && oreum.location?.lng && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: oreum.location.lat,
        longitude: oreum.location.lng,
      },
    }),
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressRegion: "제주특별자치도",
      ...(oreum.district && { addressLocality: oreum.district }),
    },
    isAccessibleForFree: true,
    publicAccess: !oreum.hasAccessRestriction,
    tourBookingPage: oreumUrl,
    ...(rating && rating.count >= 3 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.average,
        ratingCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "제주 오름", item: `${BASE_URL}/oreum` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${regionLabel} 오름`,
        item: `${BASE_URL}/oreum/region/${oreum.region}`,
      },
      { "@type": "ListItem", position: 4, name: oreum.nameKo },
    ],
  };

  return [touristAttraction, breadcrumb];
}

export const dynamic = "force-dynamic";

export default async function OreumPage({ params }: Props) {
  const { slug, locale } = await params;
  const [oreum, rating] = await Promise.all([
    getOreumBySlug(slug),
    adminGetRatingSummary(slug).catch(() => null),
  ]);
  if (!oreum) notFound();

  const jsonLdData = buildJsonLd(oreum, locale, rating);

  return (
    <>
      {jsonLdData.map((schema, i) => (
        <Script
          key={i}
          id={`json-ld-oreum-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <OreumCardClient oreum={oreum} />
    </>
  );
}

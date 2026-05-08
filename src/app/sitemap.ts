import type { MetadataRoute } from "next";
import { MBTI_RESULTS, type MbtiType } from "@/lib/quiz/mbtiData";
import { adminGetAllPublishedSlugs } from "@/lib/firestore/admin-oreums";
import type { Region } from "@/types";

const BASE_URL = "https://jejuoreum.com";
const LOCALES = ["ko", "en", "ja", "zh"] as const;
const REGIONS: Region[] = ["east", "west", "south", "north", "central"];
const LEVELS = ["beginner", "explorer"] as const;
const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
const FEATURES = ["sunrise", "sunset"] as const;

function localePrefix(locale: (typeof LOCALES)[number]) {
  return `/${locale}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => {
    const p = localePrefix(locale);
    return [
      {
        url: `${BASE_URL}${p}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: locale === "ko" ? 1.0 : 0.9,
      },
      {
        url: `${BASE_URL}${p}/quiz`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
    ];
  });

  // MBTI 결과 페이지 16종
  const quizResultPages: MetadataRoute.Sitemap = (
    Object.keys(MBTI_RESULTS) as MbtiType[]
  ).flatMap((mbti) =>
    LOCALES.map((locale) => {
      const p = localePrefix(locale);
      return {
        url: `${BASE_URL}${p}/quiz/result/${mbti.toLowerCase()}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    })
  );

  // 오름 허브 페이지 (지역별 모음)
  const oreumHubPages: MetadataRoute.Sitemap = LOCALES.map((locale) => {
    const p = localePrefix(locale);
    return {
      url: `${BASE_URL}${p}/oreum`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    };
  });

  // 지역 카테고리 페이지
  const regionPages: MetadataRoute.Sitemap = REGIONS.flatMap((region) =>
    LOCALES.map((locale) => {
      const p = localePrefix(locale);
      return {
        url: `${BASE_URL}${p}/oreum/region/${region}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  // 난이도 카테고리 페이지
  const levelPages: MetadataRoute.Sitemap = LEVELS.flatMap((level) =>
    LOCALES.map((locale) => {
      const p = localePrefix(locale);
      return {
        url: `${BASE_URL}${p}/oreum/level/${level}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  // 시즌 카테고리 페이지
  const seasonPages: MetadataRoute.Sitemap = SEASONS.flatMap((season) =>
    LOCALES.map((locale) => {
      const p = localePrefix(locale);
      return {
        url: `${BASE_URL}${p}/oreum/season/${season}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  // 특집 카테고리 페이지
  const featurePages: MetadataRoute.Sitemap = FEATURES.flatMap((feature) =>
    LOCALES.map((locale) => {
      const p = localePrefix(locale);
      return {
        url: `${BASE_URL}${p}/oreum/feature/${feature}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
  );

  // 오름 개별 페이지
  let oreumPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await adminGetAllPublishedSlugs();
    oreumPages = slugs.flatMap(({ slug, updatedAt }) =>
      LOCALES.map((locale) => {
        const p = localePrefix(locale);
        return {
          url: `${BASE_URL}${p}/oreum/${slug}`,
          lastModified: updatedAt ? new Date(updatedAt) : now,
          changeFrequency: "weekly" as const,
          priority: locale === "ko" ? 0.85 : 0.75,
        };
      })
    );
  } catch {
    // Firestore 연결 실패 시 오름 페이지 제외
  }

  return [
    ...staticPages,
    ...quizResultPages,
    ...oreumHubPages,
    ...regionPages,
    ...levelPages,
    ...seasonPages,
    ...featurePages,
    ...oreumPages,
  ];
}

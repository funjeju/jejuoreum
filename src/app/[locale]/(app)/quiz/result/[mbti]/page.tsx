import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MBTI_RESULTS, type MbtiType } from "@/lib/quiz/mbtiData";
import QuizResultClient from "./QuizResultClient";

const MBTI_TYPES = Object.keys(MBTI_RESULTS) as MbtiType[];

export async function generateStaticParams() {
  return MBTI_TYPES.map((mbti) => ({ mbti: mbti.toLowerCase() }));
}

export const revalidate = 604800; // 1주마다 재생성

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mbti: string; locale: string }>;
}): Promise<Metadata> {
  const { mbti: mbtiParam, locale } = await params;
  const mbtiKey = mbtiParam.toUpperCase() as MbtiType;
  const result = MBTI_RESULTS[mbtiKey];
  if (!result) return {};

  const title = `${result.type} - ${result.title} | 오름 MBTI | 제주 오름 패스포트`;
  const description = `${result.type}와 닮은 제주 오름은 ${result.oreumName}이에요. ${result.desc}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "ko" ? "ko_KR" : locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function QuizResultPage({
  params,
}: {
  params: Promise<{ mbti: string; locale: string }>;
}) {
  const { mbti: mbtiParam, locale } = await params;
  const mbtiKey = mbtiParam.toUpperCase() as MbtiType;
  const result = MBTI_RESULTS[mbtiKey];

  if (!result) notFound();

  return <QuizResultClient result={result} locale={locale} />;
}

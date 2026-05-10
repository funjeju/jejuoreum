"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Award, ChevronRight, Mountain, Sparkles, Radio, Users } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserProfile, getUserDiscoveries, getWishlist } from "@/lib/firestore/users";
import { getOreumCards } from "@/lib/firestore/oreums";
import { getUserChallenges } from "@/lib/firestore/challenges";
import { getPublicFeed } from "@/lib/firestore/feed";
import { Header } from "@/components/layout/Header";
import { RecommendationHeroCard } from "@/components/home/RecommendationHeroCard";
import { FriendRecommendations } from "@/components/feed/FriendRecommendations";
import { ProgressOverviewCard } from "@/components/home/ProgressOverviewCard";
import { QuickVerifyCard } from "@/components/home/QuickVerifyCard";
import { CollectionStatsCard } from "@/components/collection/CollectionStatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo, getSeason, getTimeKey } from "@/lib/utils";
import type { UserProfile, UserDiscovery, OreumCard, FeedEvent, WishlistItem, UserChallenge } from "@/types";

const GREETINGS: Record<string, string> = {
  "spring-dawn": "봄의 새벽, 오름 안개가 신비로워요",
  "spring-morning": "봄의 아침, 꽃길 탐방 어떠세요?",
  "spring-noon": "봄의 점심, 나들이 가기 좋은 날이에요",
  "spring-afternoon": "봄의 오후, 진달래가 활짝 피었어요",
  "spring-evening": "봄의 저녁, 노을빛 오름이 기다려요",
  "spring-night": "봄의 밤, 별빛이 맑아요",
  "summer-dawn": "여름의 새벽, 가장 시원한 탐방 시간이에요",
  "summer-morning": "여름의 아침, 이른 탐방이 최고예요",
  "summer-noon": "여름의 점심, 그늘 코스를 추천해요",
  "summer-afternoon": "여름의 오후, 바람이 시원한 곳으로",
  "summer-evening": "여름의 저녁, 제주 일몰이 아름다워요",
  "summer-night": "여름의 밤, 별빛 오름 탐방 어때요?",
  "autumn-dawn": "가을의 새벽, 안개와 단풍이 어우러져요",
  "autumn-morning": "가을의 아침, 단풍이 물들어가요",
  "autumn-noon": "가을의 점심, 단풍 명소로 떠나볼까요",
  "autumn-afternoon": "가을의 오후, 단풍이 절정이에요",
  "autumn-evening": "가을의 저녁, 노을빛 단풍이 특별해요",
  "autumn-night": "가을의 밤, 서늘한 바람과 별빛",
  "winter-dawn": "겨울의 새벽, 일출 명소로 떠나요",
  "winter-morning": "겨울의 아침, 설경이 펼쳐질지 몰라요",
  "winter-noon": "겨울의 점심, 맑은 하늘 아래 오름으로",
  "winter-afternoon": "겨울의 오후, 바람이 매서워도 멋있어요",
  "winter-evening": "겨울의 저녁, 따뜻하게 입고 오세요",
  "winter-night": "겨울의 밤, 별이 선명하게 빛나요",
};

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [discoveries, setDiscoveries] = useState<UserDiscovery[]>([]);
  const [featured, setFeatured]     = useState<OreumCard[]>([]);
  const [feedEvents, setFeedEvents]  = useState<FeedEvent[]>([]);
  const [wishlist, setWishlist]      = useState<WishlistItem[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<UserChallenge | null>(null);
  const [loading, setLoading]        = useState(true);
  const [popularOreums, setPopularOreums] = useState<Array<{
    slug: string; nameKo: string; thumbnailUrl: string | null; weeklyVisitors: number;
  }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [cards, feedResult] = await Promise.all([
          getOreumCards({ top100Only: true, limitCount: 10 }).catch((): OreumCard[] => []),
          getPublicFeed({ limitCount: 5 }).catch(() => ({ events: [] as FeedEvent[], cursor: null })),
        ]);
        setFeatured(cards);
        setFeedEvents(feedResult.events);

        fetch("/api/oreums/popular")
          .then((r) => r.json())
          .then(setPopularOreums)
          .catch(() => {});

        if (user) {
          const [p, d, w, ch] = await Promise.all([
            getUserProfile(user.uid).catch((): UserProfile | null => null),
            getUserDiscoveries(user.uid).catch((): UserDiscovery[] => []),
            getWishlist(user.uid).catch((): WishlistItem[] => []),
            getUserChallenges(user.uid).catch((): UserChallenge[] => []),
          ]);
          setProfile(p);
          setDiscoveries(d);
          setWishlist(w);
          setActiveChallenge(ch.find((c) => !c.isCompleted) ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const discSet = new Set(discoveries.map((d) => d.oreumSlug));
  const total = discoveries.length;
  const begDiscovered = discoveries.filter((d) => d.oreumTier === "beginner").length;
  const expDiscovered = discoveries.filter((d) => d.oreumTier === "explorer").length;
  const begTotal = featured.filter((o) => o.tier === "beginner").length || 30;
  const expTotal = featured.filter((o) => o.tier === "explorer").length || 70;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthDisc = discoveries.filter((d) => new Date(d.discoveredAt) >= firstOfMonth).length;
  const thisWeekDisc  = discoveries.filter((d) => new Date(d.discoveredAt) >= sevenDaysAgo).length;
  const uniqueRegions = new Set(discoveries.map((d) => d.oreumRegion)).size;
  const recentDiscoveries = [...discoveries]
    .sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime())
    .slice(0, 8);

  const greeting = GREETINGS[`${getSeason()}-${getTimeKey()}`] ?? "오늘도 좋은 탐험을";
  const displayName = profile?.nickname ?? user?.displayName?.split(" ")[0] ?? "탐험가";
  const recommendation = featured[0] ?? null;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header />

      {/* ── 다크 그린 헤더 영역 ─────────────────────────── */}
      <div className="bg-header px-5 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          {user && !authLoading ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/60 mb-1">{greeting}</p>
                <p className="text-xl font-bold text-white">{displayName}님의 오름 여정</p>
              </div>
              <Avatar className="w-10 h-10 ring-2 ring-white/20 shrink-0">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : !authLoading ? (
            <div>
              <div className="inline-flex items-center border border-white/20 text-white/60 text-[10px] tracking-widest uppercase mb-4 px-2.5 py-0.5 rounded-full">
                Jeju Oreum Passport
              </div>
              <h1 className="text-[26px] font-bold text-white leading-tight mb-2">
                제주 오름 100선<br />수집 여정
              </h1>
              <p className="text-white/60 text-sm mb-5 leading-relaxed">
                직접 오르고, 기록하고, 완성해가는<br />나만의 오름 도감
              </p>
              <div className="flex gap-2.5">
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex-1 h-11 rounded-xl bg-white text-primary font-semibold text-sm flex items-center justify-center hover:bg-white/90 transition-colors"
                >
                  시작하기
                </Link>
                <Link
                  href={`/${locale}/collection`}
                  className="flex-1 h-11 rounded-xl bg-white/10 text-white border border-white/20 font-semibold text-sm flex items-center justify-center hover:bg-white/15 transition-colors"
                >
                  도감 보기
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── 본문 (-mt-4 트릭으로 자연스럽게 겹침) ────────── */}
      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">

        {/* 진척도 카드 (로그인 시) */}
        {user && !loading && (
          <ProgressOverviewCard
            total={{ discovered: total, total: 100 }}
            beginner={{ discovered: begDiscovered, total: begTotal }}
            explorer={{ discovered: expDiscovered, total: expTotal }}
          />
        )}

        {/* 이번 달 리듬 카드 */}
        {user && !loading && total > 0 && (
          <div className="bg-secondary/60 rounded-2xl p-4 border border-secondary">
            <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">
              <Sparkles size={12} /> 이번 달 리듬
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{thisMonthDisc}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">이번 달<br />발견</p>
              </div>
              <div className="border-x border-border">
                <p className="text-2xl font-bold">{thisWeekDisc}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">이번 주<br />발견</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueRegions}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">다녀온<br />지역</p>
              </div>
            </div>
          </div>
        )}

        {/* 이번 주 인기 오름 */}
        {popularOreums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold">이번 주 인기 오름</h2>
                <p className="text-xs text-muted-foreground">지난 7일 탐방자 기준</p>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none]">
              {popularOreums.map((oreum) => (
                <Link
                  key={oreum.slug}
                  href={`/${locale}/oreum/${oreum.slug}`}
                  className="flex-shrink-0 w-32 group"
                >
                  <div className="relative w-32 h-40 rounded-xl overflow-hidden bg-muted">
                    {oreum.thumbnailUrl ? (
                      <Image
                        src={oreum.thumbnailUrl}
                        alt={oreum.nameKo}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="128px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                        <Mountain size={28} className="text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-[11px] font-semibold leading-tight truncate">{oreum.nameKo}</p>
                      <p className="text-white/60 text-[10px] mt-0.5">🥾 {oreum.weeklyVisitors}명</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 활동 피드 프리뷰 ────────────────────────── */}
        {feedEvents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">탐험가 활동</h2>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-full">
                  <Radio size={8} className="animate-pulse" /> LIVE
                </span>
              </div>
              <Link href={`/${locale}/feed`} className="text-xs text-primary font-semibold flex items-center gap-0.5">
                전체 보기 <ChevronRight size={12} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {feedEvents.slice(0, 5).map((event, i) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    i < feedEvents.slice(0, 5).length - 1 && "border-b border-border/60"
                  )}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={event.userAvatarUrl ?? undefined} />
                    <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
                      {event.userNickname[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{event.userNickname}</span>
                      {event.eventType === "discovery" && event.oreumNameKo && (
                        <span className="text-muted-foreground">
                          {" "}님이{" "}
                          <Link href={`/${locale}/oreum/${event.oreumSlug}`} className="text-foreground font-medium hover:text-primary">
                            {event.oreumNameKo}
                          </Link>
                          {" "}발견
                        </span>
                      )}
                      {event.eventType === "badge_earned" && event.badgeNameKo && (
                        <span className="text-muted-foreground"> 님이 <span className="text-amber-600 font-medium">{event.badgeNameKo}</span> 배지 획득</span>
                      )}
                      {event.eventType === "wishlist_completed" && (
                        <span className="text-muted-foreground"> 님이 챌린지 완료</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">{timeAgo(event.occurredAt)}</p>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                    event.eventType === "discovery" ? "bg-primary/10" : "bg-amber-100"
                  )}>
                    {event.eventType === "discovery"
                      ? <CheckCircle2 size={12} className="text-primary" strokeWidth={2} />
                      : <Award size={12} className="text-amber-500" strokeWidth={2} />
                    }
                  </div>
                </div>
              ))}
              <Link
                href={`/${locale}/feed`}
                className="flex items-center justify-center gap-1.5 py-3 text-xs text-primary font-semibold border-t border-border/60 hover:bg-muted/30 transition-colors"
              >
                <Users size={12} /> 더 많은 탐험가 활동 보기
              </Link>
            </div>
          </section>
        )}

        {/* 친구 추천 동선 */}
        <FriendRecommendations />

        {/* 오늘의 추천 오름 히어로 카드 */}
        {!loading && recommendation && (
          <RecommendationHeroCard
            oreum={recommendation}
            isDiscovered={discSet.has(recommendation.slug)}
            locale={locale}
          />
        )}
        {loading && <Skeleton className="h-[200px] rounded-2xl" />}

        {/* 구분자 */}
        <div className="flex items-center gap-3 !mt-6 !mb-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground/60 font-medium tracking-wide">지금 여기에 있다면</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* 빠른 인증 카드 */}
        <QuickVerifyCard />

        {/* 최근 발견한 오름 가로 스크롤 */}
        {user && !loading && recentDiscoveries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">최근 발견한 오름</h2>
              <Link href={`/${locale}/collection`} className="text-xs text-primary font-semibold flex items-center gap-0.5">
                더보기 <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none]">
              {recentDiscoveries.map((disc) => {
                const isNew = new Date(disc.discoveredAt) >= sevenDaysAgo;
                return (
                  <Link key={disc.id} href={`/${locale}/oreum/${disc.oreumSlug}`} className="flex-shrink-0 w-[130px]">
                    <div
                      className="relative rounded-xl overflow-hidden border border-border bg-muted"
                      style={{ height: "170px" }}
                    >
                      {disc.oreumThumbnailUrl ? (
                        <Image
                          src={disc.oreumThumbnailUrl}
                          alt={disc.oreumNameKo}
                          fill
                          className="object-cover"
                          sizes="130px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                          <Mountain size={28} className="text-white/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      {isNew && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          NEW
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-[11px] font-semibold truncate">{disc.oreumNameKo}</p>
                        <p className="text-white/50 text-[9px]">
                          {new Date(disc.discoveredAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 오름 100선 가로 스크롤 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">{t("section_featured")}</h2>
              <p className="text-xs text-muted-foreground">{t("section_featured_sub")}</p>
            </div>
            <Link href={`/${locale}/collection`} className="text-xs text-primary font-semibold flex items-center gap-0.5">
              {t("see_all")} <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-28 h-36 rounded-xl flex-shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none]">
              {featured.map((oreum) => {
                const discovered = discSet.has(oreum.slug);
                return (
                  <Link
                    key={oreum.slug}
                    href={`/${locale}/oreum/${oreum.slug}`}
                    className="flex-shrink-0 w-28 group"
                  >
                    <div className={cn(
                      "relative w-28 h-36 rounded-xl overflow-hidden bg-muted",
                      !discovered && "grayscale"
                    )}>
                      {oreum.thumbnailUrl ? (
                        <Image
                          src={oreum.thumbnailUrl}
                          alt={oreum.nameKo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="112px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white/40">{oreum.nameKo[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {discovered && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={11} color="white" strokeWidth={2.5} />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white text-[11px] font-semibold leading-tight truncate">{oreum.nameKo}</p>
                        {oreum.tierOrder && (
                          <p className="text-white/50 text-[9px]">#{oreum.tierOrder}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* MBTI 미진단 배너 */}
        {user && !loading && !profile?.oreumMbti && (
          <Link
            href={`/${locale}/quiz`}
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 hover:opacity-95 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">?</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">{t("mbti_banner_title")}</p>
              <p className="text-white/75 text-xs mt-0.5">{t("mbti_banner_sub")}</p>
            </div>
            <ChevronRight size={16} className="text-white/60 shrink-0" />
          </Link>
        )}

        {/* 이주의 미션 */}
        {user && !loading && activeChallenge && (
          <Link href={`/${locale}/challenges`} className="block">
            <div className="relative rounded-2xl overflow-hidden h-[160px] bg-gradient-to-br from-primary to-primary/70">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-white/80 tracking-widest uppercase">이주의 미션</span>
                <div>
                  <p className="text-white font-bold text-lg leading-snug">{activeChallenge.challengeNameKo}</p>
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/70 text-xs">
                        {activeChallenge.progress} / {activeChallenge.goal} 완료
                      </p>
                      <p className="text-white/70 text-xs">
                        {Math.round((activeChallenge.progress / activeChallenge.goal) * 100)}%
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (activeChallenge.progress / activeChallenge.goal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* 위시리스트 Top 3 (로그인 시) */}
        {user && !loading && wishlist.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">위시리스트</h2>
              <Link href={`/${locale}/wishlist`} className="text-xs text-primary font-semibold flex items-center gap-0.5">
                전체 보기 <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {wishlist.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/${locale}/oreum/${item.oreumSlug}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {item.oreumNameKo[0]}
                  </div>
                  <p className="text-sm font-medium flex-1 truncate">{item.oreumNameKo}</p>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

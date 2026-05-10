"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Mountain, Award, Target, Users, Loader2 } from "lucide-react";
import { getPublicFeed, type FeedCursor } from "@/lib/firestore/feed";
import { useAuth } from "@/lib/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { cn, timeAgo } from "@/lib/utils";
import type { FeedEvent, Region } from "@/types";

type FeedMode = "all" | "friends";
type Filter = "all" | "discovery" | "badge_earned" | "challenge_completed";
type RegionFilter = "all" | Region;

const PAGE_SIZE = 20;

const EVENT_FILTERS: { key: Filter; label: string }[] = [
  { key: "all",                label: "전체" },
  { key: "discovery",          label: "발견" },
  { key: "badge_earned",       label: "배지" },
  { key: "challenge_completed", label: "챌린지" },
];

const REGION_FILTERS: { key: RegionFilter; label: string }[] = [
  { key: "all",     label: "전 지역" },
  { key: "east",    label: "동부" },
  { key: "west",    label: "서부" },
  { key: "south",   label: "남부" },
  { key: "north",   label: "북부" },
  { key: "central", label: "중산간" },
];

export default function FeedClient() {
  const locale   = useLocale();
  const { user } = useAuth();

  const [events, setEvents]           = useState<FeedEvent[]>([]);
  const [feedMode, setFeedMode]       = useState<FeedMode>("all");
  const [filter, setFilter]           = useState<Filter>("all");
  const [region, setRegion]           = useState<RegionFilter>("all");
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [followingUids, setFollowingUids] = useState<string[]>([]);
  const cursorRef = useRef<FeedCursor>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // 팔로잉 목록
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/following", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setFollowingUids(data.following ?? []))
        .catch(() => {})
    );
  }, [user]);

  const loadFirst = useCallback(async () => {
    setLoading(true);
    cursorRef.current = null;
    try {
      const opts = feedMode === "friends"
        ? { limitCount: PAGE_SIZE, followingUids }
        : { limitCount: PAGE_SIZE, region: region === "all" ? undefined : region };
      const res = await getPublicFeed(opts);
      setEvents(res.events);
      cursorRef.current = res.cursor;
      setHasMore(res.events.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [feedMode, region, followingUids]);

  // 필터/모드 변경 시 첫 페이지 로드
  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // 30초 폴링 (첫 페이지만 갱신)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadFirst, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadFirst]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const opts = feedMode === "friends"
        ? { limitCount: PAGE_SIZE, followingUids, cursor: cursorRef.current }
        : { limitCount: PAGE_SIZE, region: region === "all" ? undefined : region, cursor: cursorRef.current };
      const res = await getPublicFeed(opts);
      setEvents((prev) => [...prev, ...res.events]);
      cursorRef.current = res.cursor;
      setHasMore(res.events.length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = events.filter((e) => filter === "all" || e.eventType === filter);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="bg-header pt-4 pb-8 px-4">
        <h1 className="text-white font-bold text-lg">활동 피드</h1>
        <p className="text-white/50 text-xs mt-0.5">탐험가들의 실시간 발자국</p>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl min-h-screen">
        {/* 전체 / 친구 모드 토글 */}
        {user && (
          <div className="flex px-4 pt-4 pb-1 gap-1">
            {(["all", "friends"] as FeedMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFeedMode(mode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  feedMode === mode
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {mode === "friends" && <Users size={11} />}
                {mode === "all" ? "전체" : "친구"}
              </button>
            ))}
          </div>
        )}

        {/* 이벤트 타입 필터 */}
        <div className={cn("flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none", user ? "pt-1" : "pt-4")}>
          {EVENT_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filter === key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 지역 필터 (친구 모드에서는 숨김) */}
        <div className={cn("flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none", feedMode === "friends" && "hidden")}>
          {REGION_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRegion(key)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border",
                region === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 피드 목록 */}
        <div className="px-4 space-y-2.5 pb-6">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Mountain size={36} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">아직 활동이 없어요</p>
            </div>
          ) : (
            <>
              {filtered.map((event) => (
                <FeedCard key={event.id} event={event} locale={locale} />
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-xl border text-sm text-muted-foreground hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {loadingMore
                    ? <Loader2 size={14} className="animate-spin" />
                    : "더 보기"
                  }
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function FeedCard({ event, locale }: { event: FeedEvent; locale: string }) {
  const isDiscovery  = event.eventType === "discovery";
  const isBadge      = event.eventType === "badge_earned";
  const isChallenge  = event.eventType === "challenge_completed";

  return (
    <div className="bg-card border rounded-2xl px-4 py-3.5 flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        isDiscovery ? "bg-primary/10" : isBadge ? "bg-amber-50" : "bg-blue-50"
      )}>
        {isDiscovery  && <Mountain size={18} className="text-primary" />}
        {isBadge      && <Award size={18} className="text-amber-500" />}
        {isChallenge  && <Target size={18} className="text-blue-500" />}
        {!isDiscovery && !isBadge && !isChallenge && <Target size={18} className="text-blue-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          <span className="font-semibold">{event.userNickname}</span>
          {isDiscovery && (
            <>
              {" "}님이{" "}
              {event.oreumSlug ? (
                <Link href={`/${locale}/oreum/${event.oreumSlug}`} className="text-primary font-semibold">
                  {event.oreumNameKo}
                </Link>
              ) : event.oreumNameKo}
              {" "}을 발견했어요
            </>
          )}
          {isBadge && (
            <> 님이 <span className="text-amber-600 font-semibold">&ldquo;{event.badgeNameKo}&rdquo;</span> 배지를 획득했어요</>
          )}
          {isChallenge && (
            <>
              {" "}님이{" "}
              {event.challengeNameKo
                ? <span className="text-blue-600 font-semibold">&ldquo;{event.challengeNameKo}&rdquo;</span>
                : "챌린지"
              }
              {" "}를 완료했어요
            </>
          )}
          {!isDiscovery && !isBadge && !isChallenge && (
            <> 님이 챌린지를 완료했어요</>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(event.occurredAt)}</p>
      </div>

      {event.userAvatarUrl ? (
        <Image
          src={event.userAvatarUrl}
          alt={event.userNickname}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            {event.userNickname[0]}
          </span>
        </div>
      )}
    </div>
  );
}

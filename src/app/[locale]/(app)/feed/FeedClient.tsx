"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Mountain, Award, Target, MapPin } from "lucide-react";
import { getPublicFeed } from "@/lib/firestore/feed";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import type { FeedEvent } from "@/types";

type Filter = "all" | "discovery" | "badge_earned" | "wishlist_completed";
type RegionFilter = "all" | "east" | "west" | "south" | "north" | "central";

const REGION_LABEL: Record<string, string> = {
  all: "전체", east: "동부", west: "서부", south: "남부", north: "북부", central: "중부",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function FeedClient({ initialEvents }: { initialEvents: FeedEvent[] }) {
  const locale = useLocale();
  const [events, setEvents]     = useState<FeedEvent[]>(initialEvents);
  const [filter, setFilter]     = useState<Filter>("all");
  const [loading, setLoading]   = useState(false);

  // 30초마다 폴링 (doc 07 명세)
  useEffect(() => {
    const poll = async () => {
      const fresh = await getPublicFeed({ limitCount: 30 });
      setEvents(fresh);
    };
    const id = setInterval(poll, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = events.filter((e) => filter === "all" || e.eventType === filter);

  const loadMore = async () => {
    setLoading(true);
    try {
      const more = await getPublicFeed({ limitCount: 30 });
      setEvents(more);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* 헤더 영역 */}
      <div className="bg-header pt-4 pb-8 px-4">
        <h1 className="text-white font-bold text-lg">활동 피드</h1>
        <p className="text-white/50 text-xs mt-0.5">탐험가들의 실시간 발자국</p>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl min-h-screen">
        {/* 필터 칩 */}
        <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-none">
          {(["all", "discovery", "badge_earned", "wishlist_completed"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filter === f
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === "all" && "전체"}
              {f === "discovery" && "발견"}
              {f === "badge_earned" && "배지"}
              {f === "wishlist_completed" && "챌린지"}
            </button>
          ))}
        </div>

        {/* 피드 목록 */}
        <div className="px-4 space-y-2.5 pb-6">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Mountain size={36} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">아직 활동이 없어요</p>
            </div>
          ) : filtered.map((event) => (
            <FeedCard key={event.id} event={event} locale={locale} />
          ))}
        </div>

        {events.length >= 30 && (
          <div className="px-4 pb-4">
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-3 rounded-xl border text-sm text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              {loading ? "불러오는 중..." : "더 보기"}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function FeedCard({ event, locale }: { event: FeedEvent; locale: string }) {
  const isDiscovery = event.eventType === "discovery";
  const isBadge     = event.eventType === "badge_earned";

  return (
    <div className="bg-card border rounded-2xl px-4 py-3.5 flex items-center gap-3">
      {/* 아이콘 */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        isDiscovery ? "bg-primary/10" : isBadge ? "bg-amber-50" : "bg-blue-50"
      )}>
        {isDiscovery && <Mountain size={18} className="text-primary" />}
        {isBadge     && <Award size={18} className="text-amber-500" />}
        {!isDiscovery && !isBadge && <Target size={18} className="text-blue-500" />}
      </div>

      {/* 텍스트 */}
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
            <> 님이 <span className="text-amber-600 font-semibold">"{event.badgeNameKo}"</span> 배지를 획득했어요</>
          )}
          {!isDiscovery && !isBadge && (
            <> 님이 챌린지를 완료했어요</>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(event.occurredAt)}</p>
      </div>

      {/* 아바타 */}
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

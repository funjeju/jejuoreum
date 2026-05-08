"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Users, ChevronRight, Mountain } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

interface Recommendation {
  slug: string;
  nameKo: string;
  thumbnailUrl: string | null;
  friendNickname: string;
  friendAvatarUrl: string | null;
  count: number;
}

export function FriendRecommendations() {
  const { user } = useAuth();
  const locale = useLocale();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/friend-recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => { setRecs(d.recommendations ?? []); setLoaded(true); })
        .catch(() => setLoaded(true))
    );
  }, [user]);

  if (!user || !loaded || recs.length === 0) return null;

  return (
    <section className="px-4 mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Users size={14} className="text-muted-foreground" />
        <p className="text-sm font-semibold">친구들이 최근 간 오름</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {recs.map((rec) => (
          <Link
            key={rec.slug}
            href={`/${locale}/oreum/${rec.slug}`}
            className="shrink-0 w-32 group"
          >
            <div className="relative w-32 h-40 rounded-2xl overflow-hidden bg-muted border border-border group-hover:border-primary/40 transition-colors">
              {rec.thumbnailUrl ? (
                <Image
                  src={rec.thumbnailUrl}
                  alt={rec.nameKo}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                  <Mountain size={24} className="text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {/* 친구 아바타 뱃지 */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                {rec.friendAvatarUrl ? (
                  <Image src={rec.friendAvatarUrl} alt={rec.friendNickname} width={14} height={14} className="rounded-full" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-white/30" />
                )}
                {rec.count > 1 && (
                  <span className="text-[9px] text-white/80 font-medium">+{rec.count}</span>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-xs font-bold leading-tight truncate">{rec.nameKo}</p>
                <p className="text-white/60 text-[10px] mt-0.5 truncate">{rec.friendNickname}</p>
              </div>
            </div>
          </Link>
        ))}

        {/* 더보기 링크 */}
        <Link href={`/${locale}/feed`} className="shrink-0 w-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
              <ChevronRight size={16} />
            </div>
            <span className="text-[10px]">더보기</span>
          </div>
        </Link>
      </div>
    </section>
  );
}

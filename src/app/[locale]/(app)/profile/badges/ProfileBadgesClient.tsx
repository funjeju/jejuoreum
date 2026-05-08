"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Lock } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserBadges, BADGE_SEED } from "@/lib/firestore/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserBadge } from "@/types";

const TIER_STYLE: Record<string, string> = {
  bronze:   "border-amber-200 bg-amber-50",
  silver:   "border-gray-200 bg-gray-50",
  gold:     "border-yellow-200 bg-yellow-50",
  platinum: "border-purple-200 bg-purple-50",
};

const TIER_ICON_COLOR: Record<string, string> = {
  bronze:   "text-amber-500",
  silver:   "text-gray-400",
  gold:     "text-yellow-500",
  platinum: "text-purple-500",
};

export default function ProfileBadgesClient() {
  const { user } = useAuth();
  const locale   = useLocale();
  const router   = useRouter();

  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserBadges(user.uid)
      .then(setUserBadges)
      .finally(() => setLoading(false));
  }, [user]);

  const earnedCodes = new Set(userBadges.map((b) => b.badgeCode));
  const total     = BADGE_SEED.length;
  const earned    = userBadges.length;

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="bg-header px-4 pt-4 pb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-white font-bold">획득한 배지</h1>
            <p className="text-white/50 text-xs mt-0.5">{earned} / {total}개 획득</p>
          </div>
        </div>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl px-4 pt-6 pb-10 min-h-screen">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {BADGE_SEED.map((seed) => {
              const isEarned = earnedCodes.has(seed.code);
              const earned = userBadges.find((b) => b.badgeCode === seed.code);

              return (
                <div
                  key={seed.code}
                  className={cn(
                    "rounded-2xl border p-4 text-center transition-all",
                    isEarned ? TIER_STYLE[seed.tier] : "border-border bg-card opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 mx-auto mb-2.5 rounded-full border-2 flex items-center justify-center",
                    isEarned ? "border-current" : "border-border bg-muted"
                  )}>
                    {isEarned
                      ? <Trophy size={22} className={TIER_ICON_COLOR[seed.tier]} />
                      : <Lock size={18} className="text-muted-foreground" />
                    }
                  </div>
                  <p className={cn("text-sm font-semibold", !isEarned && "text-muted-foreground")}>
                    {seed.nameKo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{seed.descriptionKo}</p>
                  {isEarned && earned && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(earned.earnedAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] mt-1.5",
                      isEarned ? "" : "opacity-50"
                    )}
                  >
                    {seed.tier}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

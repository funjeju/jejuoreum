"use client";

import { useState, useEffect } from "react";
import { Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeasonBadge } from "@/types";

function daysLeft(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 864e5));
}

export function SeasonBadgeBanner() {
  const [badges, setBadges] = useState<SeasonBadge[]>([]);

  useEffect(() => {
    fetch("/api/season-badges")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges ?? []))
      .catch(() => {});
  }, []);

  if (badges.length === 0) return null;

  return (
    <div className="px-4 mb-3 space-y-2">
      {badges.map((b) => {
        const days = daysLeft(b.seasonEnd);
        return (
          <div
            key={b.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 border",
              "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/60"
            )}
          >
            <span className="text-2xl shrink-0">{b.iconEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 truncate">{b.nameKo}</p>
              <p className="text-xs text-amber-700/70 truncate">{b.descriptionKo}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[11px] text-amber-600 font-medium">
              <Clock size={11} />
              {days}일 남음
            </div>
            <Sparkles size={14} className="text-amber-400 shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

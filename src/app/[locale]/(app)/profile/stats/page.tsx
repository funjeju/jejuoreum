"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { BarChart2, Loader2, Mountain, Map, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserDiscoveries } from "@/lib/firestore/users";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import type { UserDiscovery, Region } from "@/types";

const REGION_LABEL: Record<Region, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};
const REGION_TOTAL: Record<Region, number> = {
  east: 20, west: 18, south: 22, north: 20, central: 20,
};

function monthKey(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}

function getLastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function hourBucket(iso: string) {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 7)   return "새벽 (5–7시)";
  if (h >= 7 && h < 12)  return "오전 (7–12시)";
  if (h >= 12 && h < 17) return "오후 (12–17시)";
  if (h >= 17 && h < 20) return "저녁 (17–20시)";
  return "야간 (20–5시)";
}

const TIME_ORDER = ["새벽 (5–7시)", "오전 (7–12시)", "오후 (12–17시)", "저녁 (17–20시)", "야간 (20–5시)"];

export default function StatsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [discoveries, setDiscoveries] = useState<UserDiscovery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    getUserDiscoveries(user.uid).then((d) => { setDiscoveries(d); setLoading(false); });
  }, [user, authLoading]);

  const months = getLastNMonths(6);

  const monthlyCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of months) map[m] = 0;
    for (const d of discoveries) {
      const k = monthKey(d.discoveredAt);
      if (k in map) map[k] = (map[k] ?? 0) + 1;
    }
    return months.map((m) => ({ month: m.slice(5), count: map[m] ?? 0 }));
  }, [discoveries, months]);

  const maxMonthly = Math.max(...monthlyCounts.map((m) => m.count), 1);

  const regionCounts = useMemo(() => {
    const map: Partial<Record<Region, number>> = {};
    for (const d of discoveries) {
      map[d.oreumRegion] = (map[d.oreumRegion] ?? 0) + 1;
    }
    return (Object.keys(REGION_LABEL) as Region[]).map((r) => ({
      region: r,
      label: REGION_LABEL[r],
      count: map[r] ?? 0,
      total: REGION_TOTAL[r],
    }));
  }, [discoveries]);

  const timeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of discoveries) {
      const b = hourBucket(d.discoveredAt);
      map[b] = (map[b] ?? 0) + 1;
    }
    const total = discoveries.length || 1;
    return TIME_ORDER.map((t) => ({ label: t, count: map[t] ?? 0, pct: ((map[t] ?? 0) / total) * 100 }));
  }, [discoveries]);

  const favTimeSlot = timeCounts.reduce((a, b) => a.count >= b.count ? a : b, timeCounts[0] ?? { label: "-", count: 0, pct: 0 });

  const tierCounts = useMemo(() => {
    const beg = discoveries.filter((d) => d.oreumTier === "beginner").length;
    const exp = discoveries.filter((d) => d.oreumTier === "explorer").length;
    const mas = discoveries.filter((d) => d.oreumTier === "master").length;
    return [
      { label: "비기너",       count: beg, total: 30,  color: "bg-emerald-500" },
      { label: "익스플로러",   count: exp, total: 70,  color: "bg-blue-500" },
      { label: "마스터",       count: mas, total: 100, color: "bg-purple-500" },
    ];
  }, [discoveries]);

  const longestStreak = useMemo(() => {
    if (discoveries.length === 0) return 0;
    const days = Array.from(new Set(
      discoveries.map((d) => new Date(d.discoveredAt).toDateString())
    )).map((s) => new Date(s).getTime()).sort((a, b) => a - b);
    let best = 1; let cur = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i] - days[i - 1] === 86400000) { cur++; best = Math.max(best, cur); } else { cur = 1; }
    }
    return best;
  }, [discoveries]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title="탐험 통계" />

      <div className="bg-header px-4 pt-3 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-white/60">
            <BarChart2 size={14} />
            <p className="text-sm">나의 오름 탐험 기록</p>
          </div>
          <p className="text-white text-2xl font-bold mt-1">{discoveries.length}개 발견</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">

          {/* 요약 카드 */}
          <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{discoveries.length}</p>
              <p className="text-[11px] text-muted-foreground">전체 발견</p>
            </div>
            <div className="border-x border-border">
              <p className="text-2xl font-bold">{longestStreak}</p>
              <p className="text-[11px] text-muted-foreground">최장 연속일</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(discoveries.map((d) => d.oreumRegion)).size}</p>
              <p className="text-[11px] text-muted-foreground">방문 지역</p>
            </div>
          </div>

          {/* 최근 6개월 월별 활동 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-primary" />
              <p className="text-sm font-semibold">월별 발견 추이</p>
            </div>
            <div className="flex items-end gap-2 h-24">
              {monthlyCounts.map(({ month, count }) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{count > 0 ? count : ""}</span>
                  <div
                    className={cn("w-full rounded-t-sm transition-all", count > 0 ? "bg-primary/80" : "bg-muted")}
                    style={{ height: `${(count / maxMonthly) * 100}%`, minHeight: count > 0 ? "4px" : "2px" }}
                  />
                  <span className="text-[9px] text-muted-foreground">{month}월</span>
                </div>
              ))}
            </div>
          </div>

          {/* 지역별 달성률 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Map size={14} className="text-primary" />
              <p className="text-sm font-semibold">지역별 달성</p>
            </div>
            <div className="space-y-2.5">
              {regionCounts.map(({ region, label, count, total }) => (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">{count} / {total}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 티어별 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mountain size={14} className="text-primary" />
              <p className="text-sm font-semibold">티어별 달성</p>
            </div>
            <div className="space-y-2.5">
              {tierCounts.map(({ label, count, total, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground">{count} / {total}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", color)}
                      style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 시간대별 선호 */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-primary" />
              <p className="text-sm font-semibold">선호 탐험 시간대</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              주로 <span className="text-foreground font-medium">{favTimeSlot.label}</span>에 오름을 탐험해요
            </p>
            <div className="space-y-2">
              {timeCounts.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

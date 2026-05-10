"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mountain, BookMarked } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getOreumCards } from "@/lib/firestore/oreums";
import { getUserDiscoveries } from "@/lib/firestore/users";
import { Header } from "@/components/layout/Header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OreumCard, UserDiscovery, Region } from "@/types";

const REGIONS: { key: "all" | Region; label: string }[] = [
  { key: "all",     label: "전체" },
  { key: "east",    label: "동부" },
  { key: "west",    label: "서부" },
  { key: "south",   label: "남부" },
  { key: "north",   label: "북부" },
  { key: "central", label: "중산간" },
];

export default function StampsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [oreums, setOreums]           = useState<OreumCard[]>([]);
  const [discoveries, setDiscoveries] = useState<UserDiscovery[]>([]);
  const [loading, setLoading]         = useState(true);
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");
  const [showOnly, setShowOnly]       = useState<"all" | "discovered" | "undiscovered">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(`/${locale}/auth/login`); return; }
    (async () => {
      const [cards, disc] = await Promise.all([
        getOreumCards({ top100Only: true }),
        getUserDiscoveries(user.uid),
      ]);
      setOreums(cards);
      setDiscoveries(disc);
      setLoading(false);
    })();
  }, [user, authLoading, router, locale]);

  const discSet = useMemo(() => new Set(discoveries.map((d) => d.oreumSlug)), [discoveries]);

  const filtered = useMemo(() => {
    let list = oreums;
    if (regionFilter !== "all") list = list.filter((o) => o.region === regionFilter);
    if (showOnly === "discovered")   list = list.filter((o) => discSet.has(o.slug));
    if (showOnly === "undiscovered") list = list.filter((o) => !discSet.has(o.slug));
    return list;
  }, [oreums, regionFilter, showOnly, discSet]);

  const total      = oreums.length;
  const discovered = oreums.filter((o) => discSet.has(o.slug)).length;
  const pct        = total > 0 ? Math.round((discovered / total) * 100) : 0;

  // 지역별 달성 수
  const regionStats = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const o of oreums) {
      if (!map[o.region]) map[o.region] = { total: 0, done: 0 };
      map[o.region].total++;
      if (discSet.has(o.slug)) map[o.region].done++;
    }
    return map;
  }, [oreums, discSet]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title="스탬프 북" />

      {/* 상단 여권 스타일 헤더 */}
      <div className="bg-header px-4 pt-5 pb-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs tracking-wider uppercase mb-1">My Oreum Passport</p>
              <p className="text-white text-3xl font-bold tabular-nums">
                {loading ? "—" : discovered}
                <span className="text-white/40 text-lg font-normal"> / {total}</span>
              </p>
              <p className="text-white/60 text-sm mt-0.5">오름 완주</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <BookMarked size={26} className="text-white/80" />
            </div>
          </div>

          {/* 전체 진행 바 */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/50">
              <span>전체 달성률</span>
              <span className="text-white font-semibold">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* 지역별 미니 스탯 */}
          {!loading && (
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {(["east","west","south","north","central"] as Region[]).map((r) => {
                const stat = regionStats[r] ?? { total: 0, done: 0 };
                const rPct = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
                const labels: Record<Region, string> = {
                  east:"동부", west:"서부", south:"남부", north:"북부", central:"중산간"
                };
                return (
                  <button
                    key={r}
                    onClick={() => setRegionFilter(regionFilter === r ? "all" : r)}
                    className={cn(
                      "flex flex-col items-center py-2 px-1 rounded-xl transition-colors",
                      regionFilter === r ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <p className="text-white text-xs font-bold tabular-nums">{stat.done}</p>
                    <p className="text-white/40 text-[9px] mt-0.5">{labels[r]}</p>
                    <div className="w-full h-1 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{ width: `${rPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3">

        {/* 발견 상태 필터 탭 */}
        <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-4 shadow-sm">
          {([
            { key: "all",          label: "전체" },
            { key: "discovered",   label: `발견 ${discovered}` },
            { key: "undiscovered", label: `미방문 ${total - discovered}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setShowOnly(key)}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
                showOnly === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 스탬프 그리드 */}
        {loading ? (
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="rounded-xl" style={{ aspectRatio: "1/1" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <Mountain size={24} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">해당 오름이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {filtered.map((oreum) => {
              const done = discSet.has(oreum.slug);
              return (
                <Link key={oreum.slug} href={`/${locale}/oreum/${oreum.slug}`}>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-xl border transition-all duration-200",
                      done
                        ? "border-primary/30 ring-1 ring-primary/20 hover:ring-2"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                    style={{ aspectRatio: "1/1" }}
                  >
                    {/* 이미지 */}
                    <div className={cn("absolute inset-0", !done && "grayscale brightness-50")}>
                      {oreum.thumbnailUrl ? (
                        <Image
                          src={oreum.thumbnailUrl}
                          alt={oreum.nameKo}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center">
                          <span className="text-white/30 text-xs font-bold">{oreum.nameKo[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* 그라데이션 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    {/* 발견 스탬프 마크 */}
                    {done && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow">
                        <CheckCircle2 size={9} color="white" strokeWidth={3} />
                      </div>
                    )}

                    {/* 번호 */}
                    {oreum.tierOrder && (
                      <div className="absolute top-1 left-1">
                        <span className={cn(
                          "text-[7px] font-bold tabular-nums leading-none",
                          done ? "text-white/70" : "text-white/20"
                        )}>
                          {oreum.tierOrder}
                        </span>
                      </div>
                    )}

                    {/* 이름 */}
                    <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
                      <p className={cn(
                        "text-[8px] font-semibold leading-tight truncate text-center",
                        done ? "text-white" : "text-white/30"
                      )}>
                        {oreum.nameKo}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* 푸터 안내 */}
        {!loading && showOnly === "all" && (
          <p className="text-center text-xs text-muted-foreground mt-6 mb-2">
            컬러 오름은 직접 다녀온 곳이에요 ✅
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getOreumCards } from "@/lib/firestore/oreums";
import { getUserDiscoveries } from "@/lib/firestore/users";
import { CollectionStatsCard } from "@/components/collection/CollectionStatsCard";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OreumCard, UserDiscovery, Region } from "@/types";

type SortKey = "order" | "name" | "discovered";
type DiscFilter = "all" | "discovered" | "undiscovered";

const REGIONS: { key: "all" | Region; label: string }[] = [
  { key: "all",     label: "전체" },
  { key: "east",    label: "동부" },
  { key: "west",    label: "서부" },
  { key: "south",   label: "남부" },
  { key: "north",   label: "북부" },
  { key: "central", label: "중산간" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "order",     label: "번호순" },
  { key: "discovered", label: "발견순" },
  { key: "name",      label: "이름순" },
];

export default function CollectionPage() {
  const t = useTranslations("collection");
  const tO = useTranslations("oreum");
  const locale = useLocale();
  const { user } = useAuth();

  const [oreums, setOreums]             = useState<OreumCard[]>([]);
  const [discoveries, setDiscoveries]   = useState<UserDiscovery[]>([]);
  const [loading, setLoading]           = useState(true);
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");
  const [sortBy, setSortBy]             = useState<SortKey>("order");
  const [discFilter, setDiscFilter]     = useState<DiscFilter>("all");

  useEffect(() => {
    (async () => {
      const cards = await getOreumCards({ top100Only: true });
      setOreums(cards);
      if (user) {
        const disc = await getUserDiscoveries(user.uid);
        setDiscoveries(disc);
      }
      setLoading(false);
    })();
  }, [user]);

  const discSet = useMemo(() => new Set(discoveries.map((d) => d.oreumSlug)), [discoveries]);

  const applyFilters = useMemo(() => (base: OreumCard[]) => {
    let result = base;
    if (regionFilter !== "all") result = result.filter((o) => o.region === regionFilter);
    if (discFilter === "discovered")   result = result.filter((o) => discSet.has(o.slug));
    if (discFilter === "undiscovered") result = result.filter((o) => !discSet.has(o.slug));
    if (sortBy === "name")      result = [...result].sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    if (sortBy === "order")     result = [...result].sort((a, b) => (a.tierOrder ?? 999) - (b.tierOrder ?? 999));
    if (sortBy === "discovered") result = [...result].sort((a, b) => (discSet.has(a.slug) ? 0 : 1) - (discSet.has(b.slug) ? 0 : 1));
    return result;
  }, [regionFilter, discFilter, sortBy, discSet]);

  const byTier = useMemo(() => ({
    beginner: oreums.filter((o) => o.tier === "beginner"),
    explorer: oreums.filter((o) => o.tier === "explorer"),
    master:   oreums.filter((o) => o.tier === "master"),
  }), [oreums]);

  const totalDiscovered = oreums.filter((o) => discSet.has(o.slug)).length;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t("title")} />

      {/* 다크 그린 스탯 카드 */}
      <div className="bg-[hsl(var(--header-bg))] px-4 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <CollectionStatsCard discovered={totalDiscovered} total={100} />
        </div>
      </div>

      {/* 본문 -mt-4 */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <Tabs defaultValue="beginner" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border rounded-xl h-auto p-1">
            <TabsTrigger
              value="beginner"
              className="rounded-lg py-2 text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {tO("tier_beginner")}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {byTier.beginner.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="explorer"
              className="rounded-lg py-2 text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              {tO("tier_explorer")}
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {byTier.explorer.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="master"
              disabled
              className="rounded-lg py-2 text-xs gap-1.5 opacity-50"
            >
              {tO("tier_master")}
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">추후</Badge>
            </TabsTrigger>
          </TabsList>

          {/* 지역 필터 칩 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {REGIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRegionFilter(key)}
                className={cn(
                  "shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors",
                  regionFilter === key
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 border border-border"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 정렬·발견상태 필터 행 */}
          <div className="flex items-center gap-2 mt-2 mb-3">
            {/* 발견 상태 토글 */}
            <div className="flex gap-1 bg-muted rounded-lg p-0.5 flex-1">
              {(["all", "discovered", "undiscovered"] as DiscFilter[]).map((k) => {
                const labels = { all: "전체", discovered: "발견", undiscovered: "미발견" };
                return (
                  <button
                    key={k}
                    onClick={() => setDiscFilter(k)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs font-medium transition-colors",
                      discFilter === k ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    {labels[k]}
                  </button>
                );
              })}
            </div>
            {/* 정렬 드롭다운 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-8 pl-2.5 pr-6 rounded-lg bg-muted border border-border text-xs font-medium text-foreground appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <SlidersHorizontal size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <TabsContent value="beginner" className="mt-0">
            <OreumGrid oreums={applyFilters(byTier.beginner)} discSet={discSet} locale={locale} loading={loading} />
          </TabsContent>
          <TabsContent value="explorer" className="mt-0">
            <OreumGrid oreums={applyFilters(byTier.explorer)} discSet={discSet} locale={locale} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OreumGrid({ oreums, discSet, locale, loading }: {
  oreums: OreumCard[];
  discSet: Set<string>;
  locale: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="rounded-xl" style={{ aspectRatio: "3/4" }} />
        ))}
      </div>
    );
  }

  if (oreums.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <CheckCircle2 size={24} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">조건에 맞는 오름이 없어요</p>
        <p className="text-xs text-muted-foreground/60 mt-1">필터를 변경해보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {oreums.map((oreum) => {
        const discovered = discSet.has(oreum.slug);
        return (
          <Link key={oreum.slug} href={`/${locale}/oreum/${oreum.slug}`}>
            <div
              className="relative overflow-hidden rounded-xl border border-border bg-muted hover:scale-[1.02] transition-transform duration-200"
              style={{ aspectRatio: "3/4" }}
            >
              {/* 이미지 */}
              <div className={cn("absolute inset-0", !discovered && "grayscale brightness-65")}>
                {oreum.thumbnailUrl ? (
                  <Image
                    src={oreum.thumbnailUrl}
                    alt={oreum.nameKo}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 33vw, 170px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary/20">{oreum.nameKo[0]}</span>
                  </div>
                )}
              </div>

              {/* 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

              {/* 발견 마크 */}
              {discovered && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={11} color="white" strokeWidth={2.5} />
                </div>
              )}

              {/* 이름 */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-[11px] font-semibold leading-tight truncate">{oreum.nameKo}</p>
                {oreum.tierOrder && (
                  <p className="text-white/40 text-[9px]">#{oreum.tierOrder}</p>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

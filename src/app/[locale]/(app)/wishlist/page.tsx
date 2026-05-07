"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Trash2, Mountain, ChevronRight, SlidersHorizontal, Route } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getWishlist, removeFromWishlist } from "@/lib/firestore/users";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WishlistItem, Region } from "@/types";

type SortKey = "added" | "name" | "difficulty";

const REGION_FILTERS: { key: "all" | Region; label: string }[] = [
  { key: "all",     label: "전체" },
  { key: "east",    label: "동부" },
  { key: "west",    label: "서부" },
  { key: "south",   label: "남부" },
  { key: "north",   label: "북부" },
  { key: "central", label: "중산간" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "added",      label: "추가순" },
  { key: "name",       label: "이름순" },
  { key: "difficulty", label: "난이도" },
];

const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const { user } = useAuth();

  const [items, setItems]           = useState<WishlistItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [regionFilter, setRegion]   = useState<"all" | Region>("all");
  const [sortBy, setSortBy]         = useState<SortKey>("added");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getWishlist(user.uid).then((w) => { setItems(w); setLoading(false); });
  }, [user]);

  const handleRemove = async (id: string) => {
    if (!user) return;
    await removeFromWishlist(user.uid, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = useMemo(() => {
    let result = [...items];
    if (regionFilter !== "all") result = result.filter((i) => i.oreumRegion === regionFilter);
    if (sortBy === "name")       result = result.sort((a, b) => a.oreumNameKo.localeCompare(b.oreumNameKo, "ko"));
    if (sortBy === "difficulty") result = result.sort((a, b) => (a.oreumDifficulty ?? 0) - (b.oreumDifficulty ?? 0));
    return result;
  }, [items, regionFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t("title")} />

      <div className="bg-header px-5 pt-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-white/70" fill="rgba(255,255,255,0.3)" />
            <h2 className="text-white text-lg font-bold">{t("title")}</h2>
          </div>
          <p className="text-white/50 text-sm mt-1">{items.length}개의 오름</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4">
        {loading ? (
          <div className="space-y-3 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <Heart size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">로그인하면 위시리스트를 이용할 수 있어요</p>
            <Link href={`/${locale}/auth/login`}>
              <Button className="mt-4 bg-primary text-white">로그인하기</Button>
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
            <Link href={`/${locale}/collection`}>
              <Button variant="outline" className="mt-4">도감 보기</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* 코스 짜기 버튼 */}
            {items.length >= 2 && (
              <Link href={`/${locale}/course`} className="block mt-2">
                <Button variant="outline" className="w-full h-11 gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Route size={16} />
                  오늘의 코스 짜기
                </Button>
              </Link>
            )}

            {/* 지역 필터 칩 */}
            <div className="flex gap-2 mt-2 pb-1 overflow-x-auto [scrollbar-width:none]">
              {REGION_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRegion(key)}
                  className={cn(
                    "shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors",
                    regionFilter === key
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground border border-border hover:bg-muted/70"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 정렬 + 카운트 */}
            <div className="flex items-center justify-between mt-2 mb-3">
              <p className="text-xs text-muted-foreground">{filtered.length}개</p>
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
                <SlidersHorizontal size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Mountain size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">이 지역에 위시리스트가 없어요</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors"
                  >
                    {/* 썸네일 */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                      {item.oreumThumbnailUrl ? (
                        <Image
                          src={item.oreumThumbnailUrl}
                          alt={item.oreumNameKo}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Mountain size={18} className="text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <Link href={`/${locale}/oreum/${item.oreumSlug}`} className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.oreumNameKo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{REGION_LABEL[item.oreumRegion]}</span>
                        {item.oreumDifficulty && (
                          <>
                            <span className="text-muted-foreground/30 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{"★".repeat(item.oreumDifficulty)}{"☆".repeat(5 - item.oreumDifficulty)}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} 추가
                      </p>
                    </Link>

                    {/* 삭제 */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Loader2, Tag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import type { Goods, GoodsCategory } from "@/types";

export default function GoodsPage() {
  const locale = useLocale();
  const t = useTranslations("goods");

  const CATEGORY_LABELS: Record<GoodsCategory | "all", string> = {
    all:       t("cat_all"),
    apparel:   t("cat_apparel"),
    sticker:   t("cat_sticker"),
    postcard:  t("cat_postcard"),
    print:     t("cat_print"),
    accessory: t("cat_accessory"),
    digital:   t("cat_digital"),
    other:     t("cat_other"),
  };
  const [goods, setGoods]         = useState<Goods[]>([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState<GoodsCategory | "all">("all");

  useEffect(() => {
    setLoading(true);
    const q = category !== "all" ? `?category=${category}` : "";
    fetch(`/api/goods${q}`)
      .then((r) => r.json())
      .then((data) => setGoods(data.goods ?? []))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title={t("title")} />

      <div className="bg-header pt-4 pb-8 px-4">
        <h1 className="text-white font-bold text-lg">{t("headline")}</h1>
        <p className="text-white/50 text-xs mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl min-h-screen">
        {/* 카테고리 필터 */}
        <div className="flex gap-2 px-4 pt-4 pb-3 overflow-x-auto scrollbar-none">
          {(Object.keys(CATEGORY_LABELS) as (GoodsCategory | "all")[]).map((key) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                category === key
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : goods.length === 0 ? (
          <div className="py-24 text-center">
            <ShoppingBag size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3 pb-6">
            {goods.map((g) => (
              <Link key={g.id} href={`/${locale}/goods/${g.id}`}>
                <div className="bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    {g.imageUrls[0] ? (
                      <Image
                        src={g.imageUrls[0]}
                        alt={g.nameKo}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag size={32} className="text-muted-foreground/30" />
                      </div>
                    )}
                    {g.isLimitedEdition && (
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        {t("limited_edition")}
                      </span>
                    )}
                    {g.stock !== null && g.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{t("sold_out")}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">{CATEGORY_LABELS[g.category]}</p>
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{g.nameKo}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {g.originalPrice && g.originalPrice > g.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {g.originalPrice.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-sm font-bold text-primary">
                        {g.price.toLocaleString()}원
                      </span>
                    </div>
                    {g.stock !== null && g.stock > 0 && g.stock <= 10 && (
                      <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-0.5">
                        <Tag size={8} />{t("stock_left", { count: g.stock })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

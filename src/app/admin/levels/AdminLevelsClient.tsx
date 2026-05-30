"use client";

import { useState, useEffect, useMemo } from "react";
import { auth } from "@/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, X, Check, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OreumLevel } from "@/types";

const LEVELS: { key: OreumLevel; label: string; emoji: string; desc: string; range: string }[] = [
  { key: "entry",        label: "입문자", emoji: "🌱", desc: "오름을 처음 시작하는 분",  range: "발견 0~9개" },
  { key: "novice",       label: "초보자", emoji: "🥾", desc: "기본기를 다지는 탐험가",   range: "발견 10~29개" },
  { key: "intermediate", label: "중급자", emoji: "⛰️",  desc: "다양한 오름에 도전 중",   range: "발견 30~49개" },
  { key: "advanced",     label: "숙련자", emoji: "🏔️", desc: "오름 전문 탐험가",         range: "발견 50개 이상" },
];

interface OreumRow {
  id: string;
  nameKo: string;
  slug: string;
  region: string;
  tierOrder: number | null;
  recommendedLevel: OreumLevel | null;
  thumbnailUrl: string | null;
}

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export default function AdminLevelsClient() {
  const [oreums, setOreums] = useState<OreumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<OreumLevel>("entry");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDocs(
        query(collection(db, "oreums"), where("isPublished", "==", true))
      );
      setOreums(
        snap.docs.map((d) => ({
          id:               d.id,
          nameKo:           d.data().nameKo,
          slug:             d.data().slug,
          region:           d.data().region,
          tierOrder:        d.data().tierOrder ?? null,
          recommendedLevel: d.data().recommendedLevel ?? null,
          thumbnailUrl:     d.data().thumbnailUrl ?? null,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const assignedToLevel = useMemo(
    () => oreums.filter((o) => o.recommendedLevel === activeLevel)
      .sort((a, b) => (a.tierOrder ?? 999) - (b.tierOrder ?? 999)),
    [oreums, activeLevel]
  );

  const unassigned = useMemo(() => {
    const q = search.toLowerCase();
    return oreums
      .filter((o) =>
        o.recommendedLevel !== activeLevel &&
        (o.nameKo.includes(search) || o.slug.toLowerCase().includes(q))
      )
      .sort((a, b) => (a.tierOrder ?? 999) - (b.tierOrder ?? 999))
      .slice(0, 30);
  }, [oreums, activeLevel, search]);

  const assign = async (oreumId: string, level: OreumLevel | null) => {
    setSaving(oreumId);
    try {
      const token = await getToken();
      await fetch(`/api/admin/oreums/${oreumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recommendedLevel: level }),
      });
      setOreums((prev) =>
        prev.map((o) => o.id === oreumId ? { ...o, recommendedLevel: level } : o)
      );
    } finally {
      setSaving(null);
    }
  };

  const levelInfo = LEVELS.find((l) => l.key === activeLevel)!;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">오름 등급 관리</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          각 등급에 맞는 오름을 지정하면 마이페이지 등급에 따라 추천 오름이 달라져요
        </p>
      </div>

      {/* 등급 탭 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {LEVELS.map((lv) => {
          const count = oreums.filter((o) => o.recommendedLevel === lv.key).length;
          return (
            <button
              key={lv.key}
              onClick={() => { setActiveLevel(lv.key); setSearch(""); }}
              className={cn(
                "rounded-2xl p-4 text-left border transition-all",
                activeLevel === lv.key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              )}
            >
              <p className="text-2xl mb-1">{lv.emoji}</p>
              <p className="font-semibold text-sm">{lv.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lv.range}</p>
              <Badge variant="outline" className="mt-2 text-xs">
                {count}개 지정됨
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 왼쪽: 현재 등급에 지정된 오름 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{levelInfo.emoji}</span>
            <h2 className="font-semibold">{levelInfo.label} 오름 목록</h2>
            <Badge variant="outline" className="text-xs ml-auto">{assignedToLevel.length}개</Badge>
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
            ) : assignedToLevel.length === 0 ? (
              <div className="p-8 text-center">
                <Mountain size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">지정된 오름이 없어요</p>
                <p className="text-xs text-muted-foreground mt-1">오른쪽에서 오름을 추가해주세요</p>
              </div>
            ) : (
              <div className="divide-y max-h-[520px] overflow-y-auto">
                {assignedToLevel.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                    {o.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shrink-0">
                        <span className="text-white/60 text-xs font-bold">{o.nameKo[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.nameKo}</p>
                      <p className="text-xs text-muted-foreground">{REGION_KO[o.region] ?? o.region}</p>
                    </div>
                    <button
                      onClick={() => assign(o.id, null)}
                      disabled={saving === o.id}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      {saving === o.id
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                        : <X size={14} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 오른쪽: 검색 후 추가 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold">오름 검색 & 추가</h2>
          </div>

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="오름 이름 검색..."
              className="pl-9"
            />
          </div>

          <Card className="overflow-hidden">
            <div className="divide-y max-h-[480px] overflow-y-auto">
              {unassigned.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {search ? "검색 결과 없음" : "오름 이름을 검색하세요"}
                </div>
              ) : (
                unassigned.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                    {o.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shrink-0">
                        <span className="text-white/60 text-xs font-bold">{o.nameKo[0]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.nameKo}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{REGION_KO[o.region] ?? o.region}</span>
                        {o.recommendedLevel && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            {LEVELS.find((l) => l.key === o.recommendedLevel)?.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => assign(o.id, activeLevel)}
                      disabled={saving === o.id}
                      className="w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center shrink-0"
                    >
                      {saving === o.id
                        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
                        : <Check size={13} />
                      }
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

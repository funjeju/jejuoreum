"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { ArrowLeft, Heart, Search, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getOreumCards } from "@/lib/firestore/oreums";
import { cn } from "@/lib/utils";
import type { OreumCard } from "@/types";

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

export default function FavoritesPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  const [oreums, setOreums]     = useState<OreumCard[]>([]);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    getOreumCards({ top100Only: false }).then(setOreums).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/favorite-oreums", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => {
          const ids = (d.oreums ?? []).map((o: { id: string }) => o.id) as string[];
          setSelected(ids);
          setOriginal(ids);
          setLoading(false);
        })
        .catch(() => setLoading(false))
    );
  }, [user]);

  const filtered = oreums.filter((o) =>
    o.nameKo.includes(search) || o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/me/favorite-oreums", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ favoriteOreumIds: selected }),
      });
      setOriginal(selected);
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch {
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...original].sort());
  const selectedOreums = oreums.filter((o) => selected.includes(o.id));

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="font-semibold text-sm">나의 애정 오름</p>
          <p className="text-[11px] text-muted-foreground">{selected.length}/3 선택됨</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* 선택된 오름 미리보기 */}
        {selectedOreums.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3">
            <p className="text-xs font-semibold text-rose-600 mb-2.5 flex items-center gap-1">
              <Heart size={11} className="fill-rose-500" /> 선택된 애정 오름
            </p>
            <div className="flex gap-2">
              {selectedOreums.map((o) => (
                <div key={o.id} className="flex-1 relative">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                    {o.thumbnailUrl ? (
                      <Image src={o.thumbnailUrl} alt={o.nameKo} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                        <span className="text-white/40 font-bold">{o.nameKo[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[10px] font-semibold truncate">{o.nameKo}</p>
                  </div>
                  <button
                    onClick={() => toggle(o.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
              {/* 빈 슬롯 */}
              {Array.from({ length: 3 - selectedOreums.length }).map((_, i) => (
                <div key={i} className="flex-1 aspect-[3/4] rounded-xl border-2 border-dashed border-rose-200 flex items-center justify-center">
                  <Heart size={16} className="text-rose-200" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="오름 이름 검색..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm"
          />
        </div>

        {/* 오름 목록 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.slice(0, 60).map((o) => {
              const isSelected = selected.includes(o.id);
              const isDisabled = !isSelected && selected.length >= 3;
              return (
                <button
                  key={o.id}
                  onClick={() => !isDisabled && toggle(o.id)}
                  className={cn(
                    "relative rounded-xl overflow-hidden border-2 transition-all",
                    isSelected ? "border-rose-400 scale-[0.97]" : isDisabled ? "opacity-40 border-transparent" : "border-transparent hover:border-rose-200"
                  )}
                  style={{ aspectRatio: "3/4" }}
                >
                  <div className="absolute inset-0 bg-muted">
                    {o.thumbnailUrl ? (
                      <Image src={o.thumbnailUrl} alt={o.nameKo} fill className="object-cover" sizes="120px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                        <span className="text-xl font-bold text-white/40">{o.nameKo[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow">
                      <Check size={11} className="text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-[10px] font-semibold leading-tight truncate">{o.nameKo}</p>
                    <p className="text-white/50 text-[9px]">{REGION_KO[o.region] ?? o.region}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 저장 버튼 */}
      {hasChanged && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 h-12 bg-rose-500 text-white rounded-2xl font-semibold text-sm"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> 저장 중...</>
            ) : saved ? (
              <><Check size={16} /> 저장됨!</>
            ) : (
              <><Heart size={16} className="fill-white" /> 애정 오름 저장하기</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

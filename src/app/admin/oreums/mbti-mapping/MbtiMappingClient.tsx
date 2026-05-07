"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, X, Loader2 } from "lucide-react";
import type { Oreum } from "@/types";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const MBTI_COLORS: Record<string, string> = {
  INTJ: "bg-slate-100 border-slate-300",
  INTP: "bg-slate-100 border-slate-300",
  ENTJ: "bg-blue-50 border-blue-200",
  ENTP: "bg-blue-50 border-blue-200",
  INFJ: "bg-violet-50 border-violet-200",
  INFP: "bg-violet-50 border-violet-200",
  ENFJ: "bg-pink-50 border-pink-200",
  ENFP: "bg-pink-50 border-pink-200",
  ISTJ: "bg-green-50 border-green-200",
  ISFJ: "bg-green-50 border-green-200",
  ESTJ: "bg-teal-50 border-teal-200",
  ESFJ: "bg-teal-50 border-teal-200",
  ISTP: "bg-amber-50 border-amber-200",
  ISFP: "bg-amber-50 border-amber-200",
  ESTP: "bg-orange-50 border-orange-200",
  ESFP: "bg-orange-50 border-orange-200",
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export default function MbtiMappingClient() {
  const [oreums, setOreums]               = useState<Oreum[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedMbti, setSelectedMbti]   = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [updating, setUpdating]           = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const token = await getToken();
    let all: Oreum[] = [];
    let page = 1;
    while (true) {
      const res = await fetch(`/api/admin/oreums?page=${page}&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      all = [...all, ...(data.oreums ?? [])];
      if (all.length >= (data.total ?? 0)) break;
      page++;
    }
    setOreums(all);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const patchMbti = async (oreumId: string, mbti: string | null) => {
    setUpdating(oreumId);
    try {
      const token = await getToken();
      await fetch(`/api/admin/oreums/${oreumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mbti }),
      });
      setOreums((prev) => prev.map((o) => o.id === oreumId ? { ...o, mbti } : o));
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = (oreum: Oreum) => patchMbti(oreum.id, null);

  const handleAssign = async (oreum: Oreum) => {
    if (!selectedMbti) return;
    await patchMbti(oreum.id, selectedMbti);
    setSelectedMbti(null);
    setSearchQuery("");
  };

  const mbtiGroups = MBTI_TYPES.reduce<Record<string, Oreum[]>>((acc, m) => {
    acc[m] = oreums.filter((o) => o.mbti === m);
    return acc;
  }, {});

  const unmapped = oreums.filter((o) => !o.mbti).length;

  const searchResults = searchQuery.length >= 1
    ? oreums.filter((o) => o.nameKo.includes(searchQuery) || o.slug.includes(searchQuery)).slice(0, 10)
    : [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">MBTI 매핑 도구</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          16개 유형에 오름 매핑 — 미매핑 {unmapped}개 / 전체 {oreums.length}개
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {MBTI_TYPES.map((mbti) => {
            const assigned = mbtiGroups[mbti] ?? [];
            return (
              <div
                key={mbti}
                className={`border rounded-xl p-3 ${MBTI_COLORS[mbti] ?? "bg-gray-50 border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{mbti}</span>
                  <span className="text-xs text-muted-foreground">{assigned.length}개</span>
                </div>

                <div className="space-y-1 min-h-[48px]">
                  {assigned.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between bg-white/80 rounded-lg px-2 py-1 group"
                    >
                      <span className="text-xs font-medium truncate leading-snug">{o.nameKo}</span>
                      <button
                        onClick={() => handleRemove(o)}
                        disabled={updating === o.id}
                        className="opacity-0 group-hover:opacity-100 shrink-0 ml-1 text-muted-foreground hover:text-destructive transition-opacity"
                        title="매핑 해제"
                      >
                        {updating === o.id
                          ? <Loader2 size={10} className="animate-spin" />
                          : <X size={10} />
                        }
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setSelectedMbti(mbti); setSearchQuery(""); }}
                  className="w-full mt-2 text-xs text-primary/70 hover:text-primary border border-dashed border-primary/20 hover:border-primary/50 rounded-lg py-1.5 transition-colors"
                >
                  + 오름 추가
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedMbti} onOpenChange={(o) => !o && setSelectedMbti(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedMbti} — 오름 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="오름 이름 또는 슬러그..."
                className="pl-9"
                autoFocus
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="divide-y rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleAssign(o)}
                    disabled={updating === o.id}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.nameKo}</p>
                      <p className="text-xs text-muted-foreground">{o.mbti ? `현재: ${o.mbti}` : "미매핑"}</p>
                    </div>
                    {updating === o.id && <Loader2 size={14} className="animate-spin shrink-0" />}
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 1 ? (
              <p className="text-sm text-muted-foreground text-center py-4">검색 결과 없음</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">오름 이름을 입력하세요</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

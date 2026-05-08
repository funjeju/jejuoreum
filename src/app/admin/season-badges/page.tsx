"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeasonBadge, SeasonBadgeConditionType, Region } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const TIER_LABELS: Record<SeasonBadge["tier"], string> = {
  bronze: "브론즈", silver: "실버", gold: "골드", platinum: "플래티넘",
};

const CONDITION_LABELS: Record<SeasonBadgeConditionType, string> = {
  any_discovery:   "시즌 중 1회 이상 발견",
  discovery_count: "시즌 중 N회 발견",
  region_count:    "특정 지역 N개 발견",
  specific_oreums: "특정 오름 세트 완성",
};

const REGION_LABELS: Record<Region, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

const EMPTY: Omit<SeasonBadge, "id" | "createdAt" | "updatedAt" | "earnedCount"> = {
  code: "", nameKo: "", descriptionKo: "", iconEmoji: "🏅",
  tier: "bronze", isActive: true,
  seasonStart: new Date().toISOString().slice(0, 10),
  seasonEnd:   new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  condition: { type: "any_discovery" },
};

export default function AdminSeasonBadgesPage() {
  const [badges, setBadges]   = useState<SeasonBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SeasonBadge | null>(null);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);

  // Condition sub-fields
  const [condType, setCondType]           = useState<SeasonBadgeConditionType>("any_discovery");
  const [condCount, setCondCount]         = useState(1);
  const [condRegion, setCondRegion]       = useState<Region>("east");
  const [condSlugs, setCondSlugs]         = useState("");

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/season-badges", { headers: { Authorization: `Bearer ${token}` } });
      setBadges((await res.json()).badges ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBadges(); }, []);

  const openNew = () => {
    setEditing({ id: "", createdAt: "", updatedAt: "", earnedCount: 0, ...EMPTY });
    setCondType("any_discovery"); setCondCount(1); setCondRegion("east"); setCondSlugs("");
    setIsNew(true);
  };

  const openEdit = (b: SeasonBadge) => {
    setEditing(b);
    setCondType(b.condition.type);
    setCondCount(b.condition.count ?? 1);
    setCondRegion(b.condition.region ?? "east");
    setCondSlugs((b.condition.oreumSlugs ?? []).join(", "));
    setIsNew(false);
  };

  const buildCondition = () => {
    if (condType === "any_discovery") return { type: condType };
    if (condType === "discovery_count") return { type: condType, count: condCount };
    if (condType === "region_count") return { type: condType, count: condCount, region: condRegion };
    return { type: condType, oreumSlugs: condSlugs.split(",").map((s) => s.trim()).filter(Boolean) };
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const token = await getToken();
      const payload = { ...editing, condition: buildCondition() };
      if (isNew) {
        await fetch("/api/admin/season-badges", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/admin/season-badges/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      await fetchBadges();
      setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    const token = await getToken();
    await fetch(`/api/admin/season-badges/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setBadges((p) => p.filter((b) => b.id !== id));
  };

  const now = new Date().toISOString();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={22} />시즌 한정 배지</h1>
        <Button onClick={openNew} className="gap-1.5"><Plus size={15} /> 배지 추가</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                {["배지", "코드", "기간", "조건", "획득자", "상태", "액션"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {badges.map((b) => {
                const isActive = b.isActive && b.seasonStart <= now && b.seasonEnd >= now;
                return (
                  <tr key={b.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <span className="text-2xl mr-2">{b.iconEmoji}</span>
                      <span className="font-medium">{b.nameKo}</span>
                      <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium",
                        b.tier === "platinum" ? "bg-purple-100 text-purple-700" :
                        b.tier === "gold"     ? "bg-amber-100 text-amber-700" :
                        b.tier === "silver"   ? "bg-gray-100 text-gray-600" :
                                                "bg-orange-100 text-orange-700"
                      )}>{TIER_LABELS[b.tier]}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.code}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {b.seasonStart.slice(0, 10)} ~<br />{b.seasonEnd.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{CONDITION_LABELS[b.condition.type]}</td>
                    <td className="px-4 py-3 text-center font-semibold">{b.earnedCount}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                        isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}>
                        {isActive ? "진행중" : b.seasonEnd < now ? "종료" : b.isActive ? "예정" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => openEdit(b)}><Pencil size={12} /></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "시즌 배지 추가" : `${editing.nameKo} 편집`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">이모지</Label>
                    <Input value={editing.iconEmoji} onChange={(e) => setEditing({ ...editing, iconEmoji: e.target.value })} className="text-center text-xl" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">배지명 *</Label>
                    <Input value={editing.nameKo} onChange={(e) => setEditing({ ...editing, nameKo: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">코드 (영문, 고유값) *</Label>
                  <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="eg. spring_2026_explorer" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">설명</Label>
                  <Input value={editing.descriptionKo} onChange={(e) => setEditing({ ...editing, descriptionKo: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">등급</Label>
                    <select value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value as SeasonBadge["tier"] })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer h-10">
                      <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="accent-primary" />
                      활성화
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">시즌 시작 *</Label>
                    <Input type="date" value={editing.seasonStart.slice(0, 10)}
                      onChange={(e) => setEditing({ ...editing, seasonStart: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">시즌 종료 *</Label>
                    <Input type="date" value={editing.seasonEnd.slice(0, 10)}
                      onChange={(e) => setEditing({ ...editing, seasonEnd: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2 border rounded-lg p-3">
                  <Label className="text-xs font-semibold">획득 조건</Label>
                  <select value={condType} onChange={(e) => setCondType(e.target.value as SeasonBadgeConditionType)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>

                  {(condType === "discovery_count" || condType === "region_count") && (
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs shrink-0">횟수</Label>
                      <Input type="number" min={1} value={condCount} onChange={(e) => setCondCount(Number(e.target.value))} className="h-8" />
                    </div>
                  )}

                  {condType === "region_count" && (
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs shrink-0">지역</Label>
                      <select value={condRegion} onChange={(e) => setCondRegion(e.target.value as Region)}
                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm">
                        {Object.entries(REGION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  )}

                  {condType === "specific_oreums" && (
                    <div className="space-y-1">
                      <Label className="text-xs">오름 slug 목록 (쉼표 구분)</Label>
                      <Input value={condSlugs} onChange={(e) => setCondSlugs(e.target.value)} placeholder="oreum-a, oreum-b, ..." />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">취소</Button>
                  <Button onClick={handleSave} disabled={saving || !editing.nameKo || !editing.code} className="flex-1">
                    {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}{isNew ? "추가" : "저장"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { auth } from "@/lib/firebase/client";
import { getOreumCards } from "@/lib/firestore/oreums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Circle, Loader2, Target, X, Search, Calendar, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Challenge, ChallengeType, OreumCard } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const CHALLENGE_TYPES: { value: ChallengeType; label: string; color: string }[] = [
  { value: "weekly",    label: "주간",    color: "bg-blue-100 text-blue-700" },
  { value: "monthly",   label: "월간",    color: "bg-purple-100 text-purple-700" },
  { value: "seasonal",  label: "시즌",    color: "bg-amber-100 text-amber-700" },
  { value: "permanent", label: "상시",    color: "bg-gray-100 text-gray-600" },
];

const CONDITION_TYPES: { value: Challenge["conditionType"]; label: string }[] = [
  { value: "count",           label: "발견 개수" },
  { value: "tier_complete",   label: "티어 완주" },
  { value: "region_complete", label: "지역 완주" },
  { value: "specific_set",    label: "특정 오름 세트" },
];

type FormData = Omit<Challenge, "id" | "participantCount">;

const EMPTY_FORM: FormData = {
  code:           "",
  nameKo:         "",
  descriptionKo:  "",
  challengeType:  "permanent",
  startsAt:       null,
  endsAt:         null,
  conditionType:  "count",
  conditionValue: { value: 1 },
  rewardBadgeCode: null,
  isActive:       true,
};

// 날짜 → yyyy-MM-dd (input[type=date] 호환)
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}
function fromDateInput(val: string): string | null {
  if (!val) return null;
  return new Date(val).toISOString();
}

function formatDateRange(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  if (startsAt && endsAt) return `${fmt(startsAt)} ~ ${fmt(endsAt)}`;
  if (startsAt) return `${fmt(startsAt)}~`;
  return `~${fmt(endsAt!)}`;
}

export default function AdminChallengesClient() {
  const [challenges, setChallenges]     = useState<Challenge[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  // 오름 목록 (specific_set 피커용)
  const [allOreums, setAllOreums]       = useState<OreumCard[]>([]);
  const [oreumSearch, setOreumSearch]   = useState("");
  const [oreumLoading, setOreumLoading] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/challenges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChallenges(data.challenges ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, []);

  // specific_set 선택 시 오름 목록 로드 (최초 1회)
  useEffect(() => {
    if (form.conditionType !== "specific_set" || allOreums.length > 0) return;
    setOreumLoading(true);
    getOreumCards({ top100Only: true })
      .then(setAllOreums)
      .finally(() => setOreumLoading(false));
  }, [form.conditionType, allOreums.length]);

  const selectedSlugs: string[] = (form.conditionValue as { oreumSlugs?: string[] }).oreumSlugs ?? [];
  const selectedNames: Record<string, string> =
    (form.conditionValue as { oreumNameKos?: Record<string, string> }).oreumNameKos ?? {};

  const filteredOreums = useMemo(() =>
    allOreums.filter((o) =>
      !selectedSlugs.includes(o.slug) &&
      o.nameKo.includes(oreumSearch.trim())
    ),
    [allOreums, selectedSlugs, oreumSearch]
  );

  const addOreum = (oreum: OreumCard) => {
    const slugs = [...selectedSlugs, oreum.slug];
    const names = { ...selectedNames, [oreum.slug]: oreum.nameKo };
    setForm((f) => ({
      ...f,
      conditionValue: { oreumSlugs: slugs, oreumNameKos: names },
    }));
    setOreumSearch("");
  };

  const removeOreum = (slug: string) => {
    const slugs = selectedSlugs.filter((s) => s !== slug);
    const names = { ...selectedNames };
    delete names[slug];
    setForm((f) => ({
      ...f,
      conditionValue: { oreumSlugs: slugs, oreumNameKos: names },
    }));
  };

  const handleToggleActive = async (ch: Challenge) => {
    setTogglingId(ch.id);
    try {
      const token = await getToken();
      await fetch(`/api/admin/challenges/${ch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !ch.isActive }),
      });
      setChallenges((prev) =>
        prev.map((c) => c.id === ch.id ? { ...c, isActive: !c.isActive } : c)
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.nameKo.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      const code = form.code || form.nameKo.trim().replace(/\s+/g, "_").toLowerCase();
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, code, participantCount: 0 }),
      });
      const data = await res.json();
      if (data.id) {
        setChallenges((prev) => [
          ...prev,
          { ...form, code, id: data.id, participantCount: 0 },
        ]);
        setModal(false);
        setForm(EMPTY_FORM);
        setOreumSearch("");
      }
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setOreumSearch("");
    setModal(true);
  };

  const active   = challenges.filter((c) => c.isActive).length;
  const inactive = challenges.filter((c) => !c.isActive).length;

  const typeInfo = (t: ChallengeType) =>
    CHALLENGE_TYPES.find((x) => x.value === t) ?? CHALLENGE_TYPES[3];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">챌린지 관리</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            활성 {active}개 · 비활성 {inactive}개
          </p>
        </div>
        <Button onClick={openModal}>
          <Plus size={15} className="mr-1.5" />
          챌린지 만들기
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="py-24 text-center">
          <Target size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">아직 챌린지가 없어요</p>
          <Button className="mt-4" onClick={openModal}>첫 챌린지 만들기</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">이름</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">타입</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">기간</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">조건</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {challenges.map((ch) => {
                const ti = typeInfo(ch.challengeType ?? "permanent");
                return (
                  <tr key={ch.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{ch.nameKo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{ch.descriptionKo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ti.color)}>
                        {ti.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateRange(ch.startsAt, ch.endsAt) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {CONDITION_TYPES.find((t) => t.value === ch.conditionType)?.label ?? ch.conditionType}
                      </Badge>
                      {ch.conditionType === "specific_set" && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {((ch.conditionValue as { oreumSlugs?: string[] }).oreumSlugs ?? []).length}개 오름
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ch.isActive
                        ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={12} />활성</span>
                        : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Circle size={12} />비활성</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        disabled={togglingId === ch.id}
                        onClick={() => handleToggleActive(ch)}
                      >
                        {togglingId === ch.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : ch.isActive ? "비활성화" : "활성화"
                        }
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── 생성 모달 ── */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 챌린지 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">

            {/* 이름 */}
            <div className="space-y-1.5">
              <Label>이름 *</Label>
              <Input
                value={form.nameKo}
                onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
                placeholder="예: 이번 주의 오름 3부작"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-1.5">
              <Label>설명</Label>
              <Input
                value={form.descriptionKo}
                onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })}
                placeholder="챌린지 설명"
              />
            </div>

            {/* 코드 */}
            <div className="space-y-1.5">
              <Label>코드 (비워두면 자동 생성)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="예: weekly_3pack_2025w22"
                className="font-mono"
              />
            </div>

            {/* 챌린지 타입 */}
            <div className="space-y-1.5">
              <Label>챌린지 타입 *</Label>
              <Select
                value={form.challengeType}
                onValueChange={(v) => setForm({ ...form, challengeType: v as ChallengeType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHALLENGE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-full mr-2", t.color)}>
                        {t.label}
                      </span>
                      {t.value === "weekly"    && "매주 갱신 (이주의 챌린지)"}
                      {t.value === "monthly"   && "매달 갱신 (이달의 챌린지)"}
                      {t.value === "seasonal"  && "시즌 한정 (봄/여름/가을/겨울)"}
                      {t.value === "permanent" && "상시 (기간 없음)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기간 (permanent 제외) */}
            {form.challengeType !== "permanent" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Calendar size={12} />시작일</Label>
                  <Input
                    type="date"
                    value={toDateInput(form.startsAt)}
                    onChange={(e) => setForm({ ...form, startsAt: fromDateInput(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Calendar size={12} />종료일</Label>
                  <Input
                    type="date"
                    value={toDateInput(form.endsAt)}
                    onChange={(e) => setForm({ ...form, endsAt: fromDateInput(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* 조건 타입 */}
            <div className="space-y-1.5">
              <Label>조건 타입 *</Label>
              <Select
                value={form.conditionType}
                onValueChange={(v) => {
                  const ct = v as Challenge["conditionType"];
                  setForm({
                    ...form,
                    conditionType: ct,
                    conditionValue: ct === "specific_set"
                      ? { oreumSlugs: [], oreumNameKos: {} }
                      : { value: 1 },
                  });
                  setOreumSearch("");
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 조건별 서브 UI */}
            {form.conditionType === "count" && (
              <div className="space-y-1.5">
                <Label>목표 발견 개수</Label>
                <Input
                  type="number"
                  min={1}
                  value={(form.conditionValue as { value?: number }).value ?? 1}
                  onChange={(e) => setForm({ ...form, conditionValue: { value: Number(e.target.value) } })}
                />
              </div>
            )}

            {form.conditionType === "tier_complete" && (
              <div className="space-y-1.5">
                <Label>티어</Label>
                <Select
                  value={(form.conditionValue as { tier?: string }).tier ?? "beginner"}
                  onValueChange={(v) => setForm({ ...form, conditionValue: { tier: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">비기너 (30개)</SelectItem>
                    <SelectItem value="explorer">익스플로러 (70개)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.conditionType === "region_complete" && (
              <div className="space-y-1.5">
                <Label>지역</Label>
                <Select
                  value={(form.conditionValue as { region?: string }).region ?? "east"}
                  onValueChange={(v) => setForm({ ...form, conditionValue: { region: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="east">동부</SelectItem>
                    <SelectItem value="west">서부</SelectItem>
                    <SelectItem value="south">남부</SelectItem>
                    <SelectItem value="north">북부</SelectItem>
                    <SelectItem value="central">중산간</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* specific_set — 오름 검색 & 선택 */}
            {form.conditionType === "specific_set" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mountain size={12} />
                  오름 선택 ({selectedSlugs.length}개 선택됨)
                </Label>

                {/* 선택된 오름 칩 */}
                {selectedSlugs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSlugs.map((slug) => (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium"
                      >
                        {selectedNames[slug] ?? slug}
                        <button
                          onClick={() => removeOreum(slug)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 검색창 */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={oreumSearch}
                    onChange={(e) => setOreumSearch(e.target.value)}
                    placeholder="오름 이름 검색..."
                    className="pl-8 text-sm"
                  />
                </div>

                {/* 오름 목록 */}
                {oreumLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {filteredOreums.slice(0, 30).map((o) => (
                      <button
                        key={o.slug}
                        onClick={() => addOreum(o)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                      >
                        <span className="font-medium">{o.nameKo}</span>
                        <span className="text-xs text-muted-foreground">
                          {o.region} · #{o.tierOrder}
                        </span>
                      </button>
                    ))}
                    {filteredOreums.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">검색 결과 없음</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 보상 배지 */}
            <div className="space-y-1.5">
              <Label>보상 배지 코드 (선택)</Label>
              <Input
                value={form.rewardBadgeCode ?? ""}
                onChange={(e) => setForm({ ...form, rewardBadgeCode: e.target.value || null })}
                placeholder="예: weekly_hero"
              />
            </div>

            {/* 활성 여부 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors",
                  form.isActive ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                  form.isActive ? "left-5" : "left-0.5"
                )} />
              </button>
              <span className="text-sm text-muted-foreground">
                {form.isActive ? "즉시 활성화" : "비활성 상태로 저장"}
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setModal(false)}>취소</Button>
              <Button onClick={handleCreate} disabled={saving || !form.nameKo.trim()}>
                {saving
                  ? <Loader2 size={14} className="animate-spin mr-1.5" />
                  : <Plus size={14} className="mr-1.5" />
                }
                만들기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Circle, Loader2, Target } from "lucide-react";
import type { Challenge } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const CONDITION_TYPES: { value: Challenge["conditionType"]; label: string }[] = [
  { value: "count",          label: "발견 개수" },
  { value: "tier_complete",  label: "티어 완주" },
  { value: "region_complete",label: "지역 완주" },
  { value: "specific_set",   label: "특정 오름 세트" },
];

const EMPTY_FORM: Omit<Challenge, "id"> = {
  code:            "",
  nameKo:          "",
  descriptionKo:   "",
  conditionType:   "count",
  conditionValue:  { value: 1 },
  rewardBadgeCode: null,
  isActive:        true,
};

export default function AdminChallengesClient() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState<Omit<Challenge, "id">>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
        body: JSON.stringify({ ...form, code }),
      });
      const data = await res.json();
      if (data.id) {
        setChallenges((prev) => [...prev, { ...form, code, id: data.id }]);
        setModal(false);
        setForm(EMPTY_FORM);
      }
    } finally {
      setSaving(false);
    }
  };

  const active   = challenges.filter((c) => c.isActive).length;
  const inactive = challenges.filter((c) => !c.isActive).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">챌린지 관리</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            활성 {active}개 · 비활성 {inactive}개
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
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
          <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
            첫 챌린지 만들기
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">이름</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">코드</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">조건</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {challenges.map((ch) => (
                <tr key={ch.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ch.nameKo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{ch.descriptionKo}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ch.code}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {CONDITION_TYPES.find((t) => t.value === ch.conditionType)?.label ?? ch.conditionType}
                    </Badge>
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
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 챌린지 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>이름 *</Label>
              <Input
                value={form.nameKo}
                onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
                placeholder="예: 동부 오름 정복자"
              />
            </div>

            <div className="space-y-1.5">
              <Label>설명</Label>
              <Input
                value={form.descriptionKo}
                onChange={(e) => setForm({ ...form, descriptionKo: e.target.value })}
                placeholder="챌린지 설명"
              />
            </div>

            <div className="space-y-1.5">
              <Label>코드 (비워두면 자동 생성)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                placeholder="예: east_master_2025"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>조건 타입 *</Label>
              <Select
                value={form.conditionType}
                onValueChange={(v) => setForm({ ...form, conditionType: v as Challenge["conditionType"], conditionValue: { value: 1 } })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.conditionType === "count" && (
              <div className="space-y-1.5">
                <Label>목표 개수</Label>
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
                    <SelectItem value="beginner">비기너</SelectItem>
                    <SelectItem value="explorer">익스플로러</SelectItem>
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

            <div className="space-y-1.5">
              <Label>보상 배지 코드 (선택)</Label>
              <Input
                value={form.rewardBadgeCode ?? ""}
                onChange={(e) => setForm({ ...form, rewardBadgeCode: e.target.value || null })}
                placeholder="예: beginner_master"
              />
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

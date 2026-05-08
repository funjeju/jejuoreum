"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Store, Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Merchant, MerchantType } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const MERCHANT_TYPE_LABELS: Record<MerchantType, string> = {
  cafe: "카페", restaurant: "식당", guesthouse: "게스트하우스",
  convenience: "편의점", shop: "잡화", rentcar: "렌터카",
  experience: "체험", other: "기타",
};

const STATUS_LABELS: Record<Merchant["partnershipStatus"], string> = {
  pending: "검토중", active: "활성", inactive: "비활성",
  expired: "만료", terminated: "종료",
};

const STATUS_COLORS: Record<Merchant["partnershipStatus"], string> = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-600",
  terminated: "bg-red-100 text-red-600",
};

const EMPTY_MERCHANT: Omit<Merchant, "id" | "createdAt" | "updatedAt"> = {
  name: "", merchantType: "cafe", description: null,
  address: "", lat: null, lng: null,
  coverImageUrl: null, contactPhone: null, websiteUrl: null,
  instagramHandle: null, naverMapUrl: null, kakaoMapUrl: null,
  businessHours: null, signatureItems: [],
  relatedOreumSlugs: [], primaryOreumSlug: null,
  isPublished: false, isFeatured: false, partnershipStatus: "pending",
};

export default function AdminMerchantsClient() {
  const [merchants, setMerchants]   = useState<Merchant[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<Merchant["partnershipStatus"] | "all">("all");
  const [editing, setEditing]       = useState<Merchant | null>(null);
  const [isNew, setIsNew]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/merchants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMerchants(data.merchants ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (isNew) {
        await fetch("/api/admin/merchants", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      } else {
        await fetch(`/api/admin/merchants/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      }
      await fetchMerchants();
      setEditing(null);
      setIsNew(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 제휴 상권을 삭제하시겠어요?")) return;
    setDeleting(id);
    try {
      const token = await getToken();
      await fetch(`/api/admin/merchants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerchants((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const openNew = () => {
    setEditing({ id: "", createdAt: "", updatedAt: "", ...EMPTY_MERCHANT });
    setIsNew(true);
  };

  const filtered = merchants.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.partnershipStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = merchants.filter((m) => m.partnershipStatus === "active").length;
  const pendingCount = merchants.filter((m) => m.partnershipStatus === "pending").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">제휴 상권</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            활성 {activeCount}곳 · 검토중 {pendingCount}곳 · 총 {merchants.length}곳
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus size={15} /> 상권 추가
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "active", "pending", "inactive", "expired", "terminated"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatus(s)}
            className="h-8 text-xs"
          >
            {s === "all" ? "전체" : STATUS_LABELS[s as Merchant["partnershipStatus"]]}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상호·주소 검색..."
            className="pl-8 h-8 text-xs w-52"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Store size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">제휴 상권이 없어요</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상호</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">관련 오름</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.address}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {MERCHANT_TYPE_LABELS[m.merchantType]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.relatedOreumSlugs.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                      ))}
                      {m.relatedOreumSlugs.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{m.relatedOreumSlugs.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[m.partnershipStatus])}>
                      {STATUS_LABELS[m.partnershipStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.naverMapUrl && (
                        <a href={m.naverMapUrl} target="_blank" rel="noopener noreferrer"
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                          <ExternalLink size={13} className="text-muted-foreground" />
                        </a>
                      )}
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => { setEditing(m); setIsNew(false); }}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                      >
                        {deleting === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) { setEditing(null); setIsNew(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "제휴 상권 추가" : `${editing.name} 편집`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">상호명 *</Label>
                    <Input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      placeholder="카페 오롯"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">카테고리 *</Label>
                    <select
                      value={editing.merchantType}
                      onChange={(e) => setEditing({ ...editing, merchantType: e.target.value as MerchantType })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Object.entries(MERCHANT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">주소 *</Label>
                  <Input
                    value={editing.address}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                    placeholder="제주특별자치도..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">연락처</Label>
                    <Input
                      value={editing.contactPhone ?? ""}
                      onChange={(e) => setEditing({ ...editing, contactPhone: e.target.value || null })}
                      placeholder="064-000-0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">파트너십 상태</Label>
                    <select
                      value={editing.partnershipStatus}
                      onChange={(e) => setEditing({ ...editing, partnershipStatus: e.target.value as Merchant["partnershipStatus"] })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">설명</Label>
                  <textarea
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value || null })}
                    placeholder="상권 소개..."
                    rows={2}
                    className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">네이버 지도 URL</Label>
                    <Input
                      value={editing.naverMapUrl ?? ""}
                      onChange={(e) => setEditing({ ...editing, naverMapUrl: e.target.value || null })}
                      placeholder="https://naver.me/..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">카카오 지도 URL</Label>
                    <Input
                      value={editing.kakaoMapUrl ?? ""}
                      onChange={(e) => setEditing({ ...editing, kakaoMapUrl: e.target.value || null })}
                      placeholder="https://place.map.kakao.com/..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">관련 오름 슬러그 (쉼표 구분)</Label>
                  <Input
                    value={editing.relatedOreumSlugs.join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        relatedOreumSlugs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="saebyeol, darangshi"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">대표 오름 슬러그</Label>
                  <Input
                    value={editing.primaryOreumSlug ?? ""}
                    onChange={(e) => setEditing({ ...editing, primaryOreumSlug: e.target.value || null })}
                    placeholder="saebyeol"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">커버 이미지 URL</Label>
                  <Input
                    value={editing.coverImageUrl ?? ""}
                    onChange={(e) => setEditing({ ...editing, coverImageUrl: e.target.value || null })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editing.isPublished}
                      onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                      className="accent-primary"
                    />
                    앱에 노출
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editing.isFeatured}
                      onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                      className="accent-primary"
                    />
                    추천 상권
                  </label>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }} className="flex-1">
                    취소
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !editing.name || !editing.address} className="flex-1">
                    {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                    {isNew ? "추가" : "저장"}
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

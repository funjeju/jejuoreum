"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Loader2, Plus, Pencil, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goods, GoodsCategory, Order } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const CATEGORY_LABELS: Record<GoodsCategory, string> = {
  apparel: "의류", sticker: "스티커", postcard: "포스트카드",
  print: "프린트", accessory: "악세서리", digital: "디지털", other: "기타",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  pending: "결제대기", paid: "결제완료", preparing: "준비중",
  shipped: "배송중", delivered: "배송완료", cancelled: "취소", refunded: "환불",
};

const EMPTY_GOODS: Omit<Goods, "id" | "createdAt" | "updatedAt"> = {
  nameKo: "", descriptionKo: null, price: 0, originalPrice: null,
  imageUrls: [], category: "other", stock: null, isPublished: false,
  isLimitedEdition: false, unlockedByChallengeCode: null, relatedOreumSlug: null,
};

export default function AdminGoodsPage() {
  const [tab, setTab]             = useState<"goods" | "orders">("goods");
  const [goods, setGoods]         = useState<Goods[]>([]);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<Goods | null>(null);
  const [isNew, setIsNew]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [orderFilter, setOrderFilter] = useState<Order["status"] | "all">("all");

  const fetchGoods = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/goods", { headers: { Authorization: `Bearer ${token}` } });
      setGoods((await res.json()).goods ?? []);
    } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const q = orderFilter !== "all" ? `?status=${orderFilter}` : "";
      const res = await fetch(`/api/admin/orders${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setOrders((await res.json()).orders ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { tab === "goods" ? fetchGoods() : fetchOrders(); }, [tab, orderFilter]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (isNew) {
        await fetch("/api/admin/goods", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      } else {
        await fetch(`/api/admin/goods/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(editing),
        });
      }
      await fetchGoods();
      setEditing(null);
    } finally { setSaving(false); }
  };

  const handleDeleteGoods = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    const token = await getToken();
    await fetch(`/api/admin/goods/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setGoods((p) => p.filter((g) => g.id !== id));
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"], trackingNumber?: string) => {
    const token = await getToken();
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, ...(trackingNumber ? { trackingNumber } : {}) }),
    });
    await fetchOrders();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">굿즈 &amp; 주문</h1>
        {tab === "goods" && (
          <Button onClick={() => { setEditing({ id: "", createdAt: "", updatedAt: "", ...EMPTY_GOODS }); setIsNew(true); }} className="gap-1.5">
            <Plus size={15} /> 굿즈 추가
          </Button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        {(["goods", "orders"] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} className="h-8 text-xs">
            {t === "goods" ? <><ShoppingBag size={12} className="mr-1" />굿즈 목록</> : <><Package size={12} className="mr-1" />주문 관리</>}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : tab === "goods" ? (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                {["상품명", "카테고리", "가격", "재고", "상태", "액션"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {goods.map((g) => (
                <tr key={g.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{g.nameKo}</p>
                    {g.isLimitedEdition && <span className="text-[10px] text-amber-600">한정판</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{CATEGORY_LABELS[g.category]}</td>
                  <td className="px-4 py-3 font-semibold">{g.price.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-muted-foreground">{g.stock ?? "∞"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", g.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                      {g.isPublished ? "노출" : "숨김"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditing(g); setIsNew(false); }}><Pencil size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDeleteGoods(g.id)}><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            {(["all", "paid", "preparing", "shipped", "delivered", "cancelled"] as const).map((s) => (
              <Button key={s} size="sm" variant={orderFilter === s ? "default" : "outline"} onClick={() => setOrderFilter(s)} className="h-8 text-xs">
                {s === "all" ? "전체" : STATUS_LABELS[s as Order["status"]]}
              </Button>
            ))}
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  {["주문번호", "주문자", "상품", "금액", "상태", "액션"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{o.id.slice(0, 10)}…</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.ordererName}</p>
                      <p className="text-xs text-muted-foreground">{o.ordererPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {o.items.map((i) => `${i.nameKo} × ${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-semibold">{o.totalAmount.toLocaleString()}원</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={o.status}
                        onChange={(e) => {
                          const next = e.target.value as Order["status"];
                          if (next === "shipped") {
                            const tn = prompt("운송장 번호를 입력하세요");
                            if (tn) updateOrderStatus(o.id, next, tn);
                          } else {
                            updateOrderStatus(o.id, next);
                          }
                        }}
                        className="text-xs rounded-md border border-input bg-background px-2 py-1"
                      >
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* 굿즈 편집 다이얼로그 */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) { setEditing(null); setIsNew(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "굿즈 추가" : `${editing.nameKo} 편집`}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1"><Label className="text-xs">상품명 *</Label>
                  <Input value={editing.nameKo} onChange={(e) => setEditing({ ...editing, nameKo: e.target.value })} /></div>

                <div className="space-y-1"><Label className="text-xs">설명</Label>
                  <textarea value={editing.descriptionKo ?? ""} onChange={(e) => setEditing({ ...editing, descriptionKo: e.target.value || null })}
                    rows={2} className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring" /></div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">판매가 *</Label>
                    <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                  <div className="space-y-1"><Label className="text-xs">정가 (할인 전)</Label>
                    <Input type="number" value={editing.originalPrice ?? ""} onChange={(e) => setEditing({ ...editing, originalPrice: e.target.value ? Number(e.target.value) : null })} /></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">카테고리</Label>
                    <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as GoodsCategory })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select></div>
                  <div className="space-y-1"><Label className="text-xs">재고 (빈 칸 = 무제한)</Label>
                    <Input type="number" value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: e.target.value ? Number(e.target.value) : null })} /></div>
                </div>

                <div className="space-y-1"><Label className="text-xs">이미지 URL (쉼표 구분)</Label>
                  <Input value={editing.imageUrls.join(", ")} onChange={(e) => setEditing({ ...editing, imageUrls: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>

                <div className="flex gap-4">
                  {[
                    { key: "isPublished", label: "노출" },
                    { key: "isLimitedEdition", label: "한정판" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={editing[key as keyof Goods] as boolean}
                        onChange={(e) => setEditing({ ...editing, [key]: e.target.checked })} className="accent-primary" />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }} className="flex-1">취소</Button>
                  <Button onClick={handleSave} disabled={saving || !editing.nameKo || editing.price <= 0} className="flex-1">
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

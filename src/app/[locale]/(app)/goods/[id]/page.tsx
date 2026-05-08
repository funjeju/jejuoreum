"use client";

import { useState, useEffect, use } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ShoppingBag, Loader2, Plus, Minus, Package } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Goods } from "@/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: (clientKey: string) => any;
  }
}

export default function GoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const locale   = useLocale();
  const router   = useRouter();
  const { user } = useAuth();

  const [goods, setGoods]       = useState<Goods | null>(null);
  const [loading, setLoading]   = useState(true);
  const [qty, setQty]           = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [ordering, setOrdering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: "", phone: "", address: "", memo: "" });

  useEffect(() => {
    fetch(`/api/goods/${id}`)
      .then((r) => { if (r.status === 404) { router.replace(`/${locale}/goods`); return null; } return r.json(); })
      .then((data) => { if (data) setGoods(data.goods); })
      .finally(() => setLoading(false));
  }, [id, locale, router]);

  const handleOrder = async () => {
    if (!user || !goods) return;
    if (!form.name || !form.phone || !form.address) {
      alert("이름, 전화번호, 주소를 입력해주세요");
      return;
    }
    setOrdering(true);
    try {
      const token = await user.getIdToken();

      // 주문 생성
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ goodsId: goods.id, nameKo: goods.nameKo, price: goods.price, quantity: qty, imageUrl: goods.imageUrls[0] ?? null }],
          ordererName: form.name,
          ordererPhone: form.phone,
          deliveryAddress: form.address,
          deliveryMemo: form.memo || null,
        }),
      });
      const { orderId, totalAmount } = await orderRes.json();

      // 토스페이먼츠 위젯 결제
      const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
      if (!clientKey) { alert("결제 설정 오류"); return; }

      const toss = window.TossPayments(clientKey);
      await toss.requestPayment("카드", {
        amount: totalAmount,
        orderId,
        orderName: `${goods.nameKo} ${qty > 1 ? `외 ${qty - 1}개` : ""}`,
        customerName: form.name,
        successUrl: `${window.location.origin}/${locale}/goods/success?orderId=${orderId}`,
        failUrl: `${window.location.origin}/${locale}/goods/${id}?fail=1`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!goods) return null;

  const isSoldOut = goods.stock !== null && goods.stock === 0;
  const total = goods.price * qty;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft size={18} />
        </button>
        <span className="font-semibold text-sm flex-1">{goods.nameKo}</span>
      </div>

      {/* 이미지 갤러리 */}
      <div className="aspect-square bg-muted relative">
        {goods.imageUrls[activeImg] ? (
          <Image src={goods.imageUrls[activeImg]} alt={goods.nameKo} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag size={48} className="text-muted-foreground/30" />
          </div>
        )}
        {goods.isLimitedEdition && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
            한정판
          </span>
        )}
      </div>
      {goods.imageUrls.length > 1 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
          {goods.imageUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={cn("w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-colors", activeImg === i ? "border-primary" : "border-transparent")}
            >
              <Image src={url} alt="" width={56} height={56} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 상품 정보 */}
      <div className="px-4 pt-4 pb-4 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{goods.category}</p>
          <h1 className="text-xl font-bold">{goods.nameKo}</h1>
          <div className="flex items-center gap-2 mt-2">
            {goods.originalPrice && goods.originalPrice > goods.price && (
              <span className="text-sm text-muted-foreground line-through">{goods.originalPrice.toLocaleString()}원</span>
            )}
            <span className="text-2xl font-bold text-primary">{goods.price.toLocaleString()}원</span>
          </div>
        </div>

        {goods.descriptionKo && (
          <p className="text-sm text-muted-foreground leading-relaxed">{goods.descriptionKo}</p>
        )}

        {goods.stock !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package size={12} />
            {isSoldOut ? "품절" : `재고 ${goods.stock}개`}
          </div>
        )}

        {/* 수량 */}
        {!isSoldOut && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">수량</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(goods.stock ?? 99, q + 1))}
                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 배송 정보 입력 */}
        {!isSoldOut && showForm && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-semibold">배송 정보</p>
            {[
              { key: "name",    label: "받는 분 이름", placeholder: "홍길동" },
              { key: "phone",   label: "연락처",       placeholder: "010-0000-0000" },
              { key: "address", label: "주소",         placeholder: "제주특별자치도..." },
              { key: "memo",    label: "배송 메모",    placeholder: "문 앞에 놔주세요 (선택)" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 구매 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 flex gap-2">
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">합계</p>
          <p className="text-lg font-bold">{total.toLocaleString()}원</p>
        </div>
        {isSoldOut ? (
          <button disabled className="flex-1 py-3 rounded-2xl bg-muted text-muted-foreground font-semibold">
            품절
          </button>
        ) : !user ? (
          <button
            onClick={() => router.push(`/${locale}/auth/login`)}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold"
          >
            로그인 후 구매
          </button>
        ) : !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold"
          >
            구매하기
          </button>
        ) : (
          <button
            onClick={handleOrder}
            disabled={ordering}
            className="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {ordering ? <Loader2 size={16} className="animate-spin" /> : null}
            결제하기 ({total.toLocaleString()}원)
          </button>
        )}
      </div>
    </div>
  );
}

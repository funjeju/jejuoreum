"use client";

import { useState, useEffect, use } from "react";
import { Store, Check, Loader2, Clock, Phone, Globe, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

interface MerchantPortalData {
  name: string;
  merchantType: string;
  address: string;
  description: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  naverMapUrl: string | null;
  kakaoMapUrl: string | null;
  businessHours: Record<string, string> | null;
  coverImageUrl: string | null;
}

export default function MerchantPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData]     = useState<MerchantPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm]     = useState<Partial<MerchantPortalData>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    fetch(`/api/merchant-portal/${token}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((res) => {
        if (!res) return;
        setData(res.merchant);
        setForm({
          description:     res.merchant.description,
          contactPhone:    res.merchant.contactPhone,
          websiteUrl:      res.merchant.websiteUrl,
          instagramHandle: res.merchant.instagramHandle,
          naverMapUrl:     res.merchant.naverMapUrl,
          kakaoMapUrl:     res.merchant.kakaoMapUrl,
          businessHours:   res.merchant.businessHours ?? {},
          coverImageUrl:   res.merchant.coverImageUrl,
        });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/merchant-portal/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const setHours = (dayKey: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      businessHours: { ...(prev.businessHours ?? {}), [dayKey]: value },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Store size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-lg font-semibold mb-2">링크를 찾을 수 없어요</h1>
          <p className="text-sm text-muted-foreground">유효하지 않은 포털 링크입니다. 운영팀에 문의해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 헤더 */}
      <div className="bg-primary/5 border-b px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Store size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">제주 오름 패스포트 제휴 점주 포털</p>
            <h1 className="font-bold text-base">{data?.name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          이 링크를 통해 상점 정보를 직접 수정할 수 있어요. 링크를 타인과 공유하지 마세요.
        </div>

        {/* 기본 정보 (읽기 전용) */}
        <section className="bg-card border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3 text-muted-foreground">기본 정보 (변경 불가)</p>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-muted-foreground w-16 shrink-0">주소</span>
              <span>{data?.address}</span>
            </div>
          </div>
        </section>

        {/* 수정 가능 정보 */}
        <section className="bg-card border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold">연락 및 소개</p>

          <Field label="상점 소개">
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value || null })}
              rows={3}
              placeholder="손님에게 보여질 상점 소개..."
              className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>

          <Field label={<span className="flex items-center gap-1"><Phone size={13} />전화번호</span>}>
            <input
              type="tel"
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value || null })}
              placeholder="064-000-0000"
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>

          <Field label={<span className="flex items-center gap-1"><Globe size={13} />웹사이트</span>}>
            <input
              type="url"
              value={form.websiteUrl ?? ""}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value || null })}
              placeholder="https://..."
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>

          <Field label={<span className="flex items-center gap-1"><Instagram size={13} />인스타그램</span>}>
            <input
              type="text"
              value={form.instagramHandle ?? ""}
              onChange={(e) => setForm({ ...form, instagramHandle: e.target.value || null })}
              placeholder="@계정명 (@ 제외)"
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>
        </section>

        {/* 지도 링크 */}
        <section className="bg-card border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold">지도 링크</p>

          <Field label="네이버 지도 URL">
            <input
              type="url"
              value={form.naverMapUrl ?? ""}
              onChange={(e) => setForm({ ...form, naverMapUrl: e.target.value || null })}
              placeholder="https://naver.me/..."
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>

          <Field label="카카오 지도 URL">
            <input
              type="url"
              value={form.kakaoMapUrl ?? ""}
              onChange={(e) => setForm({ ...form, kakaoMapUrl: e.target.value || null })}
              placeholder="https://place.map.kakao.com/..."
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>
        </section>

        {/* 영업 시간 */}
        <section className="bg-card border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Clock size={14} />영업 시간
          </p>
          <div className="space-y-2">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-5 text-sm font-medium text-muted-foreground shrink-0">{label}</span>
                <input
                  type="text"
                  value={form.businessHours?.[key] ?? ""}
                  onChange={(e) => setHours(key, e.target.value)}
                  placeholder="09:00 ~ 21:00 또는 휴무"
                  className="flex-1 h-8 text-xs rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 커버 이미지 */}
        <section className="bg-card border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold">커버 이미지</p>
          <Field label="이미지 URL">
            <input
              type="url"
              value={form.coverImageUrl ?? ""}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value || null })}
              placeholder="https://..."
              className="w-full h-9 text-sm rounded-md border border-input bg-transparent px-3 outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </Field>
          {form.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.coverImageUrl} alt="커버" className="w-full h-36 object-cover rounded-lg" />
          )}
        </section>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full py-3.5 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-primary text-white hover:bg-primary/90",
            saving && "opacity-70"
          )}
        >
          {saving
            ? <><Loader2 size={16} className="animate-spin" />저장 중...</>
            : saved
            ? <><Check size={16} />저장됐어요!</>
            : "변경 사항 저장"
          }
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

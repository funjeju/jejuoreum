"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MerchantType } from "@/types";

const MERCHANT_TYPE_OPTIONS: { value: MerchantType; label: string }[] = [
  { value: "cafe",        label: "카페 / 디저트" },
  { value: "restaurant",  label: "식당" },
  { value: "guesthouse",  label: "게스트하우스 / 숙박" },
  { value: "convenience", label: "편의점 / 마트" },
  { value: "shop",        label: "잡화 / 기념품" },
  { value: "experience",  label: "체험 시설" },
  { value: "other",       label: "기타" },
];

export default function BecomePartnerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "done">("form");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    category: "" as MerchantType | "",
    address: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    businessNumber: "",
    instagramHandle: "",
    motivation: "",
  });

  const canSubmit =
    form.storeName.trim() &&
    form.category &&
    form.address.trim() &&
    form.ownerName.trim() &&
    form.ownerEmail.trim() &&
    form.ownerPhone.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: form.storeName,
          category: form.category,
          address: form.address,
          owner_name: form.ownerName,
          owner_email: form.ownerEmail,
          owner_phone: form.ownerPhone,
          business_registration_number: form.businessNumber,
          instagram_handle: form.instagramHandle || undefined,
          motivation: form.motivation,
        }),
      });
      setStep("done");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto px-5 py-16 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Check size={28} className="text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">신청이 접수됐어요</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          제휴 신청이 정상적으로 접수됐습니다.<br />
          운영팀이 검토 후 1주일 이내에 연락드릴게요.
        </p>
        <Button onClick={() => router.back()}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-32">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-base font-bold">제휴 입점 신청</h1>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* 혜택 안내 */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Store size={18} className="text-primary" />
            <p className="font-semibold text-sm">제휴 혜택</p>
          </div>
          {[
            "오름 카드 페이지에 상권 노출",
            "동선 설계 추천 후보 자동 포함",
            "인쇄물 패스포트 부록 등재",
            "도장 디자인 제작·발송 지원",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <Check size={13} className="text-primary shrink-0" />
              <p className="text-xs">{benefit}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-1 border-t border-primary/10 mt-2">
            연 입점료: 카페·식당 30~50만원 / 숙박 50~100만원
          </p>
        </div>

        {/* 신청 폼 */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>상점 이름 *</Label>
            <Input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              placeholder="예: 다랑쉬 카페"
            />
          </div>

          <div className="space-y-1.5">
            <Label>카테고리 *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as MerchantType })}
            >
              <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
              <SelectContent>
                {MERCHANT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>주소 *</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="제주특별자치도 ..."
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground">점주 정보</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>이름 *</Label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="홍길동"
                />
              </div>
              <div className="space-y-1.5">
                <Label>연락처 *</Label>
                <Input
                  value={form.ownerPhone}
                  onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                  placeholder="010-0000-0000"
                  type="tel"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>이메일 *</Label>
              <Input
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                placeholder="email@example.com"
                type="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label>사업자등록번호</Label>
              <Input
                value={form.businessNumber}
                onChange={(e) => setForm({ ...form, businessNumber: e.target.value })}
                placeholder="000-00-00000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>인스타그램 (선택)</Label>
              <Input
                value={form.instagramHandle}
                onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                placeholder="@handle"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>신청 동기 (선택)</Label>
            <textarea
              value={form.motivation}
              onChange={(e) => setForm({ ...form, motivation: e.target.value })}
              placeholder="오름 탐방객과 함께 성장하고 싶어서..."
              rows={3}
              className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
        <Button
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? <Loader2 size={16} className="animate-spin mr-2" />
            : <Store size={16} className="mr-2" />
          }
          신청하기
        </Button>
      </div>
    </div>
  );
}

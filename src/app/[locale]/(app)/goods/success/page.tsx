"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

function SuccessContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const orderId   = searchParams?.get("orderId") ?? "";
  const paymentKey = searchParams?.get("paymentKey") ?? "";
  const amount    = Number(searchParams?.get("amount") ?? 0);

  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");

  useEffect(() => {
    if (!user || !orderId || !paymentKey || !amount) { setStatus("error"); return; }
    user.getIdToken().then((token) =>
      fetch("/api/payments/toss", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })
    ).then((r) => {
      if (r.ok) setStatus("done");
      else setStatus("error");
    }).catch(() => setStatus("error"));
  }, [user, orderId, paymentKey, amount]);

  if (status === "confirming") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-muted-foreground">결제를 확인하는 중...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-semibold">결제 확인 중 문제가 발생했어요</p>
        <p className="text-sm text-muted-foreground">고객센터에 문의해주세요 (주문번호: {orderId})</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border text-sm">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <div>
        <h1 className="text-xl font-bold mb-2">주문 완료!</h1>
        <p className="text-sm text-muted-foreground">
          주문이 정상적으로 접수됐어요.<br />배송 준비 후 운송장 번호를 안내드릴게요.
        </p>
      </div>
      <p className="text-xs text-muted-foreground font-mono">주문번호: {orderId}</p>
      <Link href={`/${locale}/goods`} className="px-8 py-3 rounded-2xl bg-primary text-white font-semibold text-sm">
        쇼핑 계속하기
      </Link>
    </div>
  );
}

export default function GoodsSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}

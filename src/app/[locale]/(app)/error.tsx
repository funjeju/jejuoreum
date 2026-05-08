"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-destructive/50" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">잠깐, 뭔가 잘못됐어요</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        예상치 못한 오류가 발생했어요. 다시 시도하거나 홈으로 돌아가세요.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} className="bg-primary text-white rounded-xl h-11 px-6">
          다시 시도
        </Button>
        <Button asChild variant="outline" className="rounded-xl h-11 px-6">
          <Link href={`/${locale ?? "ko"}`}>홈으로</Link>
        </Button>
      </div>
    </div>
  );
}

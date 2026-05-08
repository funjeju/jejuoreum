import Link from "next/link";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Mountain size={36} className="text-primary/40" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg font-semibold text-foreground mb-2">페이지를 찾을 수 없어요</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        오름을 찾아 헤매다 길을 잃은 것 같아요. 다시 홈으로 돌아가볼까요?
      </p>
      <div className="flex gap-3">
        <Button asChild className="bg-primary text-white rounded-xl h-11 px-6">
          <Link href="/ko">홈으로</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl h-11 px-6">
          <Link href="/ko/collection">도감 보기</Link>
        </Button>
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  discovered: number;
  total: number;
  thisMonthDisc?: number;
}

export function CollectionStatsCard({ discovered, total, thisMonthDisc }: Props) {
  const pct = total > 0 ? Math.round((discovered / total) * 100) : 0;
  return (
    <Card className="bg-header text-white p-5 rounded-2xl border-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-white/70 mb-2">나의 도감 완성도</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-5xl font-bold leading-none">{discovered}</span>
            <span className="text-xl text-white/50">/ {total}</span>
          </div>
          <Progress
            value={pct}
            className="mt-4 h-1.5 bg-white/20 [&>div]:bg-white [&>div]:transition-all [&>div]:duration-700"
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-white/50">{pct}% 완료</p>
            {thisMonthDisc !== undefined && thisMonthDisc > 0 && (
              <p className="text-xs text-white/60">이번 달 +{thisMonthDisc}개</p>
            )}
          </div>
        </div>

        <div className="ml-4 shrink-0 opacity-60">
          <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
            <circle cx="32" cy="12" r="8" fill="white" opacity="0.9" />
            <path d="M24 28h16l-3 24h-10l-3-24z" fill="white" opacity="0.7" />
            <path d="M20 30 L12 52" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M44 30 L52 52" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M27 52 L22 72" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M37 52 L42 72" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <path d="M12 52 L20 48" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

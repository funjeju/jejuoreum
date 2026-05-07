"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface Props {
  total:    { discovered: number; total: number };
  beginner: { discovered: number; total: number };
  explorer: { discovered: number; total: number };
}

export function ProgressOverviewCard({ total, beginner, explorer }: Props) {
  const pct = total.total > 0 ? Math.round((total.discovered / total.total) * 100) : 0;
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];

  return (
    <Card className="p-4 rounded-2xl shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">나의 탐방 현황</h3>

      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={34}
                outerRadius={46}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill="var(--primary)" />
                <Cell fill="var(--border)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold leading-none">{pct}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">완료</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <ProgressRow label="비기너" current={beginner.discovered} total={beginner.total} color="bg-emerald-500" />
          <ProgressRow label="익스플로러" current={explorer.discovered} total={explorer.total} color="bg-blue-500" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">마스터</span>
            <span className="text-muted-foreground font-medium">추후 공개</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProgressRow({ label, current, total, color }: {
  label: string; current: number; total: number; color: string;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{current} <span className="text-muted-foreground font-normal">/ {total}</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

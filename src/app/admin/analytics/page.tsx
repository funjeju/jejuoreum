"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Loader2, TrendingUp, Users, Mountain, Clock, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const REGION_LABELS: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

interface Analytics {
  monthlyActivity:  { month: string; count: number }[];
  regionActivity:   { region: string; count: number }[];
  monthlyNewUsers:  { month: string; count: number }[];
  topOreums:        { slug: string; name: string; count: number }[];
  peakHour:         { hour: number; count: number } | null;
  totalDiscoveriesInPeriod: number;
}

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

function Bar({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span className="text-[10px] text-muted-foreground font-medium h-3">{value > 0 ? value : ""}</span>
      <div className={cn("w-full rounded-t-sm", value > 0 ? colorClass : "bg-muted")}
        style={{ height: `${Math.max(pct, value > 0 ? 4 : 2)}%` }} />
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData]     = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) =>
      fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, []);

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>;
  if (!data) return <div className="p-8 text-muted-foreground">데이터를 불러올 수 없어요</div>;

  const maxActivity = Math.max(...data.monthlyActivity.map((m) => m.count), 1);
  const maxUsers    = Math.max(...data.monthlyNewUsers.map((m) => m.count), 1);
  const maxRegion   = Math.max(...data.regionActivity.map((r) => r.count), 1);

  const peakHourLabel = data.peakHour
    ? `${data.peakHour.hour}시~${data.peakHour.hour + 1}시`
    : "—";

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><TrendingUp size={22} />탐험 분석</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Mountain, label: "6개월 탐험", value: data.totalDiscoveriesInPeriod.toLocaleString() },
          { icon: Clock,    label: "피크 시간대", value: peakHourLabel },
          { icon: Map,      label: "최다 지역",   value: data.regionActivity[0] ? (REGION_LABELS[data.regionActivity[0].region] ?? data.regionActivity[0].region) : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 월별 탐험 활동 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-4 flex items-center gap-1.5"><TrendingUp size={14} className="text-primary" />월별 탐험 수</p>
          <div className="flex items-end gap-2 h-32">
            {data.monthlyActivity.map(({ month, count }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                <Bar value={count} max={maxActivity} colorClass="bg-primary/80" />
                <span className="text-[9px] text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 월별 신규 사용자 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-4 flex items-center gap-1.5"><Users size={14} className="text-primary" />월별 신규 가입</p>
          <div className="flex items-end gap-2 h-32">
            {data.monthlyNewUsers.map(({ month, count }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                <Bar value={count} max={maxUsers} colorClass="bg-emerald-500/70" />
                <span className="text-[9px] text-muted-foreground">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 지역별 탐험 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Map size={14} className="text-primary" />지역별 탐험 (6개월)</p>
          <div className="space-y-2">
            {data.regionActivity.map(({ region, count }) => (
              <div key={region}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium">{REGION_LABELS[region] ?? region}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500/70 rounded-full" style={{ width: `${(count / maxRegion) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 인기 오름 Top 5 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Mountain size={14} className="text-primary" />인기 오름 Top 5 (30일)</p>
          <div className="space-y-2">
            {data.topOreums.map(({ slug, name, count }, idx) => (
              <div key={slug} className="flex items-center gap-2">
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  idx === 0 ? "bg-amber-100 text-amber-700" :
                  idx === 1 ? "bg-gray-100 text-gray-600" :
                  idx === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                )}>{idx + 1}</span>
                <span className="flex-1 text-xs truncate">{name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{count}회</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

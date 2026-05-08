"use client";

import Link from "next/link";
import {
  Mountain, Users, CheckCircle2, Image as ImageIcon,
  Flag, TrendingUp, Store, Camera,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stats {
  oreumCount: number;
  userCount: number;
  todayDiscoveryCount: number;
  pendingPhotoCount: number;
  pendingReportCount: number;
  pendingTrendAlertCount: number;
  pendingMerchantCount: number;
}

export default function AdminDashboard({ stats }: { stats: Stats }) {
  const pendingTotal =
    stats.pendingPhotoCount +
    stats.pendingReportCount +
    stats.pendingTrendAlertCount +
    stats.pendingMerchantCount;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          처리 대기 총 <span className={cn("font-semibold", pendingTotal > 0 ? "text-amber-600" : "text-emerald-600")}>{pendingTotal}건</span>
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<Users size={20} className="text-blue-600" />}
          bg="bg-blue-50"
          label="전체 탐험가"
          value={stats.userCount}
        />
        <KpiCard
          icon={<Mountain size={20} className="text-primary" />}
          bg="bg-primary/10"
          label="오름 수"
          value={stats.oreumCount}
        />
        <KpiCard
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="오늘 발견"
          value={stats.todayDiscoveryCount}
        />
        <KpiCard
          icon={<Camera size={20} className="text-violet-600" />}
          bg="bg-violet-50"
          label="미승인 사진"
          value={stats.pendingPhotoCount}
          alert={stats.pendingPhotoCount > 0}
          href="/admin/oreums"
        />
      </div>

      {/* 처리 대기 요약 */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">처리 대기</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PendingCard
            icon={<TrendingUp size={16} />}
            label="트렌드 알림"
            count={stats.pendingTrendAlertCount}
            href="/admin/trend-alerts"
          />
          <PendingCard
            icon={<Flag size={16} />}
            label="신고 처리"
            count={stats.pendingReportCount}
            href="/admin/reports"
          />
          <PendingCard
            icon={<Store size={16} />}
            label="입점 신청"
            count={stats.pendingMerchantCount}
            href="/admin/merchants"
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, bg, label, value, alert, href,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <Card className={cn("p-5 transition-colors", href && "hover:bg-muted/30 cursor-pointer")}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
          {icon}
        </div>
      </div>
      <p className={cn("text-3xl font-bold", alert && value > 0 && "text-amber-600")}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function PendingCard({
  icon, label, count, href,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            count > 0 ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={cn(
          "text-sm font-bold tabular-nums",
          count > 0 ? "text-amber-600" : "text-muted-foreground"
        )}>
          {count > 0 ? `${count}건` : "없음"}
        </span>
      </Card>
    </Link>
  );
}

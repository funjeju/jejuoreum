"use client";

import { Mountain, Users, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  stats: { oreumCount: number; userCount: number };
}

export default function AdminDashboard({ stats }: Props) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Mountain size={20} className="text-primary" />} label="오름 수" value={stats.oreumCount} />
        <StatCard icon={<Users size={20} className="text-blue-600" />} label="탐험가" value={stats.userCount} />
        <StatCard icon={<CheckCircle2 size={20} className="text-emerald-600" />} label="발견 기록" value="—" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-muted-foreground">{label}</span></div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}

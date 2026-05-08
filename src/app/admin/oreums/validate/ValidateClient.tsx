"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  AlertCircle, AlertTriangle, CheckCircle2,
  RefreshCw, ChevronLeft, ArrowUpRight,
} from "lucide-react";
import type { OreumIssue } from "@/app/api/admin/oreums/validate/route";

type FilterMode = "all" | "issues" | "warnings";

interface Summary {
  total: number;
  withIssues: number;
  withWarnings: number;
  noCoords: number;
  noThumbnail: number;
  noMbti: number;
}

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export default function ValidateClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<OreumIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterMode>("all");

  const load = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/oreums/validate", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSummary(data.summary);
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = results.filter((r) => {
    if (filter === "issues")   return r.issues.length > 0;
    if (filter === "warnings") return r.warnings.length > 0 && r.issues.length === 0;
    return true;
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/oreums">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">검증 리포트</h1>
          <p className="text-muted-foreground text-sm mt-0.5">누락 필드 및 좌표 이상치 검사</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin mr-1.5" : "mr-1.5"} />
          새로고침
        </Button>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">전체 오름</p>
            <p className="text-3xl font-bold">{summary.total}</p>
          </Card>
          <Card className="p-4 border-red-200 bg-red-50/40">
            <p className="text-xs text-red-600 mb-1">오류 (즉시 수정 필요)</p>
            <p className="text-3xl font-bold text-red-600">{summary.withIssues}</p>
          </Card>
          <Card className="p-4 border-amber-200 bg-amber-50/40">
            <p className="text-xs text-amber-600 mb-1">경고 (권장 수정)</p>
            <p className="text-3xl font-bold text-amber-600">{summary.withWarnings}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">좌표 없음/이상</p>
            <p className="text-2xl font-bold">{summary.noCoords}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">썸네일 없음</p>
            <p className="text-2xl font-bold">{summary.noThumbnail}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">MBTI 미매핑</p>
            <p className="text-2xl font-bold">{summary.noMbti}</p>
          </Card>
        </div>
      )}

      {/* 필터 탭 */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all",      label: `전체 (${results.length})` },
          { key: "issues",   label: `오류 (${results.filter((r) => r.issues.length > 0).length})` },
          { key: "warnings", label: `경고만 (${results.filter((r) => r.warnings.length > 0 && r.issues.length === 0).length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
          <p className="font-semibold text-lg">문제 없음</p>
          <p className="text-muted-foreground text-sm mt-1">선택한 필터에 해당하는 오름이 없어요</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">오름</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">지역</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">오류</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">경고</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className={r.issues.length > 0 ? "bg-red-50/30" : "bg-amber-50/20"}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.nameKo}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.region}</td>
                    <td className="px-4 py-3">
                      {r.isPublished
                        ? <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">발행</Badge>
                        : <Badge variant="outline" className="text-xs text-muted-foreground">미발행</Badge>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {r.issues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-1 text-xs text-red-600">
                            <AlertCircle size={11} className="mt-0.5 shrink-0" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {r.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1 text-xs text-amber-600">
                            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                            {w}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href="/admin/oreums">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          편집 <ArrowUpRight size={11} className="ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            {filtered.length}개 표시 / 전체 {results.length}개 문제
          </div>
        </Card>
      )}
    </div>
  );
}

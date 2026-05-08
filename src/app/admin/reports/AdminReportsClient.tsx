"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { CheckCircle2, XCircle, EyeOff, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  reporterId: string;
  targetType: "comment" | "photo" | "user";
  targetId: string;
  reason: string;
  detail: string | null;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAction?: string;
  resolvedAt?: string;
}

const TARGET_LABELS: Record<string, string> = {
  comment: "후기", photo: "사진", user: "사용자",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "처리 대기", resolved: "처리 완료", dismissed: "기각",
};
const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  dismissed:"bg-gray-100 text-gray-600 border-gray-200",
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export default function AdminReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved" | "dismissed" | "all">("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => { fetchReports(); }, [statusFilter]);

  const fetchReports = async () => {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "hide_content" | "dismiss" | "warn_user") => {
    const token = await getToken();
    if (!token) return;
    setUpdating(id);
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setReports((prev) => prev.map((r) =>
        r.id === id
          ? { ...r, status: action === "dismiss" ? "dismissed" : "resolved", resolvedAction: action }
          : r
      ));
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Flag size={18} className="text-destructive" /> 신고 처리
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-destructive mt-0.5">{pendingCount}건 처리 대기 중</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["pending", "all", "resolved", "dismissed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border",
              statusFilter === s
                ? "bg-primary text-white border-primary"
                : "bg-white border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s === "all" ? "전체" : STATUS_LABELS[s]}
            {s === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-destructive text-white rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">불러오는 중...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {statusFilter === "pending" ? "처리할 신고가 없어요" : "신고 내역이 없어요"}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {TARGET_LABELS[report.targetType] ?? report.targetType} 신고
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{report.targetId.slice(0, 12)}…</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    신고일: {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                    {report.resolvedAt && ` · 처리일: ${new Date(report.resolvedAt).toLocaleDateString("ko-KR")}`}
                  </p>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0", STATUS_COLORS[report.status])}>
                  {STATUS_LABELS[report.status]}
                </span>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-0.5">신고 사유</p>
                <p className="text-sm font-medium">{report.reason}</p>
                {report.detail && <p className="text-xs text-muted-foreground mt-1">{report.detail}</p>}
              </div>

              {report.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    disabled={updating === report.id}
                    onClick={() => handleAction(report.id, "hide_content")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <EyeOff size={12} /> 콘텐츠 숨김
                  </button>
                  <button
                    disabled={updating === report.id}
                    onClick={() => handleAction(report.id, "warn_user")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={12} /> 경고 처리
                  </button>
                  <button
                    disabled={updating === report.id}
                    onClick={() => handleAction(report.id, "dismiss")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} /> 기각
                  </button>
                  {updating === report.id && <Clock size={14} className="text-muted-foreground animate-spin ml-1" />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

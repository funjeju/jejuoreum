"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { CheckCircle2, XCircle, Scan, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendAlert } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "검토 대기", approved: "승인됨", ignored: "무시됨",
};
const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ignored:  "bg-gray-100 text-gray-600 border-gray-200",
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export default function AdminTrendAlertsClient() {
  const [alerts, setAlerts] = useState<TrendAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "ignored" | "all">("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editMessages, setEditMessages] = useState<Record<string, string>>({});
  const [detectResult, setDetectResult] = useState<{ created: number; scannedOreums: number } | null>(null);

  useEffect(() => { fetchAlerts(); }, [statusFilter]);

  const fetchAlerts = async () => {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trend-alerts?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const runDetection = async () => {
    const token = await getToken();
    if (!token) return;
    setDetecting(true);
    setDetectResult(null);
    try {
      const res = await fetch("/api/admin/trend-alerts/detect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetectResult(data);
        if (statusFilter === "pending") fetchAlerts();
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "ignore") => {
    const token = await getToken();
    if (!token) return;
    setUpdating(id);
    try {
      await fetch(`/api/admin/trend-alerts/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action, approvedMessage: editMessages[id] ?? null }),
      });
      setAlerts((prev) => prev.map((a) =>
        a.id === id ? { ...a, status: action === "approve" ? "approved" : "ignored", isActive: action === "approve" } : a
      ));
    } finally {
      setUpdating(null);
    }
  };

  const pendingCount = alerts.filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">트렌드 알림</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">{pendingCount}건 검토 대기 중</p>
          )}
        </div>
        <button
          onClick={runDetection}
          disabled={detecting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Scan size={15} className={detecting ? "animate-spin" : ""} />
          {detecting ? "감지 중..." : "감지 실행"}
        </button>
      </div>

      {detectResult && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          감지 완료 — {detectResult.scannedOreums}개 오름 스캔, {detectResult.created}건 새 알림 생성
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(["pending", "all", "approved", "ignored"] as const).map((s) => (
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
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">불러오는 중...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {statusFilter === "pending" ? "검토할 트렌드 알림이 없어요. 감지 실행 후 확인하세요." : "알림 내역이 없어요"}
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                    <h2 className="font-bold text-base">{alert.oreumNameKo}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {alert.alertType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    감지일: {new Date(alert.detectedAt).toLocaleDateString("ko-KR")}
                    {" · "}관련 후기 {alert.relatedCommentCount}건
                    {" · "}신뢰도 {Math.round(alert.confidence * 100)}%
                  </p>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0", STATUS_COLORS[alert.status])}>
                  {STATUS_LABELS[alert.status]}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">감지된 키워드</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {alert.detectedKeywords.map((kw) => (
                    <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">{kw}</span>
                  ))}
                </div>
                <p className="text-xs font-semibold text-amber-900">자동 메시지: {alert.autoMessage}</p>
              </div>

              {alert.status === "pending" && (
                <>
                  <div className="mb-3">
                    <label className="text-xs text-muted-foreground font-semibold block mb-1">
                      노출 메시지 (비워두면 자동 메시지 사용)
                    </label>
                    <input
                      type="text"
                      value={editMessages[alert.id] ?? ""}
                      onChange={(e) => setEditMessages((prev) => ({ ...prev, [alert.id]: e.target.value }))}
                      placeholder={alert.autoMessage}
                      className="w-full text-sm border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      disabled={updating === alert.id}
                      onClick={() => handleAction(alert.id, "approve")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> 활성화 (14일)
                    </button>
                    <button
                      disabled={updating === alert.id}
                      onClick={() => handleAction(alert.id, "ignore")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} /> 무시
                    </button>
                    {updating === alert.id && <Clock size={14} className="text-muted-foreground animate-spin ml-1" />}
                  </div>
                </>
              )}

              {alert.status === "approved" && alert.activeTo && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  노출 기간: {new Date(alert.activeFrom!).toLocaleDateString("ko-KR")} ~ {new Date(alert.activeTo).toLocaleDateString("ko-KR")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

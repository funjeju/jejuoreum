"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { CheckCircle2, XCircle, Clock, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerApplication {
  id: string;
  storeName: string;
  category: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessRegistrationNumber: string | null;
  instagramHandle: string | null;
  motivation: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cafe: "카페", restaurant: "식당", guesthouse: "게스트하우스",
  convenience: "편의점", shop: "잡화", rentcar: "렌터카", experience: "체험", other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "검토 대기", approved: "승인됨", rejected: "거절됨",
};
const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

async function getToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export default function AdminApplicationsClient() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/merchants/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: "approved" | "rejected", note?: string) => {
    const token = await getToken();
    if (!token) return;
    setUpdating(id);
    try {
      await fetch(`/api/admin/merchants/applications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: note }),
      });
      setApplications((prev) =>
        prev.map((a) => a.id === id ? { ...a, status, reviewedAt: new Date().toISOString() } : a)
      );
    } finally {
      setUpdating(null);
    }
  };

  const filtered = applications.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">제휴 입점 신청</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">{pendingCount}건 검토 대기 중</p>
          )}
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {(["pending", "all", "approved", "rejected"] as const).map((s) => (
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
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {statusFilter === "pending" ? "검토 대기 중인 신청이 없어요" : "신청 내역이 없어요"}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <div key={app.id} className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-base">{app.storeName}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {CATEGORY_LABELS[app.category] ?? app.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    신청일: {new Date(app.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0", STATUS_COLORS[app.status])}>
                  {STATUS_LABELS[app.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground text-xs">{app.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-xs">{app.ownerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-muted-foreground shrink-0" />
                  <a href={`mailto:${app.ownerEmail}`} className="text-xs text-primary hover:underline">{app.ownerEmail}</a>
                </div>
                {app.instagramHandle && (
                  <div className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-muted-foreground shrink-0" />
                    <a href={`https://instagram.com/${app.instagramHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      {app.instagramHandle}
                    </a>
                  </div>
                )}
              </div>

              {app.motivation && (
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">신청 동기</p>
                  <p className="text-xs">{app.motivation}</p>
                </div>
              )}

              {app.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  <button
                    disabled={updating === app.id}
                    onClick={() => handleStatus(app.id, "approved")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> 승인
                  </button>
                  <button
                    disabled={updating === app.id}
                    onClick={() => handleStatus(app.id, "rejected")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle size={13} /> 거절
                  </button>
                  {updating === app.id && <Clock size={14} className="text-muted-foreground animate-spin ml-1" />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

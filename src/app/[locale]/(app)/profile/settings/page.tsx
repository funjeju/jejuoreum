"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Globe, Clock, Lock, Bell, BellOff, Download, UserX } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

type Visibility = "public" | "delay_10min" | "private";

interface UserSettings {
  defaultDiscoveryVisibility: Visibility;
  showInFeed: boolean;
}

const VISIBILITY_OPTIONS: { value: Visibility; icon: React.ReactNode; label: string; desc: string }[] = [
  { value: "public",      icon: <Globe size={16} />,  label: "전체 공개",    desc: "모든 사람의 피드에 표시돼요" },
  { value: "delay_10min", icon: <Clock size={16} />,  label: "10분 후 공개", desc: "발견 후 10분 뒤에 피드에 표시돼요" },
  { value: "private",     icon: <Lock size={16} />,   label: "비공개",       desc: "나만 볼 수 있어요" },
];

export default function ProfileSettingsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  const [settings, setSettings] = useState<UserSettings>({
    defaultDiscoveryVisibility: "public",
    showInFeed: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => {
      fetch("/api/me/blocks", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setBlockedUsers(data.blocked ?? []))
        .catch(() => {});
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          defaultDiscoveryVisibility: data.defaultDiscoveryVisibility ?? "public",
          showInFeed: data.showInFeed ?? true,
        });
      }
      setLoading(false);
    });
  }, [user]);

  const save = async (next: UserSettings) => {
    if (!user) return;
    setSaving(true);
    await updateDoc(doc(db, "users", user.uid), {
      defaultDiscoveryVisibility: next.defaultDiscoveryVisibility,
      showInFeed: next.showInFeed,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    save(next);
  };

  if (!user) {
    router.replace(`/${locale}/auth/login`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title="알림 및 공개 설정" />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-5">

        {/* 발견 기록 기본 공개 범위 */}
        <section className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold mb-1">발견 기록 기본 공개 범위</p>
          <p className="text-xs text-muted-foreground mb-4">새 오름 발견 시 기본으로 적용되는 공개 설정이에요</p>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update({ defaultDiscoveryVisibility: opt.value })}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                    settings.defaultDiscoveryVisibility === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    settings.defaultDiscoveryVisibility === opt.value ? "bg-primary/15" : "bg-muted"
                  )}>
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                  {settings.defaultDiscoveryVisibility === opt.value && (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 피드 노출 */}
        <section className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                {settings.showInFeed ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-semibold">피드에 내 활동 표시</p>
                <p className="text-xs text-muted-foreground mt-0.5">발견 기록이 다른 사용자 피드에 노출돼요</p>
              </div>
            </div>
            <button
              onClick={() => update({ showInFeed: !settings.showInFeed })}
              disabled={loading || saving}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors shrink-0",
                settings.showInFeed ? "bg-primary" : "bg-muted-foreground/25"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                settings.showInFeed ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </section>

        {/* 차단 사용자 관리 */}
        {blockedUsers.length > 0 && (
          <section className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserX size={15} className="text-muted-foreground" />
              <p className="text-sm font-semibold">차단한 사용자</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">차단을 해제하면 해당 사용자의 후기가 다시 보여요</p>
            <div className="space-y-2">
              {blockedUsers.map((uid) => (
                <div key={uid} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-xs font-mono text-muted-foreground">{uid.slice(0, 16)}…</span>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      setUnblocking(uid);
                      try {
                        const token = await user.getIdToken();
                        await fetch("/api/me/blocks", {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                          body: JSON.stringify({ targetUid: uid, unblock: true }),
                        });
                        setBlockedUsers((prev) => prev.filter((u) => u !== uid));
                      } finally {
                        setUnblocking(null);
                      }
                    }}
                    disabled={unblocking === uid}
                    className="text-xs text-primary font-semibold hover:underline disabled:opacity-50"
                  >
                    {unblocking === uid ? "해제 중..." : "차단 해제"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 데이터 내보내기 */}
        <section className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold mb-1">내 데이터 내보내기</p>
          <p className="text-xs text-muted-foreground mb-4">발견 기록, 위시리스트, 후기 등 모든 데이터를 JSON 파일로 받아요</p>
          <button
            onClick={async () => {
              if (!user || exporting) return;
              setExporting(true);
              try {
                const token = await user.getIdToken();
                const res = await fetch("/api/me/export", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `oreum-data-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {exporting ? "내보내는 중..." : "데이터 다운로드"}
          </button>
        </section>

        {saving && <p className="text-center text-xs text-muted-foreground">저장 중...</p>}
        {saved && <p className="text-center text-xs text-primary font-semibold">저장됐어요 ✓</p>}

      </div>
    </div>
  );
}

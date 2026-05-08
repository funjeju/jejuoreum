"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISSED_KEY = "push_opt_dismissed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushOptIn() {
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "subscribed" | "denied" | "hidden">("hidden");

  useEffect(() => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    if (!VAPID_PUBLIC_KEY) return;

    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        subscribePush();
      } else if (perm === "denied") {
        setState("denied");
      } else {
        setState("idle");
      }
    });
  }, [user]);

  const subscribePush = async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const token = await user.getIdToken();
      await fetch("/api/me/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub.toJSON()),
      });
      setState("subscribed");
      setTimeout(() => setState("hidden"), 3000);
    } catch {
      setState("hidden");
    }
  };

  const handleAllow = () => {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") subscribePush();
      else setState("denied");
    });
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setState("hidden");
  };

  if (state === "hidden") return null;

  if (state === "subscribed") {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg">
        <Bell size={13} />
        알림이 설정되었어요
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="fixed bottom-24 inset-x-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <BellOff size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">알림이 차단되어 있어요</p>
          <p className="text-xs text-muted-foreground mt-0.5">브라우저 설정에서 알림을 허용하면 배지·팔로우 소식을 받을 수 있어요.</p>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 inset-x-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">새 오름 발견 알림</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            배지 획득, 팔로워 소식을 푸시 알림으로 받아보세요
          </p>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAllow}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-semibold bg-primary text-white",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          알림 받기
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 py-2 rounded-xl text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          나중에
        </button>
      </div>
    </div>
  );
}

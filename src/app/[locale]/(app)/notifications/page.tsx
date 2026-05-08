"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bell, Check, ChevronRight, ShoppingBag, User, Award, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/types";

const TYPE_ICON: Record<AppNotification["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  badge_earned:               Award,
  season_badge_earned:        Sparkles,
  new_follower:               User,
  friend_discovery_wishlist:  Bell,
  order_status_changed:       ShoppingBag,
};

const TYPE_COLOR: Record<AppNotification["type"], string> = {
  badge_earned:               "bg-amber-100 text-amber-600",
  season_badge_earned:        "bg-purple-100 text-purple-600",
  new_follower:               "bg-blue-100 text-blue-600",
  friend_discovery_wishlist:  "bg-emerald-100 text-emerald-600",
  order_status_changed:       "bg-orange-100 text-orange-600",
};

export default function NotificationsPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("notifications");
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch("/api/me/notifications?limit=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    fetchNotifications();
  }, [user, authLoading]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    const token = await user.getIdToken();
    await fetch("/api/me/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarkingAll(false);
  };

  const handleTap = async (notif: AppNotification) => {
    if (!notif.isRead && user) {
      const token = await user.getIdToken();
      fetch("/api/me/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: [notif.id] }),
      }).catch(() => {});
      setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    if (notif.link) router.push(`/${locale}${notif.link}`);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t("title")} />

      <div className="max-w-lg mx-auto">
        {/* 상단 툴바 */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? t("unread_count", { count: unreadCount }) : t("all_read")}
          </p>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={handleMarkAllRead} disabled={markingAll}
              className="text-xs h-7 gap-1 text-primary">
              {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {t("mark_all_read")}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell size={24} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("empty_title")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("empty_sub")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => {
              const Icon = TYPE_ICON[notif.type] ?? Bell;
              const colorClass = TYPE_COLOR[notif.type] ?? "bg-muted text-muted-foreground";
              return (
                <button
                  key={notif.id}
                  onClick={() => handleTap(notif)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-muted/30 transition-colors",
                    !notif.isRead && "bg-primary/5"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold", !notif.isRead ? "text-foreground" : "text-foreground/80")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                    {notif.link && <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

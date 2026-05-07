"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, BookOpen, MapPin, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const LEFT = [
  { key: "home",       href: "/",          labelKey: "home",       Icon: Home },
  { key: "collection", href: "/collection", labelKey: "collection", Icon: BookOpen },
] as const;

const RIGHT = [
  { key: "wishlist", href: "/wishlist", labelKey: "wishlist", Icon: Heart },
  { key: "my",       href: "/profile",  labelKey: "my",       Icon: User },
] as const;

export default function BottomNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [badgeNotification, setBadgeNotification] = useState(false);

  useEffect(() => {
    setBadgeNotification(localStorage.getItem("badge_notification") === "1");
  }, [pathname]);

  const isActive = (href: string) => {
    const full = `/${locale}${href}`;
    return href === "/" ? pathname === full : pathname.startsWith(full);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-end justify-around max-w-lg mx-auto h-16 px-2">
        {LEFT.map(({ key, href, labelKey, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={key}
              href={`/${locale}${href}`}
              className={cn(
                "flex flex-col items-center gap-0.5 pt-2 pb-1 px-5",
                "text-[11px] font-medium transition-colors duration-150",
                active ? "text-primary" : "text-muted-foreground/70"
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.7}
                fill={key === "home" && active ? "currentColor" : "none"}
              />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}

        {/* 중앙 인증 플로팅 버튼 */}
        <div className="flex flex-col items-center pb-1">
          <button
            onClick={() => router.push(`/${locale}/qr`)}
            aria-label={t("verify")}
            className={cn(
              "w-[52px] h-[52px] rounded-2xl bg-primary flex items-center justify-center",
              "shadow-[0_4px_16px_rgba(26,77,46,0.50)] -translate-y-3",
              "active:scale-95 transition-transform duration-100"
            )}
          >
            <MapPin size={22} color="white" strokeWidth={2} />
          </button>
          <span className="text-[10px] text-muted-foreground font-medium -mt-1.5">{t("verify")}</span>
        </div>

        {RIGHT.map(({ key, href, labelKey, Icon }) => {
          const active = isActive(href);
          const hasDot = key === "my" && badgeNotification;
          return (
            <Link
              key={key}
              href={`/${locale}${href}`}
              className={cn(
                "flex flex-col items-center gap-0.5 pt-2 pb-1 px-5",
                "text-[11px] font-medium transition-colors duration-150",
                active ? "text-primary" : "text-muted-foreground/70"
              )}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.7}
                  fill={key === "wishlist" && active ? "currentColor" : "none"}
                />
                {hasDot && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
                )}
              </div>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

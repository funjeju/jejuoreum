"use client";

import { useState, useEffect } from "react";
import { Menu, Bell, Search } from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "제주 오름 패스포트" }: HeaderProps) {
  const locale = useLocale();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    user.getIdToken().then((token) =>
      fetch("/api/me/notifications?unreadOnly=true&limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setUnread(d.unreadCount ?? 0))
        .catch(() => {})
    );
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-header px-4 text-white">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="bg-header px-6 py-8 text-white shrink-0">
            <SheetTitle className="text-white text-lg font-bold">제주 오름 패스포트</SheetTitle>
            <p className="text-white/70 text-sm mt-1">
              {user ? `${user.displayName ?? "탐험가"}님` : "로그인하여 시작하세요"}
            </p>
          </SheetHeader>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {[
              { href: `/${locale}`,               label: "홈" },
              { href: `/${locale}/collection`,    label: "오름 도감" },
              { href: `/${locale}/wishlist`,      label: "위시리스트" },
              { href: `/${locale}/challenges`,    label: "챌린지" },
              { href: `/${locale}/goods`,         label: "굿즈 스토어" },
              { href: `/${locale}/quiz`,          label: "오름 MBTI" },
              { href: `/${locale}/ar`,            label: "AR 둘러보기" },
              { href: `/${locale}/search`,        label: "검색" },
              { href: `/${locale}/profile`,       label: "프로필" },
              { href: `/${locale}/notifications`, label: "알림" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {label}
              </Link>
            ))}
            <Separator className="my-2" />
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                로그인
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-semibold">{title}</h1>

      <div className="flex items-center gap-1">
        <Link href={`/${locale}/search`}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
            <Search className="h-5 w-5" />
          </Button>
        </Link>

        <Link href={`/${locale}/notifications`}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-2 top-2 min-w-[16px] h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-0.5">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </Link>
      </div>
    </header>
  );
}

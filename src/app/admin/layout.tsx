"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Mountain, LayoutDashboard, List, LogOut, CheckCircle2, Users, Camera, MessageSquare, FileText, ShieldAlert } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin",                     icon: LayoutDashboard, label: "대시보드" },
  { href: "/admin/oreums",              icon: List,            label: "오름 관리" },
  { href: "/admin/oreums/mbti-mapping", icon: Mountain,        label: "MBTI 매핑" },
  { href: "/admin/oreums/validate",     icon: ShieldAlert,     label: "검증 리포트" },
  { href: "/admin/photos/queue",        icon: Camera,          label: "사진 큐" },
  { href: "/admin/comments/queue",      icon: MessageSquare,   label: "코멘트 큐" },
  { href: "/admin/seo-contents",        icon: FileText,        label: "SEO 콘텐츠" },
  { href: "/admin/challenges",          icon: CheckCircle2,    label: "챌린지" },
  { href: "/admin/users",               icon: Users,           label: "사용자" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [checking, setChecking] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setChecking(false); return; }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/admin/login"); return; }
      const token = await user.getIdTokenResult();
      if (!token.claims.admin) { router.replace("/admin/login"); return; }
      setChecking(false);
    });
    return unsub;
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-56 bg-header flex flex-col">
        <div className="px-5 py-6 flex items-center gap-2.5 border-b border-white/10">
          <Mountain size={20} className="text-white" />
          <span className="text-white font-bold text-sm">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                (href === "/admin" ? pathname === href : pathname.startsWith(href))
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => auth.signOut().then(() => router.push("/admin/login"))}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

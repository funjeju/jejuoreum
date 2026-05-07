"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { User, Award, Mountain, LogOut, ChevronRight, Leaf } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserProfile, getUserDiscoveries } from "@/lib/firestore/users";
import { Header } from "@/components/layout/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile, UserDiscovery } from "@/types";

const MBTI_TITLES: Record<string, string> = {
  INTJ: "고독한 탐험가",   INTP: "지식 탐구자",
  ENTJ: "오름의 지휘관",  ENTP: "호기심 많은 등반가",
  INFJ: "신비로운 안내자", INFP: "낭만적인 탐방인",
  ENFJ: "모두를 품는 리더", ENFP: "자유로운 영혼",
  ISTJ: "성실한 기록자",  ISFJ: "포근한 동반자",
  ESTJ: "든든한 탐험대장", ESFJ: "따뜻한 길잡이",
  ISTP: "조용한 강자",    ISFP: "감성적인 탐방인",
  ESTP: "스릴 러버",      ESFP: "즐거운 탐험가",
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [discoveries, setDiscoveries]  = useState<UserDiscovery[]>([]);
  const [loading, setLoading]          = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([getUserProfile(user.uid), getUserDiscoveries(user.uid)]).then(([p, d]) => {
      setProfile(p); setDiscoveries(d); setLoading(false);
    });
    localStorage.removeItem("badge_notification");
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push(`/${locale}`);
  };

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <Header title={t("title")} />
        <div className="flex flex-col items-center justify-center py-32 px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <User size={28} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mb-6">로그인하면 내 기록을 볼 수 있어요</p>
          <Link href={`/${locale}/auth/login`}>
            <Button className="bg-primary text-white px-8">로그인하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.nickname ?? user?.displayName?.split(" ")[0] ?? "탐험가";
  const total = discoveries.length;
  const pct = Math.min((total / 100) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t("title")} />

      {/* 프로필 헤더 */}
      <div className="bg-[var(--header-bg)] px-5 pt-6 pb-10">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          {loading ? (
            <Skeleton className="w-16 h-16 rounded-full" />
          ) : (
            <Avatar className="w-16 h-16 ring-2 ring-white/20">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            {loading ? (
              <Skeleton className="h-5 w-32 mb-1" />
            ) : (
              <h2 className="text-white text-lg font-bold">{displayName}</h2>
            )}
            <p className="text-white/50 text-xs mt-0.5">
              {profile?.oreumMbti ? `오름 유형 ${profile.oreumMbti}` : "오름 유형 미설정"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-3">
        {/* 통계 카드 */}
        {!loading && (
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">나의 기록</p>
              <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% 완주</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{total}</p>
                <p className="text-xs text-muted-foreground">발견</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-2xl font-bold">{discoveries.filter(d => d.oreumTier === "beginner").length}</p>
                <p className="text-xs text-muted-foreground">비기너</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{discoveries.filter(d => d.oreumTier === "explorer").length}</p>
                <p className="text-xs text-muted-foreground">익스플로러</p>
              </div>
            </div>
            <Progress value={pct} className="h-1.5 [&>div]:bg-primary" />
          </div>
        )}

        {/* MBTI 결과 카드 */}
        {!loading && (
          profile?.oreumMbti ? (
            <div className="bg-secondary/60 rounded-2xl border border-secondary p-4">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-3">
                <Leaf size={12} /> 나를 닮은 오름
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{profile.oreumMbti}</span>
                </div>
                <div>
                  <p className="text-base font-bold">{profile.oreumMbti}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {MBTI_TITLES[profile.oreumMbti] ?? "나만의 오름 유형"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/quiz`}
                  className="flex-1 h-8 rounded-lg border border-primary/30 text-primary text-xs font-semibold flex items-center justify-center"
                >
                  다시 테스트
                </Link>
                <Link
                  href={`/${locale}/quiz/result/${profile.oreumMbti.toLowerCase()}`}
                  className="flex-1 h-8 rounded-lg bg-primary text-white text-xs font-semibold flex items-center justify-center"
                >
                  결과 보기
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href={`/${locale}/quiz`}
              className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/60 border border-secondary hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Leaf size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">나를 닮은 오름 찾기</p>
                <p className="text-xs text-muted-foreground mt-0.5">10문항으로 알아보는 오름 MBTI</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
          )
        )}

        {/* 메뉴 */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {[
            { icon: Mountain, label: "내 발견 목록", href: `/${locale}/collection` },
            { icon: Award, label: "획득한 배지", href: `/${locale}/profile/badges` },
            { icon: User, label: "프로필 편집", href: `/${locale}/profile/edit` },
          ].map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon size={16} className="text-primary" />
              </div>
              <span className="text-sm font-medium flex-1">{label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border hover:bg-destructive/5 hover:border-destructive/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <LogOut size={16} className="text-destructive" />
          </div>
          <span className="text-sm font-medium text-destructive flex-1 text-left">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

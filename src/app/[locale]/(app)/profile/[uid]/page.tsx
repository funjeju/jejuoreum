"use client";

import { useEffect, useState, use } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Mountain, Award, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PublicProfile {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  oreumMbti: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  discoveryCount: number;
  discoveries: Array<{
    oreumSlug: string;
    oreumNameKo: string;
    oreumTier: string | null;
    oreumRegion: string | null;
    discoveredAt: string;
  }>;
  recentBadges: Array<{ badgeCode: string; badgeNameKo: string | null; earnedAt: string }>;
}

const TIER_COLOR: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700",
  explorer: "bg-blue-100 text-blue-700",
  master:   "bg-violet-100 text-violet-700",
};

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const locale   = useLocale();
  const { user } = useAuth();

  const [profile, setProfile]         = useState<PublicProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [myDiscoveries, setMyDiscoveries] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  // 프로필 조회
  useEffect(() => {
    fetch(`/api/users/${uid}/profile`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => { if (data) setProfile(data); })
      .finally(() => setLoading(false));
  }, [uid]);

  // 내 팔로잉 목록 조회
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/following", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setIsFollowing((data.following ?? []).includes(uid)))
    );
  }, [user, uid]);

  // 내 발견 목록 (비교용)
  useEffect(() => {
    if (!user || !compareMode) return;
    import("@/lib/firestore/users").then(({ getUserDiscoveries }) =>
      getUserDiscoveries(user.uid).then((discs) =>
        setMyDiscoveries(new Set(discs.map((d) => d.oreumSlug)))
      )
    );
  }, [user, compareMode]);

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/me/follow", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUid: uid, unfollow: isFollowing }),
      });
      setIsFollowing((prev) => !prev);
      setProfile((prev) =>
        prev
          ? { ...prev, followerCount: prev.followerCount + (isFollowing ? -1 : 1) }
          : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6">
        <Mountain size={36} className="text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">프로필을 찾을 수 없어요</p>
        <Link href={`/${locale}/feed`} className="text-primary text-sm hover:underline">피드로 돌아가기</Link>
      </div>
    );
  }

  const isSelf = user?.uid === uid;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/${locale}/feed`} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft size={18} />
        </Link>
        <span className="font-semibold text-sm">{profile.nickname}</span>
      </div>

      {/* 프로필 섹션 */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
              {profile.nickname[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-bold text-lg">{profile.nickname}</h2>
            {profile.oreumMbti && (
              <p className="text-xs text-muted-foreground mt-0.5">오름 유형 {profile.oreumMbti}</p>
            )}
            {profile.bio && <p className="text-xs text-muted-foreground mt-1">{profile.bio}</p>}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "발견", value: profile.discoveryCount },
            { label: "팔로워", value: profile.followerCount },
            { label: "팔로잉", value: profile.followingCount },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/40 rounded-xl py-3 text-center">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        {!isSelf && user && (
          <div className="flex gap-2">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors",
                isFollowing
                  ? "border border-border text-foreground hover:bg-muted/50"
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              {followLoading
                ? <Loader2 size={14} className="animate-spin" />
                : isFollowing
                ? <><UserCheck size={14} />팔로잉</>
                : <><UserPlus size={14} />팔로우</>
              }
            </button>
            {user && (
              <button
                onClick={() => setCompareMode((v) => !v)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors",
                  compareMode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                도감 비교
              </button>
            )}
          </div>
        )}
      </div>

      {/* 최근 배지 */}
      {profile.recentBadges.length > 0 && (
        <section className="px-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Award size={12} />최근 획득 배지
          </p>
          <div className="flex gap-2 flex-wrap">
            {profile.recentBadges.map((b) => (
              <span key={b.badgeCode} className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                {b.badgeNameKo ?? b.badgeCode}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 발견 목록 */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Mountain size={12} />발견한 오름 {profile.discoveryCount}개
          </p>
          {compareMode && (
            <p className="text-xs text-primary font-medium">
              ● 내가 발견한 곳 표시
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          {profile.discoveries.map((d) => {
            const alsoDiscovered = compareMode && myDiscoveries.has(d.oreumSlug);
            return (
              <Link
                key={d.oreumSlug}
                href={`/${locale}/oreum/${d.oreumSlug}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors hover:bg-muted/30",
                  alsoDiscovered ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {alsoDiscovered && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <span className="text-sm font-medium">{d.oreumNameKo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {d.oreumTier && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", TIER_COLOR[d.oreumTier] ?? "bg-muted text-muted-foreground")}>
                      {d.oreumTier === "beginner" ? "비기너" : d.oreumTier === "explorer" ? "익스플로러" : "마스터"}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.discoveredAt).toLocaleDateString("ko")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Target, CheckCircle2, Plus, Lock, Trophy } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getActiveChallenges, getUserChallenges, joinChallenge } from "@/lib/firestore/challenges";
import { getUserBadges } from "@/lib/firestore/badges";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Challenge, UserChallenge, UserBadge } from "@/types";

const BADGE_TIER_COLOR: Record<string, string> = {
  bronze:   "bg-amber-100 text-amber-700 border-amber-200",
  silver:   "bg-gray-100 text-gray-600 border-gray-200",
  gold:     "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ChallengesClient() {
  const { user } = useAuth();
  const locale   = useLocale();
  const router   = useRouter();

  const [challenges, setChallenges]       = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBadges, setUserBadges]       = useState<UserBadge[]>([]);
  const [loading, setLoading]             = useState(true);
  const [joiningId, setJoiningId]         = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ch] = await Promise.all([getActiveChallenges()]);
        setChallenges(ch);

        if (user) {
          const [uc, ub] = await Promise.all([
            getUserChallenges(user.uid),
            getUserBadges(user.uid),
          ]);
          setUserChallenges(uc);
          setUserBadges(ub);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleJoin = async (challenge: Challenge) => {
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    setJoiningId(challenge.id);
    try {
      await joinChallenge(user.uid, challenge);
      const uc = await getUserChallenges(user.uid);
      setUserChallenges(uc);
    } finally {
      setJoiningId(null);
    }
  };

  const joinedIds = new Set(userChallenges.map((uc) => uc.challengeId));

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* 헤더 */}
      <div className="bg-header pt-4 pb-8 px-4">
        <h1 className="text-white font-bold text-lg">챌린지 & 배지</h1>
        <p className="text-white/50 text-xs mt-0.5">오름 탐험의 목표를 설정하세요</p>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl min-h-screen">
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent px-4 pt-4">
            <TabsTrigger value="challenges" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3">
              챌린지
            </TabsTrigger>
            <TabsTrigger value="mybadges" className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3">
              내 배지
              {userBadges.length > 0 && (
                <span className="ml-1.5 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">
                  {userBadges.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 챌린지 탭 */}
          <TabsContent value="challenges" className="px-4 pt-4 space-y-3">
            {!user && (
              <div className="bg-muted/40 rounded-2xl p-4 text-center mb-4">
                <Lock size={20} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">로그인하면 챌린지에 참여할 수 있어요</p>
                <Button size="sm" className="mt-2" onClick={() => router.push(`/${locale}/auth/login`)}>
                  로그인하기
                </Button>
              </div>
            )}

            {/* 진행 중인 챌린지 */}
            {user && userChallenges.filter((uc) => !uc.isCompleted).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">진행 중</p>
                {userChallenges.filter((uc) => !uc.isCompleted).map((uc) => (
                  <ActiveChallengeCard key={uc.id} userChallenge={uc} />
                ))}
              </div>
            )}

            {/* 전체 챌린지 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">전체 챌린지</p>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl mb-2.5" />
                ))
                : challenges.length === 0
                  ? (
                    <div className="py-12 text-center">
                      <Target size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm">진행 중인 챌린지가 없어요</p>
                    </div>
                  )
                  : challenges.map((ch) => {
                    const joined = joinedIds.has(ch.id);
                    const userCh = userChallenges.find((uc) => uc.challengeId === ch.id);
                    return (
                      <ChallengeCard
                        key={ch.id}
                        challenge={ch}
                        joined={joined}
                        completed={userCh?.isCompleted ?? false}
                        progress={userCh?.progress ?? 0}
                        onJoin={() => handleJoin(ch)}
                        joining={joiningId === ch.id}
                      />
                    );
                  })
              }
            </div>
          </TabsContent>

          {/* 배지 탭 */}
          <TabsContent value="mybadges" className="px-4 pt-4">
            {!user ? (
              <div className="py-16 text-center">
                <Trophy size={36} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">로그인하면 배지를 확인할 수 있어요</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            ) : userBadges.length === 0 ? (
              <div className="py-16 text-center">
                <Trophy size={36} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">아직 획득한 배지가 없어요</p>
                <p className="text-muted-foreground text-xs mt-1">오름을 발견하면 배지를 얻을 수 있어요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}

function ChallengeCard({
  challenge, joined, completed, progress, onJoin, joining
}: {
  challenge: Challenge;
  joined: boolean;
  completed: boolean;
  progress: number;
  onJoin: () => void;
  joining: boolean;
}) {
  const goal = (challenge.conditionValue as { value?: number }).value ?? 1;

  return (
    <div className="bg-card border rounded-2xl p-4 mb-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            completed ? "bg-emerald-100" : "bg-primary/10"
          )}>
            {completed
              ? <CheckCircle2 size={18} className="text-emerald-500" />
              : <Target size={18} className="text-primary" />
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{challenge.nameKo}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{challenge.descriptionKo}</p>
          </div>
        </div>
        {!joined && !completed && (
          <Button
            size="sm"
            variant="outline"
            disabled={joining}
            onClick={onJoin}
            className="shrink-0 h-8 text-xs"
          >
            {joining
              ? <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              : <><Plus size={12} className="mr-0.5" />참여</>
            }
          </Button>
        )}
        {completed && (
          <Badge variant="outline" className="text-xs shrink-0 border-emerald-200 text-emerald-600">완료</Badge>
        )}
      </div>

      {joined && !completed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>진행 상황</span>
            <span>{progress} / {goal}</span>
          </div>
          <Progress value={(progress / goal) * 100} className="h-1.5" />
        </div>
      )}
      {(challenge.participantCount ?? 0) > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2">
          🥾 {(challenge.participantCount ?? 0).toLocaleString()}명 참여 중
        </p>
      )}
    </div>
  );
}

function ActiveChallengeCard({ userChallenge }: { userChallenge: UserChallenge }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-2.5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-sm">{userChallenge.challengeNameKo}</p>
        <span className="text-xs text-muted-foreground">{userChallenge.progress}/{userChallenge.goal}</span>
      </div>
      <Progress value={(userChallenge.progress / userChallenge.goal) * 100} className="h-1.5" />
    </div>
  );
}

function BadgeCard({ badge }: { badge: UserBadge }) {
  return (
    <div className="bg-card border rounded-2xl p-4 text-center">
      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <Trophy size={20} className="text-amber-500" />
      </div>
      <p className="text-sm font-semibold">{badge.badgeNameKo}</p>
      <Badge
        variant="outline"
        className={cn("text-[10px] mt-1", BADGE_TIER_COLOR[badge.badgeTier])}
      >
        {badge.badgeTier}
      </Badge>
      <p className="text-xs text-muted-foreground mt-1.5">
        {new Date(badge.earnedAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}

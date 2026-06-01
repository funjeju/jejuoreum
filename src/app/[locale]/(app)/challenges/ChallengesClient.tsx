"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Target, CheckCircle2, Plus, Lock, Trophy, Users, X,
  ChevronRight, Calendar, Mountain, Award, MapPin, List,
  Loader2, UserPlus, UserCheck, Medal,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getActiveChallenges, getUserChallenges, joinChallenge, getChallengeLeaderboard,
} from "@/lib/firestore/challenges";
import { getUserBadges } from "@/lib/firestore/badges";
import { getOreumsBySlugs } from "@/lib/firestore/oreums";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Challenge, UserChallenge, UserBadge, ChallengeParticipant, Oreum } from "@/types";

// ── 상수 ──────────────────────────────────────────────────────

const BADGE_TIER_COLOR: Record<string, string> = {
  bronze:   "bg-amber-100 text-amber-700 border-amber-200",
  silver:   "bg-gray-100 text-gray-600 border-gray-200",
  gold:     "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-purple-100 text-purple-700 border-purple-200",
};

const TYPE_STYLE: Record<string, { label: string; bg: string; text: string; border: string; grad: string }> = {
  monthly:   { label: "월간",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", grad: "from-emerald-600 to-teal-500" },
  weekly:    { label: "주간",  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    grad: "from-blue-600 to-cyan-500" },
  seasonal:  { label: "시즌",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   grad: "from-amber-500 to-orange-500" },
  permanent: { label: "상시",  bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200",  grad: "from-violet-600 to-purple-500" },
};

const REGION_KO: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

const TIER_KO: Record<string, string> = {
  beginner: "비기너", explorer: "익스플로러", master: "마스터",
};

// ── 유틸 ──────────────────────────────────────────────────────

function getChallengeStatus(ch: Challenge): "upcoming" | "active" | "ended" {
  const now = Date.now();
  if (ch.startsAt && new Date(ch.startsAt).getTime() > now) return "upcoming";
  if (ch.endsAt && new Date(ch.endsAt).getTime() < now) return "ended";
  return "active";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function ChallengesClient() {
  const { user } = useAuth();
  const locale   = useLocale();
  const router   = useRouter();

  const [challenges, setChallenges]         = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [userBadges, setUserBadges]         = useState<UserBadge[]>([]);
  const [loading, setLoading]               = useState(true);
  const [joiningId, setJoiningId]           = useState<string | null>(null);

  // 모달 상태
  const [participantsModal, setParticipantsModal] = useState<Challenge | null>(null);
  const [profileModal, setProfileModal]           = useState<string | null>(null); // uid
  const [oreumSetModal, setOreumSetModal]         = useState<Challenge | null>(null);

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
      await joinChallenge(user.uid, challenge, {
        nickname:  user.displayName ?? "탐험가",
        avatarUrl: user.photoURL ?? null,
      });
      const uc = await getUserChallenges(user.uid);
      setUserChallenges(uc);
    } finally {
      setJoiningId(null);
    }
  };

  const joinedIds = new Set(userChallenges.map((uc) => uc.challengeId));

  const activeChallenges    = userChallenges.filter((uc) => !uc.isCompleted);
  const completedChallenges = userChallenges.filter((uc) => uc.isCompleted);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* 페이지 헤더 */}
      <div className="bg-header pt-4 pb-8 px-4">
        <h1 className="text-white font-bold text-lg">챌린지 & 배지</h1>
        <p className="text-white/50 text-xs mt-0.5">오름 탐험의 목표를 설정하세요</p>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl min-h-screen">
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-transparent px-4 pt-4">
            <TabsTrigger
              value="challenges"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
            >
              챌린지
            </TabsTrigger>
            <TabsTrigger
              value="mybadges"
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
            >
              내 배지
              {userBadges.length > 0 && (
                <span className="ml-1.5 text-xs bg-primary text-white rounded-full px-1.5 py-0.5">
                  {userBadges.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── 챌린지 탭 ── */}
          <TabsContent value="challenges" className="px-4 pt-5 space-y-6">
            {!user && (
              <div className="bg-muted/40 rounded-2xl p-5 text-center">
                <Lock size={20} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">로그인하면 챌린지에 참여할 수 있어요</p>
                <Button size="sm" className="mt-3" onClick={() => router.push(`/${locale}/auth/login`)}>
                  로그인하기
                </Button>
              </div>
            )}

            {/* 진행 중인 챌린지 */}
            {user && activeChallenges.length > 0 && (
              <section>
                <SectionLabel icon={<Target size={12} />} text="진행 중" />
                <div className="space-y-3">
                  {activeChallenges.map((uc) => {
                    const ch = challenges.find((c) => c.id === uc.challengeId);
                    return (
                      <ActiveHeroCard
                        key={uc.id}
                        userChallenge={uc}
                        challenge={ch}
                        onOpenParticipants={ch ? () => setParticipantsModal(ch) : undefined}
                        onOpenOreumSet={ch && ch.conditionType === "specific_set" ? () => setOreumSetModal(ch) : undefined}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 완료한 챌린지 */}
            {user && completedChallenges.length > 0 && (
              <section>
                <SectionLabel icon={<CheckCircle2 size={12} />} text="완료" />
                <div className="space-y-3">
                  {completedChallenges.map((uc) => {
                    const ch = challenges.find((c) => c.id === uc.challengeId);
                    return (
                      <ActiveHeroCard
                        key={uc.id}
                        userChallenge={uc}
                        challenge={ch}
                        completed
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* 전체 챌린지 */}
            <section>
              <SectionLabel icon={<Mountain size={12} />} text="전체 챌린지" />
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 rounded-3xl" />
                  ))}
                </div>
              ) : challenges.length === 0 ? (
                <div className="py-14 text-center">
                  <Target size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">진행 중인 챌린지가 없어요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.map((ch) => {
                    const joined  = joinedIds.has(ch.id);
                    const userCh  = userChallenges.find((uc) => uc.challengeId === ch.id);
                    return (
                      <HeroChallengeCard
                        key={ch.id}
                        challenge={ch}
                        joined={joined}
                        completed={userCh?.isCompleted ?? false}
                        progress={userCh?.progress ?? 0}
                        onJoin={() => handleJoin(ch)}
                        joining={joiningId === ch.id}
                        onOpenParticipants={() => setParticipantsModal(ch)}
                        onOpenOreumSet={ch.conditionType === "specific_set" ? () => setOreumSetModal(ch) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>

          {/* ── 배지 탭 ── */}
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
                {userBadges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />

      {/* ── 모달들 ── */}
      {participantsModal && (
        <ParticipantsModal
          challenge={participantsModal}
          onClose={() => setParticipantsModal(null)}
          onOpenProfile={(uid) => setProfileModal(uid)}
        />
      )}
      {profileModal && (
        <UserProfileModal
          uid={profileModal}
          currentUid={user?.uid ?? null}
          locale={locale}
          onClose={() => setProfileModal(null)}
        />
      )}
      {oreumSetModal && (
        <OreumSetModal
          challenge={oreumSetModal}
          onClose={() => setOreumSetModal(null)}
        />
      )}
    </div>
  );
}

// ── 섹션 레이블 ───────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
      {icon}{text}
    </p>
  );
}

// ── 히어로 챌린지 카드 ────────────────────────────────────────

function HeroChallengeCard({
  challenge, joined, completed, progress, onJoin, joining,
  onOpenParticipants, onOpenOreumSet,
}: {
  challenge: Challenge;
  joined: boolean;
  completed: boolean;
  progress: number;
  onJoin: () => void;
  joining: boolean;
  onOpenParticipants: () => void;
  onOpenOreumSet?: () => void;
}) {
  const status  = getChallengeStatus(challenge);
  const type    = challenge.challengeType;
  const style   = TYPE_STYLE[type] ?? TYPE_STYLE.permanent;
  const cv      = challenge.conditionValue as Record<string, unknown>;
  const goal    = (cv.value as number) ?? (cv.oreumSlugs ? (cv.oreumSlugs as string[]).length : 1);
  const slugs   = challenge.conditionType === "specific_set" ? (cv.oreumSlugs as string[] | undefined) ?? [] : [];

  return (
    <div className={cn(
      "rounded-3xl overflow-hidden border shadow-sm",
      completed ? "border-emerald-200 opacity-75" : "border-border",
    )}>
      {/* 상단 그라디언트 배너 */}
      <div className={cn("bg-gradient-to-r px-4 pt-4 pb-5", style.grad)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {style.label}
            </span>
            {status === "active" && (
              <span className="bg-emerald-400/30 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />진행 중
              </span>
            )}
            {status === "upcoming" && (
              <span className="bg-yellow-400/30 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">예정</span>
            )}
            {status === "ended" && (
              <span className="bg-white/20 text-white/70 text-[10px] font-semibold px-2 py-0.5 rounded-full">종료</span>
            )}
          </div>
          {completed && (
            <span className="bg-emerald-400/30 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 size={10} />완료
            </span>
          )}
        </div>

        <h3 className="text-white font-bold text-base leading-tight">{challenge.nameKo}</h3>
        <p className="text-white/70 text-xs mt-1 leading-relaxed">{challenge.descriptionKo}</p>

        {/* 오름 세트 미니 서클 */}
        {slugs.length > 0 && (
          <div className="mt-3">
            <OreumMiniCircles slugs={slugs} onOpenAll={onOpenOreumSet} />
          </div>
        )}

        {/* count 타입일 때 조건 정보 */}
        {challenge.conditionType === "count" && (
          <div className="mt-3 flex items-center gap-1.5">
            <Target size={12} className="text-white/70" />
            <span className="text-white/80 text-xs">오름 {goal}개 발견</span>
          </div>
        )}
        {challenge.conditionType === "region_complete" && (
          <div className="mt-3 flex items-center gap-1.5">
            <MapPin size={12} className="text-white/70" />
            <span className="text-white/80 text-xs">{REGION_KO[(cv.region as string) ?? ""] ?? cv.region as string} 지역 완주</span>
          </div>
        )}
        {challenge.conditionType === "tier_complete" && (
          <div className="mt-3 flex items-center gap-1.5">
            <Medal size={12} className="text-white/70" />
            <span className="text-white/80 text-xs">{TIER_KO[(cv.tier as string) ?? ""] ?? cv.tier as string} 티어 완주</span>
          </div>
        )}
      </div>

      {/* 하단 카드 바디 */}
      <div className="px-4 py-3 bg-card space-y-3">
        {/* 진행 중인 경우 프로그레스 */}
        {joined && !completed && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>내 진행률</span>
              <span className="font-semibold text-foreground">{progress} / {goal}</span>
            </div>
            <Progress value={(progress / goal) * 100} className="h-2" />
          </div>
        )}

        {/* 기간 + 참여자 + 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 참여자 수 (클릭 가능) */}
            {(challenge.participantCount ?? 0) > 0 && (
              <button
                onClick={onOpenParticipants}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                <Users size={13} className="group-hover:text-primary transition-colors" />
                <span className="font-medium">{(challenge.participantCount ?? 0).toLocaleString()}명 참여 중</span>
                <ChevronRight size={11} className="opacity-50" />
              </button>
            )}
            {/* 기간 */}
            {(challenge.startsAt || challenge.endsAt) && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar size={10} />
                {challenge.startsAt && formatDate(challenge.startsAt)}
                {challenge.startsAt && challenge.endsAt && " ~ "}
                {challenge.endsAt && formatDate(challenge.endsAt)}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {!joined && !completed && (
            <Button
              size="sm"
              disabled={joining || status === "ended"}
              onClick={onJoin}
              className="h-8 text-xs px-3 rounded-xl"
            >
              {joining
                ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Plus size={12} className="mr-0.5" />참여하기</>
              }
            </Button>
          )}
          {joined && !completed && (
            <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full">
              참여 중
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 진행 중 히어로 카드 (내 챌린지 섹션용) ─────────────────────

function ActiveHeroCard({
  userChallenge, challenge, completed, onOpenParticipants, onOpenOreumSet,
}: {
  userChallenge: UserChallenge;
  challenge?: Challenge;
  completed?: boolean;
  onOpenParticipants?: () => void;
  onOpenOreumSet?: () => void;
}) {
  const type  = challenge?.challengeType ?? "permanent";
  const style = TYPE_STYLE[type] ?? TYPE_STYLE.permanent;
  const pct   = (userChallenge.progress / userChallenge.goal) * 100;
  const cv    = userChallenge.conditionValue as Record<string, unknown> | undefined;
  const slugs = userChallenge.conditionType === "specific_set"
    ? (cv?.oreumSlugs as string[] | undefined) ?? []
    : [];

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden border",
      completed ? "border-emerald-200 bg-emerald-50/40" : "border-primary/20 bg-primary/5"
    )}>
      <div className={cn("h-1.5 w-full bg-gradient-to-r", style.grad)} />
      <div className="px-4 py-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", style.bg, style.text)}>
                {style.label}
              </span>
              {completed && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                  <CheckCircle2 size={9} />완료
                </span>
              )}
            </div>
            <p className="font-semibold text-sm truncate">{userChallenge.challengeNameKo}</p>
          </div>
          <span className="text-sm font-bold text-primary ml-3 shrink-0">
            {userChallenge.progress}/{userChallenge.goal}
          </span>
        </div>

        <Progress value={pct} className="h-2 mb-2" />

        {slugs.length > 0 && (
          <div className="mt-2">
            <OreumMiniCircles slugs={slugs} onOpenAll={onOpenOreumSet} compact dark={false} />
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          {challenge && (challenge.participantCount ?? 0) > 0 && onOpenParticipants && (
            <button
              onClick={onOpenParticipants}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users size={10} />
              {(challenge.participantCount ?? 0).toLocaleString()}명 참여 중
              <ChevronRight size={9} />
            </button>
          )}
          {!challenge?.startsAt && <span />}
          {challenge?.endsAt && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Calendar size={9} />~{formatDate(challenge.endsAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 오름 미니 서클 ─────────────────────────────────────────────

function OreumMiniCircles({
  slugs, onOpenAll, compact, dark = true,
}: {
  slugs: string[];
  onOpenAll?: () => void;
  compact?: boolean;
  dark?: boolean;
}) {
  const SHOW = compact ? 5 : 7;
  const shown  = slugs.slice(0, SHOW);
  const hidden  = slugs.length - shown.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shown.map((slug) => (
        <OreumCircle key={slug} slug={slug} size={compact ? 26 : 30} dark={dark} />
      ))}
      {hidden > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold cursor-pointer",
            compact ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]",
            dark
              ? "bg-white/20 border border-white/30 text-white"
              : "bg-muted border border-border text-muted-foreground"
          )}
        >
          +{hidden}
        </div>
      )}
      {onOpenAll && (
        <button
          onClick={onOpenAll}
          className={cn(
            "ml-1 flex items-center gap-0.5 transition-colors font-medium",
            compact ? "text-[9px]" : "text-[10px]",
            dark
              ? "text-white/80 hover:text-white"
              : "text-primary hover:text-primary/80"
          )}
        >
          전체 보기<ChevronRight size={9} />
        </button>
      )}
    </div>
  );
}

// ── 오름 단일 서클 (slug → 썸네일 + 이름 tooltip) ────────────

const oreumCache: Record<string, { name: string; thumbnail: string | null }> = {};

function OreumCircle({ slug, size, dark = true }: { slug: string; size: number; dark?: boolean }) {
  const cached = oreumCache[slug];
  const [name, setName]           = useState<string>(cached?.name ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(cached?.thumbnail ?? null);
  const [showTip, setShowTip]     = useState(false);

  useEffect(() => {
    if (cached) return;
    import("@/lib/firestore/oreums").then(({ getOreumBySlug }) =>
      getOreumBySlug(slug).then((o) => {
        if (o) {
          oreumCache[slug] = { name: o.nameKo, thumbnail: o.thumbnailUrl ?? null };
          setName(o.nameKo);
          setThumbnail(o.thumbnailUrl ?? null);
        }
      })
    );
  }, [slug, cached]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onTouchStart={() => setShowTip(true)}
        onTouchEnd={() => setTimeout(() => setShowTip(false), 1200)}
        className={cn(
          "w-full h-full rounded-full cursor-pointer overflow-hidden transition-opacity hover:opacity-85",
          dark ? "border-2 border-white/60" : "border-2 border-emerald-300"
        )}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            dark ? "bg-white/25" : "bg-emerald-100"
          )}>
            <Mountain size={size * 0.44} className={dark ? "text-white" : "text-emerald-600"} />
          </div>
        )}
      </div>
      {showTip && name && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
            {name}
          </div>
          <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 mx-auto -mt-[3px]" />
        </div>
      )}
    </div>
  );
}

// ── 참여자 모달 ───────────────────────────────────────────────

function ParticipantsModal({
  challenge, onClose, onOpenProfile,
}: {
  challenge: Challenge;
  onClose: () => void;
  onOpenProfile: (uid: string) => void;
}) {
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChallengeLeaderboard(challenge.id, 30)
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [challenge.id]);

  return (
    <BottomSheet onClose={onClose} title={`참여자 목록 · ${(challenge.participantCount ?? 0).toLocaleString()}명`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : participants.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">아직 참여자가 없어요</div>
      ) : (
        <div className="space-y-1">
          {participants.map((p, i) => (
            <button
              key={p.uid}
              onClick={() => onOpenProfile(p.uid)}
              className="w-full flex items-center gap-3 px-1 py-2.5 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              {/* 순위 */}
              <span className="w-6 text-center text-xs text-muted-foreground font-semibold">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={p.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                  {p.nickname[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold truncate">{p.nickname}</p>
                  <p className="text-xs text-muted-foreground shrink-0 ml-2">
                    {p.isCompleted ? "✅ 완료" : `${p.progress}/${p.goal}`}
                  </p>
                </div>
                <Progress
                  value={Math.min((p.progress / p.goal) * 100, 100)}
                  className={cn("h-1.5", p.isCompleted && "[&>div]:bg-emerald-500")}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

// ── 사용자 프로필 모달 ────────────────────────────────────────

interface PublicProfile {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  oreumMbti: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  discoveryCount: number;
  recentBadges: Array<{ badgeCode: string; badgeNameKo: string | null; earnedAt: string }>;
}

function UserProfileModal({
  uid, currentUid, locale, onClose,
}: {
  uid: string;
  currentUid: string | null;
  locale: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/users/${uid}/profile`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setProfile(data); })
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/me/following", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setIsFollowing((data.following ?? []).includes(uid)))
    );
  }, [user, uid]);

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
      setIsFollowing((v) => !v);
      setProfile((p) => p ? { ...p, followerCount: p.followerCount + (isFollowing ? -1 : 1) } : p);
    } finally {
      setFollowLoading(false);
    }
  };

  const isSelf = currentUid === uid;

  return (
    <BottomSheet onClose={onClose} title="탐험가 프로필">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : !profile ? (
        <div className="py-8 text-center text-sm text-muted-foreground">프로필을 찾을 수 없어요</div>
      ) : (
        <div className="space-y-4">
          {/* 프로필 헤더 */}
          <div className="flex items-center gap-3">
            <Avatar className="w-14 h-14">
              <AvatarImage src={profile.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                {profile.nickname[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base">{profile.nickname}</h3>
              {profile.oreumMbti && (
                <p className="text-xs text-muted-foreground">오름 유형 {profile.oreumMbti}</p>
              )}
              {profile.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{profile.bio}</p>}
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "발견", value: profile.discoveryCount },
              { label: "팔로워", value: profile.followerCount },
              { label: "팔로잉", value: profile.followingCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl py-2.5 text-center">
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* 최근 배지 */}
          {profile.recentBadges.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Award size={11} />최근 배지
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {profile.recentBadges.slice(0, 4).map((b) => (
                  <span key={b.badgeCode} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-100">
                    {b.badgeNameKo ?? b.badgeCode}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => router.push(`/${locale}/profile/${uid}`)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors"
            >
              프로필 전체 보기
            </button>
            {!isSelf && user && (
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
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

// ── 오름 세트 모달 ────────────────────────────────────────────

function OreumSetModal({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  const cv = challenge.conditionValue as Record<string, unknown>;
  const slugs = (cv.oreumSlugs as string[] | undefined) ?? [];

  const [oreums, setOreums] = useState<Oreum[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    getOreumsBySlugs(slugs)
      .then(setOreums)
      .finally(() => setLoading(false));
  }, [slugs.join(",")]);

  const type  = challenge.challengeType;
  const style = TYPE_STYLE[type] ?? TYPE_STYLE.permanent;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      {/* 헤더 */}
      <div className={cn("bg-gradient-to-r px-4 pt-10 pb-4", style.grad)}>
        <div className="flex items-center justify-between pt-2 pb-1">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white">
            <X size={16} />
          </button>
          <span className="text-white text-xs font-medium">{slugs.length}개 오름</span>
        </div>
        <h2 className="text-white font-bold text-lg mt-2">{challenge.nameKo}</h2>
        <p className="text-white/70 text-xs mt-1">{challenge.descriptionKo}</p>

        {/* 뷰 전환 탭 */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
              view === "list" ? "bg-white text-gray-800" : "bg-white/20 text-white"
            )}
          >
            <List size={12} />목록
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
              view === "map" ? "bg-white text-gray-800" : "bg-white/20 text-white"
            )}
          >
            <MapPin size={12} />지도
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : view === "list" ? (
          <OreumListView oreums={oreums} />
        ) : (
          <OreumMapView oreums={oreums} />
        )}
      </div>
    </div>
  );
}

function OreumListView({ oreums }: { oreums: Oreum[] }) {
  const REGION_COLOR: Record<string, string> = {
    east: "bg-sky-100 text-sky-700",
    west: "bg-violet-100 text-violet-700",
    south: "bg-rose-100 text-rose-700",
    north: "bg-emerald-100 text-emerald-700",
    central: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-4 space-y-3">
      {oreums.map((oreum) => (
        <div
          key={oreum.id}
          className="flex gap-3 bg-card border border-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow"
        >
          {/* 썸네일 */}
          <div className="w-20 shrink-0 bg-muted relative">
            {oreum.thumbnailUrl ? (
              <img
                src={oreum.thumbnailUrl}
                alt={oreum.nameKo}
                className="w-full h-full object-cover"
                style={{ minHeight: 72 }}
              />
            ) : (
              <div className="w-full h-full min-h-[72px] flex items-center justify-center bg-emerald-50">
                <Mountain size={22} className="text-emerald-400" />
              </div>
            )}
          </div>
          {/* 정보 */}
          <div className="flex-1 py-3 pr-3 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                REGION_COLOR[oreum.region] ?? "bg-muted text-muted-foreground"
              )}>
                {REGION_KO[oreum.region] ?? oreum.region}
              </span>
              {oreum.tier && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  {TIER_KO[oreum.tier] ?? oreum.tier}
                </span>
              )}
            </div>
            <p className="font-bold text-sm">{oreum.nameKo}</p>
            {oreum.oneLinerKo && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{oreum.oneLinerKo}</p>
            )}
            {oreum.elevationM && (
              <p className="text-[10px] text-muted-foreground mt-1">해발 {oreum.elevationM}m</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OreumMapView({ oreums }: { oreums: Oreum[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;
    const kakao = (window as unknown as { kakao: { maps: { load: (cb: () => void) => void; Map: new (el: HTMLElement, opts: object) => object; LatLng: new (lat: number, lng: number) => object; Marker: new (opts: object) => { setMap: (m: object) => void }; InfoWindow: new (opts: object) => { open: (m: object, mk: object) => void; close: () => void }; event: { addListener: (t: object, e: string, h: () => void) => void } } } }).kakao;
    if (!kakao?.maps) return;

    kakao.maps.load(() => {
      if (!mapRef.current) return;

      const validOreums = oreums.filter((o) => o.location?.lat && o.location?.lng);
      const centerLat = validOreums.reduce((s, o) => s + o.location.lat, 0) / (validOreums.length || 1);
      const centerLng = validOreums.reduce((s, o) => s + o.location.lng, 0) / (validOreums.length || 1);

      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(centerLat || 33.38, centerLng || 126.55),
        level: 9,
      });
      mapInstance.current = map;

      validOreums.forEach((oreum) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(oreum.location.lat, oreum.location.lng),
          map,
        });
        const infoWindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:4px 8px;font-size:11px;font-weight:600;color:#1f2937;border-radius:8px;">${oreum.nameKo}</div>`,
        });
        kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.open(map, marker);
        });
      });

      setMapReady(true);
    });
  }, [oreums]);

  useEffect(() => {
    if ((window as unknown as { kakao?: unknown }).kakao) {
      initMap();
    }
  }, [initMap]);

  return (
    <div className="relative h-[calc(100vh-220px)]">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      )}
    </div>
  );
}

// ── 공용 바텀시트 ─────────────────────────────────────────────

function BottomSheet({
  children, onClose, title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* 타이틀 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h3 className="font-bold text-sm">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <X size={14} />
          </button>
        </div>
        {/* 스크롤 가능 컨텐츠 */}
        <div className="overflow-y-auto flex-1 px-4 py-3">
          {children}
        </div>
      </div>
    </>
  );
}

// ── 배지 카드 ─────────────────────────────────────────────────

function BadgeCard({ badge }: { badge: UserBadge }) {
  return (
    <div className="bg-card border rounded-2xl p-4 text-center hover:shadow-sm transition-shadow">
      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
        <Trophy size={20} className="text-amber-500" />
      </div>
      <p className="text-sm font-semibold leading-tight">{badge.badgeNameKo}</p>
      <Badge
        variant="outline"
        className={cn("text-[10px] mt-1.5", BADGE_TIER_COLOR[badge.badgeTier])}
      >
        {badge.badgeTier}
      </Badge>
      <p className="text-xs text-muted-foreground mt-1.5">
        {new Date(badge.earnedAt).toLocaleDateString("ko-KR")}
      </p>
    </div>
  );
}

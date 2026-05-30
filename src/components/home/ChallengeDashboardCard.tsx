"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Trophy, CheckCircle2, ChevronRight, Target, Clock, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Challenge, UserChallenge, ChallengeParticipant } from "@/types";

interface Props {
  challenge: Challenge;
  userChallenge: UserChallenge | null;
  leaderboard: ChallengeParticipant[];
  uid: string | null;
}

function daysLeft(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function ChallengeDashboardCard({ challenge, userChallenge, leaderboard, uid }: Props) {
  const locale = useLocale();
  const remaining = daysLeft(challenge.endsAt);

  const myRank = uid
    ? leaderboard.findIndex((p) => p.uid === uid) + 1
    : 0;

  const progressPct = userChallenge
    ? Math.min(100, Math.round((userChallenge.progress / userChallenge.goal) * 100))
    : 0;

  return (
    <section className="rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-emerald-50/40">
      {/* 배너 헤더 */}
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-white/80" />
          <span className="text-white text-xs font-semibold tracking-wide">진행 중인 챌린지</span>
        </div>
        <div className="flex items-center gap-2">
          {remaining !== null && (
            <span className="flex items-center gap-1 text-white/70 text-[11px]">
              <Clock size={10} />
              {remaining === 0 ? "오늘 마감" : `${remaining}일 남음`}
            </span>
          )}
          <Link
            href={`/${locale}/challenges`}
            className="text-white/80 text-[11px] font-medium flex items-center gap-0.5 hover:text-white"
          >
            전체 보기 <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* 챌린지 이름 */}
        <div>
          <p className="font-bold text-base text-foreground">{challenge.nameKo}</p>
          {challenge.descriptionKo && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{challenge.descriptionKo}</p>
          )}
        </div>

        {/* 내 진행도 */}
        {userChallenge ? (
          <div className="bg-white/60 rounded-xl px-3 py-2.5 border border-primary/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">내 진행률</span>
              <div className="flex items-center gap-2">
                {myRank > 0 && (
                  <span className="text-xs font-bold text-primary">{myRank}위</span>
                )}
                <span className="text-xs font-semibold text-foreground">
                  {userChallenge.progress}/{userChallenge.goal}
                  <span className="text-muted-foreground font-normal"> ({progressPct}%)</span>
                </span>
              </div>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        ) : uid ? (
          <Link
            href={`/${locale}/challenges`}
            className="block w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold text-center"
          >
            + 챌린지 참여하기
          </Link>
        ) : null}

        {/* 리더보드 */}
        {leaderboard.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Trophy size={11} /> 달성 현황
            </p>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((p, idx) => (
                <div
                  key={p.uid}
                  className={cn(
                    "flex items-center gap-2.5",
                    p.uid === uid && "bg-primary/10 -mx-2 px-2 py-1 rounded-xl"
                  )}
                >
                  <div className="w-5 text-center shrink-0">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : (
                      <span className="text-[11px] text-muted-foreground font-semibold">{idx + 1}</span>
                    )}
                  </div>
                  <Avatar className="w-6 h-6 shrink-0">
                    <AvatarImage src={p.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[9px] bg-muted">{p.nickname[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-medium truncate">
                        {p.nickname}
                        {p.uid === uid && <span className="text-primary text-[10px] ml-1">(나)</span>}
                      </p>
                      {p.isCompleted
                        ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                        : <span className="text-[10px] text-muted-foreground shrink-0">{p.progress}/{p.goal}</span>
                      }
                    </div>
                    <Progress value={(p.progress / p.goal) * 100} className="h-1 mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 참여자 수 */}
        {(challenge.participantCount ?? 0) > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            🥾 총 {challenge.participantCount.toLocaleString()}명 참여 중
          </p>
        )}
      </div>
    </section>
  );
}

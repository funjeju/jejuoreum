"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { MapPin, CheckCircle2, ChevronRight, RotateCcw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserProfile, getUserDiscoveries } from "@/lib/firestore/users";
import { getNearbyOreums } from "@/lib/firestore/oreums";
import { saveDiscovery, getDiscovery } from "@/lib/firestore/users";
import { createDiscoveryFeedEvent } from "@/lib/firestore/feed";
import { evaluateAndAwardBadges } from "@/lib/firestore/badges";
import { getUserChallenges, updateChallengeProgress } from "@/lib/firestore/challenges";
import { DiscoveryMomentAnimation } from "@/components/discovery/DiscoveryMomentAnimation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GpsMatchResult, NearbyOreum } from "@/types";

type Step = "locating" | "matched" | "candidates" | "no_match" | "denied" | "saving" | "discovery_anim" | "success";
type Visibility = "instant" | "delay_10min" | "private";

const VISIBILITY_OPTIONS: { key: Visibility; label: string; desc: string }[] = [
  { key: "instant",     label: "즉시 공개",  desc: "지금 바로 피드에 공개" },
  { key: "delay_10min", label: "10분 후",    desc: "10분 후 피드에 공개 (기본)" },
  { key: "private",     label: "비공개",     desc: "나만 볼 수 있음" },
];

export default function QrClient() {
  const t = useTranslations("qr");
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep]                   = useState<Step>("locating");
  const [matchResult, setMatchResult]     = useState<GpsMatchResult | null>(null);
  const [selectedOreum, setSelectedOreum] = useState<NearbyOreum | null>(null);
  const [isNew, setIsNew]                 = useState(false);
  const [visibility, setVisibility]       = useState<Visibility>("delay_10min");
  const [newBadges, setNewBadges]         = useState<string[]>([]);
  const [monthCount, setMonthCount]       = useState<number | null>(null);

  const locate = useCallback(async () => {
    setStep("locating");
    if (!navigator.geolocation) { setStep("denied"); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const nearby = await getNearbyOreums(lat, lng, 1);

        if (nearby.length === 0) {
          setMatchResult({ status: "no_match", distance: null, matchedOreum: null, candidates: [] });
          setStep("no_match");
          return;
        }

        const closest = nearby[0];
        if (closest.distanceM <= 300) {
          setMatchResult({ status: "auto", distance: closest.distanceM, matchedOreum: closest, candidates: nearby });
          setSelectedOreum(closest);
          setStep("matched");
        } else {
          setMatchResult({ status: "candidates", distance: closest.distanceM, matchedOreum: null, candidates: nearby.slice(0, 3) });
          setStep("candidates");
        }
      },
      () => setStep("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { locate(); }, [locate]);

  const handleVerify = async () => {
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    if (!selectedOreum) return;

    setStep("saving");

    const existing = await getDiscovery(user.uid, selectedOreum.slug);
    const wasNew = !existing;
    setIsNew(wasNew);

    if (wasNew) {
      await saveDiscovery(user.uid, {
        oreumId:               selectedOreum.id,
        oreumSlug:             selectedOreum.slug,
        oreumNameKo:           selectedOreum.nameKo,
        oreumRegion:           selectedOreum.region,
        oreumTier:             selectedOreum.tier,
        oreumThumbnailUrl:     selectedOreum.thumbnailUrl,
        discoveredAt:          new Date().toISOString(),
        verificationMethod:    matchResult?.status === "auto" ? "gps" : "manual_select",
        verificationDistanceM: matchResult?.distance ?? null,
        userNote:              null,
        visibility:            visibility === "private" ? "private" : "public",
      });

      const profile = await getUserProfile(user.uid).catch(() => null);
      if (visibility !== "private") {
        createDiscoveryFeedEvent({
          uid:           user.uid,
          userNickname:  profile?.nickname ?? "탐험가",
          userAvatarUrl: profile?.avatarUrl ?? null,
          oreumId:       selectedOreum.id,
          oreumSlug:     selectedOreum.slug,
          oreumNameKo:   selectedOreum.nameKo,
          visibility:    "public",
          delayMin:      visibility === "delay_10min" ? 10 : 0,
        }).catch(() => {});
      }

      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 30, 80]);
      }

      // 배지 평가 + 챌린지 진행도 업데이트 (백그라운드)
      getUserDiscoveries(user.uid).then(async (allDiscs) => {
        // 이번 달 발견 카운트
        const now = new Date();
        const monthDiscs = allDiscs.filter((d) => {
          const dt = new Date(d.discoveredAt);
          return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
        });
        setMonthCount(monthDiscs.length);

        const earned = await evaluateAndAwardBadges(user.uid, allDiscs);
        if (earned.length > 0) {
          setNewBadges(earned.map((b) => b.nameKo));
          localStorage.setItem("badge_notification", "1");
        }

        const challenges = await getUserChallenges(user.uid);
        for (const ch of challenges) {
          if (ch.isCompleted) continue;
          const discCount = allDiscs.length;
          if (discCount > ch.progress) {
            updateChallengeProgress(user.uid, ch.id, discCount, ch.goal).catch(() => {});
          }
        }
      }).catch(() => {});
    }

    if (wasNew) {
      setStep("discovery_anim");
    } else {
      setStep("success");
    }
  };

  return (
    <div className="min-h-screen bg-header flex flex-col">
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        {step === "locating" && <LocatingView t={t} />}
        {step === "matched" && selectedOreum && (
          <MatchedView
            oreum={selectedOreum}
            distance={matchResult?.distance ?? 0}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            onVerify={handleVerify}
            t={t}
          />
        )}
        {step === "candidates" && matchResult && (
          <CandidatesView
            candidates={matchResult.candidates}
            onSelect={(o) => { setSelectedOreum(o); setStep("matched"); }}
            t={t}
          />
        )}
        {step === "saving"   && <SavingView t={t} />}
        {step === "no_match" && <NoMatchView onRetry={locate} onBack={() => router.push(`/${locale}`)} t={t} />}
        {step === "denied"   && <DeniedView onRetry={locate} t={t} />}
        {step === "success" && selectedOreum && (
          <SuccessView
            oreum={selectedOreum}
            isNew={isNew}
            newBadges={newBadges}
            monthCount={monthCount}
            onClose={() => router.push(`/${locale}/collection`)}
            t={t}
          />
        )}
      </div>

      <AnimatePresence>
        {step === "discovery_anim" && selectedOreum && (
          <DiscoveryMomentAnimation
            oreum={selectedOreum}
            onComplete={() => setStep("success")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LocatingView({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center text-white">
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
        <div className="absolute inset-3 rounded-full border-2 border-white/30 animate-ping [animation-delay:300ms]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin size={28} className="text-white/80" />
        </div>
      </div>
      <p className="text-lg font-semibold">{t("locating")}</p>
      <p className="text-white/60 text-sm mt-2">{t("locating_sub")}</p>
    </div>
  );
}

function SavingView({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center text-white">
      <div className="w-14 h-14 border-2 border-white/40 border-t-white rounded-full animate-spin mx-auto mb-6" />
      <p className="text-base font-medium text-white/70">{t("saving")}</p>
    </div>
  );
}

function MatchedView({ oreum, distance, visibility, onVisibilityChange, onVerify, t }: {
  oreum: NearbyOreum; distance: number;
  visibility: Visibility; onVisibilityChange: (v: Visibility) => void;
  onVerify: () => void; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="text-center text-white w-full max-w-sm">
      <div className="w-36 h-48 mx-auto mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        {oreum.thumbnailUrl ? (
          <Image src={oreum.thumbnailUrl} alt={oreum.nameKo} width={144} height={192} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/20">{oreum.nameKo[0]}</span>
          </div>
        )}
      </div>

      <div className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4",
        distance < 300
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          : "bg-white/10 text-white/70 border border-white/10"
      )}>
        {distance < 300
          ? <><CheckCircle2 size={10} /> {t("matched")}</>
          : t("nearby", { distance: Math.round(distance) })
        }
      </div>

      <h2 className="text-3xl font-bold mb-1">{oreum.nameKo}</h2>
      <p className="text-white/60 text-sm mb-6">{t("arrive_question")}</p>

      <div className="w-full mb-6 bg-white/8 rounded-2xl border border-white/10 p-3 space-y-1 text-left">
        <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider px-1 mb-2">공개 범위</p>
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onVisibilityChange(opt.key)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all",
              visibility === opt.key
                ? "bg-primary/20 border border-primary/30"
                : "hover:bg-white/5 border border-transparent"
            )}
          >
            <div>
              <p className={cn("text-sm font-semibold", visibility === opt.key ? "text-white" : "text-white/65")}>{opt.label}</p>
              <p className="text-white/40 text-[11px] mt-0.5">{opt.desc}</p>
            </div>
            {visibility === opt.key && <CheckCircle2 size={14} className="text-primary shrink-0" />}
          </button>
        ))}
      </div>

      <Button
        className="w-full h-14 rounded-2xl bg-white text-primary font-bold text-base hover:bg-white/90"
        onClick={onVerify}
      >
        {t("verify")}
      </Button>
    </div>
  );
}

function CandidatesView({ candidates, onSelect, t }: {
  candidates: NearbyOreum[]; onSelect: (o: NearbyOreum) => void; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="text-white w-full max-w-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{t("candidates_title")}</h2>
        <p className="text-white/60 text-sm mt-1">{t("candidates_sub")}</p>
      </div>
      <div className="space-y-2.5">
        {candidates.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o)}
            className="w-full flex items-center gap-3 bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-white/70" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-white text-sm">{o.nameKo}</p>
              <p className="text-white/50 text-xs mt-0.5">{Math.round(o.distanceM)}m 거리</p>
            </div>
            <ChevronRight size={16} className="text-white/30 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

function NoMatchView({ onRetry, onBack, t }: { onRetry: () => void; onBack: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center text-white w-full max-w-sm">
      <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-white/8 border border-white/10 flex items-center justify-center">
        <MapPin size={36} className="text-white/50" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t("no_match_title")}</h2>
      <p className="text-white/60 text-sm mb-10 leading-relaxed">{t("no_match_sub")}</p>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 h-12 border-white/20 text-white/70 hover:bg-white/8" onClick={onBack}>
          {t("back")}
        </Button>
        <Button className="flex-1 h-12 bg-white text-primary hover:bg-white/90 font-semibold" onClick={onRetry}>
          <RotateCcw size={16} className="mr-1.5" />{t("retry", {})}
        </Button>
      </div>
    </div>
  );
}

function DeniedView({ onRetry, t }: { onRetry: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="text-center text-white w-full max-w-sm">
      <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-white/8 border border-white/10 flex items-center justify-center">
        <MapPin size={36} className="text-white/50" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t("denied_title")}</h2>
      <p className="text-white/60 text-sm mb-10 leading-relaxed">{t("denied_sub")}</p>
      <Button className="w-full h-14 rounded-2xl bg-white text-primary font-bold text-base hover:bg-white/90" onClick={onRetry}>
        {t("retry", {})}
      </Button>
    </div>
  );
}

function SuccessView({ oreum, isNew, newBadges, monthCount, onClose, t }: {
  oreum: NearbyOreum; isNew: boolean; newBadges: string[]; monthCount: number | null; onClose: () => void; t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center text-white w-full max-w-sm"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center"
      >
        <CheckCircle2 size={40} className="text-emerald-400" strokeWidth={1.5} />
      </motion.div>

      <h2 className="text-3xl font-bold mb-1">{isNew ? t("success_new") : t("success_revisit")}</h2>
      <p className="text-white/80 text-lg mb-1">{oreum.nameKo}</p>
      {isNew && <p className="text-white/50 text-sm">{t("success_color")}</p>}
      {isNew && monthCount !== null && (
        <p className="text-white/40 text-xs mt-1">이번 달 {monthCount}번째 발견이에요 🌿</p>
      )}

      {newBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 w-full"
        >
          <p className="text-amber-300 text-xs font-bold mb-1.5">🏅 새 배지 획득!</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {newBadges.map((name) => (
              <span key={name} className="text-amber-200 text-xs bg-amber-500/20 px-2.5 py-1 rounded-full">{name}</span>
            ))}
          </div>
        </motion.div>
      )}

      <Button
        className="w-full h-14 rounded-2xl bg-white text-primary font-bold text-base hover:bg-white/90 mt-5"
        onClick={onClose}
      >
        {t("go_collection")}
      </Button>
    </motion.div>
  );
}

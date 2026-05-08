"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Mountain, ChevronRight, X, CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { saveDiscovery, getUserDiscoveries, getUserProfile, getDiscovery } from "@/lib/firestore/users";
import { evaluateAndAwardBadges } from "@/lib/firestore/badges";
import { createDiscoveryFeedEvent } from "@/lib/firestore/feed";
import { getUserChallenges, updateChallengeProgress } from "@/lib/firestore/challenges";
import { cn } from "@/lib/utils";
import type { GpsMatchResult, NearbyOreum, Badge } from "@/types";

type Visibility = "instant" | "delay_10min" | "private";

const VISIBILITY_OPTIONS: { key: Visibility; label: string; desc: string }[] = [
  { key: "instant",     label: "즉시 공개",  desc: "지금 바로 피드에 공개" },
  { key: "delay_10min", label: "10분 후",    desc: "10분 후 피드에 공개 (기본)" },
  { key: "private",     label: "비공개",     desc: "나만 볼 수 있음" },
];

type Stage =
  | "idle"
  | "locating"
  | "matching"
  | "auto_match"
  | "candidates"
  | "no_match"
  | "permission_denied"
  | "verifying"
  | "success"
  | "error";

export default function QRPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [stage, setStage]             = useState<Stage>("idle");
  const [matchResult, setMatchResult] = useState<GpsMatchResult | null>(null);
  const [selected, setSelected]       = useState<NearbyOreum | null>(null);
  const [newBadges, setNewBadges]     = useState<Badge[]>([]);
  const [errMsg, setErrMsg]           = useState<string>("");
  const [visibility, setVisibility]   = useState<Visibility>("delay_10min");
  const [monthCount, setMonthCount]   = useState<number | null>(null);
  const [isRevisit, setIsRevisit]     = useState(false);

  const runGpsFlow = useCallback(async () => {
    setStage("locating");
    setErrMsg("");

    let coords: { latitude: number; longitude: number; accuracy: number };
    try {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
      });
    } catch (err: unknown) {
      const geoErr = err as { code?: number };
      if (geoErr?.code === 1) { setStage("permission_denied"); return; }
      setErrMsg("위치를 가져오지 못했어요. 다시 시도해주세요.");
      setStage("error");
      return;
    }

    setStage("matching");
    try {
      const res = await fetch("/api/qr/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      });
      if (!res.ok) throw new Error("match api error");
      const result: GpsMatchResult = await res.json();
      setMatchResult(result);

      if (result.status === "auto")        setStage("auto_match");
      else if (result.status === "candidates") setStage("candidates");
      else                                  setStage("no_match");
    } catch {
      setErrMsg("서버와 연결할 수 없어요. 잠시 후 다시 시도해주세요.");
      setStage("error");
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, authLoading, router, locale]);

  const handleConfirm = useCallback(async (oreum: NearbyOreum) => {
    if (!user) return;
    setStage("verifying");

    try {
      const existing = await getDiscovery(user.uid, oreum.slug).catch(() => null);
      const wasNew = !existing;
      setIsRevisit(!wasNew);

      if (wasNew) {
        const profile = await getUserProfile(user.uid).catch(() => null);
        await saveDiscovery(user.uid, {
          oreumId: oreum.id,
          oreumSlug: oreum.slug,
          oreumNameKo: oreum.nameKo,
          oreumRegion: oreum.region,
          oreumTier: oreum.tier,
          oreumThumbnailUrl: oreum.thumbnailUrl,
          discoveredAt: new Date().toISOString(),
          verificationMethod: "gps",
          verificationDistanceM: oreum.distanceM,
          userNote: null,
          visibility: visibility === "private" ? "private" : "public",
        });

        // Badge evaluation + challenge update (background)
        getUserDiscoveries(user.uid).then(async (allDiscs) => {
          const now = new Date();
          const monthDiscs = allDiscs.filter((d) => {
            const dt = new Date(d.discoveredAt);
            return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
          });
          setMonthCount(monthDiscs.length);

          const earned = await evaluateAndAwardBadges(user.uid, allDiscs).catch(() => [] as Badge[]);
          if (earned.length > 0) {
            setNewBadges(earned);
            localStorage.setItem("badge_notification", "1");
          }

          const challenges = await getUserChallenges(user.uid);
          for (const ch of challenges) {
            if (ch.isCompleted) continue;
            if (allDiscs.length > ch.progress) {
              updateChallengeProgress(user.uid, ch.id, allDiscs.length, ch.goal).catch(() => {});
            }
          }
        }).catch(() => {});

        // Feed event
        if (visibility !== "private") {
          getUserProfile(user.uid).then((profile) => {
            if (!profile) return;
            createDiscoveryFeedEvent({
              uid: user.uid,
              userNickname: profile.nickname,
              userAvatarUrl: profile.avatarUrl,
              oreumId: oreum.id,
              oreumSlug: oreum.slug,
              oreumNameKo: oreum.nameKo,
              oreumRegion: oreum.region ?? null,
              visibility: "public",
              delayMin: visibility === "delay_10min" ? 10 : 0,
            });
          }).catch(() => {});
        }

        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([40, 30, 80]);
        }
      }

      setSelected(oreum);
      setStage("success");
    } catch {
      setErrMsg("인증 중 오류가 발생했어요. 다시 시도해주세요.");
      setStage("error");
    }
  }, [user, visibility]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  // ── 성공 ──────────────────────────────────────────────────────
  if (stage === "success" && selected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-40 h-40 rounded-2xl overflow-hidden mb-6 ring-4 ring-primary/30 shadow-xl">
            {selected.thumbnailUrl ? (
              <Image src={selected.thumbnailUrl} alt={selected.nameKo} fill className="object-cover" sizes="160px" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                <Mountain size={48} className="text-white/40" />
              </div>
            )}
          </div>

          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle2 size={28} className="text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">{selected.nameKo}</h2>
          <p className="text-muted-foreground text-sm mb-1">
            {isRevisit ? "다시 방문! 반갑네요 👋" : "발견 완료! 도감에 기록됐어요 🎉"}
          </p>
          {!isRevisit && monthCount !== null && (
            <p className="text-muted-foreground text-xs mb-6">이번 달 {monthCount}번째 발견이에요 🌿</p>
          )}
          {isRevisit && <div className="mb-6" />}

          {newBadges.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 mb-6 w-full max-w-xs text-left border border-amber-200">
              <p className="text-xs font-bold text-amber-700 mb-2">🏅 새 배지 획득!</p>
              <div className="space-y-1">
                {newBadges.map((b) => (
                  <p key={b.code} className="text-sm font-medium text-amber-800">{b.nameKo}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 w-full max-w-xs">
            <Button asChild className="flex-1 bg-primary text-white rounded-xl h-11">
              <Link href={`/${locale}/oreum/${selected.slug}`}>카드 보기</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl h-11">
              <Link href={`/${locale}`}>홈으로</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 권한 거부 ──────────────────────────────────────────────────
  if (stage === "permission_denied") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
          <MapPin size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">GPS 권한이 필요해요</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
          오름 인증을 위해 위치 권한이 필요해요. 브라우저 설정에서 위치 권한을 허용하고 다시 시도해주세요.
        </p>
        <div className="flex gap-3">
          <Button onClick={runGpsFlow} className="bg-primary text-white rounded-xl h-11 px-6">
            다시 시도
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-11 px-6">
            <Link href={`/${locale}`}>홈으로</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── 오류 ──────────────────────────────────────────────────────
  if (stage === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
          <AlertTriangle size={28} className="text-destructive/60" />
        </div>
        <h2 className="text-lg font-bold mb-2">오류가 발생했어요</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">{errMsg}</p>
        <div className="flex gap-3">
          <Button onClick={runGpsFlow} className="bg-primary text-white rounded-xl h-11 px-6">
            <RefreshCw size={14} className="mr-1.5" /> 다시 시도
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-11 px-6">
            <Link href={`/${locale}`}>홈으로</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── 로딩 상태들 ──────────────────────────────────────────────
  if (stage === "locating" || stage === "matching" || stage === "verifying") {
    const msg = stage === "locating" ? "위치 확인 중..." : stage === "matching" ? "가까운 오름 찾는 중..." : "인증 중...";
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">{msg}</p>
        <p className="text-sm text-muted-foreground mt-1">잠시만 기다려주세요</p>
      </div>
    );
  }

  // ── 자동 매칭 ─────────────────────────────────────────────────
  if (stage === "auto_match" && matchResult?.matchedOreum) {
    const oreum = matchResult.matchedOreum;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="relative">
          <Link href={`/${locale}`} className="absolute top-4 left-4 z-10 w-9 h-9 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <X size={16} className="text-white" />
          </Link>
          <div className="relative h-72 bg-muted">
            {oreum.thumbnailUrl ? (
              <Image src={oreum.thumbnailUrl} alt={oreum.nameKo} fill className="object-cover" sizes="100vw" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                <Mountain size={64} className="text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white/70 text-xs mb-1">현재 위치에서 {matchResult.distance}m</p>
              <h2 className="text-3xl font-bold text-white">{oreum.nameKo}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between px-5 py-6">
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">이 오름이 맞다면 인증해주세요</p>
            <div className="bg-muted/40 rounded-2xl border border-border p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">공개 범위</p>
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setVisibility(opt.key)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all",
                    visibility === opt.key
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <div className="text-left">
                    <p className={cn("text-sm font-semibold", visibility === opt.key ? "text-primary" : "text-foreground")}>{opt.label}</p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">{opt.desc}</p>
                  </div>
                  {visibility === opt.key && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <Button
              onClick={() => handleConfirm(oreum)}
              className="w-full bg-primary text-white rounded-xl h-12 text-base font-semibold"
            >
              <CheckCircle2 size={18} className="mr-2" />
              인증하기
            </Button>
            <Button
              onClick={() => setStage("candidates")}
              variant="outline"
              className="w-full rounded-xl h-11 text-sm"
            >
              다른 오름인데요...
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── 후보 목록 ─────────────────────────────────────────────────
  if (stage === "candidates" && matchResult) {
    const list = matchResult.candidates.length > 0
      ? matchResult.candidates
      : matchResult.matchedOreum ? [matchResult.matchedOreum] : [];

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="bg-header px-5 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/${locale}`} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
              <X size={16} className="text-white" />
            </Link>
          </div>
          <h2 className="text-xl font-bold text-white">어떤 오름에 다녀오셨나요?</h2>
          <p className="text-white/60 text-sm mt-1">주변에 가까운 오름이 있어요</p>
        </div>

        <div className="flex-1 px-4 py-4 space-y-3">
          {list.map((oreum) => (
            <button
              key={oreum.slug}
              onClick={() => handleConfirm(oreum)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                {oreum.thumbnailUrl ? (
                  <Image src={oreum.thumbnailUrl} alt={oreum.nameKo} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                    <Mountain size={20} className="text-white/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{oreum.nameKo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(oreum.distanceM)}m 거리</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          ))}

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl h-11 text-sm"
          >
            <Link href={`/${locale}/collection`}>직접 선택하기</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── 오름 없음 ─────────────────────────────────────────────────
  if (stage === "no_match") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
          <Mountain size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-2">주변에 오름이 없어요</h2>
        {matchResult?.distance && (
          <p className="text-sm text-muted-foreground mb-2">
            가장 가까운 오름이 {(matchResult.distance / 1000).toFixed(1)}km 떨어져 있어요
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
          오름 근처에서 다시 시도하거나, 도감에서 직접 선택해주세요.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={runGpsFlow} className="bg-primary text-white rounded-xl h-11">
            <RefreshCw size={14} className="mr-1.5" /> 다시 시도
          </Button>
          <Button asChild variant="outline" className="rounded-xl h-11">
            <Link href={`/${locale}/collection`}>도감에서 직접 선택</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl h-11 text-sm">
            <Link href={`/${locale}`}>홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── 초기 화면 (idle) ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-header px-5 pt-4 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/${locale}`} className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
            <X size={16} className="text-white" />
          </Link>
        </div>
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-5">
            <MapPin size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">오름 인증하기</h1>
          <p className="text-white/60 text-sm leading-relaxed">
            오름 근처에서 GPS로<br />자동으로 인증해드려요
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-4 space-y-4 flex-1">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="space-y-3 mb-5">
            {[
              { icon: "📍", text: "오름 정상 또는 입구 근처에 있어야 해요" },
              { icon: "📶", text: "실내보다 야외에서 GPS 정확도가 높아요" },
              { icon: "✅", text: "인증 반경은 약 300m예요" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span className="text-base mt-0.5">{item.icon}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <Button
            onClick={runGpsFlow}
            className="w-full bg-primary text-white rounded-xl h-12 text-base font-semibold"
          >
            <MapPin size={18} className="mr-2" />
            GPS 인증 시작
          </Button>
        </div>
      </div>
    </div>
  );
}

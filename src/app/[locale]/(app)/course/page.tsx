"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { ArrowLeft, Mountain, Check, Clock, MapPin, ChevronRight, RotateCcw, ExternalLink, Share2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getWishlist } from "@/lib/firestore/users";
import { getOreumBySlug } from "@/lib/firestore/oreums";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { haversineDistance } from "@/lib/utils";
import type { WishlistItem, Oreum } from "@/types";

type Step = "select" | "result";

interface CourseOreum {
  item: WishlistItem;
  oreum: Oreum | null;
  travelMinFromPrev: number;
  travelKmFromPrev: number;
  arrivalTime: string;
}

const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function estimateTravelMin(km: number): number {
  return Math.round((km / 40) * 60) + 5;
}

export default function CoursePlannerPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("select");
  const [oreumDetails, setOreumDetails] = useState<Record<string, Oreum>>({});
  const [calculating, setCalculating] = useState(false);
  const [course, setCourse] = useState<CourseOreum[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getWishlist(user.uid).then((w) => { setWishlist(w); setLoading(false); });
  }, [user]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  };

  const handlePlan = async () => {
    setCalculating(true);
    const items = wishlist.filter((i) => selected.has(i.id));

    // Fetch oreum details (for lat/lng)
    const details: Record<string, Oreum> = {};
    await Promise.all(
      items.map(async (item) => {
        const o = await getOreumBySlug(item.oreumSlug);
        if (o) details[item.oreumSlug] = o;
      })
    );
    setOreumDetails(details);

    // Greedy nearest-neighbor algorithm starting from first item
    const startTime = "09:00";
    const remaining = [...items];
    const planned: CourseOreum[] = [];
    let prevLat = 33.4890; // Default: Jeju center
    let prevLng = 126.4983;
    let currentTime = startTime;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const o = details[remaining[i].oreumSlug];
        if (!o) { nearestIdx = i; break; }
        const d = haversineDistance(prevLat, prevLng, o.location.lat, o.location.lng);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }

      const item = remaining.splice(nearestIdx, 1)[0];
      const oreum = details[item.oreumSlug] ?? null;
      const km = oreum ? haversineDistance(prevLat, prevLng, oreum.location.lat, oreum.location.lng) : 0;
      const travelMin = estimateTravelMin(km);

      planned.push({
        item,
        oreum,
        travelMinFromPrev: travelMin,
        travelKmFromPrev: Math.round(km * 10) / 10,
        arrivalTime: addMinutes(currentTime, travelMin),
      });

      const stayMin = oreum?.estimatedMinutes ?? 60;
      currentTime = addMinutes(planned[planned.length - 1].arrivalTime, stayMin);

      if (oreum) { prevLat = oreum.location.lat; prevLng = oreum.location.lng; }
    }

    setCourse(planned);
    setCalculating(false);
    setStep("result");
  };

  const kakaoMapUrl = useMemo(() => {
    if (course.length === 0) return null;
    const first = course[0].oreum;
    const last = course[course.length - 1].oreum;
    if (!first || !last) return null;
    const waypoints = course.slice(1, -1)
      .filter((c) => c.oreum)
      .map((c) => `${c.oreum!.location.lng},${c.oreum!.location.lat},${encodeURIComponent(c.oreum!.nameKo)}`)
      .join("|");
    const sLat = first.location.lat;
    const sLng = first.location.lng;
    const eLat = last.location.lat;
    const eLng = last.location.lng;
    const waypointParam = waypoints ? `&waypoints=${waypoints}` : "";
    return `https://map.kakao.com/link/to/${encodeURIComponent(last.nameKo)},${eLat},${eLng}${waypointParam}`;
  }, [course]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <p className="text-muted-foreground text-sm">로그인이 필요해요</p>
        <Button className="mt-4" onClick={() => router.push(`/${locale}/auth/login`)}>로그인하기</Button>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="max-w-lg mx-auto bg-background min-h-screen pb-28">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setStep("select")}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold">오늘의 코스</h1>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 요약 */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">코스 요약</p>
            <p className="font-bold text-primary">
              {course.length}개 오름 ·{" "}
              {course.reduce((s, c) => s + c.travelKmFromPrev, 0).toFixed(1)}km
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              출발 09:00 — 예상 종료{" "}
              {course.length > 0
                ? addMinutes(
                    course[course.length - 1].arrivalTime,
                    course[course.length - 1].oreum?.estimatedMinutes ?? 60
                  )
                : "--:--"}
            </p>
          </div>

          {/* 타임라인 */}
          <div className="space-y-0">
            {/* 출발 */}
            <div className="flex gap-3 items-center pb-3">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">09:00 출발</p>
              </div>
            </div>

            {course.map((stop, i) => (
              <div key={stop.item.id}>
                {/* 이동 */}
                <div className="flex gap-3 items-start pl-3 py-1.5 border-l-2 border-dashed border-border ml-4">
                  <p className="text-xs text-muted-foreground">
                    🚗 {stop.travelMinFromPrev}분 · {stop.travelKmFromPrev}km
                  </p>
                </div>

                {/* 오름 */}
                <div className="flex gap-3 items-start pb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stop.arrivalTime}</p>
                        <p className="font-semibold text-sm">{stop.item.oreumNameKo}</p>
                        <p className="text-xs text-muted-foreground">
                          {REGION_LABEL[stop.item.oreumRegion]} · 약 {stop.oreum?.estimatedMinutes ?? 60}분
                        </p>
                      </div>
                      {stop.item.oreumThumbnailUrl && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 ml-3">
                          <Image
                            src={stop.item.oreumThumbnailUrl}
                            alt={stop.item.oreumNameKo}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 카카오 지도 버튼 */}
          {kakaoMapUrl && (
            <a href={kakaoMapUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-12 gap-2">
                <MapPin size={16} />
                카카오 지도로 길찾기
                <ExternalLink size={13} className="ml-auto opacity-50" />
              </Button>
            </a>
          )}

          {/* SNS 공유 */}
          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={async () => {
              const names = course.map((c) => c.item.oreumNameKo).join(",");
              const totalKm = course.reduce((s, c) => s + c.travelKmFromPrev, 0).toFixed(1);
              const ogUrl = `/api/og/course-card?oreums=${encodeURIComponent(names)}&km=${totalKm}`;
              const shareText = `오늘의 제주 오름 코스 🏔\n${course.map((c, i) => `${i + 1}. ${c.item.oreumNameKo}`).join("\n")}\n\njejuoreum.com`;
              if (navigator.share) {
                await navigator.share({ title: "제주 오름 코스", text: shareText, url: window.location.origin + ogUrl }).catch(() => {});
              } else {
                await navigator.clipboard.writeText(shareText).catch(() => {});
              }
            }}
          >
            <Share2 size={15} />
            코스 공유하기
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={() => setStep("select")}
          >
            <RotateCcw size={15} />
            다시 선택하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-32">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold">오늘의 코스 짜기</h1>
          <p className="text-xs text-muted-foreground">위시리스트에서 2~5개 선택</p>
        </div>
        <div className="text-xs text-primary font-semibold">{selected.size} / 5</div>
      </div>

      <div className="px-4 py-4 space-y-2.5">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">불러오는 중...</div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Mountain size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">위시리스트가 비어있어요</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/${locale}/collection`)}>
              도감 보기
            </Button>
          </div>
        ) : (
          wishlist.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                  isSelected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-secondary">
                  {item.oreumThumbnailUrl ? (
                    <Image
                      src={item.oreumThumbnailUrl}
                      alt={item.oreumNameKo}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mountain size={18} className="text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.oreumNameKo}</p>
                  <p className="text-xs text-muted-foreground">{REGION_LABEL[item.oreumRegion]}</p>
                  {item.oreumDifficulty && (
                    <p className="text-xs text-muted-foreground">
                      {"★".repeat(item.oreumDifficulty)}{"☆".repeat(5 - item.oreumDifficulty)}
                    </p>
                  )}
                </div>
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-primary border-primary" : "border-border"
                )}>
                  {isSelected && <Check size={14} className="text-white" strokeWidth={2.5} />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {selected.size >= 2 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4">
          <Button
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold gap-2"
            disabled={calculating}
            onClick={handlePlan}
          >
            {calculating ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><ChevronRight size={16} /> {selected.size}개 오름으로 코스 짜기</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

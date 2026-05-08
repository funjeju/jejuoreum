"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Share2, CheckCircle2, Heart, MapPin, Clock, Mountain,
  Pencil, X, Check, Camera, MessageSquare, Navigation, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { getDiscovery, addToWishlist, updateDiscoveryNote, getUserProfile } from "@/lib/firestore/users";
import { getOreumCards } from "@/lib/firestore/oreums";
import { getOreumComments, addComment } from "@/lib/firestore/comments";
import { getOreumPhotos, getMyOreumPhotos, uploadAndSavePhoto } from "@/lib/firestore/photos";
import { getMerchantsForOreum } from "@/lib/firestore/merchants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Oreum, OreumCard, UserDiscovery, Comment, Photo, UserProfile, Merchant, SeoSection } from "@/types";

const HERO_FULL = 320;
const HERO_MIN  = 72;

const TIER_LABEL: Record<string, string> = {
  beginner: "비기너", explorer: "익스플로러", master: "마스터",
};
const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};
const MERCHANT_TYPE_LABELS: Record<string, string> = {
  cafe: "카페", restaurant: "식당", guesthouse: "게스트하우스",
  convenience: "편의점", shop: "잡화", rentcar: "렌터카", experience: "체험", other: "기타",
};
const SEASON_LABELS: Record<string, string> = {
  spring: "봄 🌸", summer: "여름 ☀️", autumn: "가을 🍂", winter: "겨울 ❄️",
};
const TIME_LABELS: Record<string, string> = {
  dawn: "새벽", morning: "오전", noon: "정오", afternoon: "오후", evening: "저녁", night: "야간",
};

type NavSection = "info" | "trail" | "gallery" | "tips" | "my";
const NAV_ITEMS: { key: NavSection; label: string }[] = [
  { key: "info",    label: "정보"   },
  { key: "trail",   label: "탐방"   },
  { key: "gallery", label: "갤러리" },
  { key: "tips",    label: "후기"   },
  { key: "my",      label: "내기록" },
];

export default function OreumCardClient({ oreum, seoSections = [] }: { oreum: Oreum; seoSections?: SeoSection[] }) {
  const locale    = useLocale();
  const router    = useRouter();
  const { user }  = useAuth();

  const [discovery, setDiscovery]         = useState<UserDiscovery | null>(null);
  const [heroH, setHeroH]                 = useState(HERO_FULL);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [relatedOreums, setRelated]       = useState<OreumCard[]>([]);
  const [merchants, setMerchants]         = useState<Merchant[]>([]);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);
  const [weeklyVisitors, setWeeklyVisitors] = useState<number | null>(null);
  const [activeNav, setActiveNav]         = useState<NavSection>("info");

  const sectionRefs: Record<NavSection, React.RefObject<HTMLDivElement | null>> = {
    info:    useRef<HTMLDivElement>(null),
    trail:   useRef<HTMLDivElement>(null),
    gallery: useRef<HTMLDivElement>(null),
    tips:    useRef<HTMLDivElement>(null),
    my:      useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!user) return;
    getDiscovery(user.uid, oreum.slug).then(setDiscovery);
  }, [user, oreum.slug]);

  useEffect(() => {
    getOreumCards({ top100Only: true, region: oreum.region, limitCount: 6 }).then((cards) => {
      setRelated(cards.filter((c) => c.slug !== oreum.slug).slice(0, 4));
    });
  }, [oreum.slug, oreum.region]);

  useEffect(() => {
    getMerchantsForOreum(oreum.slug).then(setMerchants);
  }, [oreum.slug]);

  useEffect(() => {
    fetch(`/api/oreums/${oreum.slug}/stats`)
      .then((r) => r.json())
      .then((data) => {
        setTotalVisitors(data.totalVisitors ?? null);
        setWeeklyVisitors(data.weeklyVisitors ?? null);
      })
      .catch(() => {});
  }, [oreum.slug]);

  useEffect(() => {
    const handler = () => {
      setHeroH(Math.max(HERO_MIN, HERO_FULL - window.scrollY));

      // 활성 섹션 감지
      const scrollMid = window.scrollY + window.innerHeight / 2;
      let current: NavSection = "info";
      for (const { key } of NAV_ITEMS) {
        const el = sectionRefs[key].current;
        if (el && el.offsetTop <= scrollMid) current = key;
      }
      setActiveNav(current);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (key: NavSection) => {
    const el = sectionRefs[key].current;
    if (!el) return;
    const offset = HERO_MIN + 48 + 8;
    window.scrollTo({ top: el.offsetTop - offset, behavior: "smooth" });
  };

  const collapseRatio = Math.max(0, Math.min(1, (HERO_FULL - heroH) / (HERO_FULL - HERO_MIN)));
  const isDiscovered  = !!discovery;

  const handleWishlist = async () => {
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    await addToWishlist(user.uid, {
      oreumId:           oreum.id,
      oreumSlug:         oreum.slug,
      oreumNameKo:       oreum.nameKo,
      oreumThumbnailUrl: oreum.thumbnailUrl,
      oreumRegion:       oreum.region,
      oreumDifficulty:   oreum.difficulty,
      priority:          0,
      addedNote:         null,
      source:            "card_page",
      createdAt:         new Date().toISOString(),
    });
    setWishlistAdded(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: oreum.nameKo, url }).catch(() => {});
    else await navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen pb-40">
      {/* ── 히어로 (스크롤 시 축소) ─── */}
      <div
        className="sticky top-0 z-20 w-full overflow-hidden bg-header"
        style={{ height: heroH, transition: "height 0.05s linear" }}
      >
        {oreum.thumbnailUrl ? (
          <Image
            src={oreum.thumbnailUrl}
            alt={oreum.nameKo}
            fill
            priority
            className={cn("object-cover", !isDiscovered && "grayscale brightness-75")}
            sizes="(max-width: 512px) 100vw, 512px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mountain size={80} className="text-white/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        {/* 뒤로/공유 */}
        <div className="absolute top-4 left-4 right-4 flex justify-between z-30">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <Share2 size={17} strokeWidth={2.2} />
          </button>
        </div>

        {/* 풀 메타 (펼쳐진 상태) */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 transition-opacity duration-150"
          style={{ opacity: 1 - collapseRatio * 2 }}
        >
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {oreum.tier && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    {TIER_LABEL[oreum.tier]}
                  </span>
                )}
                <span className="text-white/60 text-xs">{REGION_LABEL[oreum.region]}</span>
                {weeklyVisitors !== null && weeklyVisitors >= 5 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-green-100,#d1fae5)] text-[var(--brand-green-800,#065f46)]">
                    🔥 이번 주 인기
                  </span>
                )}
              </div>
              <h1 className="text-white text-[26px] font-bold leading-tight">{oreum.nameKo}</h1>
              {oreum.oneLinerKo && (
                <p className="text-white/65 text-sm mt-1 leading-snug">{oreum.oneLinerKo}</p>
              )}
            </div>
            {isDiscovered && (
              <div className="ml-3 flex flex-col items-center gap-1 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white/60 text-[9px]">발견</span>
              </div>
            )}
          </div>
        </div>

        {/* 미니 타이틀 (축소 상태) */}
        <div
          className="absolute bottom-0 left-0 right-0 px-14 pb-2 transition-opacity duration-150"
          style={{ opacity: Math.max(0, collapseRatio * 2 - 1) }}
        >
          <p className="text-white text-sm font-bold truncate text-center">{oreum.nameKo}</p>
        </div>
      </div>

      {/* ── 레이어 메뉴 (sticky) ── */}
      <div
        className="sticky z-10 bg-background/95 backdrop-blur-sm border-b border-border"
        style={{ top: HERO_MIN }}
      >
        <div className="flex items-center gap-0 px-2 h-12 overflow-x-auto [scrollbar-width:none]">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => scrollTo(key)}
              className={cn(
                "shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-colors mx-0.5",
                activeNav === key
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 브레드크럼 ── */}
      <nav className="px-5 pt-4 pb-0">
        <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
          <li>
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">홈</Link>
          </li>
          <li className="text-muted-foreground/40">›</li>
          <li>
            <Link href={`/${locale}/oreum`} className="hover:text-foreground transition-colors">제주 오름</Link>
          </li>
          <li className="text-muted-foreground/40">›</li>
          <li>
            <Link href={`/${locale}/oreum/region/${oreum.region}`} className="hover:text-foreground transition-colors">
              {REGION_LABEL[oreum.region]}
            </Link>
          </li>
          <li className="text-muted-foreground/40">›</li>
          <li className="text-foreground font-medium truncate max-w-[120px]">{oreum.nameKo}</li>
        </ol>
      </nav>

      {/* ── 섹션들 ── */}
      <div className="px-5 py-6 space-y-10">

        {/* 섹션 1: 기본 정보 */}
        <section ref={sectionRefs.info}>
          <SectionHeader label="기본 정보" />

          {/* 협력감 메시지 */}
          {totalVisitors !== null && totalVisitors > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10 mb-4">
              <span className="text-sm">🥾</span>
              <p className="text-xs text-primary font-medium">
                지금까지 <span className="font-bold">{totalVisitors.toLocaleString()}명</span>이 이 오름을 다녀갔어요
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {oreum.elevationM && (
              <InfoChip icon={<Mountain size={14} className="text-muted-foreground" />} label="표고" value={`${oreum.elevationM}m`} />
            )}
            {oreum.difficulty && (
              <InfoChip
                icon={<span className="text-xs font-bold text-muted-foreground">난</span>}
                label="난이도"
                value={"★".repeat(oreum.difficulty) + "☆".repeat(5 - oreum.difficulty)}
              />
            )}
            {oreum.trailLengthKm && (
              <InfoChip icon={<MapPin size={14} className="text-muted-foreground" />} label="탐방로" value={`${oreum.trailLengthKm}km`} />
            )}
            {oreum.estimatedMinutes && (
              <InfoChip icon={<Clock size={14} className="text-muted-foreground" />} label="소요시간" value={`약 ${oreum.estimatedMinutes}분`} />
            )}
          </div>

          {oreum.descriptionKo && (
            <p className="text-sm leading-relaxed text-foreground mt-4">{oreum.descriptionKo}</p>
          )}

          {oreum.emotionalKeywords.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">분위기</p>
              <div className="flex flex-wrap gap-1.5">
                {oreum.emotionalKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          )}

          {oreum.mbti && (
            <Link href={`/${locale}/quiz/result/${oreum.mbti.toLowerCase()}`} className="mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors">
              <span className="text-base">🧠</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">이 오름의 MBTI</p>
                <p className="text-sm font-bold text-primary">{oreum.mbti}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </Link>
          )}

          {oreum.hasAccessRestriction && oreum.accessNotes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mt-4">
              <p className="text-amber-800 text-xs font-semibold mb-0.5">주의</p>
              <p className="text-amber-700 text-xs">{oreum.accessNotes}</p>
            </div>
          )}
        </section>

        {/* SEO 콘텐츠 섹션 (관리자가 발행한 상세 설명) */}
        {seoSections.length > 0 && seoSections.map((section) => (
          <section key={section.key}>
            <SectionHeader label={section.titleKo} />
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{section.bodyKo}</p>
          </section>
        ))}

        {/* 섹션 2: 탐방 정보 */}
        <section ref={sectionRefs.trail}>
          <SectionHeader label="탐방 정보" />

          {(oreum.recommendedSeasons.length > 0 || oreum.recommendedTimes.length > 0) ? (
            <div className="space-y-4">
              {oreum.recommendedSeasons.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">추천 시즌</p>
                  <div className="flex flex-wrap gap-2">
                    {oreum.recommendedSeasons.map((s) => (
                      <span key={s} className="px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-xs font-medium text-primary">
                        {SEASON_LABELS[s] ?? s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {oreum.recommendedTimes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">추천 시간대</p>
                  <div className="flex flex-wrap gap-2">
                    {oreum.recommendedTimes.map((t) => (
                      <span key={t} className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
                        {TIME_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">탐방 정보가 준비 중이에요</p>
          )}

          {/* 가는 길 */}
          {(oreum.location.address || oreum.location.dongAddress) && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-muted-foreground mb-2">가는 길</p>
              <div className="p-3 rounded-xl bg-muted border border-border">
                <p className="text-sm">{oreum.location.address ?? oreum.location.dongAddress}</p>
              </div>
              <a
                href={`https://map.kakao.com/link/to/${encodeURIComponent(oreum.nameKo)},${oreum.location.lat},${oreum.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-xs text-primary font-semibold"
              >
                <Navigation size={12} /> 카카오 지도에서 길찾기
              </a>
            </div>
          )}
        </section>

        {/* 섹션 3: 갤러리 */}
        <section ref={sectionRefs.gallery}>
          <SectionHeader label="갤러리" />
          <GallerySection isDiscovered={isDiscovered} oreum={oreum} user={user ?? null} />
        </section>

        {/* 섹션 4: 방문자 후기 */}
        <section ref={sectionRefs.tips}>
          <SectionHeader label="방문자 후기" />
          <TipsSection isDiscovered={isDiscovered} oreum={oreum} user={user ?? null} />
        </section>

        {/* 섹션 5: 내 기록 */}
        <section ref={sectionRefs.my}>
          <SectionHeader label="내 기록" />
          <MySection discovery={discovery} userId={user?.uid ?? null} oreumSlug={oreum.slug} />
        </section>

        {/* 섹션 6: 주변 상권 */}
        {merchants.length > 0 && (
          <section>
            <SectionHeader label="주변 함께 가볼 곳" />
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
              {merchants.map((m) => (
                <Link key={m.id} href={`/${locale}/merchant/${m.id}`} className="shrink-0">
                  <div className="w-36 rounded-xl overflow-hidden border border-border bg-muted hover:scale-[1.02] transition-transform duration-150">
                    <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5">
                      {m.coverImageUrl ? (
                        <Image src={m.coverImageUrl} alt={m.name} fill className="object-cover" sizes="144px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl text-primary/20">
                            {m.merchantType === "cafe" ? "☕" : m.merchantType === "restaurant" ? "🍽️" : "🏪"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {MERCHANT_TYPE_LABELS[m.merchantType] ?? m.merchantType}
                      </p>
                      {m.contactPhone && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{m.contactPhone}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 섹션 7: 관련 오름 */}
        {relatedOreums.length > 0 && (
          <section>
            <SectionHeader label={`${REGION_LABEL[oreum.region]} 같이 가볼 오름`} />
            <div className="grid grid-cols-2 gap-2">
              {relatedOreums.map((rel) => (
                <Link key={rel.slug} href={`/${locale}/oreum/${rel.slug}`}>
                  <div
                    className="relative rounded-xl overflow-hidden border border-border bg-muted hover:scale-[1.02] transition-transform duration-150"
                    style={{ aspectRatio: "3/2" }}
                  >
                    {rel.thumbnailUrl ? (
                      <Image src={rel.thumbnailUrl} alt={rel.nameKo} fill className="object-cover" sizes="(max-width: 512px) 50vw, 256px" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Mountain size={20} className="text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-[11px] font-semibold truncate">{rel.nameKo}</p>
                      {rel.tierOrder && <p className="text-white/40 text-[9px]">#{rel.tierOrder}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── 하단 CTA ── */}
      <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4 z-10">
        {!isDiscovered ? (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl border-primary/40 text-primary"
              onClick={handleWishlist}
              disabled={wishlistAdded}
            >
              {wishlistAdded ? (
                <><CheckCircle2 size={15} className="mr-1.5" /> 추가됨</>
              ) : (
                <><Heart size={15} className="mr-1.5" /> 위시리스트</>
              )}
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl bg-primary text-white font-semibold shadow-[0_4px_14px_rgba(26,77,46,0.35)]"
              onClick={() => router.push(`/${locale}/qr`)}
            >
              <MapPin size={15} className="mr-1.5" /> 발견하기
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <CheckCircle2 size={16} className="text-primary" />
            <p className="text-primary text-sm font-semibold">
              {discovery?.discoveredAt
                ? new Date(discovery.discoveredAt).toLocaleDateString("ko-KR")
                : ""} 발견 완료
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-sm font-bold text-foreground">{label}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted border border-border">
      {icon}
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function GallerySection({
  isDiscovered, oreum, user,
}: { isDiscovered: boolean; oreum: Oreum; user: { uid: string } | null }) {
  const [photos, setPhotos]       = useState<Photo[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]   = useState<Photo | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const approved = await getOreumPhotos(oreum.slug);
      if (user) {
        const mine = await getMyOreumPhotos(oreum.slug, user.uid);
        const approvedIds = new Set(approved.map((p) => p.id));
        const pending = mine.filter((p) => !approvedIds.has(p.id));
        setPhotos([...approved, ...pending].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } else {
        setPhotos(approved);
      }
      setLoading(false);
    };
    load();
  }, [oreum.slug, user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const profile = await getUserProfile(user.uid);
      const photo = await uploadAndSavePhoto(
        user.uid, oreum.slug, oreum.id, file, null, profile?.nickname ?? "탐험가",
      );
      setPhotos((prev) => [photo, ...prev]);
    } catch {
      // silent — storage may not be configured in dev
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {isDiscovered && user && (
        <label className={cn(
          "flex items-center gap-2 w-full p-3 rounded-xl border border-dashed transition-colors cursor-pointer",
          uploading ? "border-border opacity-60" : "border-border hover:border-primary/40"
        )}>
          <Camera size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {uploading ? "업로드 중..." : "사진 추가하기"}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Camera size={22} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isDiscovered ? "첫 번째 사진을 올려보세요!" : "아직 사진이 없어요"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {photos.map((photo) => (
            <button key={photo.id} onClick={() => setLightbox(photo)} className="aspect-square relative overflow-hidden rounded-lg">
              <Image
                src={photo.thumbnailUrl ?? photo.storageUrl}
                alt={photo.caption ?? "오름 사진"}
                fill className="object-cover" sizes="120px"
              />
              {!photo.isApproved && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-[10px] text-white/80">검토 중</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X size={24} />
            </button>
            <Image src={lightbox.storageUrl} alt={lightbox.caption ?? "오름 사진"} width={400} height={400} className="w-full rounded-xl object-cover" />
            {lightbox.caption && <p className="text-white/80 text-sm mt-3 text-center">{lightbox.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const COMMENT_PROMPTS = [
  "오늘의 탐방로 상태는 어땠나요?",
  "특별히 기억에 남는 포인트가 있나요?",
  "다음에 오는 사람에게 알려주고 싶은 팁?",
  "이 오름만의 매력이 무엇이었나요?",
  "주차장 상황은 어떠셨나요?",
];

function TipsSection({
  isDiscovered, oreum, user,
}: { isDiscovered: boolean; oreum: Oreum; user: { uid: string } | null }) {
  const [comments, setComments]       = useState<Comment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [content, setContent]         = useState("");
  const [rating, setRating]           = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [prompt]                      = useState(() => COMMENT_PROMPTS[Math.floor(Math.random() * COMMENT_PROMPTS.length)]);

  useEffect(() => { getOreumComments(oreum.slug).then((c) => { setComments(c); setLoading(false); }); }, [oreum.slug]);
  useEffect(() => { if (user) getUserProfile(user.uid).then(setProfile); }, [user]);

  const handleSubmit = async () => {
    if (!user || content.trim().length < 5 || submitting) return;
    setSubmitting(true);
    try {
      const data: Omit<Comment, "id"> = {
        oreumSlug: oreum.slug, oreumId: oreum.id, userId: user.uid,
        userNickname: isAnonymous ? "익명의 탐험가" : (profile?.nickname ?? "탐험가"),
        userAvatarUrl: isAnonymous ? null : (profile?.avatarUrl ?? null),
        isAnonymous, content: content.trim(), rating,
        commentType: null, isPublic: true, isPromotedToTip: false,
        createdAt: new Date().toISOString(),
      };
      const id = await addComment(data);
      setComments((prev) => [{ id, ...data }, ...prev]);
      setContent(""); setRating(null);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      {isDiscovered && user && (
        <div className="border rounded-2xl p-4 space-y-3">
          <p className="text-xs text-muted-foreground">{prompt}</p>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(rating === star ? null : star)} className={cn("text-xl leading-none transition-colors", star <= (rating ?? 0) ? "text-amber-400" : "text-muted-foreground/25")}>★</button>
            ))}
            {rating && <span className="text-xs text-muted-foreground ml-1.5">({rating}점)</span>}
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="후기를 남겨주세요 (5자 이상)" maxLength={500} rows={3}
            className="w-full text-sm bg-transparent resize-none outline-none placeholder:text-muted-foreground/50 border-b border-border pb-2" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-3.5 h-3.5 accent-primary" />
              익명으로
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground/40">{content.length}/500</span>
              <Button size="sm" disabled={content.trim().length < 5 || submitting} onClick={handleSubmit} className="h-8 text-xs px-4">
                {submitting ? "..." : "등록"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <MessageSquare size={22} className="text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isDiscovered ? "첫 번째 후기를 남겨보세요!" : "아직 후기가 없어요"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">{comments.map((c) => <CommentItem key={c.id} comment={c} />)}</div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{comment.isAnonymous ? "?" : comment.userNickname[0]}</span>
          </div>
          <div>
            <p className="text-xs font-semibold">{comment.userNickname}</p>
            {comment.rating && (
              <span className="text-xs text-amber-400 leading-none">
                {"★".repeat(comment.rating)}<span className="text-muted-foreground/30">{"★".repeat(5 - comment.rating)}</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground shrink-0">{new Date(comment.createdAt).toLocaleDateString("ko-KR")}</p>
      </div>
      {comment.isPromotedToTip && (
        <div className="mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">현장 팁</span>
        </div>
      )}
      <p className="text-sm leading-relaxed">{comment.content}</p>
    </div>
  );
}

function MySection({
  discovery, userId, oreumSlug,
}: { discovery: UserDiscovery | null; userId: string | null; oreumSlug: string }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText]       = useState(discovery?.userNote ?? "");
  const [saving, setSaving]           = useState(false);

  if (!discovery) {
    return (
      <div className="text-center py-12">
        <Mountain size={36} className="text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">아직 발견하지 않은 오름이에요</p>
        <p className="text-muted-foreground/60 text-xs mt-1">현장에서 GPS 인증으로 발견하세요</p>
      </div>
    );
  }

  const handleSaveNote = async () => {
    if (!userId) return;
    setSaving(true);
    await updateDiscoveryNote(userId, oreumSlug, noteText);
    setSaving(false);
    setEditingNote(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/15">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">발견 완료</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(discovery.discoveredAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-muted border border-border">
        <p className="text-xs text-muted-foreground mb-0.5">인증 방법</p>
        <p className="text-sm font-medium">
          {discovery.verificationMethod === "gps" ? "GPS 자동 인증" : "수동 선택"}
          {discovery.verificationDistanceM && ` (${discovery.verificationDistanceM}m)`}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-muted border border-border">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">나의 메모</p>
          {!editingNote ? (
            <button onClick={() => setEditingNote(true)} className="flex items-center gap-1 text-[11px] text-primary font-semibold">
              <Pencil size={11} /> {noteText ? "수정" : "작성"}
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => { setEditingNote(false); setNoteText(discovery.userNote ?? ""); }}
                className="w-6 h-6 rounded-full bg-muted-foreground/15 flex items-center justify-center">
                <X size={12} className="text-muted-foreground" />
              </button>
              <button onClick={handleSaveNote} disabled={saving}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check size={12} className="text-white" />
              </button>
            </div>
          )}
        </div>
        {editingNote ? (
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
            placeholder="이 오름에 대한 기억을 남겨보세요" rows={3}
            className="w-full text-sm bg-transparent resize-none outline-none placeholder:text-muted-foreground/50"
            autoFocus />
        ) : noteText ? (
          <p className="text-sm">{noteText}</p>
        ) : (
          <p className="text-sm text-muted-foreground/50">메모를 남겨보세요</p>
        )}
      </div>
    </div>
  );
}

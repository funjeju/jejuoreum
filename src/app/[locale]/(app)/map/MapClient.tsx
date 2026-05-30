"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useLocale } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserDiscoveries } from "@/lib/firestore/users";
import { Header } from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";
import type { OreumLevel } from "@/types";

interface OreumLocation {
  id: string;
  slug: string;
  nameKo: string;
  lat: number;
  lng: number;
  recommendedLevel: OreumLevel | null;
  isTop100: boolean;
  thumbnailUrl: string | null;
  tier: string | null;
  region: string;
}

const LEVEL_COLORS: Record<string, string> = {
  entry: "#10b981",
  novice: "#3b82f6",
  intermediate: "#8b5cf6",
  advanced: "#f59e0b",
};

const LEVEL_LABELS: Record<string, string> = {
  entry: "🌱 입문자",
  novice: "🥾 초보자",
  intermediate: "⛰️ 중급자",
  advanced: "🏔️ 숙련자",
};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (container: HTMLElement, options: object) => KakaoMap;
        LatLng: new (lat: number, lng: number) => object;
        Marker: new (options: object) => KakaoMarker;
        InfoWindow: new (options: object) => KakaoInfoWindow;
        MarkerImage: new (src: string, size: object, options?: object) => object;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        event: {
          addListener: (target: object, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

interface KakaoMap {
  setCenter: (latlng: object) => void;
  getLevel: () => number;
}
interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
}
interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
}

export default function MapClient() {
  const { user } = useAuth();
  const locale = useLocale();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const openInfoRef = useRef<KakaoInfoWindow | null>(null);

  const [oreums, setOreums] = useState<OreumLocation[]>([]);
  const [discSlugs, setDiscSlugs] = useState<Set<string>>(new Set());
  const [levelFilter, setLevelFilter] = useState<"all" | OreumLevel>("all");
  const [top100Only, setTop100Only] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // 데이터 로드
  useEffect(() => {
    fetch("/api/oreums/locations")
      .then((r) => r.json())
      .then((data) => setOreums(data.oreums ?? []));
    if (user) {
      getUserDiscoveries(user.uid)
        .then((d) => setDiscSlugs(new Set(d.map((x) => x.oreumSlug))))
        .catch(() => {});
    }
  }, [user]);

  // 지도 초기화 — autoload=true 방식: onLoad 시점에 kakao.maps 바로 사용 가능
  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(33.38, 126.55),
      level: 10,
    });
    mapInstanceRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (sdkReady) initMap();
  }, [sdkReady, initMap]);

  // 마커 렌더링
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || oreums.length === 0) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (openInfoRef.current) openInfoRef.current.close();

    const filtered = oreums.filter((o) => {
      if (levelFilter !== "all" && o.recommendedLevel !== levelFilter) return false;
      if (top100Only && !o.isTop100) return false;
      return true;
    });

    filtered.forEach((oreum) => {
      const isDisc = discSlugs.has(oreum.slug);
      const color = isDisc
        ? (LEVEL_COLORS[oreum.recommendedLevel ?? ""] ?? "#1a4d2e")
        : "#9ca3af";

      // SVG 마커
      const svg = `
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22s14-12.37 14-22C28 6.27 21.73 0 14 0z" fill="${color}" opacity="${isDisc ? 1 : 0.5}"/>
          <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
        </svg>
      `.trim();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const markerImage = new window.kakao.maps.MarkerImage(
        url,
        new window.kakao.maps.Size(28, 36),
        { offset: new window.kakao.maps.Point(14, 36) }
      );

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(oreum.lat, oreum.lng),
        map,
        image: markerImage,
        title: oreum.nameKo,
      });

      const levelLabel = LEVEL_LABELS[oreum.recommendedLevel ?? ""] ?? "";
      const infoContent = `
        <div style="padding:10px 14px;min-width:140px;font-family:sans-serif;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${oreum.nameKo}</p>
          ${levelLabel ? `<p style="font-size:11px;color:#6b7280;margin:0 0 2px;">${levelLabel}</p>` : ""}
          <p style="font-size:11px;color:${isDisc ? "#10b981" : "#9ca3af"};margin:0 0 6px;">${isDisc ? "✅ 발견 완료" : "미발견"}</p>
          <a href="/${locale}/oreum/${oreum.slug}" style="font-size:12px;color:#1a4d2e;font-weight:600;text-decoration:none;">자세히 보기 →</a>
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent,
        removable: true,
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        if (openInfoRef.current) openInfoRef.current.close();
        infoWindow.open(map, marker);
        openInfoRef.current = infoWindow;
      });

      markersRef.current.push(marker);
    });
  }, [oreums, discSlugs, levelFilter, top100Only, mapReady, locale]);

  return (
    <div className="min-h-screen bg-background">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}`}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
      />
      <Header title="오름 지도" />

      {/* 필터 바 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
        <button
          onClick={() => setLevelFilter("all")}
          className={cn(
            "shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors",
            levelFilter === "all" && !top100Only
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground border border-border"
          )}
        >
          전체
        </button>
        {(Object.entries(LEVEL_LABELS) as [OreumLevel, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setLevelFilter(key); setTop100Only(false); }}
            className={cn(
              "shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors",
              levelFilter === key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground border border-border"
            )}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => { setTop100Only((v) => !v); setLevelFilter("all"); }}
          className={cn(
            "shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors",
            top100Only
              ? "bg-amber-500 text-white"
              : "bg-muted text-muted-foreground border border-border"
          )}
        >
          ⭐ 100선만
        </button>
        <span className="shrink-0 self-center text-[11px] text-muted-foreground ml-auto">
          {oreums.filter((o) => {
            if (levelFilter !== "all" && o.recommendedLevel !== levelFilter) return false;
            if (top100Only && !o.isTop100) return false;
            return true;
          }).length}개
        </span>
      </div>

      {/* 지도 영역 — 카카오맵은 명시적 px 높이 필수 */}
      <div className="relative" style={{ height: "calc(100vh - 112px)" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* 범례 */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur rounded-xl border border-border px-3 py-2 text-[10px] space-y-1 pointer-events-none z-10">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> 발견</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> 미발견</div>
        </div>

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">지도 불러오는 중...</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

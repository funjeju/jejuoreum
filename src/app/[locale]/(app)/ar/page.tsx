"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  X, Layers, Mountain, ShoppingBag, Waves, TriangleAlert,
  MapPin, Compass, Check,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  distanceM, bearing, screenX, screenY, labelScale,
  bearingLabel, formatDist,
} from "@/lib/ar/calculations";
import { cn } from "@/lib/utils";
import type { ArObject, ArObjectWithScreen } from "@/types/ar";

type Layer = "oreum" | "mountain" | "sea_landmark" | "merchant";

const LAYER_CONFIG: Record<Layer, { label: string; icon: React.ReactNode; color: string }> = {
  oreum:        { label: "오름",    icon: <Mountain size={14} />,    color: "#16a34a" },
  mountain:     { label: "산",      icon: <TriangleAlert size={14} />, color: "#7c3aed" },
  sea_landmark: { label: "바다",    icon: <Waves size={14} />,       color: "#2563eb" },
  merchant:     { label: "상권",    icon: <ShoppingBag size={14} />, color: "#d97706" },
};

const DEFAULT_LAYERS: Record<Layer, boolean> = {
  oreum: true, mountain: true, sea_landmark: false, merchant: false,
};

export default function ArPage() {
  const router   = useRouter();
  const locale   = useLocale();
  const { user } = useAuth();

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [phase, setPhase]           = useState<"safety" | "loading" | "ready" | "error">("safety");
  const [errorMsg, setErrorMsg]     = useState("");
  const [layers, setLayers]         = useState<Record<Layer, boolean>>(DEFAULT_LAYERS);
  const [showLayers, setShowLayers] = useState(false);
  const [objects, setObjects]       = useState<ArObject[]>([]);
  const [visible, setVisible]       = useState<ArObjectWithScreen[]>([]);
  const [selected, setSelected]     = useState<ArObjectWithScreen | null>(null);
  const [userPos, setUserPos]       = useState<{ lat: number; lng: number; alt: number } | null>(null);
  const [heading, setHeading]       = useState(0);
  const [compassAvail, setCompassAvail] = useState(true);

  // 나침반 수신
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) setHeading(360 - e.alpha);
    };
    window.addEventListener("deviceorientationabsolute" as "deviceorientation", handler);
    window.addEventListener("deviceorientation", handler);
    return () => {
      window.removeEventListener("deviceorientationabsolute" as "deviceorientation", handler);
      window.removeEventListener("deviceorientation", handler);
    };
  }, []);

  const startAr = useCallback(async () => {
    setPhase("loading");
    try {
      // iOS 나침반 권한
      if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
        const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (perm !== "granted") setCompassAvail(false);
      }

      // GPS
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude: lat, longitude: lng, altitude: alt } = pos.coords;
      setUserPos({ lat, lng, alt: alt ?? 0 });

      // 카메라
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // AR 객체 조회
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      if (user?.uid) params.set("uid", user.uid);
      const res = await fetch(`/api/ar/objects?${params}`);
      const data = await res.json();
      setObjects([
        ...(data.oreums ?? []),
        ...(data.landmarks ?? []),
        ...(data.merchants ?? []),
      ]);

      setPhase("ready");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "카메라 또는 위치 권한이 필요해요");
      setPhase("error");
    }
  }, [user]);

  // 라벨 위치 계산 (프레임마다)
  useEffect(() => {
    if (phase !== "ready" || !userPos) return;
    const { innerWidth: W, innerHeight: H } = window;
    const FOV = 60;

    const next: ArObjectWithScreen[] = [];
    for (const obj of objects) {
      if (!layers[obj.type as Layer]) continue;
      const dist = distanceM(userPos.lat, userPos.lng, obj.lat, obj.lng);
      const bear = bearing(userPos.lat, userPos.lng, obj.lat, obj.lng);
      const sx = screenX(bear, heading, FOV, W);
      if (sx === null) continue;
      const sy = screenY(obj.elevation, userPos.alt, dist, H);
      const scale = labelScale(dist);
      next.push({ ...obj, distM: dist, bearingDeg: bear, screenX: sx, screenY: sy, scale });
    }
    // 거리 순 정렬 (가까운 것이 위)
    next.sort((a, b) => a.distM - b.distM);
    setVisible(next.slice(0, 20)); // 최대 20개
  }, [heading, objects, phase, userPos, layers]);

  // 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 안전 안내 화면
  if (phase === "safety") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted">
            <X size={18} />
          </button>
          <h1 className="font-bold">AR 둘러보기</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <TriangleAlert size={28} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg mb-2">안전 안내</h2>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• 걸으면서 사용하지 마세요</li>
              <li>• 정상 가장자리에서 멀리 떨어져 사용하세요</li>
              <li>• AR 사용 중에도 주변을 살피세요</li>
            </ul>
          </div>
          <button
            onClick={startAr}
            className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold"
          >
            알겠습니다 — AR 시작
          </button>
        </div>
      </div>
    );
  }

  // 로딩
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/70">카메라·위치·오름 데이터 준비 중...</p>
      </div>
    );
  }

  // 오류
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <TriangleAlert size={36} className="text-destructive" />
        <p className="font-semibold text-center">{errorMsg}</p>
        <p className="text-sm text-muted-foreground text-center">
          카메라와 위치 권한을 허용한 뒤 다시 시도하세요
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl border text-sm"
        >
          돌아가기
        </button>
      </div>
    );
  }

  // AR 화면
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* 카메라 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* AR 라벨 오버레이 */}
      <div className="absolute inset-0 pointer-events-none">
        {visible.map((obj) => (
          <ArLabel
            key={obj.id}
            obj={obj}
            onClick={() => setSelected(obj)}
          />
        ))}
      </div>

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            router.back();
          }}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
        >
          <X size={18} className="text-white" />
        </button>

        <span className="text-white font-semibold text-sm drop-shadow">AR 둘러보기</span>

        <button
          onClick={() => setShowLayers((v) => !v)}
          className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center"
        >
          <Layers size={18} className="text-white" />
        </button>
      </div>

      {/* 레이어 토글 패널 */}
      {showLayers && (
        <div className="absolute top-16 right-4 bg-black/80 backdrop-blur rounded-2xl p-3 min-w-[150px] z-10">
          {(Object.keys(LAYER_CONFIG) as Layer[]).map((key) => (
            <button
              key={key}
              onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
                layers[key] ? "border-transparent" : "border-white/40"
              )}
                style={{ backgroundColor: layers[key] ? LAYER_CONFIG[key].color : "transparent" }}
              >
                {layers[key] && <Check size={10} className="text-white" />}
              </div>
              <span className="text-white text-xs">{LAYER_CONFIG[key].label}</span>
              <span className="text-white/40 text-[10px] ml-auto">
                {visible.filter((o) => o.type === key).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 하단 상태 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between px-5 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <MapPin size={14} className="text-white/70" />
          <span className="text-xs text-white/70">
            {userPos ? `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : "위치 확인 중"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <Compass size={14} className="text-white/70" />
          <span className="text-xs text-white/70">
            {compassAvail ? `${Math.round(heading)}°` : "나침반 없음"}
          </span>
        </div>
      </div>

      {/* 선택된 객체 상세 패널 */}
      {selected && (
        <div
          className="absolute bottom-16 left-0 right-0 mx-4 bg-white/95 backdrop-blur rounded-2xl p-4 z-20"
          onClick={() => setSelected(null)}
        >
          <ObjectDetail obj={selected} locale={locale} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function ArLabel({
  obj,
  onClick,
}: {
  obj: ArObjectWithScreen;
  onClick: () => void;
}) {
  const cfg = LAYER_CONFIG[obj.type as Layer];
  const isDiscovered = obj.type === "oreum" && obj.isDiscovered;
  const isTop100 = obj.type === "oreum" && obj.isTop100;

  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: obj.screenX,
        top: obj.screenY,
        transform: `translate(-50%, -50%) scale(${obj.scale})`,
        pointerEvents: "auto",
      }}
      className="flex flex-col items-center gap-0.5"
    >
      <div
        className={cn(
          "px-2.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-lg backdrop-blur-sm",
          isDiscovered ? "ring-2 ring-white/60" : ""
        )}
        style={{ backgroundColor: cfg.color + (isTop100 && !isDiscovered ? "cc" : "e6") }}
      >
        <div className="flex items-center gap-1">
          {isDiscovered && <Check size={9} className="shrink-0" />}
          <span className="leading-tight max-w-[100px] truncate">{obj.name}</span>
        </div>
        <p className="text-[9px] text-white/70 mt-0.5">
          {formatDist(obj.distM)} · {bearingLabel(obj.bearingDeg)}
        </p>
      </div>
      <div
        className="w-0.5 h-3 rounded-full opacity-60"
        style={{ backgroundColor: cfg.color }}
      />
    </button>
  );
}

function ObjectDetail({
  obj,
  locale,
  onClose,
}: {
  obj: ArObjectWithScreen;
  locale: string;
  onClose: () => void;
}) {
  const cfg = LAYER_CONFIG[obj.type as Layer];

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: cfg.color }}
          >
            {cfg.icon}
          </div>
          <div>
            <h3 className="font-bold text-sm">{obj.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDist(obj.distM)} · {bearingLabel(obj.bearingDeg)}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted">
          <X size={14} />
        </button>
      </div>

      {obj.type === "oreum" && (
        <div className="space-y-2">
          {obj.isDiscovered && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Check size={12} /> 발견한 오름
            </div>
          )}
          {obj.elevation > 0 && (
            <p className="text-xs text-muted-foreground">해발 {obj.elevation}m</p>
          )}
          {obj.slug && (
            <Link
              href={`/${locale}/oreum/${obj.slug}`}
              className="block w-full py-2 text-center rounded-xl bg-primary text-white text-sm font-semibold"
            >
              {obj.isDiscovered ? "카드 페이지 보기" : "오름 정보 보기"}
            </Link>
          )}
        </div>
      )}

      {(obj.type === "mountain" || obj.type === "sea_landmark") && (
        <div className="text-sm text-muted-foreground">
          <p>표고: {obj.elevation}m</p>
          <p className="mt-1 text-xs">제주의 {obj.type === "mountain" ? "산" : "해안 랜드마크"}</p>
        </div>
      )}

      {obj.type === "merchant" && (
        <div className="text-sm text-muted-foreground">
          <p>제휴 상권 · {obj.merchantType}</p>
        </div>
      )}
    </div>
  );
}

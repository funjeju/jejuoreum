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

// 기기/브라우저 판별 (CriOS = iPhone의 Chrome)
function detectDevice(): "ios_safari" | "ios_chrome" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return /CriOS/.test(ua) ? "ios_chrome" : "ios_safari";
  }
  if (/Android/.test(ua)) return "android";
  return "other";
}

type ArError = {
  title: string;
  desc: string;
  steps: string[];
  cameraGranted?: boolean; // 카메라는 성공했지만 다음 단계(위치 등)에서 실패한 경우
};

export default function ArPage() {
  const router   = useRouter();
  const locale   = useLocale();
  const { user } = useAuth();

  const videoRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [phase, setPhase]       = useState<"safety" | "loading" | "ready" | "error">("safety");
  const [arError, setArError]   = useState<ArError | null>(null);
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
    setArError(null);

    const device = detectDevice();

    const throwErr = (err: ArError): never => { throw err; };

    // ── API 지원 확인 ─────────────────────────────────────────
    if (!navigator.mediaDevices?.getUserMedia) {
      throwErr({
        title: "이 브라우저는 카메라를 지원하지 않아요",
        desc: device === "ios_safari"
          ? "iOS Safari 최신 버전을 사용해주세요."
          : device === "ios_chrome"
          ? "iPhone Chrome을 최신 버전으로 업데이트해주세요."
          : "Chrome 최신 버전으로 업데이트 후 다시 시도해주세요.",
        steps: [],
      });
    }

    // ── getUserMedia는 반드시 첫 번째 await이어야 함 ──────────
    // (Android Chrome: 이전 await이 있으면 user gesture context 소멸 → 팝업 없이 자동 거부)
    try {
      // ① 카메라 권한을 가장 먼저 요청
      let stream!: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        // Permissions API로 실제 권한 상태 확인 (가능한 경우)
        let camState: PermissionState | null = null;
        try {
          const r = await navigator.permissions.query({ name: "camera" as PermissionName });
          camState = r.state;
        } catch { /* 지원 안 하는 브라우저는 무시 */ }
        const e = err as DOMException;
        const e2 = err as DOMException;
        if (e2.name === "NotAllowedError" || e2.name === "PermissionDeniedError") {
          // camState === "prompt" → 권한 창이 떴어야 하는데 즉시 거부 → 서버 정책이 막은 것
          const blockedByPolicy = camState === "prompt";
          if (device === "ios_safari") {
            throwErr({
              title: "카메라 권한이 필요해요",
              desc: blockedByPolicy
                ? "카메라 권한 팝업이 뜨지 않았다면 Safari 설정을 확인해주세요."
                : "iPhone 설정에서 Safari 카메라 권한을 허용해주세요.",
              steps: [
                "iPhone 설정 앱 열기",
                "아래로 스크롤 → Safari 선택",
                "카메라 → '허용'으로 변경",
                "이 페이지로 돌아와 다시 시도",
              ],
            });
          } else if (device === "ios_chrome") {
            throwErr({
              title: "카메라 권한이 필요해요",
              desc: blockedByPolicy
                ? "카메라 권한 팝업이 뜨지 않았다면 Chrome 앱 설정을 확인해주세요."
                : "iPhone 설정에서 Chrome 카메라 권한을 허용해주세요.",
              steps: [
                "iPhone 설정 앱 열기",
                "아래로 스크롤 → Chrome 선택",
                "카메라 → '허용'으로 변경",
                "Chrome으로 돌아와 다시 시도",
              ],
            });
          } else if (device === "android") {
            throwErr({
              title: "카메라 권한이 필요해요",
              desc: blockedByPolicy
                ? "권한 팝업이 뜨지 않았어요. Chrome 앱 권한을 먼저 확인해주세요."
                : "Chrome에서 카메라 권한을 허용해주세요.",
              steps: [
                "Android 설정 → 앱 → Chrome → 권한 → 카메라 → '허용'",
                "Chrome으로 돌아와 이 페이지 새로고침",
                "AR 다시 시작 → 카메라 허용 팝업이 뜨면 허용",
              ],
            });
          } else {
            throwErr({
              title: "카메라 권한이 필요해요",
              desc: "브라우저에서 카메라 접근을 허용해주세요.",
              steps: ["주소창 근처의 🔒 또는 ⚙️ 아이콘을 눌러 카메라 권한을 '허용'으로 변경하세요."],
            });
          }
        }
        if (e2.name === "NotFoundError" || e2.name === "DevicesNotFoundError") {
          throwErr({
            title: "카메라를 찾을 수 없어요",
            desc: "이 기기에서 후면 카메라를 인식하지 못했어요.",
            steps: ["다른 브라우저로 시도하거나, 기기에 카메라가 있는지 확인해주세요."],
          });
        }
        throwErr({
          title: "카메라를 시작할 수 없어요",
          desc: e2.message,
          steps: ["브라우저를 재시작하고 다시 시도해주세요."],
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch { /* autoplay 정책 허용 */ }
      }

      // ② iOS 13+ 나침반 권한 (카메라 다음으로 요청)
      if (
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
          .requestPermission === "function"
      ) {
        try {
          const perm = await (
            DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
          ).requestPermission();
          if (perm !== "granted") setCompassAvail(false);
        } catch {
          setCompassAvail(false);
        }
      }

      // ③ GPS (나침반 이후)
      let pos!: GeolocationPosition;
      try {
        pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
          })
        );
      } catch (err) {
        const e = err as GeolocationPositionError;
        if (e.code === 1 /* PERMISSION_DENIED */) {
          if (device === "ios_safari") {
            throwErr({
              title: "위치 권한이 필요해요",
              desc: "카메라는 허용됐어요. 위치 권한도 설정해주세요.",
              cameraGranted: true,
              steps: [
                "iPhone 설정 앱 열기",
                "개인 정보 보호 및 보안 → 위치 서비스",
                "아래로 스크롤 → Safari → '앱 사용 중' 선택",
                "이 페이지로 돌아와 다시 시도",
              ],
            });
          } else if (device === "ios_chrome") {
            throwErr({
              title: "위치 권한이 필요해요",
              desc: "카메라는 허용됐어요. 위치 권한도 설정해주세요.",
              cameraGranted: true,
              steps: [
                "iPhone 설정 앱 열기",
                "아래로 스크롤 → Chrome 선택",
                "위치 → '앱 사용 중' 선택",
                "Chrome으로 돌아와 다시 시도",
              ],
            });
          } else if (device === "android") {
            throwErr({
              title: "위치 권한이 필요해요",
              desc: "카메라는 허용됐어요. 위치 권한도 허용해주세요.",
              cameraGranted: true,
              steps: [
                "주소창 왼쪽 🔒 아이콘 탭",
                "'권한' 또는 '사이트 설정' 선택",
                "위치 → '허용'으로 변경",
                "페이지 새로고침 후 다시 시도",
              ],
            });
          } else {
            throwErr({
              title: "위치 권한이 필요해요",
              desc: "카메라는 허용됐어요. 브라우저에서 위치 접근도 허용해주세요.",
              cameraGranted: true,
              steps: ["주소창 근처의 🔒 아이콘을 눌러 위치 권한을 '허용'으로 변경하세요."],
            });
          }
        }
        if (e.code === 3 /* TIMEOUT */) {
          throwErr({
            title: "위치를 가져올 수 없어요",
            desc: "GPS 신호가 약해요. 야외로 이동 후 다시 시도해주세요.",
            steps: [],
          });
        }
        throwErr({
          title: "위치를 가져올 수 없어요",
          desc: "GPS가 켜져 있는지 확인하고 다시 시도해주세요.",
          steps: [],
        });
      }

      const { latitude: lat, longitude: lng, altitude: alt } = pos.coords;
      setUserPos({ lat, lng, alt: alt ?? 0 });

      // ④ AR 객체 조회
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
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (e && typeof e === "object" && "title" in e) {
        setArError(e as ArError);
      } else {
        setArError({
          title: "AR을 시작할 수 없어요",
          desc: e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.",
          steps: ["브라우저를 재시작하고 다시 시도해주세요."],
        });
      }
      setPhase("error");
    }
  }, [user]);

  // phase가 ready로 바뀐 후 video 엘리먼트가 마운트되면 스트림 연결
  useEffect(() => {
    if (phase !== "ready" || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [phase]);

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
  if (phase === "error" && arError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted">
            <X size={18} />
          </button>
          <h1 className="font-bold">AR 둘러보기</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center p-6 max-w-sm mx-auto w-full">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-5">
            <TriangleAlert size={26} className="text-red-500" />
          </div>

          {arError.cameraGranted && (
            <div className="flex gap-2 mb-4">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                <Check size={11} /> 카메라
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                <TriangleAlert size={11} /> 위치
              </span>
            </div>
          )}

          <h2 className="text-lg font-bold mb-1">{arError.title}</h2>
          {arError.desc && (
            <p className="text-sm text-muted-foreground mb-5">{arError.desc}</p>
          )}

          {arError.steps.length > 0 && (
            <div className="bg-muted/50 rounded-2xl p-4 border border-border mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">해결 방법</p>
              <ol className="space-y-2.5">
                {arError.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setArError(null); setPhase("safety"); }}
              className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm"
            >
              다시 시도
            </button>
            <button
              onClick={() => router.back()}
              className="w-full py-3.5 rounded-2xl border text-sm font-medium"
            >
              돌아가기
            </button>
          </div>
        </div>
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Upload, Sparkles, Download, Save, ChevronRight, Loader2, X, RefreshCw, ImageIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Oreum } from "@/types";

// ── 스타일 설정 ──────────────────────────────────────────────
const STYLES = [
  { key: "ghibli",     label: "지브리",   emoji: "🌿", desc: "수채화 애니" },
  { key: "anime",      label: "애니",     emoji: "✨", desc: "셀 쉐이딩" },
  { key: "oil",        label: "유화",     emoji: "🎨", desc: "인상주의" },
  { key: "watercolor", label: "수채화",   emoji: "💧", desc: "수채 느낌" },
  { key: "retro",      label: "레트로",   emoji: "🗺️", desc: "빈티지 포스터" },
] as const;
type StyleKey = typeof STYLES[number]["key"];

// ── 카드 텍스트 기본값 ───────────────────────────────────────
interface CardText {
  name:       string;
  oneLiner:   string;
  region:     string;
  elevation:  string;
  hashtags:   string;
}

// ── 카드 그리기 (Canvas) ──────────────────────────────────────
function drawCard(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  text: CardText,
) {
  const W = 1080, H = 1350;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 배경 이미지 (cover)
  const ratio = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth  * ratio;
  const dh = img.naturalHeight * ratio;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // 하단 그라데이션
  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.55)");
  grad.addColorStop(1,   "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 상단 로고
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("제주 오름 패스포트", 60, 72);

  // 지역 + 고도 뱃지
  const badge = [text.region, text.elevation ? `${text.elevation}m` : ""].filter(Boolean).join(" · ");
  if (badge) {
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.textAlign = "left";
    ctx.fillText(badge, 60, H - 300);
  }

  // 오름 이름
  ctx.font = "bold 110px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(text.name, 60, H - 190);

  // 한 줄 설명
  if (text.oneLiner) {
    ctx.font = "36px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.80)";
    // 자동 줄바꿈
    const words = text.oneLiner.split(" ");
    let line = "";
    let y = H - 130;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > W - 120 && line) {
        ctx.fillText(line.trim(), 60, y);
        line = word + " ";
        y += 44;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 60, y);
  }

  // 해시태그
  if (text.hashtags) {
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.textAlign = "left";
    ctx.fillText(text.hashtags, 60, H - 44);
  }
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function CardMakerPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const oreumIdParam = searchParams?.get("oreumId") ?? null;

  const [step, setStep]             = useState<1 | 2 | 3 | 4>(1);
  const [oreums, setOreums]         = useState<Oreum[]>([]);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Oreum | null>(null);

  const [originalImg, setOriginalImg] = useState<string | null>(null);   // 업로드된 원본
  const [styledImg, setStyledImg]     = useState<string | null>(null);   // AI 변환 결과
  const [styleKey, setStyleKey]       = useState<StyleKey>("ghibli");
  const [generating, setGenerating]       = useState(false);
  const [genError, setGenError]           = useState("");
  const [savingIllust, setSavingIllust]   = useState(false);
  const [illustSaved, setIllustSaved]     = useState(false);

  const [cardText, setCardText] = useState<CardText>({
    name: "", oneLiner: "", region: "", elevation: "", hashtags: "",
  });

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const previewImgRef = useRef<HTMLImageElement | null>(null);

  // 오름 목록 로드
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/admin/oreums?pageSize=200", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setOreums(data.oreums ?? []))
        .catch(() => {})
    );
  }, [user]);

  // URL param으로 오름 자동선택
  useEffect(() => {
    if (!oreumIdParam || oreums.length === 0) return;
    const found = oreums.find((o) => o.id === oreumIdParam);
    if (found) { setSelected(found); setStep(2); }
  }, [oreums, oreumIdParam]);

  // 오름 선택 시 텍스트 자동 채우기
  useEffect(() => {
    if (!selected) return;
    const REGION_KO: Record<string, string> = {
      east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
    };
    setCardText({
      name:      selected.nameKo,
      oneLiner:  selected.oneLinerKo ?? "",
      region:    REGION_KO[selected.region] ?? selected.region,
      elevation: selected.elevationM ? String(selected.elevationM) : "",
      hashtags:  `#제주오름 #${selected.nameKo} #JejuOreum`,
    });
  }, [selected]);

  // 파일 선택
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImg(ev.target?.result as string);
      setStyledImg(null);
      setStep(3);
    };
    reader.readAsDataURL(file);
  };

  // AI 스타일 변환
  const handleGenerate = async () => {
    if (!originalImg) return;
    setGenerating(true);
    setGenError("");
    setStyledImg(null);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/admin/card/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64: originalImg, style: styleKey }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "변환 실패");
      const { imageBase64 } = await res.json();
      setStyledImg(imageBase64);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setGenerating(false);
    }
  };

  // 캔버스 렌더
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const src    = styledImg ?? originalImg;
    if (!canvas || !src) return;
    const img = new Image();
    img.onload = () => {
      previewImgRef.current = img;
      drawCard(canvas, img, cardText);
    };
    img.src = src;
  }, [styledImg, originalImg, cardText]);

  useEffect(() => {
    if (step === 4) renderCanvas();
  }, [step, renderCanvas]);

  useEffect(() => {
    if (step === 4 && previewImgRef.current) renderCanvas();
  }, [cardText, renderCanvas, step]);

  // 다운로드
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${cardText.name || "oreum"}-card.png`;
    a.click();
  };

  const filteredOreums = oreums.filter(
    (o) =>
      o.nameKo.includes(search) ||
      o.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const activeImg = styledImg ?? originalImg;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">오름 카드 메이커</h1>
      <p className="text-sm text-muted-foreground mb-6">
        사진 업로드 → AI 스타일 변환 → 텍스트 편집 → 카드 저장
      </p>

      {/* 스텝 바 */}
      <div className="flex items-center gap-2 mb-8">
        {(["1 오름 선택", "2 사진 업로드", "3 스타일 변환", "4 카드 편집"] as const).map(
          (label, i) => {
            const s = (i + 1) as 1 | 2 | 3 | 4;
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => { if (s < step) setStep(s); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                    step === s
                      ? "bg-primary text-white"
                      : s < step
                        ? "bg-primary/20 text-primary cursor-pointer"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {label}
                </button>
                {s < 4 && <ChevronRight size={14} className="text-muted-foreground" />}
              </div>
            );
          },
        )}
      </div>

      {/* ── Step 1: 오름 선택 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="오름 이름 검색..."
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
          />
          <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto">
            {filteredOreums.map((o) => (
              <button
                key={o.id}
                onClick={() => { setSelected(o); setStep(2); }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left hover:border-primary transition-colors",
                  selected?.id === o.id ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                {o.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shrink-0">
                    <span className="text-white/60 font-bold">{o.nameKo[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{o.nameKo}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {o.tierOrder ? `#${o.tierOrder}` : ""} {o.region}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: 사진 업로드 ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted">
            {selected?.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.thumbnailUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{selected?.nameKo[0]}</span>
              </div>
            )}
            <div>
              <p className="font-bold">{selected?.nameKo}</p>
              <p className="text-xs text-muted-foreground">{selected?.oneLinerKo}</p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-3 transition-colors"
          >
            <Upload size={32} className="text-muted-foreground" />
            <p className="font-semibold text-sm">사진을 클릭해서 업로드</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — 최대 10MB</p>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* ── Step 3: 스타일 변환 ── */}
      {step === 3 && (
        <div className="grid grid-cols-2 gap-6">
          {/* 원본 미리보기 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">원본 사진</p>
            {originalImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={originalImg} alt="original" className="w-full aspect-square object-cover rounded-xl" />
            )}
            <button
              onClick={() => { setStep(2); setOriginalImg(null); }}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
            >
              <X size={12} /> 다른 사진 선택
            </button>
          </div>

          {/* 스타일 선택 + 결과 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">스타일 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyleKey(s.key)}
                  className={cn(
                    "p-2 rounded-xl border text-center transition-colors",
                    styleKey === s.key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <p className="text-xl">{s.emoji}</p>
                  <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <><Loader2 size={16} className="animate-spin" /> AI 변환 중... (30초 소요)</>
              ) : (
                <><Sparkles size={16} /> AI 스타일 변환</>
              )}
            </button>

            {genError && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">{genError}</p>
            )}

            {styledImg && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">변환 결과</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={styledImg} alt="styled" className="w-full aspect-square object-cover rounded-xl" />

                {/* 일러스트 저장 버튼 — MBTI 매칭에 사용될 이미지 */}
                <button
                  onClick={async () => {
                    if (!selected || !styledImg) return;
                    setSavingIllust(true);
                    setIllustSaved(false);
                    try {
                      const token = await user?.getIdToken();
                      const res = await fetch("/api/admin/card/save-illustration", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({ oreumId: selected.id, imageBase64: styledImg }),
                      });
                      if (!res.ok) throw new Error("저장 실패");
                      setIllustSaved(true);
                    } catch {
                      alert("일러스트 저장 실패. 다시 시도해주세요.");
                    } finally {
                      setSavingIllust(false);
                    }
                  }}
                  disabled={savingIllust || illustSaved}
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                    illustSaved
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-secondary text-foreground border border-border hover:bg-muted",
                  )}
                >
                  {savingIllust ? (
                    <><Loader2 size={12} className="animate-spin" /> 저장 중...</>
                  ) : illustSaved ? (
                    <><Check size={12} /> 일러스트 저장 완료</>
                  ) : (
                    <><ImageIcon size={12} /> 일러스트로 저장 (MBTI 매칭용)</>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setIllustSaved(false); handleGenerate(); }}
                    className="flex-1 py-2 rounded-lg border border-border text-xs flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={12} /> 재생성
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    다음 → 카드 편집
                  </button>
                </div>
              </div>
            )}

            {!styledImg && !generating && (
              <p className="text-xs text-muted-foreground text-center">
                스타일 선택 후 AI 변환을 눌러주세요
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: 카드 편집 & 미리보기 ── */}
      {step === 4 && (
        <div className="grid grid-cols-2 gap-6">
          {/* 텍스트 편집 */}
          <div className="space-y-4">
            <p className="text-sm font-semibold">텍스트 편집</p>

            {(
              [
                { key: "name",      label: "오름 이름",      placeholder: "대록산" },
                { key: "oneLiner",  label: "한 줄 설명",      placeholder: "제주 동부의 숨은 보석" },
                { key: "region",    label: "지역",            placeholder: "동부" },
                { key: "elevation", label: "표고 (숫자만)",   placeholder: "312" },
                { key: "hashtags",  label: "해시태그",        placeholder: "#제주오름 #대록산" },
              ] as { key: keyof CardText; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input
                  value={cardText[key]}
                  onChange={(e) =>
                    setCardText((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted"
              >
                <Download size={15} /> PNG 다운로드
              </button>
              <button
                onClick={async () => {
                  const canvas = canvasRef.current;
                  if (!canvas || !selected) return;
                  const imageBase64 = canvas.toDataURL("image/png");
                  const token = await user?.getIdToken();
                  const res = await fetch(`/api/admin/oreums/${selected.id}/thumbnail`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ imageBase64 }),
                  });
                  if (res.ok) alert(`${selected.nameKo} 썸네일 저장 완료!`);
                  else alert("저장 실패. 다시 시도해주세요.");
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Save size={15} /> 썸네일 저장
              </button>
            </div>

            {activeImg && (
              <button
                onClick={() => setStep(3)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← 스타일 변환으로 돌아가기
              </button>
            )}
          </div>

          {/* 카드 미리보기 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">카드 미리보기</p>
            <p className="text-xs text-muted-foreground">1080 × 1350 (Instagram 4:5)</p>
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl shadow-lg"
              style={{ aspectRatio: "1080/1350" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Check, X, Star, Loader2, Camera, ChevronLeft, ChevronRight, Keyboard,
} from "lucide-react";
import type { Photo, PhotoCategory } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  parking:     "주차장",
  entrance:    "입구",
  trail:       "탐방로",
  summit_view: "정상 뷰",
  crater:      "분화구",
  flora:       "식생",
  signage:     "표지석",
  selfie:      "인증샷",
};

export default function PhotoQueueClient() {
  const router = useRouter();
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [idx, setIdx]         = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [showHelp, setShowHelp]   = useState(false);
  const [done, setDone]           = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await getToken();
      const res = await fetch("/api/admin/photos/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPhotos(data.photos ?? []);
      setLoading(false);
    })();
  }, []);

  const current = photos[idx] ?? null;

  const action = useCallback(async (
    type: "approve" | "reject" | "representative",
  ) => {
    if (!current || actioning) return;
    setActioning(true);
    try {
      const token = await getToken();
      const body =
        type === "approve"         ? { isApproved: true } :
        type === "reject"          ? { isApproved: false, rejectedAt: new Date().toISOString() } :
        /* representative */         { isApproved: true, isRepresentative: true };

      await fetch(`/api/admin/photos/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      setPhotos((prev) => prev.filter((_, i) => i !== idx));
      setIdx((prev) => Math.min(prev, photos.length - 2));
      setDone((d) => d + 1);
    } finally {
      setActioning(false);
    }
  }, [current, actioning, idx, photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") action("approve");
      else if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft")  action("reject");
      else if (e.key === "l" || e.key === "L" || e.key === "ArrowUp")    action("representative");
      else if (e.key === "?") setShowHelp((h) => !h);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [action]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = photos.length + done;

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera size={28} className="text-primary" />
        </div>
        <p className="text-lg font-semibold">모든 사진을 처리했어요</p>
        <p className="text-muted-foreground text-sm">검토 대기 중인 사진이 없어요</p>
        {done > 0 && <p className="text-xs text-muted-foreground">이번 세션 {done}장 처리</p>}
        <Button variant="outline" onClick={() => router.push("/admin")}>대시보드로</Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">사진 검토</h1>
          <p className="text-sm text-muted-foreground">
            남은 {photos.length}장 · 이번 세션 {done}장 처리
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelp((h) => !h)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Keyboard size={15} />
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(photos.length - 1, i + 1))}
              disabled={idx === photos.length - 1}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {showHelp && (
        <Card className="p-4 mb-4 text-sm space-y-1.5 bg-muted/50">
          <p className="font-semibold mb-2">키보드 단축키</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">K 또는 →</span><span>승인</span>
            <span className="text-muted-foreground">J 또는 ←</span><span>거절</span>
            <span className="text-muted-foreground">L 또는 ↑</span><span>대표 사진 지정</span>
            <span className="text-muted-foreground">?</span><span>도움말 토글</span>
          </div>
        </Card>
      )}

      {/* 진행률 바 */}
      <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
        />
      </div>

      {current && (
        <Card className="overflow-hidden">
          <div className="relative w-full bg-muted" style={{ aspectRatio: "4/3" }}>
            <Image
              src={current.storageUrl}
              alt={current.caption ?? "사진"}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 600px"
            />
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-medium text-sm">{current.oreumSlug}</p>
                <p className="text-xs text-muted-foreground">
                  업로더: {current.userNickname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(current.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              {current.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {CATEGORY_LABELS[current.category]}
                </Badge>
              )}
            </div>

            {current.caption && (
              <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
                "{current.caption}"
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                disabled={actioning}
                onClick={() => action("reject")}
              >
                <X size={16} className="mr-1.5" /> 거절 (J)
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                disabled={actioning}
                onClick={() => action("representative")}
              >
                <Star size={16} className="mr-1.5" /> 대표 (L)
              </Button>
              <Button
                className="flex-1 h-11 bg-primary text-white"
                disabled={actioning}
                onClick={() => action("approve")}
              >
                {actioning
                  ? <Loader2 size={16} className="animate-spin mr-1.5" />
                  : <Check size={16} className="mr-1.5" />
                }
                승인 (K)
              </Button>
            </div>
          </div>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground mt-3">
        {idx + 1} / {photos.length}
      </p>
    </div>
  );
}

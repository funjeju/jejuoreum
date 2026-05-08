"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebase/client";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TEMPLATE_HEADERS = [
  "slug", "nameKo", "nameEn", "tier", "tierOrder", "region", "difficulty",
  "elevation", "trailLengthKm", "estimatedMinutes", "lat", "lng", "address",
  "altNames", "emotionalKeywords", "seasons", "timesOfDay", "features",
  "isPublished", "isFeatured",
].join(",");

const EXAMPLE_ROW = [
  "saebyeol-oreum", "새별오름", "Saebyeol Oreum", "beginner", "1", "west", "2",
  "519.3", "3.2", "90", "33.3707", "126.3086", "제주특별자치도 제주시 애월읍",
  "새별|샛별", "노을|드넓은|인기", "spring|autumn", "afternoon|evening", "panorama|trail",
  "true", "false",
].join(",");

type ImportResult = {
  total: number;
  created: number;
  updated: number;
  errors: number;
  results: Array<{ slug: string; action: string; error?: string }>;
};

export default function BulkImportPage() {
  const [csv, setCsv]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setCsv((e.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const content = [TEMPLATE_HEADERS, EXAMPLE_ROW].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oreums-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csv.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/oreums/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ csv }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const lineCount = csv.trim() ? csv.trim().split("\n").length - 1 : 0;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">오름 데이터 일괄 업로드</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          CSV 파일로 오름 데이터를 한 번에 추가하거나 업데이트해요
        </p>
      </div>

      <div className="space-y-4">
        {/* 템플릿 다운로드 */}
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">CSV 템플릿</p>
              <p className="text-xs text-muted-foreground">필드 형식 예시 파일</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
            <Download size={13} /> 다운로드
          </Button>
        </Card>

        {/* 파일 업로드 */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <Upload size={28} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">CSV 파일을 드래그하거나 클릭해서 업로드</p>
            <p className="text-xs text-muted-foreground mt-0.5">UTF-8 인코딩 CSV (slug 필드 필수)</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>

        {/* 직접 입력 */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">또는 CSV 텍스트 직접 입력</p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            placeholder={`${TEMPLATE_HEADERS}\n${EXAMPLE_ROW}`}
            className="w-full text-xs font-mono rounded-md border border-input bg-transparent px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
          />
        </div>

        {/* 업로드 버튼 */}
        {csv.trim() && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {lineCount}개 행 감지됨
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCsv(""); setResult(null); }}>
                초기화
              </Button>
              <Button onClick={handleImport} disabled={loading} className="gap-1.5">
                {loading
                  ? <><Loader2 size={14} className="animate-spin" />처리 중...</>
                  : <><Upload size={14} />업로드 실행</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              {result.errors === 0
                ? <CheckCircle2 size={18} className="text-emerald-500" />
                : <XCircle size={18} className="text-amber-500" />
              }
              <p className="font-semibold text-sm">업로드 완료</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-2xl font-bold text-emerald-600">{result.created}</p>
                <p className="text-xs text-emerald-700 mt-0.5">신규 추가</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-xs text-blue-700 mt-0.5">업데이트</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-xs text-red-700 mt-0.5">오류</p>
              </div>
            </div>
            {result.errors > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-600">오류 목록</p>
                {result.results.filter((r) => r.error).map((r) => (
                  <div key={r.slug} className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    <span className="font-mono font-semibold">{r.slug}</span>: {r.error}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

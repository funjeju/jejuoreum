"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Upload, Search, ChevronLeft, ChevronRight,
  Pencil, Eye, EyeOff, FileSpreadsheet, CheckCircle2, X, AlertCircle, ShieldAlert, ImagePlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Papa from "papaparse";
import type { Oreum, Tier, Region } from "@/types";
import type { CsvOreumRow } from "@/lib/firestore/admin-oreums";

const TIER_LABEL: Record<string, string> = { beginner: "비기너", explorer: "익스플로러", master: "마스터" };
const REGION_LABEL: Record<string, string> = { east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간" };
const PAGE_SIZE = 20;

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export default function AdminOreumsClient() {
  const [oreums, setOreums]           = useState<Oreum[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]         = useState(false);

  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "unpublished">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [editOreum, setEditOreum]     = useState<Oreum | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [csvModal, setCsvModal]     = useState(false);
  const [csvRows, setCsvRows]       = useState<CsvOreumRow[]>([]);
  const [csvErrors, setCsvErrors]   = useState<string[]>([]);
  const [csvResult, setCsvResult]   = useState<{ inserted: number; updated: number; errors: string[] } | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchOreums = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (search) params.set("search", search);
      if (publishFilter === "published")   params.set("published", "true");
      if (publishFilter === "unpublished") params.set("published", "false");
      const res = await fetch(`/api/admin/oreums?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOreums(data.oreums ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, publishFilter]);

  useEffect(() => { fetchOreums(); }, [fetchOreums]);
  useEffect(() => { setSelectedIds(new Set()); }, [page, search]);

  const pageIds = oreums.map((o) => o.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => { const s = new Set(prev); pageIds.forEach((id) => s.delete(id)); return s; });
    } else {
      setSelectedIds((prev) => { const s = new Set(prev); pageIds.forEach((id) => s.add(id)); return s; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const token = await getToken();
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/admin/oreums/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ isPublished: publish }),
          })
        )
      );
      setSelectedIds(new Set());
      fetchOreums();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleTogglePublish = async (oreum: Oreum) => {
    const token = await getToken();
    await fetch(`/api/admin/oreums/${oreum.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isPublished: !oreum.isPublished }),
    });
    fetchOreums();
  };

  const handleSaveEdit = async () => {
    if (!editOreum) return;
    setEditLoading(true);
    try {
      const token = await getToken();
      await fetch(`/api/admin/oreums/${editOreum.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editOreum),
      });
      setEditOreum(null);
      fetchOreums();
    } finally {
      setEditLoading(false);
    }
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvErrors([]);
    setCsvResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        const rows: CsvOreumRow[] = result.data.map((row, i) => {
          if (!row.slug)   errors.push(`Row ${i + 2}: slug 필드 누락`);
          if (!row.nameKo) errors.push(`Row ${i + 2}: nameKo 필드 누락`);
          if (!row.region) errors.push(`Row ${i + 2}: region 필드 누락`);
          return {
            slug:               row.slug,
            nameKo:             row.nameKo,
            nameEn:             row.nameEn || undefined,
            tier:               (row.tier as Tier) || undefined,
            tierOrder:          row.tierOrder ? Number(row.tierOrder) : undefined,
            region:             row.region as Region,
            lat:                row.lat ? Number(row.lat) : undefined,
            lng:                row.lng ? Number(row.lng) : undefined,
            address:            row.address || undefined,
            elevationM:         row.elevationM ? Number(row.elevationM) : undefined,
            prominenceM:        row.prominenceM ? Number(row.prominenceM) : undefined,
            oneLinerKo:         row.oneLinerKo || undefined,
            difficulty:         row.difficulty ? Number(row.difficulty) : undefined,
            trailLengthKm:      row.trailLengthKm ? Number(row.trailLengthKm) : undefined,
            estimatedMinutes:   row.estimatedMinutes ? Number(row.estimatedMinutes) : undefined,
            emotionalKeywords:  row.emotionalKeywords || undefined,
            mbti:               row.mbti || undefined,
            isPrivateLand:      row.isPrivateLand === "true",
            hasAccessRestriction: row.hasAccessRestriction === "true",
          };
        });
        setCsvErrors(errors);
        setCsvRows(rows);
      },
    });
  };

  const handleCsvImport = async () => {
    if (csvRows.length === 0) return;
    setCsvLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/oreums/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: csvRows }),
      });
      const data = await res.json();
      setCsvResult(data);
      fetchOreums();
    } finally {
      setCsvLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">오름 관리</h1>
          <p className="text-muted-foreground text-sm mt-0.5">전체 {total}개</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/oreums/validate">
            <Button variant="outline">
              <ShieldAlert size={15} className="mr-1.5" />
              검증 리포트
            </Button>
          </Link>
          <Button onClick={() => { setCsvModal(true); setCsvRows([]); setCsvErrors([]); setCsvResult(null); }}>
            <Upload size={15} className="mr-1.5" />
            CSV 일괄 등록
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all",         label: "전체" },
          { key: "published",   label: "발행" },
          { key: "unpublished", label: "미발행" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setPublishFilter(key); setPage(1); setSelectedIds(new Set()); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              publishFilter === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
            placeholder="이름 또는 슬러그 검색..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={() => { setSearch(searchInput); setPage(1); }}>
          검색
        </Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
            <X size={14} />
          </Button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium text-primary">{selectedIds.size}개 선택됨</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              disabled={bulkLoading}
              onClick={() => handleBulkPublish(true)}
            >
              <Eye size={12} className="mr-1" />발행
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-orange-500 border-orange-200 hover:bg-orange-50"
              disabled={bulkLoading}
              onClick={() => handleBulkPublish(false)}
            >
              <EyeOff size={12} className="mr-1" />미발행
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              <X size={12} className="mr-1" />선택 해제
            </Button>
          </div>
          {bulkLoading && <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-muted-foreground/30 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">이름</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">슬러그</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">티어</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">지역</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">고도</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
                : oreums.map((o, idx) => (
                  <tr
                    key={o.id}
                    className={`hover:bg-muted/20 transition-colors ${selectedIds.has(o.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded border-muted-foreground/30 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium">{o.nameKo}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{o.slug}</td>
                    <td className="px-4 py-3">
                      {o.tier ? (
                        <Badge variant="outline" className="text-xs">
                          {TIER_LABEL[o.tier]}
                        </Badge>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{REGION_LABEL[o.region] ?? o.region}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {o.elevationM != null ? `${o.elevationM}m` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {o.isPublished
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={12} />발행</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><EyeOff size={12} />미발행</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEditOreum({ ...o })}
                        >
                          <Pencil size={12} className="mr-1" />편집
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`h-7 px-2 text-xs ${o.isPublished ? "text-orange-500 hover:text-orange-600" : "text-emerald-600 hover:text-emerald-700"}`}
                          onClick={() => handleTogglePublish(o)}
                        >
                          {o.isPublished ? <><EyeOff size={12} className="mr-1" />미발행</> : <><Eye size={12} className="mr-1" />발행</>}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <span className="text-xs text-muted-foreground">{page} / {totalPages} 페이지</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 w-7 p-0">
                <ChevronLeft size={14} />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 w-7 p-0">
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!editOreum} onOpenChange={(o) => !o && setEditOreum(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>오름 편집 — {editOreum?.nameKo}</DialogTitle>
          </DialogHeader>
          {editOreum && (
            <EditForm
              oreum={editOreum}
              onChange={setEditOreum}
              onSave={handleSaveEdit}
              onCancel={() => setEditOreum(null)}
              loading={editLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={csvModal} onOpenChange={setCsvModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet size={18} />
              CSV 일괄 등록
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">필수 컬럼: slug, nameKo, region</p>
              <p>선택 컬럼: nameEn, tier, tierOrder, lat, lng, address, elevationM, prominenceM, oneLinerKo, difficulty, trailLengthKm, estimatedMinutes, emotionalKeywords, mbti, isPrivateLand, hasAccessRestriction</p>
              <p className="mt-1">region 값: east / west / south / north / central</p>
              <p>tier 값: beginner / explorer / master</p>
            </div>

            <div
              className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">CSV 파일을 클릭하여 업로드</p>
              <p className="text-xs text-muted-foreground mt-1">UTF-8 인코딩 권장</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
            </div>

            {csvErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {csvErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    {e}
                  </p>
                ))}
              </div>
            )}

            {csvRows.length > 0 && !csvResult && (
              <div>
                <p className="text-sm font-medium mb-2">{csvRows.length}개 인식됨 (위 5개 미리보기)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border rounded-lg overflow-hidden">
                    <thead className="bg-muted">
                      <tr>
                        {["slug", "nameKo", "tier", "region", "elevationM"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {csvRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono">{row.slug}</td>
                          <td className="px-3 py-2">{row.nameKo}</td>
                          <td className="px-3 py-2">{row.tier ?? "-"}</td>
                          <td className="px-3 py-2">{row.region}</td>
                          <td className="px-3 py-2">{row.elevationM ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {csvResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
                <p className="text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="inline mr-1" />
                  완료
                </p>
                <p className="text-xs text-emerald-600">신규 등록: {csvResult.inserted}개</p>
                <p className="text-xs text-emerald-600">업데이트: {csvResult.updated}개</p>
                {csvResult.errors.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {csvResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setCsvModal(false)}>닫기</Button>
              {csvRows.length > 0 && !csvResult && (
                <Button
                  disabled={csvErrors.length > 0 || csvLoading}
                  onClick={handleCsvImport}
                >
                  {csvLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : `${csvRows.length}개 적용`
                  }
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({
  oreum,
  onChange,
  onSave,
  onCancel,
  loading,
}: {
  oreum: Oreum;
  onChange: (o: Oreum) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const set = (key: keyof Oreum, val: unknown) => onChange({ ...oreum, [key]: val });
  const [thumbUploading, setThumbUploading] = useState(false);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/oreums/${oreum.id}/thumbnail`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (data.thumbnailUrl) onChange({ ...oreum, thumbnailUrl: data.thumbnailUrl });
    } finally {
      setThumbUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      {/* 썸네일 */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">썸네일</h3>
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted shrink-0 relative">
            {oreum.thumbnailUrl ? (
              <Image src={oreum.thumbnailUrl} alt={oreum.nameKo} fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <ImagePlus size={28} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className={`flex items-center gap-2 cursor-pointer ${thumbUploading ? "opacity-60" : ""}`}>
              <Button type="button" variant="outline" size="sm" disabled={thumbUploading} asChild>
                <span>
                  <ImagePlus size={14} className="mr-1.5" />
                  {thumbUploading ? "업로드 중..." : "이미지 업로드"}
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={thumbUploading} />
            </label>
            {oreum.thumbnailUrl && (
              <div className="space-y-1">
                <Label className="text-xs">URL 직접 입력</Label>
                <Input
                  value={oreum.thumbnailUrl ?? ""}
                  onChange={(e) => set("thumbnailUrl", e.target.value || null)}
                  placeholder="https://..."
                  className="text-xs h-7"
                />
              </div>
            )}
            {!oreum.thumbnailUrl && (
              <div className="space-y-1">
                <Label className="text-xs">또는 URL 직접 입력</Label>
                <Input
                  value=""
                  onChange={(e) => set("thumbnailUrl", e.target.value || null)}
                  placeholder="https://..."
                  className="text-xs h-7"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>이름 (한국어)</Label>
            <Input value={oreum.nameKo} onChange={(e) => set("nameKo", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>이름 (영어)</Label>
            <Input value={oreum.nameEn ?? ""} onChange={(e) => set("nameEn", e.target.value || null)} />
          </div>
          <div className="space-y-1">
            <Label>슬러그</Label>
            <Input value={oreum.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>한줄 소개</Label>
            <Input value={oreum.oneLinerKo ?? ""} onChange={(e) => set("oneLinerKo", e.target.value || null)} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">분류</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>티어</Label>
            <Select value={oreum.tier ?? "none"} onValueChange={(v) => set("tier", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                <SelectItem value="beginner">비기너</SelectItem>
                <SelectItem value="explorer">익스플로러</SelectItem>
                <SelectItem value="master">마스터</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>티어 순서</Label>
            <Input
              type="number"
              value={oreum.tierOrder ?? ""}
              onChange={(e) => set("tierOrder", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>지역</Label>
            <Select value={oreum.region} onValueChange={(v) => set("region", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REGION_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">물리적 정보</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>고도 (m)</Label>
            <Input
              type="number"
              value={oreum.elevationM ?? ""}
              onChange={(e) => set("elevationM", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>상대고도 (m)</Label>
            <Input
              type="number"
              value={oreum.prominenceM ?? ""}
              onChange={(e) => set("prominenceM", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>난이도 (1~5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={oreum.difficulty ?? ""}
              onChange={(e) => set("difficulty", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>탐방길 (km)</Label>
            <Input
              type="number"
              step="0.1"
              value={oreum.trailLengthKm ?? ""}
              onChange={(e) => set("trailLengthKm", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>소요시간 (분)</Label>
            <Input
              type="number"
              value={oreum.estimatedMinutes ?? ""}
              onChange={(e) => set("estimatedMinutes", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label>MBTI</Label>
            <Input
              value={oreum.mbti ?? ""}
              maxLength={4}
              onChange={(e) => set("mbti", e.target.value.toUpperCase() || null)}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">위치</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>위도</Label>
            <Input
              type="number"
              step="0.000001"
              value={oreum.location?.lat ?? ""}
              onChange={(e) => set("location", { ...oreum.location, lat: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>경도</Label>
            <Input
              type="number"
              step="0.000001"
              value={oreum.location?.lng ?? ""}
              onChange={(e) => set("location", { ...oreum.location, lng: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>주소</Label>
            <Input
              value={oreum.location?.address ?? ""}
              onChange={(e) => set("location", { ...oreum.location, address: e.target.value || null })}
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">키워드</h3>
        <div className="space-y-1">
          <Label>감성 키워드 (쉼표로 구분)</Label>
          <Input
            value={oreum.emotionalKeywords.join(", ")}
            onChange={(e) => set("emotionalKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          />
        </div>
      </section>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button onClick={onSave} disabled={loading}>
          {loading
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : "저장"
          }
        </Button>
      </div>
    </div>
  );
}

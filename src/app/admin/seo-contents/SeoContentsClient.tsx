"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileText, Loader2, Check, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeoContent, SeoSection } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const DEFAULT_SECTIONS: SeoSection[] = [
  { key: "overview",      titleKo: "개요",          bodyKo: "" },
  { key: "trail_info",    titleKo: "탐방 정보",       bodyKo: "" },
  { key: "access",        titleKo: "찾아가는 방법",   bodyKo: "" },
  { key: "best_time",     titleKo: "베스트 시간대",   bodyKo: "" },
  { key: "nearby",        titleKo: "주변 볼거리",     bodyKo: "" },
  { key: "tips",          titleKo: "꼭 알아야 할 팁", bodyKo: "" },
];

export default function SeoContentsClient() {
  const [contents, setContents]     = useState<SeoContent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing]       = useState<SeoContent | null>(null);
  const [saving, setSaving]         = useState(false);
  const [enhancing, setEnhancing]   = useState<string | null>(null); // section key being enhanced

  const fetchContents = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/seo-contents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContents(data.contents ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContents(); }, []);

  const handleSave = async (publish: boolean) => {
    if (!editing) return;
    setSaving(true);
    try {
      const token = await getToken();
      const body: Partial<SeoContent> = {
        ...editing,
        isPublished: publish,
        publishedAt: publish ? (editing.publishedAt ?? new Date().toISOString()) : null,
      };
      await fetch(`/api/admin/seo-contents/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setContents((prev) =>
        prev.map((c) => c.id === editing.id ? { ...c, ...body } : c)
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAiEnhance = async (sectionIdx: number, instruction: string) => {
    if (!editing) return;
    const section = editing.sections[sectionIdx];
    setEnhancing(section.key);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/seo-contents/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          oreumNameKo: editing.oreumNameKo,
          sectionTitle: section.titleKo,
          currentText: section.bodyKo,
          instruction,
        }),
      });
      if (res.ok) {
        const { enhanced } = await res.json();
        const sections = [...editing.sections];
        sections[sectionIdx] = { ...sections[sectionIdx], bodyKo: enhanced };
        setEditing({ ...editing, sections });
      }
    } finally {
      setEnhancing(null);
    }
  };

  const filtered = contents.filter((c) => {
    const matchSearch =
      !search ||
      c.oreumNameKo.toLowerCase().includes(search.toLowerCase()) ||
      c.oreumSlug.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "all" ? true :
      filterStatus === "published" ? c.isPublished :
      !c.isPublished;
    return matchSearch && matchFilter;
  });

  const published = contents.filter((c) => c.isPublished).length;
  const draft     = contents.filter((c) => !c.isPublished).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">SEO 콘텐츠</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            발행됨 {published}개 · 드래프트 {draft}개
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["all", "published", "draft"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filterStatus === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="h-8 text-xs"
          >
            {f === "all" ? "전체" : f === "published" ? "발행됨" : "드래프트"}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="오름 검색..."
            className="pl-8 h-8 text-xs w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <FileText size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">SEO 콘텐츠가 없어요</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">오름</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">메타 제목</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">섹션</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.oreumNameKo}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.oreumSlug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px]">
                    <p className="truncate text-xs">{c.metaTitle ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.sections?.filter((s) => s.bodyKo).length ?? 0} / {c.sections?.length ?? DEFAULT_SECTIONS.length}
                  </td>
                  <td className="px-4 py-3">
                    {c.isPublished
                      ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Globe size={12} />발행됨
                        </span>
                      : <span className="text-xs text-muted-foreground">드래프트</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => setEditing({
                        ...c,
                        sections: c.sections?.length ? c.sections : DEFAULT_SECTIONS.map((s) => ({ ...s })),
                      })}
                    >
                      편집
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>{editing.oreumNameKo} SEO 편집</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      메타 제목 ({editing.metaTitle?.length ?? 0}/60)
                    </Label>
                    <Input
                      value={editing.metaTitle ?? ""}
                      onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })}
                      placeholder="검색 결과에 표시되는 제목"
                      maxLength={60}
                      className={cn(
                        (editing.metaTitle?.length ?? 0) > 60 && "border-red-300"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">OG 이미지 URL</Label>
                    <Input
                      value={editing.ogImageUrl ?? ""}
                      onChange={(e) => setEditing({ ...editing, ogImageUrl: e.target.value || null })}
                      placeholder="SNS 공유 이미지 URL"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    메타 설명 ({editing.metaDescription?.length ?? 0}/155)
                  </Label>
                  <Input
                    value={editing.metaDescription ?? ""}
                    onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                    placeholder="검색 결과 아래 표시되는 설명"
                    maxLength={155}
                    className={cn(
                      (editing.metaDescription?.length ?? 0) > 155 && "border-red-300"
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">키워드 (쉼표 구분)</Label>
                  <Input
                    value={editing.metaKeywords.join(", ")}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        metaKeywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                      })
                    }
                    placeholder="제주 오름, 등산, ..."
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-semibold">콘텐츠 섹션</p>
                  {(editing.sections ?? DEFAULT_SECTIONS).map((section, i) => (
                    <div key={section.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">{section.titleKo}</Label>
                        <div className="flex items-center gap-1">
                          {enhancing === section.key ? (
                            <Loader2 size={12} className="animate-spin text-primary" />
                          ) : (
                            <div className="flex gap-1">
                              {[
                                { key: "expand",       label: "확장" },
                                { key: "shorten",      label: "요약" },
                                { key: "tone_emotion", label: "감성" },
                                { key: "keyword",      label: "SEO" },
                              ].map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => handleAiEnhance(i, opt.key)}
                                  className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  <Sparkles size={9} /> {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={section.bodyKo}
                        onChange={(e) => {
                          const sections = [...editing.sections];
                          sections[i] = { ...sections[i], bodyKo: e.target.value };
                          setEditing({ ...editing, sections });
                        }}
                        placeholder={`${section.titleKo} 내용 작성...`}
                        rows={3}
                        className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 resize-y outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                      />
                      <p className="text-[10px] text-muted-foreground text-right">{section.bodyKo.length}자</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">
                    취소
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                    임시저장
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 bg-primary text-white"
                  >
                    {saving
                      ? <Loader2 size={14} className="animate-spin mr-1.5" />
                      : <Check size={14} className="mr-1.5" />
                    }
                    발행
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

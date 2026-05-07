"use client";

import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Loader2, ThumbsUp, ThumbsDown, EyeOff, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

const TYPE_LABELS: Record<string, string> = {
  tip: "현장 팁",
  review: "후기",
  warning: "주의",
  photo_caption: "사진 설명",
};
const TYPE_COLOR: Record<string, string> = {
  tip: "bg-amber-50 text-amber-700 border-amber-200",
  review: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-red-50 text-red-700 border-red-200",
  photo_caption: "bg-muted text-muted-foreground",
};

export default function CommentQueueClient() {
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<"all" | "unreviewed" | "tip">("unreviewed");
  const [actioning, setActioning]   = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/comments/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleAction = async (
    comment: Comment,
    type: "promote" | "hide" | "keep",
  ) => {
    setActioning(comment.id);
    try {
      const token = await getToken();
      const body =
        type === "promote" ? { isPromotedToTip: true, commentType: "tip" } :
        type === "hide"    ? { isPublic: false } :
        {};

      await fetch(`/api/admin/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? {
                ...c,
                ...(type === "promote" ? { isPromotedToTip: true, commentType: "tip" as const } :
                    type === "hide"    ? { isPublic: false } : {}),
              }
            : c
        )
      );
    } finally {
      setActioning(null);
    }
  };

  const filtered = comments.filter((c) => {
    const matchSearch =
      !search ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      c.oreumSlug.toLowerCase().includes(search.toLowerCase()) ||
      c.userNickname.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all"        ? true :
      filter === "unreviewed" ? (!c.isPromotedToTip && c.isPublic) :
      filter === "tip"        ? c.commentType === "tip" :
      true;

    return matchSearch && matchFilter;
  });

  const tipCount = comments.filter((c) => c.isPromotedToTip).length;
  const hiddenCount = comments.filter((c) => !c.isPublic).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">코멘트 큐레이션</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            전체 {comments.length}개 · 팁 승격 {tipCount}개 · 비공개 {hiddenCount}개
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(["unreviewed", "tip", "all"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="h-8 text-xs"
          >
            {f === "unreviewed" ? "미검토" : f === "tip" ? "팁 승격됨" : "전체"}
          </Button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
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
          <MessageSquare size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">코멘트가 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className={cn("p-4", !c.isPublic && "opacity-50")}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{c.oreumSlug}</span>
                  <span className="text-muted-foreground text-xs shrink-0">·</span>
                  <span className="text-muted-foreground text-xs shrink-0">{c.userNickname}</span>
                  {c.rating && (
                    <>
                      <span className="text-muted-foreground text-xs shrink-0">·</span>
                      <span className="text-amber-400 text-xs shrink-0">{"★".repeat(c.rating)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.isPromotedToTip && (
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200">팁</Badge>
                  )}
                  {!c.isPublic && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">비공개</Badge>
                  )}
                  {c.commentType && (
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] border", TYPE_COLOR[c.commentType])}
                    >
                      {TYPE_LABELS[c.commentType] ?? c.commentType}
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-3">{c.content}</p>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                </p>
                <div className="flex gap-1.5">
                  {c.isPublic && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      disabled={actioning === c.id}
                      onClick={() => handleAction(c, "hide")}
                    >
                      <EyeOff size={12} className="mr-1" />비공개
                    </Button>
                  )}
                  {!c.isPromotedToTip && c.isPublic && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        disabled={actioning === c.id}
                        onClick={() => handleAction(c, "keep")}
                      >
                        <ThumbsDown size={12} className="mr-1" />일반 유지
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        disabled={actioning === c.id}
                        onClick={() => handleAction(c, "promote")}
                      >
                        {actioning === c.id
                          ? <Loader2 size={12} className="animate-spin mr-1" />
                          : <ThumbsUp size={12} className="mr-1" />
                        }
                        팁 승격
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

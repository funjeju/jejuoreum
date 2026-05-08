"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, Mountain, User, X, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const TIER_LABEL: Record<string, string> = {
  beginner: "비기너", explorer: "익스플로러", master: "마스터",
};
const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

interface OreumResult {
  id: string; slug: string; nameKo: string; thumbnailUrl: string | null;
  tier: string | null; region: string; difficulty: number | null;
}
interface UserResult {
  uid: string; nickname: string; avatarUrl: string | null; bio: string | null;
}

type TabType = "all" | "oreums" | "users";

const RECENT_KEY = "search_recent";
const MAX_RECENT = 8;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function addRecent(q: string) {
  const prev = getRecent().filter((r) => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

export default function SearchPage() {
  const locale = useLocale();
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("all");
  const [oreums, setOreums] = useState<OreumResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(getRecent());
    inputRef.current?.focus();
  }, []);

  const doSearch = async (q: string, t: TabType = tab) => {
    if (!q.trim()) { setOreums([]); setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${t}`);
      const data = await res.json();
      setOreums(data.oreums ?? []);
      setUsers(data.users ?? []);
    } finally { setLoading(false); }
  };

  const handleInput = (v: string) => {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(v), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { addRecent(query.trim()); setRecent(getRecent()); doSearch(query.trim()); }
  };

  const handleRecentClick = (q: string) => {
    setQuery(q); addRecent(q); setRecent(getRecent()); doSearch(q);
  };

  const clearRecent = () => { localStorage.removeItem(RECENT_KEY); setRecent([]); };

  const hasResults = oreums.length > 0 || users.length > 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t("title")} />

      {/* 검색바 */}
      <div className="bg-header px-4 pt-3 pb-5">
        <form onSubmit={handleSubmit} className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full h-11 bg-white/10 border border-white/20 rounded-xl pl-9 pr-9 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 focus:bg-white/15 transition-all"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setOreums([]); setUsers([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X size={15} />
            </button>
          )}
        </form>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {!query && (
          /* 최근 검색어 */
          recent.length > 0 ? (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">{t("recent_label")}</p>
                <button onClick={clearRecent} className="text-xs text-muted-foreground hover:text-foreground">{t("clear_all")}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => handleRecentClick(r)}
                    className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-secondary border border-border transition-colors">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <Search size={32} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{t("empty_hint")}</p>
            </div>
          )
        )}

        {query && (
          <>
            {/* 탭 */}
            <div className="flex gap-2 py-3">
              {(["all", "oreums", "users"] as const).map((tabKey) => (
                <button key={tabKey} onClick={() => { setTab(tabKey); doSearch(query, tabKey); }}
                  className={cn("text-xs px-3 py-1.5 rounded-full border transition-colors",
                    tab === tabKey ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                  {tabKey === "all" ? t("tab_all") : tabKey === "oreums" ? t("tab_oreums") : t("tab_users")}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : !hasResults ? (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("no_results", { query })}
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {/* 오름 결과 */}
                {(tab === "all" || tab === "oreums") && oreums.length > 0 && (
                  <section>
                    {tab === "all" && <p className="text-xs font-semibold text-muted-foreground mb-2">{t("section_oreums")}</p>}
                    <div className="space-y-1">
                      {oreums.map((o) => (
                        <Link key={o.slug} href={`/${locale}/oreum/${o.slug}`}
                          onClick={() => addRecent(query)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                            {o.thumbnailUrl ? (
                              <Image src={o.thumbnailUrl} alt={o.nameKo} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Mountain size={20} className="text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{o.nameKo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {o.tier && (
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                  {TIER_LABEL[o.tier] ?? o.tier}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {REGION_LABEL[o.region] ?? o.region}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* 유저 결과 */}
                {(tab === "all" || tab === "users") && users.length > 0 && (
                  <section>
                    {tab === "all" && <p className="text-xs font-semibold text-muted-foreground mb-2">{t("section_users")}</p>}
                    <div className="space-y-1">
                      {users.map((u) => (
                        <Link key={u.uid} href={`/${locale}/profile/${u.uid}`}
                          onClick={() => addRecent(query)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {u.avatarUrl ? (
                              <Image src={u.avatarUrl} alt={u.nickname} width={48} height={48} className="object-cover" />
                            ) : (
                              <User size={20} className="text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{u.nickname}</p>
                            {u.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{u.bio}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, Shield, ShieldOff, Users } from "lucide-react";
import type { AdminUserRecord } from "@/lib/firestore/admin-users";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AdminUsersClient() {
  const [users, setUsers]       = useState<AdminUserRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [togglingUid, setTogglingUid] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleAdmin = async (u: AdminUserRecord) => {
    setTogglingUid(u.uid);
    try {
      const token = await getToken();
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: u.uid, isAdmin: !u.isAdmin }),
      });
      setUsers((prev) =>
        prev.map((x) => x.uid === u.uid ? { ...x, isAdmin: !x.isAdmin } : x)
      );
    } finally {
      setTogglingUid(null);
    }
  };

  const filtered = search
    ? users.filter((u) =>
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.displayName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        u.uid.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">사용자 관리</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            전체 {users.length}명 · 관리자 {adminCount}명
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이메일, 이름, UID 검색..."
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <Users size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">사용자가 없어요</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">사용자</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">이메일</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">가입일</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">최근 로그인</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">권한</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.uid} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={u.photoURL ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(u.displayName ?? u.email ?? "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.displayName ?? "이름 없음"}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">{u.uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.lastSignIn)}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin
                      ? <Badge className="text-xs bg-primary/10 text-primary border-primary/20 border">
                          관리자
                        </Badge>
                      : <span className="text-xs text-muted-foreground">일반</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      disabled={togglingUid === u.uid}
                      onClick={() => handleToggleAdmin(u)}
                    >
                      {togglingUid === u.uid
                        ? <Loader2 size={12} className="animate-spin" />
                        : u.isAdmin
                          ? <><ShieldOff size={12} className="mr-1" />관리자 해제</>
                          : <><Shield size={12} className="mr-1" />관리자 지정</>
                      }
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

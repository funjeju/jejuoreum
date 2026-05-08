"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { UserCheck, User, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

interface UserRow { uid: string; nickname: string; avatarUrl: string | null; bio: string | null; }

export default function FollowingPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [following, setFollowing] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingUid, setUnfollowingUid] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    user.getIdToken().then((token) =>
      fetch("/api/me/following?profiles=true", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { setFollowing(d.profiles ?? []); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, [user, authLoading]);

  const handleUnfollow = async (targetUid: string, nickname: string) => {
    if (!user || !confirm(`${nickname}님을 언팔로우할까요?`)) return;
    setUnfollowingUid(targetUid);
    const token = await user.getIdToken();
    await fetch("/api/me/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUid, unfollow: true }),
    }).catch(() => {});
    setFollowing((p) => p.filter((f) => f.uid !== targetUid));
    setUnfollowingUid(null);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={`팔로잉 ${following.length > 0 ? following.length : ""}`} />
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
        ) : following.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center px-4">
            <UserCheck size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">팔로잉하는 탐험가가 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">피드에서 다른 탐험가를 팔로우해보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {following.map((f) => (
              <div key={f.uid} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/${locale}/profile/${f.uid}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-muted shrink-0 overflow-hidden">
                    {f.avatarUrl ? (
                      <Image src={f.avatarUrl} alt={f.nickname} width={44} height={44} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={18} className="text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.nickname}</p>
                    {f.bio && <p className="text-xs text-muted-foreground truncate">{f.bio}</p>}
                  </div>
                </Link>
                <Button size="sm" variant="outline"
                  className="shrink-0 h-8 text-xs border-muted-foreground/30 text-muted-foreground"
                  onClick={() => handleUnfollow(f.uid, f.nickname)}
                  disabled={unfollowingUid === f.uid}>
                  {unfollowingUid === f.uid ? <Loader2 size={12} className="animate-spin" /> : "팔로잉"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

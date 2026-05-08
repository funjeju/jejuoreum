"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Users, User, Loader2, UserMinus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

interface UserRow { uid: string; nickname: string; avatarUrl: string | null; bio: string | null; }

export default function FollowersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [followers, setFollowers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push(`/${locale}/auth/login`); return; }
    user.getIdToken().then((token) =>
      fetch("/api/me/followers", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => { setFollowers(d.followers ?? []); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, [user, authLoading]);

  const handleRemove = async (targetUid: string) => {
    if (!user || !confirm("팔로워를 삭제할까요?")) return;
    setRemovingUid(targetUid);
    const token = await user.getIdToken();
    await fetch("/api/me/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUid, removeFollower: true }),
    }).catch(() => {});
    setFollowers((p) => p.filter((f) => f.uid !== targetUid));
    setRemovingUid(null);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={`팔로워 ${followers.length > 0 ? followers.length : ""}`} />
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center px-4">
            <Users size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">아직 팔로워가 없어요</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {followers.map((f) => (
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
                <Button size="sm" variant="ghost" className="shrink-0 h-8 px-2 text-muted-foreground"
                  onClick={() => handleRemove(f.uid)} disabled={removingUid === f.uid}>
                  {removingUid === f.uid ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={14} />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

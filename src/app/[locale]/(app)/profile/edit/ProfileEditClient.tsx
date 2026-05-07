"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import Image from "next/image";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import { getUserProfile, upsertUserProfile } from "@/lib/firestore/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types";

export default function ProfileEditClient() {
  const { user } = useAuth();
  const locale   = useLocale();
  const router   = useRouter();

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { router.replace(`/${locale}/auth/login`); return; }
    getUserProfile(user.uid)
      .then((p) => { if (p) setProfile(p); })
      .finally(() => setLoading(false));
  }, [user, locale, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfile((p) => ({ ...p, avatarUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertUserProfile(user.uid, {
        nickname:   profile.nickname ?? "",
        avatarUrl:  profile.avatarUrl ?? null,
        bio:        profile.bio ?? null,
        oreumMbti:  profile.oreumMbti ?? null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="bg-[hsl(var(--header-bg))] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-white font-semibold">프로필 편집</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="-mt-4 bg-background rounded-t-2xl px-4 pt-6 pb-10">
        {/* 아바타 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="프로필" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                  {profile.nickname?.[0] ?? "?"}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background"
            >
              {uploading
                ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} className="text-white" />
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* 폼 */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>닉네임</Label>
            <Input
              value={profile.nickname ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
              maxLength={20}
              placeholder="닉네임을 입력하세요"
            />
          </div>

          <div className="space-y-1.5">
            <Label>소개</Label>
            <Input
              value={profile.bio ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value || null }))}
              maxLength={60}
              placeholder="짧은 소개를 적어보세요"
            />
          </div>

          <div className="space-y-1.5">
            <Label>오름 MBTI</Label>
            <Input
              value={profile.oreumMbti ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, oreumMbti: e.target.value.toUpperCase() || null }))}
              maxLength={4}
              placeholder="MBTI 테스트 후 자동 입력됩니다"
              readOnly
              className="cursor-not-allowed text-muted-foreground"
            />
          </div>
        </div>

        <Button className="w-full mt-8 h-12" onClick={handleSave} disabled={saving || !profile.nickname?.trim()}>
          {saving
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : "저장하기"
          }
        </Button>
      </div>
    </div>
  );
}

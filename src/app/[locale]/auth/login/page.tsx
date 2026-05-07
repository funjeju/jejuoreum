"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Mountain } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { upsertUserProfile } from "@/lib/firestore/users";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await upsertUserProfile(user.uid, {
        nickname: user.displayName?.split(" ")[0] ?? "탐험가",
        avatarUrl: user.photoURL ?? null,
        createdAt: new Date().toISOString(),
      });
      router.push(`/${locale}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--header-bg)] flex flex-col items-center justify-center px-6">
      {/* 로고 */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
          <Mountain size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t("login_title")}</h1>
        <p className="text-white/60 text-sm mt-2 leading-relaxed">{t("login_sub")}</p>
      </div>

      {/* 로그인 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleGoogle}
          className="w-full h-14 rounded-2xl bg-white flex items-center justify-center gap-3 font-semibold text-gray-800 hover:bg-white/95 active:scale-[0.98] transition-all shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("google_login")}
        </button>

        <Button
          variant="ghost"
          className="w-full h-12 text-white/60 hover:text-white hover:bg-white/10"
          onClick={() => router.push(`/${locale}`)}
        >
          {t("guest")}
        </Button>
      </div>

      <p className="text-white/30 text-xs mt-10 text-center">
        로그인하면 이용약관 및 개인정보처리방침에 동의하게 됩니다
      </p>
    </div>
  );
}

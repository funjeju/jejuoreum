"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { upsertUserProfile } from "@/lib/firestore/users";

export function PendingMbtiSaver() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem("pending_mbti");
    if (!pending) return;
    localStorage.removeItem("pending_mbti");
    upsertUserProfile(user.uid, { oreumMbti: pending }).catch(() => {});
  }, [user]);

  return null;
}

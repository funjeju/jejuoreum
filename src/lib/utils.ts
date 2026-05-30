import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export function getSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export function getTimeKey(): string {
  const h = new Date().getHours();
  if (h < 5) return "dawn";
  if (h < 11) return "morning";
  if (h < 14) return "noon";
  if (h < 18) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

export type UserGrade = "entry" | "novice" | "intermediate" | "advanced";

export const GRADE_INFO: Record<UserGrade, { label: string; emoji: string; color: string; min: number; max: number | null }> = {
  entry:        { label: "입문자", emoji: "🌱", color: "emerald", min: 0,  max: 9  },
  novice:       { label: "초보자", emoji: "🥾", color: "blue",    min: 10, max: 29 },
  intermediate: { label: "중급자", emoji: "⛰️", color: "violet",  min: 30, max: 49 },
  advanced:     { label: "숙련자", emoji: "🏔️", color: "amber",   min: 50, max: null },
};

export function getUserGrade(discoveryCount: number): UserGrade {
  if (discoveryCount < 10) return "entry";
  if (discoveryCount < 30) return "novice";
  if (discoveryCount < 50) return "intermediate";
  return "advanced";
}

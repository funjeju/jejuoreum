import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "제주 오름 패스포트",
  description: "제주 오름 100선 수집 여정 — 직접 오르고, 기록하고, 완성해가는 나만의 오름 도감",
  metadataBase: new URL("https://jejuoreum.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "오름패스포트",
  },
  openGraph: {
    title: "제주 오름 패스포트",
    description: "제주 오름 100선 수집 여정",
    locale: "ko_KR",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

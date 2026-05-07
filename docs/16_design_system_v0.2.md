# 16. Design System v0.2 — 시안 기반 + shadcn/ui 필수

> **본 문서는 첨부 시안 이미지를 픽셀 단위로 구현하기 위한 명세다.**
> 모든 컴포넌트는 **shadcn/ui 베이스**로 만든다. 직접 구현 최소화.
> 외주사가 이 한 문서만 보고 구현 가능하도록 작성됐다.

---

## 0. 가장 먼저 읽을 것

### 0.1 시안 이미지가 곧 디자인이다

첨부된 시안 (홈 탭 + 도감 탭) = **최종 확정 디자인**.

- 색상·여백·라운드·폰트 모두 시안 그대로
- 임의 변경 금지
- 의문점 발생 시 시안 우선

### 0.2 강제 도구 (절대 변경 X)

```bash
# 모두 npx shadcn@latest init 후 add 명령으로
- shadcn/ui (모든 인터랙티브 컴포넌트)
- Tailwind CSS (스타일)
- lucide-react (아이콘 — 이모지 절대 금지)
- recharts (도넛 차트)
- Pretendard (한글 폰트)
```

직접 만들지 말 것. 이미 있는 거 쓸 것.

---

## 1. 컬러 시스템 (시안 정확 추출)

### 1.1 시안에서 추출한 핵심 색상

| 용도 | HEX | HSL | Tailwind 클래스 |
|------|-----|-----|---------------|
| 헤더 다크 그린 | `#0F2A1D` | `142 60% 12%` | `bg-header-bg` |
| 브랜드 그린 (액센트) | `#1A4D2E` | `142 49% 21%` | `bg-primary` |
| 옅은 그린 (배경 강조) | `#F0F7F2` | `142 30% 95%` | `bg-secondary` |
| 본문 배경 | `#FFFFFF` | `0 0% 100%` | `bg-background` |
| 섹션 배경 | `#FAFAFA` | `0 0% 98%` | `bg-muted` |
| 보더 | `#E5E5E5` | `0 0% 90%` | `border-border` |
| 텍스트 (제목) | `#0F0F0F` | `0 0% 6%` | `text-foreground` |
| 텍스트 (보조) | `#737373` | `0 0% 45%` | `text-muted-foreground` |
| NEW 라벨 배경 | `#1A4D2E` | — | `bg-primary` |
| 체크 마크 (발견) | `#1A4D2E` 원 + 흰 체크 | — | — |

### 1.2 globals.css 정확한 값

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 6%;

    --primary: 142 49% 21%;
    --primary-foreground: 0 0% 100%;

    --secondary: 142 30% 95%;
    --secondary-foreground: 142 49% 15%;

    --muted: 0 0% 98%;
    --muted-foreground: 0 0% 45%;

    --accent: 142 30% 90%;
    --accent-foreground: 142 49% 15%;

    --destructive: 0 84% 50%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 90%;
    --input: 0 0% 90%;
    --ring: 142 49% 21%;

    --radius: 0.75rem;

    /* 커스텀 */
    --header-bg: 142 60% 12%;
    --header-foreground: 0 0% 100%;
  }
}
```

### 1.3 tailwind.config.ts 추가

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn 기본 토큰 (자동 생성됨)
        // 추가 커스텀:
        "header-bg": "hsl(var(--header-bg))",
        "header-foreground": "hsl(var(--header-foreground))",
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 2. 타이포그래피

### 2.1 Pretendard 적용

`app/layout.tsx`:

```typescript
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

또는 CDN 직접 사용:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" />
```

### 2.2 텍스트 스케일 (시안 정확)

| 용도 | Tailwind 클래스 | 사이즈 / weight |
|------|---------------|---------------|
| 헤더 제목 ("제주 오름 패스포트") | `text-base font-semibold` | 16px / 600 |
| 페이지 큰 제목 (도감 36/100의 "36") | `text-5xl font-bold` | 48px / 700 |
| Hero 카드 제목 ("새별오름") | `text-2xl font-bold` | 24px / 700 |
| 섹션 제목 ("나의 탐방 현황") | `text-base font-semibold` | 16px / 600 |
| 본문 | `text-sm` | 14px / 400 |
| 카드 메타 (날짜·거리) | `text-xs text-muted-foreground` | 12px / 400 |
| 라벨 (NEW, 비기너 30) | `text-xs font-medium` | 12px / 500 |

---

## 3. shadcn/ui 컴포넌트 매핑

### 3.1 시안 화면별 컴포넌트 매트릭스

#### 홈 탭 (좌측 시안)

| 시안 요소 | shadcn 사용 | 자체 작성 | 예시 |
|---------|------------|---------|------|
| 헤더 (메뉴/제목/알림) | — | ✓ Header.tsx | sticky, `bg-header-bg` |
| 햄버거 메뉴 → Sheet | ✓ `Sheet` | — | 좌측 슬라이드 |
| 알림 아이콘 | — | `lucide-react Bell` | — |
| 인사말 | — | 단순 텍스트 | — |
| Hero 카드 (오늘의 추천) | ✓ `Card` | 변형 (사진 배경) | `RecommendationHeroCard` |
| 태그 (비기너/서부/일출 추천) | ✓ `Badge` | — | `variant="secondary"` |
| 체크 마크 | — | `lucide-react CheckCircle2` | 우상단 absolute |
| 나의 탐방 현황 카드 | ✓ `Card` | + recharts `PieChart` | `ProgressOverviewCard` |
| 진척도 라인 (비기너 8/30) | ✓ `Progress` | — | `<Progress value={26.7} />` |
| 빠른 인증하기 카드 | ✓ `Card` | + 사진 배경 변형 | `QuickVerifyCard` |
| GPS 인증 시작 버튼 | ✓ `Button` | — | `<Button>GPS 인증 시작</Button>` |
| 가로 스크롤 카드 | ✓ `ScrollArea` | + Card 자체 | `RecentDiscoveryCard` |
| NEW 라벨 | ✓ `Badge` | — | `variant="default"` |
| 위시리스트 Top 3 | ✓ `Card` (3개) | — | — |
| 하단 탭바 | — | ✓ BottomNavBar.tsx | sticky bottom |
| 플로팅 QR 버튼 | — | ✓ FloatingQRButton.tsx | `Button` 베이스 |

#### 도감 탭 (우측 시안)

| 시안 요소 | shadcn 사용 | 자체 작성 | 예시 |
|---------|------------|---------|------|
| 헤더 (홈과 동일) | ✓ 재사용 | — | — |
| 도감 완성도 카드 | ✓ `Card` | + 캐릭터 일러스트 | `CollectionStatsCard` |
| 36/100 큰 숫자 | — | text-5xl | — |
| 진척도 바 | ✓ `Progress` | — | `<Progress value={36} />` |
| Tier Tabs (비기너/익스플로러/마스터) | ✓ `Tabs` | — | `TabsList`, `TabsTrigger` |
| Tab Trigger 옆 카운트 | ✓ `Badge` | — | `variant="secondary"` |
| 3열 그리드 | — | CSS grid | `grid grid-cols-3 gap-2` |
| 카드 (발견) | ✓ `Card` | 사진 배경 | `OreumCard` |
| 체크 마크 | — | `lucide-react CheckCircle2` | 우상단 |
| 카드 (미발견) | ✓ `Card` | `grayscale opacity-60` | — |
| 하단 필터/맵핀/정렬 | ✓ `Button` (3개) | — | `variant="outline"` |
| 필터 모달 | ✓ `Sheet` | — | 하단 슬라이드 |

### 3.2 자체 작성 컴포넌트 목록 (페이즈 1 필수)

오직 다음만 직접 작성. 그 외는 shadcn 기반.

```
components/
├── layout/
│   ├── Header.tsx               # sticky 헤더, bg-header-bg
│   └── BottomNavBar.tsx         # 5탭 + 플로팅 QR
├── home/
│   ├── RecommendationHeroCard.tsx
│   ├── ProgressOverviewCard.tsx # 도넛 + 진척도
│   ├── QuickVerifyCard.tsx
│   ├── RecentDiscoveryScroll.tsx
│   └── WishlistTop3.tsx
├── collection/
│   ├── CollectionStatsCard.tsx  # 36/100 + 캐릭터
│   ├── OreumCard.tsx            # 그리드용 카드
│   └── FilterControls.tsx       # 하단 필터·정렬 row
├── discovery/
│   └── DiscoveryMomentAnimation.tsx  # 흑백→컬러
├── floating/
│   └── FloatingQRButton.tsx
└── ui/
    └── (shadcn 자동 생성 — 직접 수정 X)
```

---

## 4. 핵심 컴포넌트 코드 명세

이 섹션은 외주사가 **그대로 복사해 만들 수 있는** 수준으로 작성.

### 4.1 Header (홈/도감 공통)

```typescript
// components/layout/Header.tsx
"use client";

import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  title?: string;
  notificationCount?: number;
}

export function Header({ title = "제주 오름 패스포트", notificationCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-header-bg px-4 text-header-foreground">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          {/* 사이드 메뉴 콘텐츠 */}
        </SheetContent>
      </Sheet>

      <h1 className="text-base font-semibold">{title}</h1>

      <Button variant="ghost" size="icon" className="text-header-foreground hover:bg-white/10 relative">
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Button>
    </header>
  );
}
```

### 4.2 RecommendationHeroCard (오늘의 추천)

```typescript
// components/home/RecommendationHeroCard.tsx
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  oreum: {
    id: string;
    name: string;
    imageUrl: string;
    tags: string[];
    isDiscovered: boolean;
  };
  onClick: () => void;
}

export function RecommendationHeroCard({ oreum, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="relative overflow-hidden h-[220px] cursor-pointer rounded-2xl"
    >
      {/* 사진 배경 */}
      <Image
        src={oreum.imageUrl}
        alt={oreum.name}
        fill
        className="object-cover"
      />

      {/* 다크 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* 체크 마크 (발견 시) */}
      {oreum.isDiscovered && (
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* 텍스트 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-xs text-white/85 mb-1">오늘의 추천 오름</p>
        <h2 className="text-2xl font-bold text-white mb-2">{oreum.name}</h2>
        <div className="flex gap-1.5 flex-wrap">
          {oreum.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

### 4.3 ProgressOverviewCard (탐방 현황 + 도넛)

```typescript
// components/home/ProgressOverviewCard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface Props {
  total: { discovered: number; total: number };
  beginner: { discovered: number; total: number };
  explorer: { discovered: number; total: number };
  master: { discovered: number; total: number | "추후" };
}

export function ProgressOverviewCard({ total, beginner, explorer, master }: Props) {
  const percentage = Math.round((total.discovered / total.total) * 100);
  const data = [
    { name: "discovered", value: percentage },
    { name: "rest", value: 100 - percentage },
  ];

  return (
    <Card className="p-4 rounded-2xl">
      <h3 className="text-base font-semibold mb-3">나의 탐방 현황</h3>

      <div className="flex items-center gap-6">
        {/* 도넛 차트 */}
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={56}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                <Cell fill="hsl(var(--primary))" />
                <Cell fill="hsl(var(--border))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{percentage}%</span>
            <span className="text-xs text-muted-foreground">전체 발견률</span>
          </div>
        </div>

        {/* 우측 진척도 텍스트 */}
        <div className="flex-1 space-y-2">
          <ProgressRow label="비기너" current={beginner.discovered} total={beginner.total} />
          <ProgressRow label="익스플로러" current={explorer.discovered} total={explorer.total} />
          <ProgressRow
            label="마스터"
            current={master.discovered}
            total={typeof master.total === "number" ? master.total : 0}
            showAsTBD={master.total === "추후"}
          />
        </div>
      </div>
    </Card>
  );
}

function ProgressRow({
  label,
  current,
  total,
  showAsTBD,
}: {
  label: string;
  current: number;
  total: number;
  showAsTBD?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">
        {current} / {showAsTBD ? "추후" : total}
      </span>
    </div>
  );
}
```

### 4.4 OreumCard (도감 그리드용)

```typescript
// components/collection/OreumCard.tsx
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  oreum: {
    id: string;
    number: number;
    name: string;
    imageUrl: string;
    isDiscovered: boolean;
  };
  onClick: () => void;
}

export function OreumCard({ oreum, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative aspect-[3/4] overflow-hidden cursor-pointer rounded-xl border",
        !oreum.isDiscovered && "opacity-90"
      )}
    >
      {/* 이미지 — 미발견 시 흑백 처리 */}
      <div className="relative h-3/4 w-full">
        <Image
          src={oreum.imageUrl}
          alt={oreum.name}
          fill
          className={cn(
            "object-cover",
            !oreum.isDiscovered && "grayscale opacity-60"
          )}
        />

        {/* 체크 마크 (발견 시) */}
        {oreum.isDiscovered && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* 번호·이름 */}
      <div className="p-2">
        <p className="text-xs text-muted-foreground">
          {String(oreum.number).padStart(3, "0")}
        </p>
        <p className="text-sm font-semibold truncate">{oreum.name}</p>
      </div>
    </Card>
  );
}
```

### 4.5 BottomNavBar (하단 탭바 + 플로팅 QR)

```typescript
// components/layout/BottomNavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookMarked, QrCode, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: Home, label: "홈" },
  { href: "/collection", icon: BookMarked, label: "도감" },
  { href: "/qr", icon: QrCode, label: "", isFloating: true },
  { href: "/wishlist", icon: Heart, label: "위시리스트" },
  { href: "/me", icon: User, label: "마이" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        if (tab.isFloating) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
            >
              <tab.icon className="h-6 w-6" strokeWidth={2.5} />
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <tab.icon
              className="h-5 w-5"
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className={cn("text-[11px]", isActive && "font-medium")}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### 4.6 QuickVerifyCard (GPS 인증)

```typescript
// components/home/QuickVerifyCard.tsx
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickVerifyCard({ onStart }: { onStart: () => void }) {
  return (
    <Card className="relative overflow-hidden h-[140px] rounded-2xl">
      <Image
        src="/images/qr-bg.jpg"
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />

      <div className="relative z-10 flex h-full flex-col justify-center p-4">
        <h3 className="text-base font-semibold text-white">빠른 인증하기</h3>
        <p className="text-sm text-white/85 mt-1">
          오름 근처에 계신가요?<br />
          GPS로 가까운 오름을 확인하세요
        </p>
        <Button
          onClick={onStart}
          className="mt-3 w-fit bg-primary hover:bg-primary/90"
          size="sm"
        >
          <MapPin className="mr-1.5 h-4 w-4" />
          GPS 인증 시작
        </Button>
      </div>
    </Card>
  );
}
```

### 4.7 CollectionStatsCard (도감 완성도)

```typescript
// components/collection/CollectionStatsCard.tsx
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface Props {
  discovered: number;
  total: number;
}

export function CollectionStatsCard({ discovered, total }: Props) {
  const percentage = Math.round((discovered / total) * 100);

  return (
    <Card className="bg-header-bg text-header-foreground p-5 rounded-2xl border-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-white/80 mb-2">나의 도감 완성도</p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold">{discovered}</span>
            <span className="text-2xl text-white/60">/ {total}</span>
          </div>
          <Progress
            value={percentage}
            className="mt-4 h-1.5 bg-white/20 [&>div]:bg-white"
          />
        </div>

        {/* 캐릭터 일러스트 (등산하는 사람) */}
        <div className="ml-4 h-20 w-20 shrink-0 relative">
          <Image
            src="/images/character-hiker.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>
      </div>
    </Card>
  );
}
```

### 4.8 Tier Tabs (비기너/익스플로러/마스터)

```typescript
// 도감 페이지에서 직접 사용
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function CollectionTiers() {
  return (
    <Tabs defaultValue="beginner" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-border rounded-none h-auto p-0">
        <TabsTrigger
          value="beginner"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-3 gap-2"
        >
          비기너 <Badge variant="secondary" className="text-xs">30</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="explorer"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-3 gap-2"
        >
          익스플로러 <Badge variant="secondary" className="text-xs">70</Badge>
        </TabsTrigger>
        <TabsTrigger
          value="master"
          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-3 gap-2 opacity-50"
          disabled
        >
          마스터 <Badge variant="outline" className="text-xs">추후</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="beginner">
        <OreumGrid tier="beginner" />
      </TabsContent>
      <TabsContent value="explorer">
        <OreumGrid tier="explorer" />
      </TabsContent>
    </Tabs>
  );
}
```

---

## 5. 페이지 레이아웃 (전체 조립)

### 5.1 홈 페이지 (`app/page.tsx`)

```typescript
import { Header } from "@/components/layout/Header";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { RecommendationHeroCard } from "@/components/home/RecommendationHeroCard";
import { ProgressOverviewCard } from "@/components/home/ProgressOverviewCard";
import { QuickVerifyCard } from "@/components/home/QuickVerifyCard";
import { RecentDiscoveryScroll } from "@/components/home/RecentDiscoveryScroll";
import { WishlistTop3 } from "@/components/home/WishlistTop3";
import { getHomeData } from "@/lib/firebase/queries";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 pb-20">
        {/* 다크 그린 인사말 영역 */}
        <section className="bg-header-bg text-header-foreground px-4 pb-6 pt-2">
          <p className="text-sm text-white/85">
            오늘도 좋은 탐험 되세요! 👋
          </p>
        </section>

        {/* 본문 */}
        <div className="space-y-4 px-4 -mt-4">
          <RecommendationHeroCard oreum={data.recommendation} onClick={() => {}} />
          <ProgressOverviewCard {...data.progress} />
          <QuickVerifyCard onStart={() => {}} />

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">최근 발견된 오름</h2>
              <button className="text-xs text-muted-foreground">더보기 ›</button>
            </div>
            <RecentDiscoveryScroll items={data.recentDiscoveries} />
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">위시리스트 Top 3</h2>
              <button className="text-xs text-muted-foreground">더보기 ›</button>
            </div>
            <WishlistTop3 items={data.wishlistTop3} />
          </section>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
```

### 5.2 도감 페이지 (`app/collection/page.tsx`)

```typescript
import { Header } from "@/components/layout/Header";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { CollectionStatsCard } from "@/components/collection/CollectionStatsCard";
import { CollectionTiers } from "@/components/collection/CollectionTiers";
import { FilterControls } from "@/components/collection/FilterControls";
import { getCollectionData } from "@/lib/firebase/queries";

export default async function CollectionPage() {
  const data = await getCollectionData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 pb-20">
        {/* 다크 그린 헤더 영역 (스탯 카드 포함) */}
        <section className="bg-header-bg px-4 pb-6 pt-2">
          <CollectionStatsCard
            discovered={data.discovered}
            total={data.total}
          />
        </section>

        {/* 본문 */}
        <div className="px-4">
          <CollectionTiers />
        </div>
      </main>

      <FilterControls className="fixed bottom-16 left-0 right-0 z-30 px-4 py-2 bg-background border-t border-border" />
      <BottomNavBar />
    </div>
  );
}
```

---

## 6. 인터랙션·애니메이션

### 6.1 발견 모먼트 (흑백 → 컬러)

```typescript
// components/discovery/DiscoveryMomentAnimation.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function DiscoveryMomentAnimation({
  oreum,
  onComplete,
}: {
  oreum: { name: string; imageUrl: string };
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onAnimationComplete={() => setTimeout(onComplete, 1200)}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1.05, 1] }}
        transition={{ duration: 0.6 }}
        className="relative h-80 w-64 rounded-2xl overflow-hidden"
      >
        <motion.div
          initial={{ filter: "grayscale(100%) brightness(0.6)" }}
          animate={{ filter: "grayscale(0%) brightness(1)" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full w-full relative"
        >
          <Image src={oreum.imageUrl} alt={oreum.name} fill className="object-cover" />
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary"
        >
          <CheckCircle2 className="h-7 w-7 text-white" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4"
        >
          <p className="text-sm text-white/85">발견했어요!</p>
          <h2 className="text-2xl font-bold text-white">{oreum.name}</h2>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
```

`framer-motion` 설치:
```bash
npm install framer-motion
```

### 6.2 햅틱 피드백 (모바일)

```typescript
// lib/haptics.ts
export function vibrate(pattern: number | number[] = 40) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// 사용
import { vibrate } from "@/lib/haptics";

function onCardTap() {
  vibrate(40); // 짧은 진동
  // ...
}
```

---

## 7. 다크 그린 + 화이트 영역 구분 패턴

시안에서 가장 중요한 시각 패턴.

### 7.1 패턴 정의

상단 일정 영역만 다크 그린, 그 아래 본문은 화이트.

```
┌─────────────────────────────┐
│ [헤더] Header               │ ← bg-header-bg (#0F2A1D)
├─────────────────────────────┤
│ [컨텍스트 영역]              │ ← bg-header-bg 연장
│ - 인사말 또는                │
│ - 도감 스탯 카드             │
└─────────────────────────────┘
   ↓ 자연스러운 전환 (-mt-4 트릭)
┌─────────────────────────────┐
│                             │
│ [본문]                      │ ← bg-background (white)
│ 카드들이 살짝 위로 겹침       │
│                             │
└─────────────────────────────┘
```

### 7.2 구현 패턴

```tsx
{/* 다크 그린 영역 */}
<section className="bg-header-bg text-header-foreground px-4 pb-6 pt-2">
  {/* ... */}
</section>

{/* 본문 영역 — 살짝 위로 겹쳐서 자연스럽게 */}
<div className="space-y-4 px-4 -mt-4">
  {/* 카드들 */}
</div>
```

이 `-mt-4` 트릭이 시안의 **다크에서 화이트로 부드러운 전환** 효과를 만든다.

---

## 8. 반응형 (모바일 우선)

### 8.1 브레이크포인트

본 프로젝트는 **모바일 우선**.

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
    },
  },
};
```

### 8.2 데스크탑 (1024px+)

본문 최대 폭 제한:

```tsx
<main className="mx-auto max-w-md flex-1">
  {/* 모바일 폭(약 480px)으로 제한 */}
</main>
```

---

## 9. 접근성

### 9.1 필수 사항

- 모든 버튼: `aria-label` (아이콘만 있을 시)
- 카드: `role="article"` 또는 `<article>` 태그
- 진척도: shadcn `Progress`가 자동 처리
- 탭: shadcn `Tabs`가 자동 처리
- 발견/미발견 상태: 아이콘으로만이 아닌 `aria-label`로 명시

### 9.2 색 대비

- 텍스트와 배경 대비: 4.5:1 이상 (WCAG AA)
- 다크 그린 헤더 위 흰 텍스트 ✓
- 화이트 배경 위 검정 텍스트 ✓

---

## 10. 즉시 실행 체크리스트 (외주사용)

이 문서 받은 즉시 다음 순서로:

### Step 1: 환경 셋업

```bash
# 1) shadcn 초기화
npx shadcn@latest init

# 2) 필수 컴포넌트 일괄 설치
npx shadcn@latest add button card badge tabs progress dialog sheet dropdown-menu toast skeleton scroll-area separator tooltip input form select avatar alert command

# 3) 추가 라이브러리
npm install lucide-react recharts framer-motion
```

### Step 2: 디자인 토큰 적용

- `app/globals.css` → 1.2의 CSS 변수 그대로 복붙
- `tailwind.config.ts` → 1.3의 설정 추가
- Pretendard 폰트 적용 (2.1)

### Step 3: 자체 컴포넌트 작성

3.2의 디렉토리 구조대로 다음 순서로:

1. `Header.tsx` (4.1)
2. `BottomNavBar.tsx` (4.5)
3. `RecommendationHeroCard.tsx` (4.2)
4. `ProgressOverviewCard.tsx` (4.3)
5. `OreumCard.tsx` (4.4)
6. `QuickVerifyCard.tsx` (4.6)
7. `CollectionStatsCard.tsx` (4.7)

### Step 4: 페이지 조립

5번 그대로 복사해서 페이지 구성.

### Step 5: Firebase 데이터 연결

`lib/firebase/queries.ts`에서 `getHomeData()`, `getCollectionData()` 등 구현.

---

## 11. 외주사 검수 체크리스트

납품 전 다음 모두 ✓ 확인:

### 시안 일치성

- [ ] 헤더 색상이 시안의 다크 그린(#0F2A1D)와 동일
- [ ] 브랜드 그린 액센트 #1A4D2E 사용
- [ ] 폰트 Pretendard 적용
- [ ] 둥근 모서리 12px (rounded-xl)
- [ ] **이모지 사용 0개** (모두 lucide-react)

### shadcn/ui 사용

- [ ] Modal/Dialog/Toast/Tabs 모두 shadcn 사용 (직접 만든 것 X)
- [ ] Badge / Card / Button shadcn 사용
- [ ] `components/ui/` 폴더에 shadcn 컴포넌트 존재
- [ ] **자체 작성 컴포넌트는 3.2 목록에만 한정**

### 용어 일치

- [ ] "비기너 / 익스플로러 / 마스터" 표기 (초급/중급/고급 X)
- [ ] "탐험가" (사용자 X)
- [ ] "발견" (정복/등반 X)
- [ ] "미션북 / 패스포트" (가이드북 X)

### 기능 일치

- [ ] 도감 그리드 발견 시 컬러, 미발견 흑백 처리(grayscale)
- [ ] 발견 카드 우상단 체크 마크 (CheckCircle2 lucide)
- [ ] NEW Badge가 7일 이내 발견에 노출
- [ ] 도넛 차트 (recharts)
- [ ] 진척도 바 (shadcn Progress)
- [ ] 하단 탭바 5개 + 가운데 플로팅 QR (-mt-6으로 위로 띄움)

---

## 12. 변경 이력

| 일자 | 버전 | 변경 내용 |
|------|------|---------|
| 2026-05-07 | 0.1 | 초안 (디자인 토큰 + 컴포넌트 인벤토리) |
| 2026-05-07 | **0.2** | **시안 이미지 기반 재작성. shadcn/ui 필수화. lucide-react 강제. 모든 컴포넌트 코드 명세. 외주사 즉시 실행 체크리스트.** |

---

## 13. 후속 작업 (미명세 영역)

다음은 본 문서 v0.2 범위 밖. 후속 명세 필요:

- 카드 페이지 (개별 오름 상세) — `05_oreum_card_page.md` 참조 + shadcn 매핑 추가 필요
- 위시리스트 화면 — `06_wishlist_routing.md` 참조 + 시안 추가 필요
- MBTI 결과 페이지 16종 — `19_oreum_mbti.md` 참조 + 시안 추가 필요
- AR 화면 — `08_ar_system.md` 참조 (페이즈 2)
- 어드민 화면 — `14_admin_backoffice.md` 참조 + shadcn 매핑 추가 필요

위 화면들도 본 v0.2의 원칙(shadcn/ui 필수, lucide-react, 디자인 토큰 준수) 따라야 함.

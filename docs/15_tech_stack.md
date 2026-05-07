# 15. Tech Stack

> 본 문서는 제주 오름 패스포트 프로젝트의 기술 스택과 인프라 구조를 확정한다.
> 모든 개발 환경 구축, 외부 서비스 계약, 비용 산정의 기준이 된다.

---

## 0. 결정 원칙

### 0.1 우선순위

1. **시간 단축**: BaaS·매니지드 서비스를 적극 활용해 인프라 운영 부담 최소화
2. **비용 효율**: 초기에는 무료 티어 활용, 사용자 증가 후 유료 전환
3. **확장성**: 페이즈 1 → 4까지 단계적 확장이 가능한 구조
4. **SEO 친화**: 단순 SPA가 아닌 SSR/SSG 지원이 필수
5. **모바일 우선**: PWA 기반, 네이티브 앱 가능성 열어두되 강제 안 함

### 0.2 피해야 할 함정

- 자체 서버 운영 (DevOps 부담)
- 신생·검증 안 된 라이브러리 (장기 유지보수 리스크)
- 락인이 강한 솔루션 (이전 비용)
- 한국 네트워크에서 느린 글로벌 서비스

---

## 1. 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (모바일/PC)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│              Cloudflare (CDN + DNS)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│         Vercel (Next.js 호스팅 + Edge Functions)          │
│  - SSG: SEO 콘텐츠 360개 페이지                            │
│  - SSR: 마이페이지·도감 등 동적 페이지                       │
│  - PWA: Service Worker, 오프라인 캐시                      │
└──────────┬───────────────┬─────────────────┬────────────┘
           │               │                 │
           ↓               ↓                 ↓
    ┌──────────┐   ┌──────────────┐   ┌────────────┐
    │ Firebase │   │ External APIs│   │ AI Services│
    │  (BaaS)  │   │              │   │            │
    │          │   │ - 카카오맵     │   │ - OpenAI   │
    │ - Firestore   │ - 카카오 OAuth│   │ - Claude   │
    │ - Auth   │   │ - 네이버 OAuth│   │ - Replicate│
    │ - Storage│   │ - 날씨 API    │   │   (이미지)  │
    │ - Analytics   │              │   │            │
    └──────────┘   └──────────────┘   └────────────┘
```

---

## 2. 프론트엔드

### 2.1 프레임워크: Next.js 14+ (App Router)

**선정 이유**:
- SSG/SSR/CSR 자유롭게 혼용 가능 (SEO 콘텐츠는 SSG, 마이페이지는 SSR)
- React 생태계의 가장 큰 커뮤니티
- Vercel과 완벽 통합 (배포·환경변수·미리보기)
- App Router로 서버 컴포넌트 활용 → 번들 사이즈 감소
- 한국어 i18n 지원 풍부

**버전**: 14.x (LTS, App Router 안정화 버전)

**대안 검토**:
- Nuxt.js: 가능하지만 React 인력 풀이 더 큼
- Remix: 좋지만 SSG 우선이 아님 (SEO 페이지 비효율)
- Astro: SSG 강하지만 인터랙티브 부분 비효율

### 2.2 스타일링

**Tailwind CSS** + 디자인 토큰 (16번 문서)

```bash
# 설치
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.ts`에 디자인 토큰 매핑:
```typescript
{
  theme: {
    extend: {
      colors: {
        'brand-green': {
          50: '#F0F7F2', 100: '#D4E8DC', /* ... */
          800: '#1A4D2E', 900: '#0F2A1D'
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'sm': '6px', 'md': '12px', 'lg': '16px', 'xl': '24px'
      }
    }
  }
}
```

### 2.3 폰트

**Pretendard** (오픈소스, CDN 제공)

```typescript
// app/layout.tsx
import { Pretendard } from '@/lib/fonts';

// 또는 CDN
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
```

### 2.4 상태 관리

**Zustand** (가벼운 클라이언트 상태) + **TanStack Query** (서버 상태)

- Zustand: UI 상태, 로컬 임시 데이터
- TanStack Query: API 응답 캐시, 무한 스크롤, optimistic update

Redux나 Recoil을 굳이 도입하지 않음 (오버엔지니어링).

### 2.5 폼 처리

**React Hook Form** + **Zod** (검증 스키마)

### 2.6 PWA

**next-pwa** 또는 **@serwist/next** (next-pwa의 후속)

- Service Worker 자동 생성
- 오프라인 캐싱
- "홈 화면에 추가" 기능
- Manifest 자동 생성

오프라인 캐싱 전략:
- SEO 페이지: 한 번 본 페이지는 오프라인에서 다시 볼 수 있게
- 마이페이지: 마지막 데이터 캐시 (네트워크 끊어진 산속에서도 본인 도감은 봄)
- 카드 일러스트: stale-while-revalidate

### 2.6.5 다국어 (i18n)

**next-intl** — Next.js 14 App Router 친화적, SSG/SSR 모두 지원

```bash
npm install next-intl
```

**선정 이유**:
- App Router의 server component와 호환 우수
- 메시지 파일 형식 단순 (JSON)
- URL 라우팅 자동 처리 (`/ko/oreum/...`, `/en/oreum/...`)
- TypeScript 타입 안전

**대안 검토**:
- next-i18next: Pages Router 시절 표준, App Router 호환 약함
- react-intl: 프레임워크 독립적이지만 SSR 통합 더 복잡

**페이즈별 도입**:
- 페이즈 0: 인프라 구축 + 모든 UI 텍스트 i18n 키 분리, ko 메시지 파일 100% 작성
- 페이즈 2: en 메시지 파일 작성 (UI 텍스트만)
- 페이즈 3: en SEO 콘텐츠 (100선 100개)
- 페이즈 4: ja, zh UI + SEO 콘텐츠 점진 추가

**메시지 파일 구조**:
```
/messages
  /ko.json
  /en.json (페이즈 2)
  /ja.json (페이즈 4)
  /zh.json (페이즈 4)
```

**언어 감지·전환**:
- 사용자 첫 진입: `Accept-Language` 헤더로 자동 감지
- 로그인 사용자: `user_settings.preferred_language` 우선
- 명시적 전환: 헤더의 언어 선택 드롭다운

**비용 추가**:
- 전문 번역가 영어 번역: 100선 100개 SEO 콘텐츠 ≈ 500~1,000만원
- UI 텍스트 영어 번역 (1회성): 50~100만원
- 일본어/중국어는 페이즈 4에서 별도 검토

### 2.7 지도

**카카오맵 JavaScript API**

- 한국 내 정확도가 가장 좋음
- 무료 티어: 일 30만 요청
- 길찾기, 위치 검색, 마커 표시 모두 지원

대안: 네이버맵 (비슷한 수준), Google Maps (한국 내 부정확)

### 2.8 AR

**AR.js + A-Frame** (오픈소스)

- WebAR (앱 설치 불필요)
- GPS 기반 위치 AR 지원
- 무료, MIT 라이선스

대안 (페이즈 4 검토):
- 8th Wall: 강력하지만 상용 라이선스 비쌈 ($3000/월~)
- MindAR: 이미지 인식 AR이 강함 (페이즈 3 이미지 인식 도입 시 검토)

### 2.9 차트·시각화

**Recharts** (React 친화적, 가벼움) — 도넛 차트, 진척도 바
복잡한 시각화 필요 시 D3.js 추가 검토.

### 2.10 아이콘

**Tabler Icons React** — 16번 문서 참조

```bash
npm install @tabler/icons-react
```

### 2.11 애니메이션

**Framer Motion** — 발견 모먼트 같은 핵심 애니메이션
간단한 transition은 Tailwind만으로 충분.

---

## 3. 백엔드

### 3.1 BaaS: Firebase

**선정 이유**:
- Firestore (NoSQL) + Auth + Storage + Analytics + FCM 한 곳에
- Google 인프라 — 글로벌 CDN, 자동 스케일링
- 한국 region 가능 (asia-northeast3 서울)
- 실시간 Firestore 리스너로 피드 구현 용이
- 풍부한 Next.js 연동 레퍼런스

**Firebase 사용 영역**:
- Firestore: 오름 데이터, 사용자 컬렉션, 인증 기록, 코멘트
- Auth: 카카오/네이버/구글 OAuth + email (커스텀 Provider)
- Storage: 사용자 사진, 카드 일러스트
- Analytics: GA4 기반 사용자 행동 분석
- FCM: 푸시 알림 (페이즈 2)

**플랜**:
- 페이즈 0~1: Spark (무료) — Firestore 1GB, Storage 5GB, Analytics 무료
- 페이즈 2~: Blaze (종량제) — 사용량 기반, 예산 알림 설정 필수

**데이터 모델 주의사항**:
- Firestore는 NoSQL (document/collection) — 01_data_model.md의 관계형 설계를 Firestore 구조로 변환 필요
- 복잡한 집계 쿼리는 Cloud Functions로 처리

### 3.2 데이터베이스: Firestore

Firebase가 제공. 구조:
- **Collection 설계**: `oreums`, `users`, `certifications`, `comments`, `photos`, `challenges`
- **지리 좌표**: GeoPoint 타입 기본 제공 (AR 좌표 계산은 클라이언트에서 처리)
- **한글 검색**: Firestore 기본 검색 한계 → Algolia 연동 검토 (페이즈 2)
- **정기 작업**: Cloud Functions Scheduled Functions 활용

### 3.3 서버리스 함수: Vercel Edge Functions + Firebase Cloud Functions

**Vercel Edge Functions** (Next.js 내):
- API 라우트 (`/app/api/...`)
- 한국 사용자 빠른 응답 (Edge에서 실행)
- Firestore 읽기·쓰기, 외부 API 호출

**Firebase Cloud Functions** (Node.js):
- 백그라운드 작업 (Firestore 트리거)
- 무거운 처리 (이미지 AI 분류, 코멘트 분석)
- 예약 작업 (피드 정리, 통계 집계)
- FCM 푸시 알림 전송

분리 기준:
- 동기 응답 빠른 것 → Vercel
- 비동기 무거운 것 → Cloud Functions

---

## 4. 외부 서비스

### 4.1 인증

**Supabase Auth** + **OAuth Providers**

- 카카오 로그인 (한국 사용자 우선)
- 네이버 로그인
- (옵션) 구글 로그인 — 외국인 관광객 대비

설정:
- 카카오 디벨로퍼 등록 → REST API 키 발급
- 네이버 개발자 센터 등록
- Supabase Dashboard에서 OAuth Provider 추가

### 4.2 지도·위치

**카카오맵 API** (전술)
**카카오 모빌리티 API** (길찾기) — 페이즈 2 동선 설계 시 활용

비용:
- 카카오맵: 일 30만 요청까지 무료 (충분)
- 카카오 모빌리티: 일 1만 요청 무료, 초과 시 건당 과금

### 4.3 날씨

**기상청 단기예보 API** (한국 정확도)
또는 **OpenWeather API** (간편, 무료 티어)

용도:
- 인증 시 weather snapshot
- 카드 페이지의 "오늘의 날씨" 표시
- AI 분석에 시즌·날씨 컨텍스트 제공

### 4.4 AI 서비스

#### 4.4.1 텍스트 (코멘트 분석, SEO 콘텐츠 보강)

**Anthropic Claude API** (Claude 3.5 Sonnet 또는 Haiku)
- 코멘트 분류, 키워드 추출, 톤 분석
- SEO 콘텐츠 1차 생성

또는 **OpenAI GPT-4** (대안)

#### 4.4.2 사진 분류

**Claude Vision** 또는 **GPT-4 Vision**
- 카테고리 분류 (주차장/입구/탐방로/정상 등)
- 품질 점수, 부적절 콘텐츠 필터

비용 추정 (월간):
- 사진 1장당 약 30원 (input + output)
- 월 1만 장 처리 시 30만원

#### 4.4.3 이미지 생성 (카드 일러스트)

**페이즈 0 일회성 작업**.

선택지:
1. **Midjourney** (Discord 기반)
   - 품질 최고, 일관성 좋음
   - 월 $30 ($60 Pro 권장)
   - 100장 생성 충분
   - 단점: API 미공개, 수동 작업

2. **Stable Diffusion XL via Replicate** (API)
   - 자동화 가능
   - 비용 저렴 (장당 약 50원)
   - 품질 Midjourney보다 약간 낮음
   - LoRA로 스타일 고정 가능

3. **DALL-E 3 via OpenAI**
   - API 안정적
   - 품질 좋음
   - 장당 약 0.04~0.08달러

**권장**: Midjourney로 첫 5~10장 스타일 확정 → Stable Diffusion(LoRA 학습 후)으로 100장 일괄 생성 → 디자이너 후보정.

### 4.5 결제 (페이즈 3)

**토스페이먼츠** — 인쇄물 패스포트, 굿즈 결제

대안: 포트원(아임포트), 카카오페이 직연동

### 4.6 이메일

**Resend** (개발자 친화, 한국에서 빠름)
또는 **SendGrid**

용도:
- 가입 인증 (Supabase Auth와 연동)
- 챌린지 완료 알림
- 운영자 알림

### 4.7 푸시 알림 (페이즈 2)

**OneSignal** (PWA 푸시 알림 무료)
또는 **Firebase Cloud Messaging**

---

## 5. 인프라·호스팅

### 5.1 호스팅: Vercel

**선정 이유**:
- Next.js 만든 회사, 호환성 최고
- 한국 Edge Region 있음
- 미리보기 배포 (PR마다 자동)
- 무료 티어 SSL, 도메인 연결

**플랜**:
- 페이즈 0~1: Hobby (무료)
- 페이즈 2~: Pro ($20/월, 팀 협업, 분석)
- 페이즈 3~: Team ($25/유저/월)

### 5.2 CDN·DNS: Cloudflare

- DNS 무료
- DDoS 방어 무료
- 이미지 최적화 (Cloudflare Images, $5/월~)
- 캐시 룰 설정

### 5.3 스토리지

**Supabase Storage** (기본)
- 사용자 사진, 카드 일러스트
- CDN 자동 제공

**대용량·아카이브 시 (페이즈 4)**:
- AWS S3 + CloudFront
- 또는 Cloudflare R2 (egress 무료)

### 5.4 도메인

`.kr` 또는 `.com` 도메인 확보 필요.
권장: `jejuoreum.com` + `jejuoreum.kr` 둘 다 확보 후 메인 결정.

---

## 6. 개발 도구

### 6.1 IDE·에디터

- VS Code 권장
- Cursor (AI pair programming)
- 권장 확장: ESLint, Prettier, Tailwind IntelliSense, Supabase

### 6.2 버전 관리

**GitHub** — 비공개 저장소

브랜치 전략:
- `main` — 프로덕션
- `develop` — 다음 릴리스
- `feature/*` — 기능 개발
- `hotfix/*` — 긴급 수정

### 6.3 CI/CD

**GitHub Actions** + **Vercel 자동 배포**

워크플로우:
1. PR 생성 → Vercel 미리보기 자동 배포
2. main merge → Production 자동 배포
3. 테스트, lint, type check 자동 실행

### 6.4 모니터링·분석

#### 6.4.1 에러 추적
**Sentry** — 프론트·백엔드 통합
- 무료 티어: 월 5천 이벤트
- Source map 업로드로 정확한 스택트레이스

#### 6.4.2 사용자 분석
**PostHog** (오픈소스, 자가 호스팅 가능)
또는 **Amplitude** / **Mixpanel**

추적 이벤트 예시:
- 오름 인증 완료
- 위시리스트 추가
- 카드 페이지 진입
- AR 활성화

#### 6.4.3 SEO 분석
**Google Search Console**
**네이버 서치어드바이저**
**Google Analytics 4**

#### 6.4.4 성능 모니터링
**Vercel Analytics** (Core Web Vitals)
**Web Vitals 라이브러리** (실사용자 측정)

### 6.5 디자인 협업

**Figma** — 디자인 시스템, 와이어프레임, 프로토타입
- Variables로 16번 문서의 토큰 매핑
- 개발자에게 사양 자동 추출

### 6.6 프로젝트 관리

**Linear** 또는 **Notion**
- Linear: 개발 이슈 트래킹
- Notion: 기획·의사결정 문서

### 6.7 커뮤니케이션

**Slack** 또는 **Discord** (소규모 팀)

---

## 7. 환경 분리

### 7.1 환경 종류

| 환경 | 용도 | URL |
|------|------|-----|
| `development` | 로컬 개발 | localhost:3000 |
| `staging` | QA, 사내 테스트 | staging.jejuoreum.com |
| `production` | 실제 서비스 | jejuoreum.com |

### 7.2 환경 변수

`.env.local` (커밋 금지) / Vercel Environment Variables 사용

핵심 환경 변수:
```bash
# Firebase (클라이언트 — NEXT_PUBLIC_ 필수)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK (서버 전용 — 절대 NEXT_PUBLIC_ 붙이지 말 것)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 외부 API
KAKAO_MAP_API_KEY=
WEATHER_API_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
REPLICATE_API_TOKEN=

# 분석
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_POSTHOG_KEY=

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

---

## 8. 보안

### 8.1 핵심 정책

- **HTTPS 강제** (Vercel·Cloudflare 자동)
- **CSP (Content Security Policy)** 헤더 설정
- **CORS** 화이트리스트 적용
- **Rate Limiting**: Upstash Redis 또는 Vercel KV

### 8.2 민감 정보 보호

- 사용자 정확 좌표는 본인만 read (RLS 정책)
- API 키는 환경변수에만, 클라이언트 노출 금지
- `NEXT_PUBLIC_` prefix 없는 변수는 서버 전용

### 8.3 인증·세션

- Supabase Auth의 JWT 사용
- 세션 만료: 7일
- Refresh token rotation 활성화

### 8.4 정기 점검

- npm audit (주 1회)
- Snyk 또는 Dependabot 자동 PR
- OWASP Top 10 체크리스트 분기별 검토

### 8.5 개인정보 처리방침

- 가입 시 동의 절차 필수
- 한국 개인정보보호법 준수
- 위치 정보 수집 시 별도 동의

---

## 9. 성능 목표

### 9.1 Core Web Vitals

| 지표 | 목표 | 측정 |
|------|------|------|
| LCP (Largest Contentful Paint) | < 2.5초 | Vercel Analytics |
| FID (First Input Delay) | < 100ms | 실측 |
| CLS (Cumulative Layout Shift) | < 0.1 | 실측 |
| INP (Interaction to Next Paint) | < 200ms | 실측 |

### 9.2 SEO 성능

- 모든 SEO 페이지 SSG (빌드 시점 생성)
- 빌드 시간: 360개 페이지 < 5분
- 페이지 크기: < 200KB (gzip)

### 9.3 모바일 우선

- Lighthouse 모바일 점수 90+ (Performance, Accessibility, SEO)
- 3G 네트워크에서 첫 페이지 로드 < 5초

---

## 10. 비용 추정

### 10.1 페이즈 0 (출시 전, 일회성)

| 항목 | 비용 |
|------|------|
| 카드 일러스트 100개 (AI + 후보정) | 200~500만 |
| Midjourney 구독 (3개월) | 약 30만 |
| 디자이너 후보정 인건비 | 200~400만 |
| 도메인 (2개) | 5만 |
| 인쇄물 디자인·인쇄 (초도 1000부) | 500~800만 |
| **MBTI 콘텐츠** (16유형 × 결과 페이지 + 360개 매핑) | 50~100만 |
| **i18n 인프라 셋업** (개발 추가 시간) | 100~150만 |
| **SEO 콘텐츠 작성** (100선 100개 깊이 + 비100선 50~100개) | 자체 또는 300~500만 (외주 시) |
| **합계** | **1,080~2,485만** |

### 10.2 페이즈 1 (출시 후 운영, 월간)

| 항목 | 무료/Free | 본격 운영 |
|------|---------|----------|
| Vercel | $0 | $20 |
| Supabase | $0 | $25 |
| Cloudflare | $0 | $5 (Images) |
| 도메인 | - | 월 1천원 |
| 카카오맵 API | $0 | $0 (무료 티어 충분) |
| AI (사진 분류) | - | 30만 (월 1만 장) |
| AI (콘텐츠 보강) | - | 10만 |
| Sentry | $0 | $26 |
| PostHog | $0 (자가호스팅) | $0 |
| **합계** | **$0** | **약 70~80만** |

### 10.3 페이즈 2~3 (확장 후, 월간)

| 항목 | 비용 |
|------|------|
| 모든 위 항목 | 약 80만 |
| Supabase Team | $599 (한화 약 80만) |
| 추가 AI 사용량 | 50~100만 |
| 푸시 알림 | $0 (OneSignal Free) |
| **다국어 영어 번역** (UI + 100선 SEO 100개, 일회성) | 600~1,100만 (페이즈 2~3) |
| **합계** | **약 250~300만 (월간) + 일회성 비용** |

### 10.4 페이즈 4 (자산 활용·확장)

| 항목 | 비용 |
|------|------|
| 일본어/중국어 번역 (UI + 일부 SEO) | 800~1,500만 (일회성) |
| 팀 시스템 개발 (실시간 채팅 등) | 별도 견적 |
| 네이티브 앱 개발 검토 | 별도 견적 |

---

## 11. 외부 의존성 정리

### 11.1 필수 등록·계약

페이즈 0 작업 시작 전 완료해야 할 외부 등록:

- [ ] 카카오 디벨로퍼 등록 (OAuth + 카카오맵)
- [ ] 네이버 개발자 센터 등록 (OAuth)
- [ ] Supabase 프로젝트 생성 (한국 region)
- [ ] Vercel 팀 계정 생성
- [ ] Cloudflare 계정 생성
- [ ] GitHub 조직 생성
- [ ] 도메인 구매 (jejuoreum.com, .kr)
- [ ] Anthropic API 가입
- [ ] OpenAI API 가입
- [ ] 기상청 API 신청
- [ ] Google Search Console 등록
- [ ] 네이버 서치어드바이저 등록
- [ ] 구글 애널리틱스 4 설정

### 11.2 사업자 등록·법인

- 사업자 등록증 (개인사업자 또는 법인)
- 통신판매업 신고 (페이즈 3 굿즈 판매 시)
- 정보보호책임자 지정
- 개인정보처리방침 게시
- 이용약관 게시

---

## 12. 개발 팀 권장 구성

### 12.1 최소 구성 (페이즈 0~1)

- **풀스택 개발자 1명** (시니어): Next.js + Supabase 능숙
- **디자이너 1명**: Figma, AI 일러스트 후보정
- **기획자 1명**: 콘텐츠 작성, 운영 (현재 기획자님)

### 12.2 페이즈 2 확장 시

- **프론트엔드 개발자 1명 추가**: AR, 인터랙션 강화
- **콘텐츠 라이터 1명** (계약직): SEO 콘텐츠 작성

### 12.3 페이즈 3 확장 시

- **백엔드 개발자 1명 추가**: 굿즈 커머스, 결제
- **마케터 1명**: SEO·SNS·제휴

---

## 13. 마일스톤 일정 (개략)

상세는 `17_phase_roadmap.md` 참조.

| 페이즈 | 기간 | 핵심 산출물 |
|--------|------|-------------|
| 페이즈 0 | 2~3개월 | 인프라, 카드 100장, 인쇄물, SEO 100~200개 |
| 페이즈 1 (출시) | 0개월 | 출시 |
| 페이즈 2 | 출시 후 3~6개월 | AR, 피드, 챌린지, 동선 |
| 페이즈 3 | 출시 후 6~12개월 | 굿즈, 마스터 영역 |

---

## 14. 기술 부채 관리

### 14.1 의도적으로 미루는 결정

- **다국어 지원**: 페이즈 4. 처음부터 i18n 인프라는 깔되 영어 콘텐츠 미작성.
- **네이티브 앱**: 페이즈 4. PWA로 충분.
- **마이크로서비스 분리**: 페이즈 4 이후. 모놀리식 Next.js 유지.

### 14.2 기술 검토 시점

- **PostGIS 도입**: 페이즈 2 AR 본격화 시점
- **Redis 캐시 도입**: 사용자 1만 명 돌파 시점
- **CDN 이미지 최적화**: 사진 자산 1만 장 돌파 시점
- **별도 검색 엔진 (Algolia/Meilisearch)**: 검색 사용량 분석 후

---

## 15. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. Next.js + Supabase + Vercel 스택 확정. AI 워크플로우 정리, 비용 추정 | 기획+Claude |
| 2026-05-07 | 0.2 | i18n 섹션 신설(2.6.5), next-intl 채택, 페이즈별 다국어 도입 계획 명시, 비용 추정에 MBTI/i18n/SEO 콘텐츠 비용 추가, 페이즈 4 비용 항목 신설 | 기획+Claude |
| 2026-05-07 | 0.3 | **백엔드 Supabase → Firebase로 변경 확정.** 아키텍처 다이어그램, 3.1~3.3절, 환경변수 목록 전면 수정. Firestore 데이터 모델 주의사항 추가. | 기획+Claude |

---

## 16. 후속 작업

- 외부 서비스 등록·계약 시작 (11.1 체크리스트)
- Next.js 보일러플레이트 저장소 생성
- Supabase 프로젝트 생성 + 01번 문서의 스키마 마이그레이션 실행
- CI/CD 파이프라인 셋업
- 환경 변수 안전 보관 정책 확립
- 페이즈 0 카드 일러스트 워크플로우 (Midjourney → Stable Diffusion → 디자이너 후보정) 시작

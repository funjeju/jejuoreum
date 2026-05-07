# 제주 오름 패스포트 — Core v0.5

> **이 문서는 외주사·개발자가 가장 먼저 읽어야 할 강제 결정 문서다.**
> 본 문서의 결정은 **반드시 준수**해야 하며, 다른 문서와 충돌 시 본 문서가 우선한다.
> v0.5에서 데이터베이스와 UI 라이브러리 결정이 변경됐다.

---

## 0. 프로젝트 한 줄 정의

**360개 제주 오름 중 100선 큐레이션 + 인쇄 미션북 + 디지털 웹앱.**

- 인쇄물 = 메인 상품 (1차 수익원)
- 디지털 = 시각화·인증·확장
- 사용자가 직접 채워가는 수집형 탐험 도감

---

## 1. 강제 기술 스택 (변경 불가)

본 결정은 **반드시 준수**한다. 외주사 임의 판단으로 다른 것 사용 시 무효 처리.

### 1.1 데이터베이스: Firebase (Supabase 사용 금지)

**기존 v0.4까지의 Supabase 결정은 무효.**

| 영역 | 사용할 것 |
|------|---------|
| 인증 | **Firebase Authentication** |
| 데이터베이스 | **Cloud Firestore** (NoSQL) |
| 파일 저장 | **Firebase Storage** |
| 서버리스 함수 | **Cloud Functions for Firebase** |
| 실시간 | **Firestore Realtime Listeners** |
| 푸시 알림 | **Firebase Cloud Messaging (FCM)** |
| 분석 | **Firebase Analytics + Crashlytics** |

**금지 사항**:
- ❌ Supabase 사용 금지
- ❌ PostgreSQL 직접 사용 금지
- ❌ 자체 서버 구축 금지

**이유**: 운영 단순성, 한국 내 OAuth(카카오·네이버) 연동 편의성, 오프라인 동기화, 비용 예측 가능성.

### 1.2 UI 라이브러리: shadcn/ui (필수)

**모든 인터랙티브 컴포넌트는 shadcn/ui 기반으로 만든다. 직접 만드는 컴포넌트는 최소화.**

#### 설치 명령 (외주사 즉시 실행)

```bash
# Tailwind CSS 셋업 (이미 됐으면 스킵)
npx tailwindcss init -p

# shadcn/ui 초기화
npx shadcn@latest init

# 다음 옵션으로 응답:
# ✓ TypeScript: Yes
# ✓ Style: Default
# ✓ Base color: Stone
# ✓ CSS variables: Yes
# ✓ Tailwind config: tailwind.config.ts
# ✓ Components dir: @/components
# ✓ Utils dir: @/lib/utils
# ✓ React Server Components: Yes
```

#### 필수 설치 컴포넌트 (페이즈 1 출시용)

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add progress
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add tooltip
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add avatar
npx shadcn@latest add alert
npx shadcn@latest add command
```

**금지 사항**:
- ❌ 위 컴포넌트를 직접 구현 금지 (Modal, Dropdown, Toast, Tabs 등)
- ❌ 다른 UI 라이브러리(Mantine, Chakra, Material-UI, Ant Design) 사용 금지
- ❌ 이모지로 아이콘 대체 금지 → **반드시 `lucide-react` 사용**

#### 아이콘: lucide-react

```bash
npm install lucide-react
```

이모지(👍 📍 🏔️ 🎉 등) UI 사용 절대 금지. 모든 아이콘은 `lucide-react`.

### 1.3 프론트엔드 스택

| 영역 | 사용할 것 |
|------|---------|
| 프레임워크 | **Next.js 14 App Router** |
| 언어 | **TypeScript (strict)** |
| 스타일 | **Tailwind CSS + shadcn/ui CSS 변수** |
| 폰트 | **Pretendard** (한글) |
| 상태관리 | **Zustand + TanStack Query** |
| 폼 | **react-hook-form + zod** (shadcn Form 기본) |
| 차트 | **recharts** (도넛·진척도용) |
| 다국어 | **next-intl** |
| 지도 | **카카오맵 (페이즈 1)** |
| 분석 | **Firebase Analytics + PostHog** |
| 에러 | **Sentry** |
| 호스팅 | **Vercel** (또는 Firebase Hosting) |

### 1.4 디자인 토큰 (CSS 변수)

shadcn/ui 초기화 후 `app/globals.css`의 CSS 변수를 다음으로 **반드시 덮어쓴다**:

```css
@layer base {
  :root {
    /* shadcn 기본 토큰 */
    --background: 0 0% 100%;
    --foreground: 0 0% 10%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 10%;

    /* 브랜드 그린 (메인 액센트) */
    --primary: 142 49% 21%;          /* #1A4D2E */
    --primary-foreground: 0 0% 100%;

    --secondary: 142 30% 95%;         /* #F0F7F2 */
    --secondary-foreground: 142 49% 15%;

    --muted: 0 0% 96%;                /* #F5F5F5 */
    --muted-foreground: 0 0% 45%;     /* #737373 */

    --accent: 142 30% 90%;            /* #D4E8DC */
    --accent-foreground: 142 49% 15%;

    --destructive: 0 84% 50%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 90%;               /* #E5E5E5 */
    --input: 0 0% 90%;
    --ring: 142 49% 21%;              /* primary와 동일 */

    --radius: 0.75rem;                /* 12px 기본 */

    /* 커스텀 토큰 추가 */
    --header-bg: 142 60% 9%;          /* #0F2A1D - 헤더 다크 그린 */
    --header-foreground: 0 0% 100%;
  }
}
```

**Tailwind 사용 시 자동 매핑**:
- `bg-primary` → 브랜드 그린
- `bg-secondary` → 옅은 그린
- `text-foreground` → 본문 텍스트
- `bg-header-bg` → 다크 그린 헤더 (커스텀, tailwind.config.ts에 추가 필요)

`tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        'header-bg': 'hsl(var(--header-bg))',
        'header-foreground': 'hsl(var(--header-foreground))',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## 2. 강제 용어집 (절대 다른 표기 금지)

외주사가 임의로 번역하지 말 것. 사용자에게 노출되는 텍스트는 **반드시 다음 표기**.

| 영역 | 사용 (○) | 금지 (✗) |
|------|--------|---------|
| 100선 1차 영역 | **비기너** | 초급, 입문, 쉬움 |
| 100선 2차 영역 | **익스플로러** | 중급, 탐험가 (단독 X) |
| 100선 3차 영역 | **마스터** | 고급, 마스터급 |
| 인증 행위 | **발견** | 정복, 등반, 인증 (UI X) |
| 사용자 | **탐험가** | 회원, 유저, 사용자 (UI X) |
| 책자 | **미션북** 또는 **패스포트** | 가이드북, 책 |

DB 컬럼·코드는 영어로(`tier='beginner'`, `is_discovered`), 사용자 노출 텍스트는 한국어 표기 통일.

---

## 3. 메인 화면 디자인 강제

이미지로 첨부된 시안이 **최종 확정 디자인**이다. 임의 변경 금지.

상세 명세는 `16_design_system.md v0.2` 참조. 핵심 요점:

### 3.1 홈 탭

- 상단: 다크 그린 헤더 (`bg-header-bg`)
- 인사말 (시간대별)
- **Hero 카드**: 오늘의 추천 오름 (사진 배경 + 그라데이션 + 태그 Badge + 체크 마크)
- **나의 탐방 현황**: 도넛 차트(36%) + 비기너/익스플로러/마스터 진척도
- **빠른 인증하기**: 사진 배경 카드 + GPS 인증 시작 버튼
- **최근 발견된 오름**: 가로 스크롤 카드 3개 (NEW Badge)
- **위시리스트 Top 3**
- 하단: BottomNavBar (5개 탭, 가운데 QR 플로팅)

### 3.2 도감 탭

- 상단: 다크 그린 헤더 (홈과 동일)
- **나의 도감 완성도** 카드: 다크 그린 배경 + "36 / 100" 큰 숫자 + 진척도 바 + 우측 캐릭터 일러스트 (등산하는 사람)
- **Tier Tabs**: `비기너 30 | 익스플로러 70 | 마스터 추후` (shadcn Tabs 사용)
- **3열 그리드**:
  - 발견됨: 풀컬러 사진 + 우상단 체크 마크 + 번호/이름
  - 미발견: 흑백 처리(`grayscale opacity-60`) + 번호/이름만
- 하단: `[필터] [맵핀 오름] [발견순]` 컨트롤

---

## 4. 카드 비주얼: 사진 (페이즈 1) → 일러스트 (페이즈 3+)

이전 v0.4의 "100% 일러스트 통일" 결정은 **페이즈 3 이후로 연기**.

### 4.1 페이즈 1 출시 시점

- **사진 사용**: 비짓제주 API 또는 본인 보유 사진
- 사진이 없는 오름은 **placeholder** (단색 그라데이션 + 큰 한글 타이포그래피)
- 통일감은 사진 후처리(채도·명도 조정)와 그라데이션 오버레이로

### 4.2 페이즈 3 한정판

- 그때 가서 일러스트 100장 제작 → 한정판 미션북
- 디지털도 일러스트 모드 토글 추가

**이유**: 일러스트 100장 6~8주 + 200~500만원은 출시 일정에 무리. 사진으로 빠르게 출시 후 한정판 전략으로 전환.

---

## 5. 데이터베이스 모델 (Firestore 컬렉션)

기존 `01_data_model.md`의 PostgreSQL 스키마는 **NoSQL 패턴으로 재구성**한다.

### 5.1 핵심 컬렉션

```
/oreums/{oreumId}                 # 360개 마스터
/users/{userId}                   # 사용자 프로필
/users/{userId}/discoveries/{id}  # 발견 기록 (서브컬렉션)
/users/{userId}/wishlist/{id}     # 위시리스트
/users/{userId}/badges/{id}       # 획득 배지
/users/{userId}/courses/{id}      # 코스
/comments/{commentId}             # 코멘트 (오름별 인덱스)
/photos/{photoId}                 # 사진 (오름별 인덱스)
/badges/{badgeId}                 # 배지 정의
/challenges/{challengeId}         # 챌린지 정의
/userChallenges/{id}              # 사용자 챌린지 진행
/feedEvents/{eventId}             # 피드 이벤트
/partnerMerchants/{merchantId}    # 제휴 상권
/seoContents/{slug}_{lang}        # SEO 콘텐츠 (언어별)
/mbtiQuestions/{questionId}
/userQuizResults/{id}
```

### 5.2 Security Rules 핵심

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 본인만 자기 데이터 read/write
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }

    // 오름 마스터: 모두 read, admin만 write
    match /oreums/{oreumId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }

    // 코멘트: 본인 작성 + 모두 read
    match /comments/{commentId} {
      allow read: if resource.data.is_public == true;
      allow create: if request.auth.uid == request.resource.data.user_id;
      allow update, delete: if request.auth.uid == resource.data.user_id;
    }

    // 사진: 유사
    match /photos/{photoId} {
      allow read: if resource.data.approval_status == 'approved';
      allow create: if request.auth.uid != null;
      // ...
    }
  }
}
```

상세 데이터 모델은 별도 문서 `01_data_model_firebase.md`로 재작성 필요. (페이즈 0 1주차 작업)

---

## 6. 어드민 모드 우선순위 (페이즈 0 출시 전)

`14_admin_backoffice.md`의 페이즈 분류는 **무효**. 다음으로 강제:

### 6.1 페이즈 0 (출시 전, **반드시 작동**)

1. **로그인** (Firebase Auth + admin claim)
2. **오름 일괄 등록** (CSV 업로드 → 검증 → 적용)
3. **오름 단건 편집** (전 필드)
4. **오름 발행/미발행 토글**
5. **MBTI 매핑 도구** (16칸 그리드)
6. **시각 자산 관리** (사진 업로드 + 자동 매칭)
7. **검증 리포트** (누락 필드, 좌표 이상치)

### 6.2 페이즈 1 (출시 직후)

- 사진 큐레이션 큐
- 코멘트 큐레이션 큐
- SEO 콘텐츠 편집기
- 챌린지 생성·관리
- 사용자 리스트

### 6.3 페이즈 2 이후

- 트렌드 알림 검토
- 점주 통계
- 일괄 처리 도구
- AI 보강

---

## 7. 핵심 5가지 신규 기능 (v0.4부터 유지)

1. **오름 MBTI** (페이즈 1)
2. **리듬 시스템** (페이즈 1, 랭킹 X)
3. **다국어 인프라 페이즈 0부터** (next-intl, 한국어 100%)
4. **팀 시스템** 페이즈 4로 이동 (5만+ 임계점 후)
5. **동네별/성별 랭킹 미도입**

---

## 8. 변경 이력

| 일자 | 버전 | 변경 |
|------|------|------|
| 2026-05-07 | 0.1 | 초안 |
| 2026-05-07 | 0.2~0.4 | 신규 기능 5종 결정, 인쇄물 사양 확정 |
| 2026-05-07 | **0.5** | **Supabase → Firebase 변경, shadcn/ui 필수, 사진 베이스 카드, 어드민 페이즈 0 강제** |

---

## 9. 외주사·개발자 즉시 실행 체크리스트

이 문서 받은 즉시 다음 순서로 작업:

- [ ] Firebase 프로젝트 생성 (Authentication / Firestore / Storage / Functions 활성화)
- [ ] Next.js + Tailwind 프로젝트에 `npx shadcn@latest init`
- [ ] 위 1.2의 컴포넌트 19종 일괄 설치
- [ ] `lucide-react` 설치
- [ ] `app/globals.css`에 CSS 변수 적용 (1.4 그대로)
- [ ] `tailwind.config.ts`에 커스텀 컬러 추가
- [ ] Pretendard 폰트 적용
- [ ] 어드민 라우트 (`/admin`) 셋업 + Firebase Auth admin claim
- [ ] 오름 일괄 등록 도구부터 작성 (제주오름요약설명 CSV 90개 즉시 임포트)

이 체크리스트가 끝나면 시안 화면 구현 시작.

---

## 10. 우선 참조 문서

본 문서 외 가장 우선 참조:

1. **`16_design_system.md v0.2`** — 시안 기반 컴포넌트 명세 + shadcn 매핑
2. **`02_user_flows.md`** — 사용자 흐름 (변경 없음)
3. **`17_phase_roadmap.md`** — 일정 (Firebase 반영 필요)

나머지 문서는 v0.5 결정 반영 후 점진 업데이트.

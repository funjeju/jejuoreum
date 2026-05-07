# 04. My Page & Collection

> 본 문서는 사용자가 가장 자주 보는 화면 — 마이페이지와 도감 — 의 모든 상세 명세를 정의한다.
> `16_design_system.md`의 디자인 토큰과 컴포넌트를 따른다.
> 메인화면 A/B 시안을 통합하여 **두 탭으로 분리**하는 결정을 반영한다.

---

## 0. 화면 구조 결정

### 0.1 메인화면 A/B 통합 방식

시안으로 받은 두 메인화면을 **별도 탭으로 분리**한다.

| 탭 | 역할 | 시안 출처 |
|----|------|----------|
| **홈 탭** (`/home`) | 활동 중심 — 오늘 할 것, 최근 활동 | 메인화면 A |
| **도감 탭** (`/collection`) | 수집 중심 — 100개 그리드, 진척도 시각화 | 메인화면 B |
| **위시리스트 탭** (`/wishlist`) | 다음 갈 곳 + 동선 설계 | 별도 |
| **마이 탭** (`/me`) | 프로필·배지·설정·MBTI 결과 | 별도 |

### 0.2 분리 이유

- 한 화면에 모두 담으면 정보 과잉
- 사용자별 선호 다름 (활동가 vs 수집가)
- 기능 추가 시 확장 여유

### 0.3 진입 우선순위

- 신규 가입자 (발견 < 5개): **홈 탭**이 기본 (행동 유도)
- 활성 사용자 (발견 5~80): **마지막 본 탭** 기억
- 마니아 (발견 80+): **도감 탭** 우선 추천 (수집 시각화 만족감)

페이즈 1 출시: 단순하게 항상 **홈 탭**을 기본으로. 사용자별 분기는 페이즈 2 이후.

---

## 1. 하단 탭바

전 화면 공통.

### 1.1 구조

```
┌─────────────────────────────────────┐
│   [홈]  [도감]  [QR]  [위시]  [마이]   │
└─────────────────────────────────────┘
```

5개 탭, 중앙(QR)은 플로팅 액션 버튼.

### 1.2 사양

```
높이: 64px (iOS safe area 추가)
배경: --white
보더 상단: 0.5px solid --neutral-200

탭 4개 (홈/도감/위시/마이):
  - 아이콘: 24px (Tabler outline)
  - 라벨: 11px, weight 500
  - 활성: --brand-green-800
  - 비활성: --neutral-500
  - 탭 시 햅틱 피드백 + scale(0.95) 100ms

중앙 QR 버튼:
  - 원형 직경 56px
  - 배경: --brand-green-800
  - 아이콘: 24px QR 아이콘, white
  - 위치: y축 -16px (위로 띄움)
  - 그림자: --shadow-lg
  - 탭 시 즉시 /qr 페이지 진입 + 카메라 자동 활성화
```

### 1.3 아이콘 매핑

| 탭 | Tabler 아이콘 | 활성 시 |
|----|---------------|--------|
| 홈 | `home` | 채워짐 효과 (보더 굵게) |
| 도감 | `book-2` | 채워짐 효과 |
| QR (중앙) | `qrcode` | 항상 흰색 |
| 위시 | `heart` | 채워짐 효과 |
| 마이 | `user-circle` | 채워짐 효과 |

### 1.4 알림 배지

- 신규 챌린지 등장 시 홈 탭에 빨간 점
- 신규 배지 획득 시 마이 탭에 빨간 점
- 사용자가 해당 탭 진입 시 자동 제거

---

## 2. 홈 탭 (`/home`)

### 2.1 화면 구조

```
┌────────────────────────────────────┐
│  [상단 헤더: 메뉴 / 제목 / 알림]      │ ← 56px
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 인사말 영역                    │  │ ← 64px
│  │ "오늘도 좋은 탐험 되세요!"      │  │
│  └──────────────────────────────┘  │
│                                    │
│  [오늘의 추천 오름 카드]              │ ← 220px
│  (Hero Card)                       │
│                                    │
│  [나의 탐방 현황 카드]                │ ← 180px
│  (도넛 + 섹션별 진척도)              │
│                                    │
│  [이번 달 리듬 카드]                  │ ← 100px
│                                    │
│  [GPS 인증 시작 카드]                 │ ← 140px
│  (CTA)                             │
│                                    │
│  [최근 발견한 오름] (가로 스크롤)      │ ← 200px
│                                    │
│  [위시리스트 Top 3]                  │ ← 200px
│                                    │
│  [이주의 미션] (있을 시)              │ ← 160px
│                                    │
│  [오름 MBTI 안내] (미참여 시)         │ ← 140px
│                                    │
└────────────────────────────────────┘
        ↓ 하단 탭바 (64px)
```

### 2.2 인사말 영역

```
시간대별 인사:
- 05:00~09:00: "오늘도 좋은 탐험 되세요! 🌅"
- 09:00~12:00: "활기찬 하루 되세요! ☀️"
- 12:00~17:00: "오후의 여정도 화이팅! 🌤️"
- 17:00~20:00: "노을 명소를 찾아보세요 🌇"
- 20:00~05:00: "내일의 오름을 계획해보세요 🌙"

스타일:
- 폰트: --text-body-lg (16px), weight 500
- 색상: --neutral-900
- 배경: --white
- 패딩: --space-4
```

### 2.3 오늘의 추천 오름 카드 (Hero Card)

가장 큰 비주얼 요소. 사용자별 개인화.

```
크기: 화면 폭 - 32px × 220px
배경: 카드 일러스트 (full bleed)
오버레이: 사진 위 다크 그라데이션 (하단)
모서리: --radius-lg (16px)

콘텐츠 (좌하단):
- 라벨 ("오늘의 추천 오름"): 12px, white opacity 0.9
- 제목 (오름 이름): 24px, weight 700, white
- 태그 그룹 (3개): "비기너", "동부", "일출 추천"
  · 반투명 white 배경, 11px

우상단:
- 발견됨 표시: 원형 40px, --brand-green-800 + 흰 체크
- 미발견: rgba(255,255,255,0.2) + 흰 체크 (희미)

탭 시: /oreum/{slug} 진입
```

#### 2.3.1 추천 알고리즘

**우선순위**:
1. 사용자 MBTI 추천 결과 (있다면, 미발견인 것)
2. 위시리스트 1순위 (미발견)
3. 거주지·현재 위치 기준 가까운 미발견 오름
4. 시즌 추천 (봄→봄 추천 오름)
5. fallback: 비기너 영역 미발견 오름 랜덤

```typescript
async function getTodayRecommendation(userId: string): Promise<Oreum> {
  // 1. MBTI 매칭 결과 중 미발견
  const mbtiResult = await getMbtiResult(userId);
  if (mbtiResult) {
    const undiscovered = await findUndiscovered(mbtiResult.recommended_oreum_ids, userId);
    if (undiscovered) return undiscovered;
  }

  // 2. 위시리스트 1순위 미발견
  const wishlistTop = await findUndiscoveredFromWishlist(userId);
  if (wishlistTop) return wishlistTop;

  // 3. 거주지/현재 위치 기준 가까운 미발견
  const profile = await getUserProfile(userId);
  if (profile.home_location_lat) {
    const nearby = await findNearbyUndiscovered(
      profile.home_location_lat,
      profile.home_location_lng,
      userId
    );
    if (nearby) return nearby;
  }

  // 4. 시즌 추천
  const currentSeason = getCurrentSeason();
  const seasonal = await findUndiscoveredBySeason(currentSeason, userId);
  if (seasonal) return seasonal;

  // 5. fallback
  return await getRandomBeginnerUndiscovered(userId);
}
```

#### 2.3.2 추천 갱신 주기

- **하루 1회 갱신**: 매일 자정 기준 새 추천
- **사용자가 인증 시**: 새 추천 즉시 갱신
- **명시적 새로고침**: 카드 우상단 "🔄" 버튼 (페이즈 2)

### 2.4 나의 탐방 현황 카드

도넛 차트 + 섹션별 진척도.

```
배경: --white
보더: 1px solid --neutral-200
모서리: --radius-md (12px)
패딩: --space-4

좌측: 도넛 차트
- 직경: 120px
- 두께: 12px
- fill: --brand-green-800
- track: --neutral-200
- 중앙 텍스트: "36%" (32px, weight 700)

우측: 섹션별 진척도 리스트
┌─────────────────┐
│ 비기너   8 / 30  │
│ 익스플로러 18 / 70 │
│ 마스터    0 / 추후 │
└─────────────────┘
- 라벨: 12px, --neutral-700
- 숫자: 14px, weight 600
- 우측 정렬

탭 시: /collection 도감 탭으로 이동
```

### 2.5 이번 달 리듬 카드

랭킹 X, 본인 페이스 가시화.

```
배경: --brand-green-50
모서리: --radius-md
패딩: --space-4

구조:
┌──────────────────────────────────────┐
│ ⭐ 이번 달 리듬                        │
│                                       │
│ 새로 발견한 오름  5개  (이번 주: 2개) │
│ 다녀온 지역      3 / 5                │
│                                       │
│ "234명이 함께 ○○오름을 다녀갔어요"     │
└──────────────────────────────────────┘

상세:
- 헤딩: 14px, weight 600, --brand-green-800
- 본문: 13px, --neutral-700
- 숫자 강조: 18px, weight 700, --brand-green-800
- 협력감 메시지: 12px, --neutral-700
  (가장 최근 인증한 오름의 30일 누적 방문자 수)

탭 시: 마이 탭의 리듬 상세로 이동 (페이즈 2)
```

### 2.6 GPS 인증 시작 카드

```
크기: 화면 폭 - 32px × 140px
배경: 사진 (제주 풍경, 살짝 어두운 톤)
오버레이: 다크 그라데이션
모서리: --radius-lg

콘텐츠:
- 헤딩 ("오름 근처에 계신가요?"): 18px, weight 600, white
- 부제: 14px, white opacity 0.85

버튼:
- 배경: --brand-green-800
- 텍스트: white, 14px, weight 600
- 패딩: 12px 20px
- 모서리: --radius-md
- 아이콘: GPS 핀 (16px)
- 텍스트: "GPS 인증 시작"

탭 시: /qr 진입
```

### 2.7 최근 발견한 오름 (가로 스크롤)

```
섹션 헤더:
- 좌: "최근 발견한 오름" (16px, weight 600)
- 우: "더보기" 링크 (12px, --brand-green-800)

가로 스크롤 카드:
- 카드 폭: 140px, 높이 180px
- 모서리: --radius-md
- gap: 12px
- 좌우 패딩: 16px

각 카드 구조:
┌──────────────┐
│              │
│  [일러스트]    │ (75% 높이)
│              │
├──────────────┤
│ 다랑쉬오름     │ (이름)
│ 2026.05.20   │ (날짜)
└──────────────┘

NEW 라벨 (최근 7일):
- 좌상단
- 배경: --brand-green-800
- 텍스트: "NEW", 11px, weight 600, white

빈 상태 (발견 없음):
- "첫 오름을 발견해보세요!" 안내
- "GPS 인증 시작" 버튼
```

### 2.8 위시리스트 Top 3

```
섹션 헤더:
- "위시리스트 Top 3"
- 우측 "더보기"

3개 카드 가로 배열 (또는 가로 스크롤)
각 카드 구조:
┌──────────────┐
│  [일러스트]    │
│              │
│ 영주산        │
│ 1.8km · 동부  │
└──────────────┘

비어있을 시:
- "위시리스트가 비어있어요"
- "오름 둘러보기" 버튼
```

### 2.9 이주의 미션 (선택 노출)

진행 중인 챌린지가 있을 때만 노출.

```
배경: 챌린지 커버 이미지 + 다크 오버레이
높이: 160px
모서리: --radius-lg

콘텐츠:
- 라벨: "이주의 미션"
- 제목: 챌린지 제목 (18px, weight 600, white)
- 진행도: "3 / 5 완료" (프로그레스 바)
- 마감일: "3일 남음"

탭 시: 챌린지 상세 페이지
```

### 2.10 오름 MBTI 안내 (미참여 시)

```
배경: --brand-green-50
패딩: --space-4
모서리: --radius-md

구조:
┌──────────────────────────────────────┐
│ 🌿 나를 닮은 오름은?                   │
│                                       │
│ 10문항으로 알아보는 오름 MBTI          │
│ 당신과 닮은 오름을 추천해드려요         │
│                                       │
│ [ 테스트 시작하기 ]                    │
└──────────────────────────────────────┘

탭 시: /quiz 진입
참여 후엔 이 카드 안 보임 (결과는 마이 탭에서 확인)
```

### 2.11 풀 투 리프레시

전체 화면 풀 다운으로 갱신.
- 인디케이터 색상: --brand-green-800
- 갱신: 추천 오름, 진척도, 리듬 카드, 최근 발견

---

## 3. 도감 탭 (`/collection`)

### 3.1 화면 구조

```
┌────────────────────────────────────┐
│  [상단 헤더]                         │ ← 56px
├────────────────────────────────────┤
│                                    │
│  [발견률 큰 숫자 + 진척도 바]         │ ← 100px
│                                    │
│  [난이도 탭] (비기너/익스플로러/마스터) │ ← 48px
│                                    │
│  [지역 필터 칩]                       │ ← 44px
│                                    │
│  [정렬·필터 버튼 행]                  │ ← 48px
│                                    │
│  ┌────┬────┬────┐                   │
│  │ 카드 │ 카드 │ 카드 │                │
│  ├────┼────┼────┤                  │
│  │ 카드 │ 카드 │ 카드 │                │ ← 그리드
│  ├────┼────┼────┤                  │   3열
│  │ ... │ ... │ ... │                │   무한 스크롤
│  └────┴────┴────┘                   │
│                                    │
└────────────────────────────────────┘
        ↓ 하단 탭바
```

### 3.2 발견률 표시 영역

```
배경: --white
패딩: --space-4 (16px)

상단:
- 좌: 큰 숫자 "36 / 100" (32px, weight 700)
- 우: 작은 라벨 "나의 도감 완성률" (12px, --neutral-700)

하단:
- 진척도 바 (높이 8px, 모서리 --radius-full)
  - 배경: --neutral-200
  - fill: --brand-green-800
  - fill 비율: 36%

장식 일러스트 (선택):
- 우측에 등산하는 사람 일러스트 (시안의 캐릭터)
- 크기 80×80px
- 발견률에 따라 변화 (페이즈 2 검토):
  - 0~30%: 출발 모습
  - 30~60%: 등산 중
  - 60~90%: 정상 가까이
  - 90~100%: 깃발 든 모습
```

### 3.3 난이도 탭

```
배경: --white
보더 하단: 0.5px solid --neutral-200
높이: 48px

탭 3개:
- "비기너 30"
- "익스플로러 70"
- "마스터 추후" (옅게 비활성)

활성 탭:
- 텍스트: --brand-green-800, weight 600
- 하단 보더: 2px solid --brand-green-800
- 숫자 칩: 발견/전체 형식 ("18/30")

비활성 탭:
- 텍스트: --neutral-500, weight 400

전환:
- 탭 클릭 시 즉시 그리드 필터링
- 부드러운 fade transition (200ms)
```

### 3.4 지역 필터 칩

```
가로 스크롤 칩 행:
[ 전체 ] [ 동 ] [ 서 ] [ 남 ] [ 북 ] [ 중산간 ]

칩 사양:
- 높이: 32px
- 패딩: 4px 12px
- 폰트: 13px, weight 500
- 모서리: --radius-full
- gap: 8px

활성 칩:
- 배경: --brand-green-800
- 텍스트: white

비활성 칩:
- 배경: --neutral-100
- 텍스트: --neutral-700
- 보더: 1px solid --neutral-200

다중 선택 X (단일 선택)
```

### 3.5 정렬·필터 버튼 행

```
좌측: 정렬 드롭다운
"발견순 ▼" 버튼
선택지:
- 발견순 (기본, 최근 발견 우선)
- 번호순 (tier_order)
- 이름순 (가나다)
- 거리순 (거주지/현재 위치 기준)

우측: 부가 필터 모달 트리거
"필터 ⚙" 버튼
모달 옵션:
- 발견 상태: 전체 / 발견 / 미발견
- 시즌: 전체 / 봄 / 여름 / 가을 / 겨울
- 시간대: 전체 / 일출 / 오후 / 일몰
- 난이도: 1~5 슬라이더
```

### 3.6 카드 그리드 (메인 영역)

```
그리드 사양:
- 3열 (반응형: 모바일 3, 태블릿 4, 데스크탑 5)
- gap: 12px
- 양쪽 패딩: 16px

각 카드 사양:
크기: (화면폭 - 32px - 24px) / 3
비율: 1:1.2 (세로 약간 긺)
모서리: --radius-md (12px)
보더: 1px solid --neutral-200
배경: --white

카드 내부:
┌──────────────┐
│              │
│              │
│  [일러스트]    │ ← 70% 높이
│              │
│              │
├──────────────┤
│ 001          │ ← 번호 (작게)
│ 새별오름      │ ← 이름 (강조)
└──────────────┘

발견된 카드:
- 일러스트: 풀컬러
- 우상단 체크 마크 (28px 원형, --brand-green-800)

미발견 카드:
- 일러스트 filter: grayscale(100%) opacity(0.6)
- 번호와 이름은 보임 (스포일러 X 정책 시 가려도 무방)
```

### 3.7 무한 스크롤

```
한 번에 로드: 30개 (10행)
스크롤 90% 도달 시 다음 30개 로드
끝에 도달 시: "모두 봤어요" 메시지 또는 추천

로딩 상태:
- 스켈레톤 카드 (--neutral-100 배경 + shimmer)
- 부드러운 페이드인
```

### 3.8 카드 탭 동작

```
[카드 탭]
    ↓
[scale(0.98) 100ms 햅틱]
    ↓
[Hero animation: 카드가 확대되며 페이지 전환]
    ↓
[/oreum/{slug} 진입]
```

상세 페이지: `05_oreum_card_page.md` 참조.

### 3.9 빈 상태 처리

**필터 결과 없음**:
```
[일러스트: 빈 박스]
"이 조건에 맞는 오름이 없어요"
"필터 변경하기" 버튼
```

**도감 시작 전 (가입 직후)**:
```
[일러스트: 빈 도감]
"첫 오름을 발견해보세요"
"GPS 인증 시작" 버튼
```

---

## 4. 위시리스트 탭 (`/wishlist`)

상세 명세는 `06_wishlist_routing.md` 참조. 본 문서는 개요만.

```
[헤더: 위시리스트]
[필터 칩: 지역/난이도/계절]
[카드 리스트 (수직)]
  - 각 카드: 일러스트 + 이름 + 거리 + 추가일
[하단 고정 버튼: "오늘의 코스 짜기"]
```

---

## 5. 마이 탭 (`/me`)

### 5.1 화면 구조

```
┌────────────────────────────────────┐
│  [프로필 헤더]                       │ ← 120px
│  - 아바타, 닉네임, 가입일             │
│  - "프로필 수정" 버튼                 │
├────────────────────────────────────┤
│  [요약 통계 카드]                    │ ← 80px
│  - 발견 36개 / 사진 12장 / 코멘트 8개  │
├────────────────────────────────────┤
│  [내 MBTI 결과] (있을 시)            │ ← 200px
├────────────────────────────────────┤
│  [배지 진열]                         │ ← 가변
├────────────────────────────────────┤
│  [내 사진·코멘트 기록]                │ ← 가변
├────────────────────────────────────┤
│  [활동 기록 (타임라인)]               │ ← 가변
├────────────────────────────────────┤
│  [설정 메뉴]                         │ ← 가변
└────────────────────────────────────┘
```

### 5.2 프로필 헤더

```
배경: --brand-green-50
패딩: --space-6 (24px)

좌측: 아바타
- 원형 64px
- OAuth 가져온 이미지 또는 기본값
- 탭 시 변경 가능

우측: 정보
- 닉네임 (18px, weight 600)
- 가입일 ("2026년 5월 가입")
- "프로필 수정" 버튼 (작게)
```

### 5.3 요약 통계 카드

```
3열 그리드:
┌──────┬──────┬──────┐
│  36  │  12  │   8  │
│ 발견 │ 사진 │ 코멘트│
└──────┴──────┴──────┘

각 항목:
- 큰 숫자: 24px, weight 700
- 라벨: 12px, --neutral-700
- 탭 시 해당 영역으로 이동
```

### 5.4 내 MBTI 결과

```
배경: --brand-green-50
패딩: --space-4
모서리: --radius-md

구조:
┌──────────────────────────────────────┐
│ 🌿 나를 닮은 오름                     │
│                                       │
│ ENFJ - 모두를 품는 리더                │
│                                       │
│ ┌──────────────────────────────┐     │
│ │ [추천 오름 카드 작게]           │     │
│ │ 따라비오름                     │     │
│ │ "제주 동부의 여왕"              │     │
│ └──────────────────────────────┘     │
│                                       │
│ [ 다시 테스트 ] [ 결과 공유 ]          │
└──────────────────────────────────────┘

미참여 시:
"오름 MBTI 테스트 해보기" 버튼
```

### 5.5 배지 진열

```
섹션 헤더: "획득한 배지" + 숫자 ("8 / 24")

그리드 4열:
┌────┬────┬────┬────┐
│ 🏅 │ 🏅 │ 🏅 │ 🏅 │
│ 첫발견│지역동│봄탐험│기록자│
└────┴────┴────┴────┘

획득 배지:
- 일러스트 풀컬러 (48×48)
- 라벨 11px

미획득:
- 흑백 + 잠금 아이콘
- 탭 시 획득 조건 안내

"전체 보기" 링크 → 배지 전용 페이지
```

### 5.6 내 사진·코멘트 기록

```
탭 영역:
[ 내 사진 (12) ] [ 내 코멘트 (8) ]

내 사진 탭:
- 그리드 3열
- 승인됨 / 검토 중 상태 표시
- 대표 사진 채택됐으면 별 마크

내 코멘트 탭:
- 리스트
- 오름명 + 코멘트 첫 줄 + 날짜
- 팁 승격됐으면 라벨 표시
```

### 5.7 활동 기록 (타임라인)

```
"내 탐험 일지"

타임라인 형태:
┌─ 2026.05.20 ─┐
│ 다랑쉬오름 발견│
│ 사진 2장 추가  │
└──────────────┘
        ↓
┌─ 2026.05.18 ─┐
│ 금오름 발견    │
└──────────────┘
        ↓
...

월/년 단위 그룹핑
```

### 5.8 설정 메뉴

```
리스트 항목:
- 알림 설정
- 피드 공개 설정 (즉시/10분 딜레이/비공개)
- 언어 설정
- 거주지 설정
- 계정 정보 (이메일, OAuth 연결)
- 도움말
- 이용약관·개인정보처리방침
- 문의하기
- 로그아웃
- 회원 탈퇴 (가장 아래)
```

---

## 6. API 명세

### 6.1 GET /api/me/home

홈 탭 진입 시 호출. 한 번의 요청으로 필요한 모든 데이터.

**Response**:
```typescript
{
  user: {
    nickname: string;
    avatar_url: string;
  };
  greeting: string; // 시간대별
  recommendation: {
    oreum: Oreum;
    reason: 'mbti' | 'wishlist' | 'nearby' | 'seasonal' | 'fallback';
  };
  progress: {
    total: { discovered: 36, total: 100 };
    beginner: { discovered: 8, total: 30 };
    explorer: { discovered: 28, total: 70 };
    master: { discovered: 0, total: 0 };
  };
  rhythm: {
    this_month_discoveries: number;
    this_week_discoveries: number;
    this_month_regions: number;
    total_regions: number;
    last_oreum_companionship: { oreum_name: string; visitor_count: number };
  };
  recent_discoveries: Array<{
    oreum_id: string;
    name_ko: string;
    slug: string;
    illustration_url: string;
    discovered_at: string;
    is_new: boolean; // 7일 이내
  }>;
  wishlist_top3: Array<Oreum>;
  active_challenge: Challenge | null;
  show_mbti_invite: boolean; // 미참여 시 true
}
```

### 6.2 GET /api/me/collection

도감 탭 진입 시 호출.

**Query**:
```
?tier=beginner|explorer|master|all
&region=east|west|south|north|central|all
&discovered=all|true|false
&sort=discovered_desc|tier_order|name|distance
&season=spring|summer|autumn|winter
&page=1
&limit=30
```

**Response**:
```typescript
{
  stats: {
    total: { discovered: number; total: number };
    by_tier: { beginner: {...}, explorer: {...}, master: {...} };
    by_region: { east: number; west: number; ... };
  };
  oreums: Array<{
    id: string;
    slug: string;
    name_ko: string;
    name_en?: string;
    tier: string;
    tier_order: number;
    region: string;
    illustration_url: string;
    is_discovered: boolean;
    discovered_at?: string;
    distance_km?: number; // 정렬이 distance면 포함
  }>;
  pagination: {
    page: number;
    has_next: boolean;
  };
}
```

### 6.3 GET /api/me/profile

마이 탭 진입 시 호출.

**Response**:
```typescript
{
  user: { /* ... */ };
  stats: {
    discoveries_count: number;
    photos_count: number;
    comments_count: number;
  };
  mbti_result: {
    mbti: string;
    title: string;
    recommended_oreums: Array<Oreum>;
    completed_at: string;
  } | null;
  badges: {
    earned_count: number;
    total_count: number;
    earned: Array<Badge>;
    upcoming: Array<Badge>; // 가까이 도달한 미획득 배지 3개
  };
  recent_activities: Array<Activity>;
}
```

---

## 7. 인터랙션·애니메이션

### 7.1 탭 전환

```
[탭 클릭]
    ↓
[즉시 햅틱 피드백]
    ↓
[페이지 전환 fade 200ms]
    ↓
[새 탭 콘텐츠 로드]
    ↓
[데이터 fetch (캐시 활용)]
```

캐시 전략 (TanStack Query):
- staleTime: 5분
- 풀 투 리프레시 시 강제 갱신
- 인증·발견 등 mutation 시 즉시 invalidate

### 7.2 도감 그리드 카드 진입

```
[카드 탭]
    ↓
[Hero Animation 시작]
- 카드가 확대되며 페이지 전체로 변환
- duration: 350ms
- easing: cubic-bezier(0.4, 0, 0.2, 1)
    ↓
[/oreum/{slug} 페이지 표시]
- 상단에 같은 카드 위치 (sticky)
- 자연스러운 연결감
```

### 7.3 발견 모먼트 → 도감 갱신

```
[다른 화면에서 발견 완료]
    ↓
[도감 탭으로 이동]
    ↓
[해당 오름 카드 즉시 컬러 표시]
    ↓
[scroll into view (필요 시)]
    ↓
[은은한 강조 효과 (1초)]
- 카드 주변 글로우 애니메이션
```

### 7.4 진척도 카운터 애니메이션

발견 시 진척도 숫자가 카운트 업.

```
[발견 완료]
    ↓
[카운터 0.8초 동안 카운트 업]
- ease-out
- 35 → 36
    ↓
[발견률 % 동시 갱신]
    ↓
[진척도 바 fill 갱신]
- 0.6초 fill 애니메이션
```

---

## 8. 반응형 처리

### 8.1 데스크탑 (1280px+)

본 프로젝트는 모바일 우선이지만 데스크탑 사용자 대응:

- 콘텐츠 최대 폭: 480px (모바일 미러링)
- 좌우 회색 배경 영역
- 또는 와이드 레이아웃 (페이즈 3 검토):
  - 좌측 사이드바: 탭 메뉴
  - 우측: 메인 콘텐츠

### 8.2 태블릿 (768~1024px)

- 도감 그리드: 4열로 확장
- 카드 사이즈 약간 커짐
- 나머지는 모바일과 동일

### 8.3 모바일 가로

- 그리드 4열로 확장
- 헤더·탭바 그대로

---

## 9. 다국어 처리

### 9.1 화면 텍스트

모든 UI 텍스트는 i18n 키로 분리.

```typescript
// messages/ko.json (예시)
{
  "home": {
    "greeting": {
      "morning_early": "오늘도 좋은 탐험 되세요!",
      "morning": "활기찬 하루 되세요!",
      // ...
    },
    "today_recommendation": {
      "label": "오늘의 추천 오름"
    },
    "rhythm": {
      "title": "이번 달 리듬",
      "discoveries_this_month": "{count}개의 오름을 새로 발견했어요"
    }
  },
  "collection": {
    "stats": {
      "completion_rate": "도감 완성률"
    },
    "tier": {
      "beginner": "비기너",
      "explorer": "익스플로러",
      "master": "마스터"
    }
  }
}
```

### 9.2 동적 콘텐츠

- 오름 이름: `name_{lang}` 컬럼 사용, fallback: `name_ko`
- 시간대 인사: 사용자 timezone 고려 (Asia/Seoul 기본)
- 거리 표시: 한국어 "1.2km", 영어 "1.2 km" (공백 처리)

---

## 10. 성능 최적화

### 10.1 초기 로딩

- **Critical CSS**: 인라인 (above-the-fold)
- **카드 일러스트**: lazy loading + blur hash placeholder
- **다음 화면 prefetch**: 도감 탭 진입 시 첫 6개 카드의 카드 페이지 prefetch

### 10.2 도감 그리드

- 가상 스크롤 (페이즈 2 검토, 100개는 일반 스크롤로 충분)
- 이미지 사이즈: 카드 표시 사이즈에 맞춰 변환 (Cloudflare Images)
- WebP/AVIF 자동

### 10.3 캐시 전략

```typescript
// TanStack Query 설정
{
  queries: {
    // 마스터 데이터 (오름 정보)
    'oreums-master': { staleTime: 24 * 60 * 60 * 1000 }, // 1일
    // 사용자 데이터
    'me-home': { staleTime: 5 * 60 * 1000 }, // 5분
    'me-collection': { staleTime: 5 * 60 * 1000 },
    'me-profile': { staleTime: 5 * 60 * 1000 },
    // 통계
    'rhythm': { staleTime: 60 * 1000 }, // 1분
  }
}
```

### 10.4 PWA 오프라인

- 마지막 본 도감 상태 캐시
- 오름 마스터 데이터 캐시
- 사용자 발견 기록 캐시 (낙관적 업데이트)

---

## 11. 접근성

- 모든 카드에 `role="article"` + `aria-label`
- 진척도 바: `role="progressbar"` + `aria-valuenow/min/max`
- 발견 상태: `aria-label="발견함" / "미발견"`
- 탭바: `role="tablist"` + 각 탭 `aria-current="page"` (활성 시)
- 색상만으로 정보 전달 X (체크 아이콘 항상 동반)

---

## 12. 분석·이벤트

### 12.1 추적할 이벤트

| 이벤트 | 속성 |
|--------|------|
| `home_viewed` | recommended_oreum_id, recommendation_reason |
| `home_recommendation_clicked` | oreum_id |
| `collection_viewed` | total_discovered |
| `collection_filter_applied` | filter_type, filter_value |
| `collection_card_clicked` | oreum_id, is_discovered |
| `me_viewed` | discoveries_count |
| `mbti_invite_clicked` | source: 'home' |
| `tab_switched` | from_tab, to_tab |

### 12.2 KPI

- 홈 탭 → 인증 전환률
- 추천 오름 클릭률
- 도감 탭 체류 시간
- 카드 → 상세 페이지 클릭률
- MBTI 안내 카드 클릭률 (페이즈 1 가설 검증)

---

## 13. 테스트 시나리오

### 13.1 단위 테스트

- 추천 알고리즘 5단계 분기
- 진척도 계산 (각 tier별)
- 시간대별 인사 메시지

### 13.2 통합 테스트

- 홈 탭 진입 → 추천 → 인증 → 도감 갱신 (E2E)
- 필터 적용 → 결과 정확성
- 카드 탭 → 상세 페이지 Hero animation

### 13.3 시각 회귀 테스트

- 홈 탭 시안과 차이 확인
- 도감 탭 흑백/컬러 전환
- 다양한 발견률 (0%, 30%, 70%, 100%)에서 화면 확인

---

## 14. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 4개 탭 분리, 홈 탭 11섹션, 도감 탭 9섹션, 마이 탭 8섹션 명세, 추천 알고리즘, API 응답 구조, 인터랙션 정의 | 기획+Claude |

---

## 15. 후속 작업

- 각 탭 Figma 와이어프레임
- 추천 알고리즘 A/B 테스트 설계
- 발견률 진척도 일러스트 캐릭터 변화 디자인
- 빈 상태 일러스트 제작
- 다국어 메시지 파일 작성

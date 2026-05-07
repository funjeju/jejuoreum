# 06. Wishlist & Course Routing

> 본 문서는 위시리스트 관리와 동선 설계 도구의 모든 명세를 정의한다.
> 사용자가 "다음 갈 곳을 정하고, 효율적으로 다녀오는" 핵심 도구.

---

## 0. 기능의 위상

### 0.1 왜 중요한가

위시리스트와 동선 설계는 **재방문 동기 부여 + 한 번 방문에서 여러 오름 인증 유도**라는 두 가지 효과를 만든다.

- **재방문 동기**: "다음에 와서 가야지" 위시리스트가 다음 제주 여행을 자연 예약
- **여러 오름 인증**: 한 번 갔을 때 1개가 아니라 3~4개 인증하게 만듦
- **사용자가 짠 코스의 콘텐츠화**: 코스 공유로 자연 마케팅
- **제휴 상권 노출**: 코스 사이에 제휴 카페·식당 자연 끼워넣기

### 0.2 두 도구의 관계

```
위시리스트 (저장소)
    ↓ 선택
동선 설계 (도구)
    ↓ 결과
코스 카드 (활용·공유)
```

위시리스트 자체로는 단순 즐겨찾기지만, 동선 설계와 결합하면 "오늘의 여정"이 만들어진다.

---

## 1. 위시리스트 화면

### 1.1 진입 경로

- 하단 탭바 → 위시리스트 탭
- AR 화면 → "다음 목적지로" → 위시리스트 자동 추가
- 카드 페이지 → "위시리스트 추가" 버튼
- MBTI 결과 → "이 오름 가보기" → 위시리스트 자동 추가
- SEO 페이지 → "위시리스트에 저장" → 가입 후 저장

### 1.2 화면 구조

```
┌────────────────────────────────────┐
│  [상단 헤더: 제목 / 검색]             │ ← 56px
├────────────────────────────────────┤
│                                    │
│  [필터·정렬 영역]                    │ ← 96px
│  - 지역 칩                          │
│  - 정렬: 추가순/거리순/난이도/계절    │
│                                    │
│  [위시리스트 카운트 + 코스 짜기 버튼]  │ ← 56px
│  "8개의 오름이 위시리스트에 있어요"   │
│  [ 오늘의 코스 짜기 ]                 │
│                                    │
│  [오름 카드 리스트 (수직)]            │
│                                    │
│  ┌────────────────────────────┐    │
│  │ [일러스트]  영주산           │    │
│  │           1.8km · 동부      │    │
│  │           ★★ 비기너         │    │
│  │           추가일: 5월 20일   │    │
│  │                  [선택 ☐]   │    │
│  └────────────────────────────┘    │
│                                    │
│  ┌────────────────────────────┐    │
│  │ [일러스트]  따라비오름        │    │
│  │           ...               │    │
│  └────────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
        ↓ 하단 탭바
```

### 1.3 카드 사양

```
높이: 96px
배경: --white
보더: 0.5px solid --neutral-200
모서리: --radius-md
패딩: --space-3

좌측: 일러스트 썸네일
- 80×80, 모서리 --radius-sm
- 미발견: 흑백 처리

중앙: 정보
- 오름 이름: 16px, weight 600
- 메타 (거리·지역): 13px, --neutral-700
  · 거리는 거주지 또는 현재 위치 기준
- 난이도 + tier: 12px, --neutral-500
- 추가일: 11px, --neutral-500

우측: 액션
- 체크박스 (코스 선택용)
- 또는 ⋯ (옵션 메뉴: 제거, 우선순위 변경)

탭 시: /oreum/{slug} 진입
```

### 1.4 필터·정렬

#### 필터 칩

```
가로 스크롤:
[ 전체 ] [ 동 ] [ 서 ] [ 남 ] [ 북 ] [ 중산간 ] [ 비기너 ] [ 익스플로러 ]

다중 선택 가능 (지역 / 난이도 별도 그룹)
```

#### 정렬 옵션

```
드롭다운:
- 추가순 (최신 먼저, 기본값)
- 거리순 (현재 위치 또는 거주지 기준)
- 난이도 (쉬운 것부터)
- 시즌 적합도 (현재 시즌 추천 우선)
- 이름순 (가나다)
```

### 1.5 빈 상태

```
[일러스트: 빈 하트 또는 빈 책]

"위시리스트가 비어있어요"
"가고 싶은 오름을 저장해보세요"

[ 추천 오름 보러가기 ]
[ 도감 둘러보기 ]
```

---

## 2. 위시리스트 추가·관리

### 2.1 추가 흐름

```
[추가 트리거 (다양한 진입점)]
    ↓
[로그인 체크]
   ├── 로그인 X → 로그인 모달 → 인증 후 추가
   └── 로그인 O → 즉시 추가
    ↓
[user_wishlist 삽입]
   - source 컬럼에 진입점 기록
   - priority 0 (기본값)
    ↓
[성공 토스트]
- "위시리스트에 추가됐어요"
- 하트 아이콘 채워짐 애니메이션
    ↓
[버튼 상태 변경]
- "위시리스트 추가" → "위시리스트에 있음 ✓"
```

### 2.2 중복 추가 처리

```sql
-- UNIQUE(user_id, oreum_id) 제약
INSERT INTO user_wishlist (...)
ON CONFLICT (user_id, oreum_id) DO NOTHING;
```

이미 추가된 경우:
- 토스트 "이미 위시리스트에 있어요"
- 버튼 상태는 그대로

### 2.3 제거 흐름

```
[위시리스트에서 제거 트리거]
   - 카드의 ⋯ 메뉴 → "제거"
   - 카드 페이지의 "위시리스트에서 제거"
   - 스와이프 제거 (모바일 제스처)
    ↓
[확인 모달]
- "위시리스트에서 제거하시겠어요?"
- [취소] [제거]
    ↓
[삭제 + 부드러운 fade out 애니메이션 (300ms)]
    ↓
[Undo 토스트 (5초)]
- "제거했어요. [되돌리기]"
```

### 2.4 우선순위 (드래그)

```
[카드 길게 누르기]
    ↓
[드래그 모드 활성화]
- 카드 살짝 들림 (scale 1.02 + shadow)
- 햅틱 피드백
    ↓
[드래그 이동]
- 다른 카드 자리 비켜줌
    ↓
[놓으면 priority 업데이트]
```

priority 정렬 시 사용자 정렬 우선.

### 2.5 자동 정리 (페이즈 2)

옵션: 발견한 오름을 위시리스트에서 자동 제거.

```
[오름 발견]
    ↓
[user_wishlist에 있다면 자동 제거 또는 "방문 완료" 표시]
```

사용자 설정으로 ON/OFF 가능.

---

## 3. 동선 설계 도구 (오늘의 코스 짜기)

### 3.1 진입

```
[위시리스트 화면 → "오늘의 코스 짜기" 버튼]
또는
[홈 화면 → "오늘의 코스" 카드]
```

### 3.2 단계별 흐름

```
[1단계: 출발지 입력]
    ↓
[2단계: 위시리스트에서 오름 선택 (2~5개)]
    ↓
[3단계: 옵션 선택]
   - 제휴 상권 끼워넣기 (토글)
   - 식사 시간 고려 (토글)
    ↓
[4단계: 자동 동선 계산]
    ↓
[5단계: 코스 결과 카드]
    ↓
[6단계: 코스 활성화 또는 공유]
```

### 3.3 1단계: 출발지 입력

```
[출발지 선택 화면]

옵션:
1. 현재 위치 (기본값, GPS)
2. 저장된 거주지 (있다면)
3. 직접 입력 (검색)
   - 카카오 주소 검색 API
   - 자주 쓰는 장소 (제주공항, 대표 호텔 등) 빠른 선택

선택 후 [다음] 버튼
```

### 3.4 2단계: 오름 선택

```
[위시리스트 카드 리스트]

각 카드 우측에 체크박스:
☐ 영주산
☑ 따라비오름
☑ 다랑쉬오름
☐ 새별오름

상단:
- "선택한 오름: 2 / 5"
- 최대 5개 선택 가능
- 최소 1개 필요 (혼자만 골라도 동선 짜기 가능, 단 추가 추천 노출)

하단:
- 위시리스트가 비어있으면: "오름을 먼저 추가해주세요"
- "이 오름들로 코스 짜기" 버튼
```

### 3.5 3단계: 옵션 선택

```
[옵션 화면]

토글 옵션들:
[●] 제휴 상권 끼워넣기
    "오름 사이에 제휴 카페·식당이 자동으로 추가됩니다"

[ ] 식사 시간 고려
    "점심 시간(12~14시)에 식당이 자동 배치됩니다"

[ ] 일출/일몰 시간 우선
    "베스트 시간대에 맞춰 동선이 조정됩니다"

[ ] 휴식 시간 포함
    "각 오름 사이에 30분 휴식이 추가됩니다"

[다음] 버튼
```

### 3.6 4단계: 자동 동선 계산

```
[로딩 화면]
- 1~3초 (실제 계산 + 멋있게 보이는 시간)
- 애니메이션: "최적 동선을 계산 중..."
    ↓
[계산 완료]
```

### 3.7 동선 계산 알고리즘

#### 입력
- 출발지 좌표
- 선택된 오름 N개 (2~5개)
- 옵션 (상권 포함, 식사, 휴식 등)

#### 알고리즘 (Greedy Nearest Neighbor + 후보정)

```typescript
interface CourseStop {
  type: 'oreum' | 'merchant' | 'meal_break' | 'rest';
  oreum?: Oreum;
  merchant?: PartnerMerchant;
  arrival_time: Date;
  duration_min: number;
  travel_distance_km?: number;
  travel_duration_min?: number;
}

async function planCourse(input: CourseInput): Promise<Course> {
  // 1. 출발지에서 가장 가까운 오름부터 방문 (Greedy)
  let currentLocation = input.start;
  let currentTime = input.start_time || new Date();
  const stops: CourseStop[] = [];
  const remainingOreums = [...input.selected_oreums];

  while (remainingOreums.length > 0) {
    // 가장 가까운 오름 찾기
    const sorted = remainingOreums
      .map(o => ({
        oreum: o,
        distance: distance(currentLocation, o.location),
        // 카카오 모빌리티로 실제 운전 시간
        travel_min: await getTravelTime(currentLocation, o.location)
      }))
      .sort((a, b) => a.travel_min - b.travel_min);

    const next = sorted[0];

    // 식사 시간 체크 (옵션)
    if (input.consider_meal_time && isMealTime(currentTime)) {
      const mealMerchant = await findNearbyMealMerchant(currentLocation);
      if (mealMerchant) {
        stops.push({
          type: 'meal_break',
          merchant: mealMerchant,
          arrival_time: currentTime,
          duration_min: 60, // 점심 1시간
          travel_distance_km: distance(currentLocation, mealMerchant.location),
          travel_duration_min: await getTravelTime(currentLocation, mealMerchant.location)
        });
        currentTime = addMinutes(currentTime, 60 + travel_duration);
        currentLocation = mealMerchant.location;
      }
    }

    // 오름 추가
    stops.push({
      type: 'oreum',
      oreum: next.oreum,
      arrival_time: addMinutes(currentTime, next.travel_min),
      duration_min: next.oreum.estimated_duration_min || 60,
      travel_distance_km: next.distance,
      travel_duration_min: next.travel_min
    });

    currentTime = addMinutes(currentTime, next.travel_min + next.oreum.estimated_duration_min);
    currentLocation = next.oreum.location;

    // 제휴 상권 끼워넣기 (옵션)
    if (input.include_merchants && remainingOreums.length > 1) {
      const merchant = await findNearbyMerchant(currentLocation, {
        related_to: next.oreum.id,
        type: ['cafe']
      });
      if (merchant) {
        stops.push({
          type: 'merchant',
          merchant,
          arrival_time: currentTime,
          duration_min: 30,
          // ...
        });
        currentTime = addMinutes(currentTime, 30);
        currentLocation = merchant.location;
      }
    }

    remainingOreums.splice(remainingOreums.indexOf(next.oreum), 1);
  }

  // 2. 후보정: 너무 늦은 시간이면 경고
  // 3. 총 시간/거리 계산

  return {
    stops,
    total_distance_km: stops.reduce((s, st) => s + (st.travel_distance_km || 0), 0),
    total_duration_min: differenceInMinutes(currentTime, input.start_time)
  };
}
```

#### 알고리즘 한계와 보완

Greedy는 최적해 보장 X. 작은 N (2~5)에서는 모든 순열 시도해도 빠름:
- 5개 = 5! = 120개 순열
- 각각 거리 계산 후 최단 선택

```typescript
async function planCourseOptimal(input: CourseInput): Promise<Course> {
  if (input.selected_oreums.length <= 5) {
    // 모든 순열 시도
    const permutations = getAllPermutations(input.selected_oreums);
    const results = await Promise.all(
      permutations.map(perm => calculateRouteTime(input.start, perm))
    );
    return results.sort((a, b) => a.total_duration - b.total_duration)[0];
  } else {
    // 6개 이상은 Greedy로
    return planCourseGreedy(input);
  }
}
```

본 프로젝트는 5개 제한이므로 항상 최적 시도 가능.

### 3.8 5단계: 코스 결과 카드

```
[결과 화면]

상단 요약:
┌────────────────────────────────────┐
│  오늘의 코스                         │
│  총 4시간 30분 · 47km                │
│  3개 오름 + 1개 카페                  │
└────────────────────────────────────┘

타임라인 형태:
┌────────────────────────────────────┐
│  09:00  📍 출발 (제주공항)            │
│   │                                 │
│   │  🚗 23분 (15km)                 │
│   ↓                                 │
│  09:23  ⛰️  새별오름                 │
│   │     45분 탐방                    │
│   │                                 │
│   │  🚗 12분 (8km)                  │
│   ↓                                 │
│  10:20  ☕ 카페 오롯                  │
│   │     30분 휴식                    │
│   │                                 │
│   │  🚗 18분 (11km)                 │
│   ↓                                 │
│  11:08  ⛰️  다랑쉬오름                │
│   │     60분 탐방                    │
│   │                                 │
│   │  🚗 15분 (10km)                 │
│   ↓                                 │
│  12:23  ⛰️  따라비오름                │
│   │     60분 탐방                    │
│   ↓                                 │
│  13:23  🏁 도착                      │
└────────────────────────────────────┘

하단 액션:
[ 코스 시작 ] ← Primary
[ 공유하기 ] [ 수정하기 ] [ 저장만 ]
```

### 3.9 6단계: 코스 활용

#### A. 코스 시작 (활성화)

```
[코스 시작 버튼]
    ↓
[user_courses.is_active = true]
    ↓
[홈 탭 상단에 진행 중 코스 카드 고정]
[다음 목적지 안내]
    ↓
[각 오름 인증 시 자동으로 진척도 업데이트]
- "1/3 완료"
- 다음 목적지 강조
    ↓
[모든 오름 완료 시]
- "코스 완주!" 모먼트 애니메이션
- 코스 완주 배지 (있다면)
- SNS 공유 카드 자동 생성
```

#### B. 공유

```
[공유 버튼]
    ↓
[공유 카드 자동 생성]
- 정사각 1080x1080
- 코스 제목 + 타임라인 시각화
- "내가 짠 제주 오름 1박2일 코스"
    ↓
[채널 선택]
- 카카오톡
- 인스타그램 스토리
- 트위터
- 링크 복사 (share_token 기반)
```

#### C. 저장만

```
[저장만 버튼]
    ↓
[user_courses 저장, is_active=false]
    ↓
[마이 탭의 "내 코스" 영역에서 나중에 불러오기]
```

---

## 4. 코스 진행 화면

코스 활성화된 상태에서 보이는 화면.

### 4.1 홈 탭 상단

```
┌────────────────────────────────────┐
│ 🟢 진행 중인 코스                     │
│                                     │
│ 동부 일출 코스 · 1/3 완료              │
│                                     │
│ 다음 목적지: 다랑쉬오름                │
│ 약 18분 거리 (11km)                   │
│                                     │
│ [ 다음 길 안내 ] [ 일시 정지 ]         │
└────────────────────────────────────┘
```

### 4.2 길 안내

```
[다음 길 안내 버튼]
    ↓
[옵션]
- 카카오맵 앱 (설치 시)
- 네이버 지도 앱
- 좌표 복사
- 인앱 지도 (간단 길 안내)
```

### 4.3 코스 상태 변경

```
사용자 액션:
- "현재 위치에서 일찍 끝내기" → 진행 중 코스 종료
- "다음 목적지 건너뛰기" → 다음 다음 목적지로
- "코스 일시 정지" → 잠시 멈춤
```

### 4.4 자동 진척도 업데이트

```
[코스 활성화 + 인증 시]
    ↓
[해당 오름이 코스에 있는지 체크]
   - user_courses.oreum_ids 에 포함되는지
    ↓
[포함되면 current_step 증가]
    ↓
[모두 완료되면 completed_at 설정]
    ↓
[코스 완주 모먼트 + 배지 (해당 시)]
```

### 4.5 코스 완주 모먼트

```
[모든 오름 인증 완료]
    ↓
[모먼트 애니메이션 (3초)]
- "코스 완주!" 큰 텍스트
- 완주한 오름 카드들이 차례로 빛남
- 총 시간/거리 노출
    ↓
[코스 완주 보상]
- 활성 챌린지에 코스 완주 조건 있다면 진행도 업데이트
- SNS 공유 카드 즉시 생성
- "다른 코스도 짜보기" 추천
```

---

## 5. 코스 카드 (공유)

### 5.1 공유 URL 구조

```
https://jejuoreum.com/course/{share_token}
```

share_token: 32자 랜덤 (URL-safe Base64)

### 5.2 공유 화면 (다른 사용자가 볼 때)

```
[비로그인/타 사용자 진입]

┌────────────────────────────────────┐
│  ✨ ○○님이 추천하는 코스               │
│                                     │
│  동부 일출 코스                       │
│  3개 오름 · 약 4시간 30분              │
│                                     │
│  [지도: 코스 시각화]                  │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ 09:00 출발 (제주공항)          │   │
│  │ 09:23 새별오름 (45분)          │   │
│  │ ...                            │   │
│  └──────────────────────────────┘   │
│                                     │
│  [ 내 위시리스트에 저장 ]              │
│  [ 동선 설계 직접 해보기 ]              │
└────────────────────────────────────┘
```

### 5.3 공유 카드 이미지

```
1080x1080 정사각

상단:
- 사이트 로고
- "내가 짠 제주 오름 코스"

중앙:
- 코스 시각화 (지도 + 핀)
- 또는 오름 카드 일러스트 3~5개 가로 배치

하단:
- 핵심 정보 (총 시간, 거리)
- "○○님 추천"
- jejuoreum.com 워터마크
```

생성 방식:
- Server-side rendering (Sharp 또는 Satori 라이브러리)
- 또는 클라이언트 Canvas API

### 5.4 SEO 활용

코스 페이지(`/course/{share_token}`)도 SEO 페이지:
- 타이틀: "{코스명} - 추천 제주 오름 코스"
- 설명: "총 N시간, N km, ○개 오름"
- OG 이미지: 자동 생성된 카드 이미지

---

## 6. 데이터 모델 (재확인)

### 6.1 user_wishlist

```sql
CREATE TABLE user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  priority SMALLINT DEFAULT 0,
  added_note TEXT,
  source TEXT, -- 'ar_screen' | 'card_page' | 'recommendation' | 'manual' | 'mbti_result'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, oreum_id)
);
```

상세: `01_data_model.md` 4.4 참조.

### 6.2 user_courses

```sql
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  start_label TEXT,
  oreum_ids UUID[] NOT NULL,
  course_stops JSONB, -- 모든 stop 정보 (오름·상권·휴식 포함)
  estimated_duration_min INT,
  estimated_distance_km FLOAT,

  is_active BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_step SMALLINT DEFAULT 0,

  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  view_count BIGINT DEFAULT 0, -- 공유 시 조회수

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

`course_stops` JSONB 예시:
```json
[
  {
    "type": "oreum",
    "oreum_id": "abc-123",
    "arrival_time": "2026-05-20T09:23:00+09:00",
    "duration_min": 45,
    "travel_distance_km": 15.2,
    "travel_duration_min": 23
  },
  {
    "type": "merchant",
    "merchant_id": "xyz-456",
    "arrival_time": "2026-05-20T10:20:00+09:00",
    "duration_min": 30,
    "travel_distance_km": 7.8,
    "travel_duration_min": 12
  }
]
```

---

## 7. API 명세

### 7.1 GET /api/me/wishlist

위시리스트 조회.

**Query**:
```
?region=east|all
&tier=beginner|all
&season=spring|all
&sort=added_desc|distance|difficulty|name
&page=1&limit=30
```

**Response**:
```typescript
{
  wishlist: Array<{
    id: string;
    oreum: Oreum;
    added_at: string;
    added_note: string | null;
    distance_km?: number;
    priority: number;
  }>;
  count: number;
}
```

### 7.2 POST /api/me/wishlist

위시리스트 추가.

**Request**:
```typescript
{
  oreum_id: string;
  source?: string;
  added_note?: string;
}
```

**Response**:
```typescript
{
  wishlist_item: { /* ... */ };
  is_already_added: boolean;
}
```

### 7.3 DELETE /api/me/wishlist/{id}

위시리스트 항목 제거.

### 7.4 PATCH /api/me/wishlist/{id}

우선순위 변경.

```typescript
{ priority: number }
```

### 7.5 POST /api/courses/plan

동선 계산 (저장 X, 미리보기).

**Request**:
```typescript
{
  start: { lat: number; lng: number; label?: string };
  start_time?: string; // ISO 8601
  oreum_ids: string[];
  options: {
    include_merchants: boolean;
    consider_meal_time: boolean;
    sunrise_priority: boolean;
    include_rest: boolean;
  };
}
```

**Response**:
```typescript
{
  course: {
    stops: CourseStop[];
    total_distance_km: number;
    total_duration_min: number;
    summary: string;
  };
  alternatives?: Array<{ /* 다른 동선 옵션 */ }>;
}
```

### 7.6 POST /api/courses

코스 저장.

**Request**:
```typescript
{
  title: string;
  start: {...};
  oreum_ids: string[];
  course_stops: CourseStop[];
  is_active: boolean;
  is_public: boolean;
}
```

**Response**:
```typescript
{
  course: Course;
  share_url?: string; // is_public이면 포함
}
```

### 7.7 GET /api/courses/{share_token}

공유 코스 조회 (비로그인 가능).

```typescript
{
  course: PublicCourse;
  creator_nickname: string;
  view_count: number;
}
```

### 7.8 PATCH /api/me/courses/{id}/progress

코스 진척도 업데이트 (인증 시 자동 호출).

```typescript
{ completed_oreum_id: string }
```

**Response**:
```typescript
{
  course: Course;
  is_completed: boolean;
  next_stop: CourseStop | null;
}
```

---

## 8. 외부 서비스 연동

### 8.1 카카오 모빌리티 API

길찾기·소요 시간 계산.

```typescript
async function getTravelTime(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' = 'driving'
): Promise<{ duration_min: number; distance_km: number }> {
  const response = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?` +
    `origin=${origin.lng},${origin.lat}&` +
    `destination=${destination.lng},${destination.lat}&` +
    `priority=RECOMMEND`,
    {
      headers: {
        'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
      }
    }
  );

  const data = await response.json();
  return {
    duration_min: Math.round(data.routes[0].summary.duration / 60),
    distance_km: data.routes[0].summary.distance / 1000
  };
}
```

비용:
- 일 1만 요청까지 무료
- 한 코스 계산: 평균 4~6회 호출 (5개 오름 + 출발지)
- 일 1,500개 코스 생성 가능

### 8.2 카카오 주소 검색 API

출발지 직접 입력 시 자동완성.

```typescript
async function searchAddress(query: string) {
  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
      }
    }
  );
  return response.json();
}
```

### 8.3 캐시 전략

- 동일 출발지·목적지 조합: 결과 1시간 캐시
- 자주 쓰는 경로 (제주공항 ↔ 새별오름 등): 1일 캐시

---

## 9. 인터랙션·애니메이션

### 9.1 위시리스트 추가

```
[추가 버튼 탭]
    ↓
[하트 아이콘 채워짐 (300ms)]
- 빈 하트 → 채워진 하트
- scale: 1.0 → 1.3 → 1.0 (튕김)
    ↓
[버튼 색상 전환]
- 보더 → 채워진 배경
    ↓
[토스트 (2초)]
- "위시리스트에 추가됐어요"
- 좌측 하트 아이콘 + 메시지
```

### 9.2 위시리스트 제거 (스와이프)

```
[카드 좌측 스와이프]
    ↓
[배경 빨간색 노출 (rgba(208, 69, 69, 0.1))]
[제거 아이콘 표시]
    ↓
[일정 거리 이상 스와이프 시]
[Undo 옵션과 함께 fade out]
- 카드 height 0으로 줄어듦 (300ms)
- 다른 카드들 자리 채움
```

### 9.3 코스 계산 로딩

```
[계산 중 화면]
- 핑 애니메이션 (제주 지도 위 점들이 연결됨)
- "최적 동선을 계산 중..." 메시지
- 1~3초 사이 (실제 계산 시간 + 멋있게 보이는 시간)
```

### 9.4 코스 결과 등장

```
[로딩 완료]
    ↓
[타임라인 위에서 아래로 차례차례 등장]
- 각 stop이 100ms 간격으로 fade-in
- 도로 라인이 그려지는 효과
```

### 9.5 코스 진행 모먼트

각 오름 인증 시:

```
[코스 진행 중인 오름 인증]
    ↓
[일반 발견 모먼트]
    ↓
[추가: 코스 진척도 업데이트 모먼트]
- "1/3 완료" → "2/3 완료" 카운트 업
- 다음 목적지 카드가 강조됨
    ↓
[다음 목적지 안내 화면 자동 노출 (옵션)]
```

코스 완주 시:

```
[마지막 오름 인증]
    ↓
[코스 완주 큰 모먼트 (3초)]
- 풀 화면 오버레이
- "코스 완주!" 큰 텍스트
- 완주한 모든 오름이 별처럼 빛남
- 별이 모여서 "완주" 형태로
    ↓
[정산 화면]
- 총 소요 시간
- 총 거리
- 발견한 오름 수
- "다른 사람들과 공유하기" CTA
```

---

## 10. 다국어 처리

### 10.1 화면 텍스트

```typescript
// messages/ko.json
{
  "wishlist": {
    "empty": {
      "title": "위시리스트가 비어있어요",
      "subtitle": "가고 싶은 오름을 저장해보세요"
    },
    "added_toast": "위시리스트에 추가됐어요",
    "removed_toast": "제거했어요",
    "course_button": "오늘의 코스 짜기"
  },
  "course": {
    "step_1_title": "어디서 출발하시나요?",
    "step_2_title": "어떤 오름에 가시나요?",
    "step_3_title": "추가 옵션",
    "calculating": "최적 동선을 계산 중...",
    "result_summary": "총 {duration} · {distance}km",
    "completed_title": "코스 완주!"
  }
}
```

### 10.2 시간·거리 표시 형식

```typescript
function formatDuration(minutes: number, lang: string) {
  switch (lang) {
    case 'ko':
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
    case 'en':
      return h > 0 ? `${h}h ${m}m` : `${m} min`;
    // ...
  }
}

function formatDistance(km: number, lang: string) {
  switch (lang) {
    case 'ko':
      return `${km.toFixed(1)}km`;
    case 'en':
      return `${km.toFixed(1)} km`;
  }
}
```

---

## 11. 성능 최적화

### 11.1 위시리스트 로딩

- 첫 30개 즉시 로드 + 무한 스크롤
- 거리 계산은 클라이언트 (불필요한 서버 호출 X)
- 카드 일러스트 lazy loading

### 11.2 동선 계산 캐시

```typescript
// 동일 입력 → 동일 결과 캐싱
const cacheKey = hash({ start, oreum_ids: sortedOreumIds, options });
const cached = await redis.get(`course:${cacheKey}`);
if (cached) return JSON.parse(cached);

const result = await planCourse(input);
await redis.setex(`course:${cacheKey}`, 3600, JSON.stringify(result));
return result;
```

### 11.3 코스 카드 이미지 생성

- Server-side: Satori (React → SVG → PNG)
- 캐시: share_token 기반 영구 캐시
- 재생성: 코스 수정 시에만

---

## 12. 접근성

- 카드: `role="article"` + `aria-label`
- 체크박스: 명확한 `<input type="checkbox">` + `<label>`
- 드래그 정렬: 키보드 대안 제공 (위/아래 화살표 버튼)
- 코스 타임라인: `<ol>` 시맨틱 + `aria-current="location"` (현재 위치)

---

## 13. 분석·이벤트

| 이벤트 | 속성 |
|--------|------|
| `wishlist_added` | oreum_id, source |
| `wishlist_removed` | oreum_id |
| `wishlist_filtered` | filter_type, value |
| `course_planning_started` | from: 'wishlist' \| 'home' |
| `course_planning_options_set` | options |
| `course_calculated` | oreum_count, duration, distance |
| `course_started` | course_id |
| `course_step_completed` | course_id, step_index |
| `course_completed` | course_id, total_duration |
| `course_shared` | course_id, channel |
| `course_view_via_share` | course_id, viewer_logged_in |

KPI:
- 위시리스트 보유 사용자 비율 (목표: 60%+)
- 평균 위시리스트 항목 수
- 코스 짜기 → 활성화 전환률
- 코스 완주율 (목표: 50%+)
- 코스 공유 → 신규 가입 전환률

---

## 14. 테스트 시나리오

### 14.1 위시리스트

- 추가/제거/우선순위 변경
- 필터·정렬 정확성
- 동시에 여러 곳에서 추가 시 동기화

### 14.2 동선 설계

- 1개 오름 (출발지 → 1개 오름)
- 5개 오름 (최대치, 모든 순열)
- 옵션 조합별 결과 정확성
- 카카오 API 실패 시 fallback (직선거리 추정)

### 14.3 코스 진행

- 코스 활성화 → 인증 → 진척도 업데이트
- 코스 완주 모먼트
- 일시정지·재개·취소

### 14.4 공유 코스

- share_token 기반 비로그인 진입
- 코스 보고 가입 → 자기 위시리스트로 복사
- 만료된 코스(삭제) 처리

---

## 15. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 위시리스트 화면, 동선 설계 6단계 흐름, 알고리즘 (Greedy + 최적 순열), 코스 카드 공유, 카카오 모빌리티 연동, API 명세 | 기획+Claude |

---

## 16. 후속 작업

- 동선 알고리즘 실측 데이터로 검증 (실제 제주 코스 짜보기)
- 카카오 모빌리티 API 비용 시뮬레이션
- 코스 카드 SVG 디자인 (공유용)
- 빈 상태 일러스트
- 코스 진행 화면 와이어프레임
- 코스 공유 페이지 SEO 최적화 검토

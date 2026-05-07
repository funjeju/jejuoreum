# 20. Rhythm System

> 본 문서는 리듬 시스템의 모든 상세 명세를 정의한다.
> 사용자 간 직접 비교·랭킹을 의도적으로 배제하고,
> 본인 페이스 가시화와 협력감을 통해 건강한 게이미피케이션을 만든다.

---

## 0. 시스템 철학

### 0.1 왜 랭킹이 아닌 리듬인가

`core.md` 2.9 건강한 게이미피케이션 원칙에 근거.

**랭킹의 문제** (도입 안 함):
- 시간·자원 많은 사용자가 일반 사용자 위축
- 즐거움이 의무로 변질
- 환경 보전 가치와 충돌 (오버투어리즘 가속화)
- 본 프로젝트 정체성("직접 참여하고 기록하며 완성해가는 탐험")과 어긋남

**리듬의 가치** (도입함):
- 본인 페이스 그대로 인정
- 협력감 ("함께 다녀가는 사람들이 있다")
- 시간이 누적될수록 자기 자신과의 대화
- 시즌·계절 흐름과 자연스럽게 결합

### 0.2 핵심 결정

**도입하지 않는 것**:
- 사용자 간 발견 수 랭킹 (전국·지역·성별·연령 모두)
- 상위권 노출 리더보드
- "이번 주 1등" 같은 표시
- 점수 차감 시스템
- 누가 누구보다 더 많이 했는지 비교

**도입하는 것**:
1. **본인 페이스 가시화** — "이번 달 새로 발견한 오름 N개"
2. **오름 관점 인기도** — "이번 주 가장 많이 발견된 오름 Top 10"
3. **협력감 표시** — "234명이 함께 다녀갔어요"
4. **챌린지 참여 카운트** — "1,247명이 함께 도전 중"
5. **시즌 흐름 표시** — "지금은 가을, 단풍 시즌이에요"

### 0.3 사용자 경험 차이

**랭킹 시스템에서 사용자 경험**:
> "어제 38위였는데 오늘 42위네... 더 가야 하나"

**리듬 시스템에서 사용자 경험**:
> "이번 달 5개 다녀왔네. 234명이 함께 다녀간 오름이라니, 좋은 선택이었구나."

이게 본 프로젝트가 추구하는 정서.

---

## 1. 본인 페이스 가시화

### 1.1 표시 위치

| 화면 | 표시 내용 |
|------|---------|
| 홈 탭 (이번 달 리듬 카드) | 이번 달 새로 발견 + 협력감 |
| 도감 탭 (상단) | 발견률 + 이번 달 진행 |
| 마이 탭 (활동 영역) | 상세 리듬 통계 |
| 발견 모먼트 직후 | "이번 달 N번째 발견이에요" |

### 1.2 본인 페이스 지표

#### A. 시간 단위 발견 카운트

```
이번 달 발견: 5개
이번 주 발견: 2개
지난 7일: 2개
지난 30일: 6개
```

#### B. 다양성 점수

```
이번 달 다녀온 지역: 3 / 5 (동·서·남)
이번 달 시즌: 가을 위주
이번 달 시간대: 오전·오후 (일출 X, 일몰 X)
```

#### C. 누적 진척도

```
전체: 36 / 100 (36%)
비기너: 8 / 30 (27%)
익스플로러: 28 / 70 (40%)
```

#### D. 이번 시즌 흐름

```
이번 가을 시즌 (9~11월)
- 14일 동안 4개 발견
- 이전 가을 시즌 대비 +1개
- (단순 비교, 우열 X)
```

### 1.3 메시지 톤

긍정적·중립적, 비난·압박 X.

좋은 예:
- "이번 달 5개의 새로운 오름을 발견했어요"
- "꾸준히 모으고 계시네요"
- "사계절 모두 다녀왔어요!"

피할 표현:
- "더 빨리 모아야 해요" (압박)
- "지난달보다 줄었어요" (부정)
- "다른 사람들은 더 많이 갔어요" (비교)

### 1.4 빈 활동 처리

이번 달 발견 0개일 때:
- 비난 X
- 단순 안내: "이번 달은 잠시 쉬어가는 시간이군요"
- 추천: "다음 추천 오름은 ○○오름이에요"

---

## 2. 오름 관점 인기도

### 2.1 핵심 컨셉

**사람을 등수 매기지 않고, 오름을 등수 매긴다.**

- "○○님이 이번 주 1등" ❌
- "○○오름이 이번 주 가장 많이 발견됐어요" ✓

이렇게 하면 사람 간 경쟁 없이 활기 있는 정보 제공.

### 2.2 표시 위치

| 화면 | 표시 내용 |
|------|---------|
| 홈 탭 추천 영역 | "이번 주 인기 오름" 카드 |
| 카드 페이지 | "이번 주 인기" 라벨 (해당 시) |
| 별도 인기 페이지 | Top 10 리스트 |

### 2.3 데이터 정의

#### 이번 주 가장 많이 발견된 오름

```sql
SELECT
  o.id, o.slug, o.name_ko, o.illustration_url,
  COUNT(ud.id) AS week_discovery_count
FROM oreums o
LEFT JOIN user_discoveries ud ON ud.oreum_id = o.id
  AND ud.discovered_at >= date_trunc('week', now())
WHERE o.is_published = true AND o.is_top_100 = true
GROUP BY o.id
ORDER BY week_discovery_count DESC
LIMIT 10;
```

#### 이번 달 가장 많이 발견된 오름

```sql
SELECT
  o.id, o.slug, o.name_ko, o.illustration_url,
  COUNT(ud.id) AS month_discovery_count
FROM oreums o
LEFT JOIN user_discoveries ud ON ud.oreum_id = o.id
  AND ud.discovered_at >= date_trunc('month', now())
WHERE o.is_published = true AND o.is_top_100 = true
GROUP BY o.id
ORDER BY month_discovery_count DESC
LIMIT 10;
```

### 2.4 표시 사양

```
[홈 탭의 "이번 주 인기 오름" 카드]

배경: --white
보더: 1px solid --neutral-200
모서리: --radius-md
패딩: --space-4

헤딩: "이번 주 인기 오름"
(14px, weight 600, --neutral-900)
부제: "지금 많은 사람들이 다녀가는 곳"
(12px, --neutral-700)

가로 스크롤 카드 (3~5개):
[작은 카드 - 일러스트 + 이름]
- 각 카드 130x150px
- 카드 하단 미니 정보:
  · "○○○명 다녀감"
  · 발견자 절대 수 표시 (등수 X)
```

**중요**: 1위, 2위 같은 등수 표시 X. 단순히 "많이 다녀간 곳" 형태.

### 2.5 카드 페이지 라벨

```
[해당 오름이 이번 주 인기 Top 10에 들어가면]

[작은 라벨 노출]
"🔥 이번 주 인기"
- 카드 비주얼 영역 우상단 또는 메타 정보 옆
- --brand-green-100 배경, --brand-green-800 텍스트
```

자동 갱신 (1시간마다 또는 새 발견 시).

---

## 3. 협력감 표시

### 3.1 핵심 메시지

각 오름마다:
- "지난 30일간 ○○명이 다녀갔어요"
- "이번 달 ○○명이 다녀갔어요"
- "지금까지 ○○명이 다녀간 오름"

### 3.2 표시 위치

| 화면 | 메시지 |
|------|--------|
| 카드 페이지 (메타 영역) | "지난 30일 234명이 다녀갔어요" |
| 발견 모먼트 직후 | "234명이 함께 ○○오름을 다녀갔어요" |
| 홈 탭 추천 영역 | (옵션) "234명이 함께한 곳" |

### 3.3 메시지 작성 가이드

```typescript
function getCompanionshipMessage(oreum: Oreum, lang: string) {
  const visitors30d = oreum.companionship.recent_30d_visitors;
  const visitors7d = oreum.companionship.recent_7d_visitors;
  const total = oreum.companionship.total_visitors;

  // 우선순위: 최근 → 누적
  if (visitors7d >= 50) {
    return `이번 주 ${visitors7d}명이 다녀갔어요`;
  } else if (visitors30d >= 100) {
    return `지난 30일간 ${visitors30d}명이 다녀갔어요`;
  } else if (visitors30d >= 10) {
    return `최근 ${visitors30d}명이 다녀갔어요`;
  } else if (total >= 100) {
    return `지금까지 ${total}명이 다녀간 곳이에요`;
  } else {
    return null; // 노출 안 함 (방문자 너무 적으면)
  }
}
```

### 3.4 노출 조건

협력감 메시지는 **충분한 데이터가 있을 때만** 노출:
- 최소 임계값: 30일 누적 10명 이상
- 신생 오름 (방문자 거의 없음): 노출 X
- 비100선 오름: 노출 X (혼란 회피)

### 3.5 발견 모먼트와 결합

```
[발견 모먼트 직후]

기본 메시지:
"○○오름을 발견했어요!"

추가 메시지 (협력감):
"234명이 함께 다녀간 오름이에요"

또는 시즌:
"이번 가을 87명이 다녀간 오름이에요"
```

이 메시지가 사용자에게 "혼자가 아니다"는 감각을 만든다.

---

## 4. 챌린지 참여 카운트

### 4.1 표시 형식

```
"현재 1,247명이 도전 중"
"234명이 완주했어요"
```

### 4.2 표시 위치

| 화면 | 메시지 |
|------|--------|
| 챌린지 카드 (목록) | "1,247명이 도전 중" |
| 챌린지 상세 페이지 | "현재 1,247명이 함께 도전 중 / 234명 완주" |
| 챌린지 완주 모먼트 | "당신은 234번째 완주자" (등수 X, 단순 표시) |

### 4.3 데이터

```sql
CREATE VIEW challenge_participation AS
SELECT
  challenge_id,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) AS total_participants
FROM user_challenges
GROUP BY challenge_id;
```

### 4.4 메시지 톤

- "234번째 완주자입니다" → 단순 사실 표시
- "234번째로 완주했습니다" → 순서 강조 X
- 의미: "당신이 N번째로 완주한 큰 흐름의 일부"

비교가 아닌 **순서·맥락**.

---

## 5. 시즌 흐름 표시

### 5.1 시즌 인사

홈 탭 인사말 영역에 시즌 컨텍스트:

```
시간대 + 시즌 결합 인사:

"가을의 오후, 단풍이 절정이에요 🍁"
"겨울의 새벽, 따뜻한 차 한 잔이 어울려요 🌅"
"봄의 오전, 새로운 시작에 좋은 날 🌸"
```

시즌별 추천:
- 봄: 벚꽃·진달래 명소
- 여름: 시원한 그늘 코스
- 가을: 단풍 명소 (가장 인기)
- 겨울: 일출 명소 (사람 적음)

### 5.2 시즌 진행도

```
[홈 탭 한 영역]

"이번 가을 시즌 (9~11월)
당신은 4개의 오름을 다녀왔어요"

[부드러운 진행 바]
[관련 챌린지 카드]
```

### 5.3 시즌 베스트 오름

```sql
SELECT * FROM oreums
WHERE recommended_seasons @> ARRAY[$current_season]::text[]
  AND is_top_100 = true
ORDER BY 
  -- 다른 사용자들이 이번 시즌에 많이 다녀갔는지
  (SELECT COUNT(*) FROM user_discoveries
   WHERE oreum_id = oreums.id
     AND discovered_at >= date_trunc('season', now())) DESC
LIMIT 5;
```

### 5.4 시즌 전환 알림

```
[새 시즌 시작 (3/6/9/12월 1일)]
    ↓
[푸시 알림 (옵션)]
"가을이 시작됐어요. 단풍 명소가 기다립니다 🍁"

[홈 탭 시즌 카드 갱신]
- 시즌별 다른 일러스트
- 시즌별 추천 오름
```

---

## 6. 데이터 모델

### 6.1 View 명세 (재확인)

`01_data_model.md` 8.5에서 정의된 view들:

#### user_monthly_rhythm

```sql
CREATE VIEW user_monthly_rhythm AS
SELECT
  user_id,
  COUNT(*) FILTER (
    WHERE discovered_at >= date_trunc('month', now())
  ) AS this_month_discoveries,
  COUNT(*) FILTER (
    WHERE discovered_at >= date_trunc('week', now())
  ) AS this_week_discoveries,
  COUNT(DISTINCT (
    SELECT region FROM oreums WHERE id = oreum_id
  )) FILTER (
    WHERE discovered_at >= date_trunc('month', now())
  ) AS this_month_regions
FROM user_discoveries
GROUP BY user_id;
```

#### oreum_weekly_popularity

```sql
CREATE VIEW oreum_weekly_popularity AS
SELECT
  o.id AS oreum_id,
  o.slug,
  o.name_ko,
  COUNT(ud.id) AS week_discovery_count,
  COUNT(DISTINCT ud.user_id) AS week_unique_users
FROM oreums o
LEFT JOIN user_discoveries ud ON ud.oreum_id = o.id
  AND ud.discovered_at >= date_trunc('week', now())
WHERE o.is_published = true
GROUP BY o.id, o.slug, o.name_ko;
```

#### oreum_companionship

```sql
CREATE VIEW oreum_companionship AS
SELECT
  oreum_id,
  COUNT(DISTINCT user_id) AS recent_30d_visitors,
  COUNT(DISTINCT user_id) FILTER (
    WHERE discovered_at >= date_trunc('week', now())
  ) AS recent_7d_visitors,
  COUNT(DISTINCT user_id) FILTER (
    WHERE discovered_at >= date_trunc('day', now())
  ) AS today_visitors
FROM user_discoveries
WHERE discovered_at >= now() - interval '30 days'
GROUP BY oreum_id;
```

#### challenge_participation

```sql
CREATE VIEW challenge_participation AS
SELECT
  challenge_id,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) AS total_participants
FROM user_challenges
GROUP BY challenge_id;
```

### 6.2 시즌 통계 (페이즈 2)

시즌별 집계가 자주 필요하면 별도 Materialized View:

```sql
CREATE MATERIALIZED VIEW oreum_seasonal_popularity AS
SELECT
  oreum_id,
  EXTRACT(YEAR FROM discovered_at) AS year,
  CASE
    WHEN EXTRACT(MONTH FROM discovered_at) IN (3,4,5) THEN 'spring'
    WHEN EXTRACT(MONTH FROM discovered_at) IN (6,7,8) THEN 'summer'
    WHEN EXTRACT(MONTH FROM discovered_at) IN (9,10,11) THEN 'autumn'
    ELSE 'winter'
  END AS season,
  COUNT(*) AS discovery_count
FROM user_discoveries
GROUP BY oreum_id, year, season;

CREATE INDEX ON oreum_seasonal_popularity(oreum_id, year, season);

-- 매일 새벽 갱신
REFRESH MATERIALIZED VIEW oreum_seasonal_popularity;
```

---

## 7. 컴포넌트 명세

### 7.1 이번 달 리듬 카드 (홈 탭)

```typescript
function MonthlyRhythmCard({ userId }) {
  const { data } = useQuery({
    queryKey: ['rhythm', userId],
    queryFn: () => fetchUserRhythm(userId)
  });

  if (!data) return <Skeleton />;

  return (
    <Card className="bg-brand-green-50 p-4 rounded-md">
      <h3 className="text-sm font-semibold text-brand-green-800">
        ⭐ 이번 달 리듬
      </h3>

      <div className="mt-3 space-y-2">
        <Stat
          label="새로 발견한 오름"
          value={data.this_month_discoveries}
          unit="개"
          subtext={`이번 주: ${data.this_week_discoveries}개`}
        />

        <Stat
          label="다녀온 지역"
          value={data.this_month_regions}
          total={5}
          unit="개"
        />
      </div>

      {data.last_oreum_companionship && (
        <p className="mt-3 text-xs text-neutral-700">
          {data.last_oreum_companionship.visitor_count}명이 함께
          {data.last_oreum_companionship.oreum_name}을 다녀갔어요
        </p>
      )}
    </Card>
  );
}
```

### 7.2 이번 주 인기 오름 카드 (홈 탭)

```typescript
function PopularOreumsCard() {
  const { data } = useQuery({
    queryKey: ['weekly-popular'],
    queryFn: fetchWeeklyPopular
  });

  return (
    <Card>
      <header>
        <h3>이번 주 인기 오름</h3>
        <p>지금 많은 사람들이 다녀가는 곳</p>
      </header>

      <ScrollArea horizontal>
        {data?.oreums.map(oreum => (
          <OreumMiniCard key={oreum.id} oreum={oreum}>
            {/* 등수 표시 X */}
            <p className="text-xs">{oreum.week_discovery_count}명 다녀감</p>
          </OreumMiniCard>
        ))}
      </ScrollArea>
    </Card>
  );
}
```

### 7.3 협력감 메시지 컴포넌트 (카드 페이지)

```typescript
function CompanionshipMessage({ oreum }) {
  const message = getCompanionshipMessage(oreum, currentLang);
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-700">
      <Icon name="users" size={14} />
      <span>{message}</span>
    </div>
  );
}
```

### 7.4 챌린지 참여 카운트

```typescript
function ChallengeParticipantCount({ challenge }) {
  const { in_progress, completed } = challenge.participation;

  return (
    <div className="text-sm text-neutral-700">
      <span className="font-semibold text-brand-green-800">
        {in_progress.toLocaleString()}명
      </span>
      이 함께 도전 중
      {completed > 0 && (
        <span className="ml-2 text-xs text-neutral-500">
          ({completed}명 완주)
        </span>
      )}
    </div>
  );
}
```

### 7.5 시즌 인사

```typescript
function SeasonalGreeting() {
  const hour = new Date().getHours();
  const month = new Date().getMonth();

  const timeOfDay = getTimeOfDay(hour); // 'dawn' | 'morning' | ...
  const season = getSeason(month);     // 'spring' | 'summer' | ...

  const greeting = getGreeting(timeOfDay, season, currentLang);

  return (
    <div className="px-4 py-3">
      <p className="text-base font-medium">{greeting}</p>
    </div>
  );
}

function getGreeting(timeOfDay: string, season: string, lang: string) {
  // 시즌 + 시간대 조합
  const messages = {
    'autumn-afternoon-ko': '가을의 오후, 단풍이 절정이에요 🍁',
    'winter-dawn-ko': '겨울의 새벽, 따뜻한 차 한 잔이 어울려요 🌅',
    // ... (총 5 시간대 × 4 시즌 × 언어 = 80개)
  };

  return messages[`${season}-${timeOfDay}-${lang}`]
    || messages[`default-${lang}`];
}
```

---

## 8. API 명세

### 8.1 GET /api/me/rhythm

본인 리듬 데이터.

**Response**:
```typescript
{
  this_month_discoveries: number;
  this_week_discoveries: number;
  this_month_regions: number;
  total_regions: number;

  this_season: {
    name: 'spring' | 'summer' | 'autumn' | 'winter';
    started_at: string;
    discoveries_this_season: number;
  };

  last_oreum_companionship?: {
    oreum_id: string;
    oreum_name: string;
    visitor_count: number;
  };

  diversity: {
    regions_visited: string[];
    seasons_visited: string[];
    times_visited: string[];
  };
}
```

### 8.2 GET /api/oreums/popular

이번 주/달 인기 오름.

**Query**:
```
?period=week|month
&limit=10
&exclude_discovered=true|false (사용자별)
```

**Response**:
```typescript
{
  oreums: Array<{
    oreum: Oreum;
    discovery_count: number;
    unique_users: number;
  }>;
  period_label: string; // "이번 주" | "이번 달"
}
```

### 8.3 GET /api/oreums/{slug}/companionship

특정 오름의 협력감 데이터.

**Response**:
```typescript
{
  recent_30d_visitors: number;
  recent_7d_visitors: number;
  today_visitors: number;
  total_visitors: number;
  is_popular_this_week: boolean; // 이번 주 Top 10 포함 여부
  message: string; // 자동 생성 메시지
}
```

### 8.4 GET /api/seasonal-recommendations

시즌별 추천 오름.

**Response**:
```typescript
{
  current_season: string;
  recommendations: Array<Oreum>;
  greeting: string;
}
```

---

## 9. 인터랙션·애니메이션

### 9.1 발견 모먼트 후 협력감

```
[발견 모먼트 끝난 후]
    ↓
[배지 모먼트 (있다면)]
    ↓
[협력감 메시지 fade-in]
"234명이 함께 ○○오름을 다녀갔어요"
- 작은 박스, 부드러운 애니메이션
- 3초 자동 닫힘
```

### 9.2 리듬 카드 진입 애니메이션

```
[홈 탭 진입]
    ↓
[리듬 카드 fade + slide up]
- duration 400ms
- 숫자 카운트 애니메이션 (0 → 5)
```

### 9.3 인기 오름 카드 호버 (데스크탑)

```
[카드에 마우스 오버]
    ↓
[scale 1.02 + shadow 강조]
    ↓
["이 오름 보기" 버튼 fade-in]
```

---

## 10. 다국어 처리

### 10.1 메시지 다국어

```typescript
{
  "rhythm": {
    "monthly_card": {
      "title": "이번 달 리듬",
      "discoveries_label": "새로 발견한 오름",
      "regions_label": "다녀온 지역",
      "this_week_subtext": "이번 주: {count}개"
    },
    "popular_oreums": {
      "title": "이번 주 인기 오름",
      "subtitle": "지금 많은 사람들이 다녀가는 곳",
      "visitors": "{count}명 다녀감"
    },
    "companionship": {
      "this_week_high": "이번 주 {count}명이 다녀갔어요",
      "month_30d": "지난 30일간 {count}명이 다녀갔어요",
      "recent": "최근 {count}명이 다녀갔어요",
      "all_time": "지금까지 {count}명이 다녀간 곳이에요"
    },
    "challenge_participation": "{count}명이 함께 도전 중",
    "seasonal_greeting": {
      "spring_morning": "봄의 오전, 새로운 시작에 좋은 날 🌸",
      "autumn_afternoon": "가을의 오후, 단풍이 절정이에요 🍁"
    }
  }
}
```

### 10.2 숫자 형식

```typescript
function formatNumber(num: number, lang: string) {
  switch (lang) {
    case 'ko': return num.toLocaleString('ko-KR'); // "1,247"
    case 'en': return num.toLocaleString('en-US'); // "1,247"
    case 'ja': return num.toLocaleString('ja-JP');
    case 'zh': return num.toLocaleString('zh-CN');
  }
}
```

대규모 숫자 (1만+):
- 한국어: "1만 247명" 또는 "1,247명"
- 영어: "1.2K" or "1,247"

페이즈 1: 단순 콤마 형식. 페이즈 2 이후 현지화 강화.

---

## 11. 분석·KPI

### 11.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `rhythm_card_viewed` | this_month_count |
| `popular_oreums_viewed` | period |
| `popular_oreum_clicked` | oreum_id, rank |
| `companionship_message_viewed` | oreum_id, visitor_count |
| `seasonal_greeting_shown` | season, time_of_day |
| `challenge_participation_viewed` | challenge_id |

### 11.2 KPI

본 시스템의 효과는 **간접적**:
- 직접 측정: 사용자 만족도 (정성적)
- 간접 측정:
  - 재방문 빈도 (리듬을 보러 들어오는가)
  - 챌린지 참여율 (협력감이 동기 부여하는가)
  - 평균 세션 길이 (콘텐츠 가치)
  - 푸시 알림 ON 비율 (시즌 알림 받고 싶은가)

### 11.3 검증 가설

페이즈 2 검증할 가설:

**가설 1**: "리듬 시스템이 랭킹보다 사용자 만족도 높다"
- 검증: 사용자 설문 (NPS)
- 비교: 다른 게이미피케이션 앱 만족도

**가설 2**: "협력감 메시지가 발견 동기를 높인다"
- 검증: A/B 테스트 (페이즈 2)
- 메시지 노출 그룹 vs 미노출 그룹의 후속 발견 비율

**가설 3**: "시즌 추천이 발견 분포를 균형 있게 만든다"
- 검증: 시즌별 발견 패턴 분석
- 가을 단풍 시즌 외 다른 시즌 활동도 활성화되는지

---

## 12. 잠재적 진화 (페이즈 3+)

### 12.1 친구 단위 리듬 (페이즈 3)

```
[친구 시스템 도입 후]

"이번 달 친구들이 다녀간 오름"
- 친구별 발견 횟수 (전체 통계 X, 친구별 표시 O)

"친구가 추천한 코스"
- 친구의 활성 코스 가져와서 본인용 변형
```

친구 단위는 협력감의 자연스러운 확장.

### 12.2 시계열 비교 (페이즈 3)

본인 데이터의 시계열:
- "작년 가을 vs 올해 가을" (본인 활동만)
- "지난 1년 가장 많이 다녀간 시즌"

본인과의 비교는 OK. 다른 사람과 비교 X.

### 12.3 그룹 페이스 (페이즈 4)

팀 시스템 도입 시:
- "우리 팀이 이번 달 다녀간 오름들"
- "팀이 함께 도전 중인 챌린지"

팀 간 비교는 도입 X. 팀 내 협력감만.

---

## 13. 구현 우선순위 (페이즈 1)

### 13.1 출시 시점에 포함

✅ 본인 페이스 (이번 달/주 발견 카운트)
✅ 다양성 점수 (지역 분포)
✅ 협력감 메시지 (오름 페이지)
✅ 이번 주 인기 오름 카드
✅ 시즌 인사 메시지
✅ 챌린지 참여 카운트

### 13.2 페이즈 2 추가

- 시즌 흐름 상세 (지난 시즌 비교)
- 시즌 전환 푸시 알림
- 친구 단위 리듬 (페이즈 3)

### 13.3 미도입

❌ 사용자 간 랭킹
❌ "이번 주 1등" 표시
❌ 동네별·성별 비교
❌ 점수 차감

---

## 14. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 본인 페이스 가시화, 오름 관점 인기도, 협력감 표시, 챌린지 참여 카운트, 시즌 흐름, view 명세, 컴포넌트 사양, API 명세, KPI | 기획+Claude |

---

## 15. 후속 작업

- 리듬 카드 디자인 시안 (Figma)
- 협력감 메시지 톤 검토 (5~10개 변형 작성)
- 시즌 인사말 5×4 매트릭스 작성 (시간대×시즌)
- 인기 오름 갱신 주기 결정 (1시간 vs 실시간)
- A/B 테스트 설계 (페이즈 2 검증 가설)
- View 성능 측정 (사용자 1만+ 시점)

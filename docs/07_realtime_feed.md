# 07. Realtime Feed

> 본 문서는 실시간 인증 피드 시스템의 모든 명세를 정의한다.
> "지금 누군가 오름에 오르고 있다"는 살아있는 감각을 만들면서도 사용자 사생활을 보호하는 균형을 잡는다.

---

## 0. 시스템 철학

### 0.1 피드의 역할

실시간 피드는 본 프로젝트에 다음 가치를 만든다:

- **살아있는 감각**: "지금 누군가 다녀가고 있다"는 활기
- **재방문 동기**: "지금은 어떨까" 호기심
- **협력감**: 같은 오름에 다녀온 사람들과의 연결감
- **추천 시스템 보조**: 인기 오름 자동 노출

### 0.2 사생활 보호와의 균형

피드는 잘못 만들면 **스토킹·사생활 침해 도구**가 된다. 본 프로젝트의 핵심 결정:

- **3단계 공개 옵션**: 즉시 / 10분 딜레이 / 비공개
- **기본값은 10분 딜레이** (현장 노출 위험 최소)
- **정확 시간 노출 X**: "방금 전" / "5분 전"으로 표시
- **정확 좌표 노출 X**: 오름 단위까지만
- **사용자 설정 우선**: 인증마다 별도 옵션도 가능

### 0.3 핵심 결정

- **기본 공개 옵션**: 10분 딜레이 (사용자 설정으로 변경 가능)
- **익명 옵션**: 닉네임 대신 "익명의 등산가" 노출
- **랭킹 X**: 누가 가장 많이 인증했는지 같은 비교 노출 X
- **이벤트 종류**: 발견·배지·챌린지 완주

---

## 1. 피드 화면 구조

### 1.1 피드 진입점

| 진입점 | 컨텍스트 |
|--------|---------|
| 홈 탭 하단 "활동 피드" 영역 | 짧은 미리보기 |
| 별도 피드 화면 (`/feed`) | 전체 피드 |
| 카드 페이지 "이 오름의 최근 방문" | 해당 오름만 |

### 1.2 메인 피드 화면 (`/feed`)

```
┌────────────────────────────────────┐
│  [상단 헤더: 활동 피드]              │ ← 56px
├────────────────────────────────────┤
│                                    │
│  [필터 칩]                          │ ← 44px
│  [ 전체 ] [ 발견 ] [ 배지 ] [ 챌린지 ]│
│                                    │
│  [지역 칩 (옵션)]                    │ ← 44px
│  [ 전체 ] [ 동 ] [ 서 ] [ 남 ] ...  │
│                                    │
├────────────────────────────────────┤
│                                    │
│  [실시간 피드 항목들]                │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ⛰️  ○○○ 다녀감                 │  │
│  │     다랑쉬오름 · 5분 전          │  │
│  │     [작은 일러스트]              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🏅  □□□ 배지 획득              │  │
│  │     "비기너 마스터" · 12분 전    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ⛰️  익명의 등산가 다녀감         │  │
│  │     새별오름 · 23분 전          │  │
│  │     [작은 일러스트]              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 🎯  ○○○ 챌린지 완주             │  │
│  │     "동부 일출 3선" · 38분 전    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ...                                │
│                                    │
└────────────────────────────────────┘
        ↓ 하단 탭바
```

### 1.3 피드 항목 사양

#### 발견 이벤트 카드

```
높이: 80px
배경: --white
보더: 0.5px solid --neutral-200
모서리: --radius-md (12px)
패딩: --space-3
gap (좌우 요소 간): --space-3

좌측: 작은 일러스트 (오름 카드)
- 56×56, 모서리 --radius-sm (6px)

중앙: 정보
- 이벤트 라벨: "○○○ 다녀감" (또는 "익명의 등산가 다녀감")
  · 14px, weight 500
  · 사용자 닉네임 강조 (--brand-green-800, weight 600)
- 오름 이름: 13px, --neutral-700
- 시간 표시: 12px, --neutral-500
  · "방금 전" / "5분 전" / "12분 전" / "1시간 전"

우측 (옵션): 액션 점
- 더보기 점 ⋯
- 신고 / 숨기기 옵션

탭 시: /oreum/{slug} 진입
```

#### 배지 획득 이벤트 카드

```
좌측: 배지 일러스트 (56×56, 작게)
중앙:
- "○○○ 배지 획득" 또는 "익명의 등산가 배지 획득"
- 배지 이름: "비기너 마스터" 강조
- 시간

탭 시: 마이 탭 (본인 배지) 또는 배지 정보 모달
```

#### 챌린지 완주 이벤트 카드

```
좌측: 챌린지 커버 이미지 (56×56)
중앙:
- "○○○ 챌린지 완주"
- 챌린지 이름: "동부 일출 3선"
- 참여자 수 (옵션): "234명과 함께 완주"
- 시간

탭 시: 챌린지 상세 페이지
```

### 1.4 무한 스크롤

- 한 번에 로드: 20개
- 스크롤 90% 도달 시 다음 20개 로드
- 새 이벤트 자동 갱신 (페이지 상단으로 슬라이드인, 옵션)
- 풀 투 리프레시: 최신 이벤트 즉시 갱신

### 1.5 빈 상태

```
[일러스트: 빈 화면]
"아직 활동이 없어요"
"오늘 첫 인증을 남겨보세요"
[ GPS 인증 시작 ]
```

---

## 2. 사용자 공개 옵션

### 2.1 3단계 공개 정책

| 옵션 | 동작 | 사용 케이스 |
|------|------|-----------|
| **즉시 공개** (`instant`) | 인증 즉시 피드 노출 | 활발히 활동하는 사용자 |
| **10분 딜레이** (`delay_10min`) | 10분 뒤 노출 (기본값) | 일반 사용자 |
| **비공개** (`private`) | 피드 노출 X | 사생활 우선 사용자 |

### 2.2 기본값 결정 근거

**기본값: 10분 딜레이**

- **즉시 공개를 기본으로 X**: 사용자가 "어디 있는지" 실시간 노출은 사생활 침해
- **비공개를 기본으로 X**: 피드가 비어버려 시스템 가치 X
- **10분 딜레이가 균형점**: 현장 노출 위험은 작고, "방금 전" 활기는 유지

### 2.3 사용자 설정 위치

```
[마이 탭 → 설정 → 피드 공개 설정]

옵션:
○ 즉시 공개
● 10분 후 공개 (기본)
○ 비공개

[저장]
```

### 2.4 인증별 개별 옵션

```
[인증 직후 화면 옵션 영역]

기본값: 사용자 설정 따름

개별 변경 가능:
☐ 이번 인증만 즉시 공개
☐ 이번 인증만 비공개

[발견 모먼트 진행]
```

이 옵션은 user_discoveries.visibility에 별도 저장되며, 사용자 설정과 다르게 적용됨.

### 2.5 익명 옵션

```
[설정 → 익명 모드]
○ 닉네임으로 노출 (기본)
● 익명으로 노출

활성화 시:
- 피드에 "익명의 등산가" 표시
- 다국어: "Anonymous Hiker" / "匿名のハイカー"
- 자기 이름은 본인 마이 탭에서만 보임
```

---

## 3. 데이터 모델

### 3.1 feed_events 테이블

`01_data_model.md` 6.1 참조.

```sql
CREATE TABLE feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
    -- 'discovery' | 'badge_earned' | 'challenge_completed'
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID REFERENCES oreums(id),
  badge_id UUID REFERENCES badges(id),
  challenge_id UUID REFERENCES challenges(id),
  course_id UUID REFERENCES user_courses(id),

  -- 공개 시점 제어 (핵심)
  occurred_at TIMESTAMPTZ NOT NULL,
  publish_at TIMESTAMPTZ NOT NULL,
    -- delay_10min 사용자: occurred_at + 10min
    -- instant: occurred_at
    -- private: 매우 먼 미래 (또는 row 자체 미생성)
  visibility TEXT NOT NULL DEFAULT 'public',
    -- 'public' | 'private'
  is_anonymous BOOLEAN DEFAULT false,

  -- 캐시된 정보 (피드 빠른 노출용, JOIN 회피)
  user_nickname TEXT,
  user_avatar_url TEXT,
  oreum_name TEXT,
  oreum_slug TEXT,
  oreum_illustration_url TEXT,
  badge_name TEXT,
  badge_icon_url TEXT,
  challenge_title TEXT,
  challenge_cover_url TEXT,

  region TEXT, -- 지역 필터용

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_events_publish ON feed_events(publish_at DESC, visibility)
  WHERE visibility = 'public';
CREATE INDEX idx_feed_events_user ON feed_events(user_id);
CREATE INDEX idx_feed_events_oreum ON feed_events(oreum_id);
CREATE INDEX idx_feed_events_region ON feed_events(region);
CREATE INDEX idx_feed_events_type ON feed_events(event_type);
```

### 3.2 인덱스 전략

피드 쿼리는 `publish_at <= now() AND visibility='public'` 형식이 대부분.
이 조건의 인덱스가 가장 중요.

```sql
-- 가장 중요한 쿼리 패턴
SELECT * FROM feed_events
WHERE publish_at <= now()
  AND visibility = 'public'
ORDER BY publish_at DESC
LIMIT 20;
```

부분 인덱스(`WHERE visibility='public'`)로 비공개 row 제외하여 효율적.

### 3.3 캐시된 컬럼 사용 이유

`oreum_name`, `user_nickname` 등을 JOIN 없이 컬럼에 저장:
- 피드는 매우 자주 호출됨 (홈 화면, 별도 피드 탭)
- JOIN 비용을 회피
- 단, 사용자가 닉네임을 변경해도 과거 피드는 옛 닉네임으로 표시 (의도적)

---

## 4. 피드 이벤트 생성

### 4.1 생성 시점

**발견 이벤트** (`event_type='discovery'`):
- `POST /api/discoveries` 트랜잭션 내
- 사용자 설정에 따라 `publish_at`, `visibility` 결정

**배지 이벤트** (`event_type='badge_earned'`):
- 배지 획득 트리거 함수 내 (`11_badge_challenge.md` 1.5)

**챌린지 완주 이벤트** (`event_type='challenge_completed'`):
- 챌린지 진행도 업데이트 시 완료 판정 시점

### 4.2 publish_at 계산 로직

```typescript
async function calculatePublishTime(
  userId: string,
  occurredAt: Date,
  individualOverride?: 'instant' | 'delay_10min' | 'private'
): Promise<{ publish_at: Date; visibility: 'public' | 'private' }> {
  const userSettings = await getUserSettings(userId);

  const effectiveSetting = individualOverride ?? userSettings.feed_visibility;

  switch (effectiveSetting) {
    case 'instant':
      return { publish_at: occurredAt, visibility: 'public' };

    case 'delay_10min':
      return {
        publish_at: new Date(occurredAt.getTime() + 10 * 60 * 1000),
        visibility: 'public'
      };

    case 'private':
      return {
        publish_at: new Date('9999-12-31'), // 사실상 노출 안 됨
        visibility: 'private'
      };

    default:
      return {
        publish_at: new Date(occurredAt.getTime() + 10 * 60 * 1000),
        visibility: 'public'
      };
  }
}
```

### 4.3 이벤트 생성 트랜잭션

```typescript
// 발견 시
await db.$transaction(async (tx) => {
  // user_discoveries 삽입
  const discovery = await tx.userDiscoveries.create({...});

  // feed_events 삽입
  const { publish_at, visibility } = await calculatePublishTime(
    userId, discovery.discovered_at, req.visibility
  );

  // 캐시 데이터 미리 fetch
  const oreum = await tx.oreums.findUnique({ where: { id: req.oreum_id }});
  const user = await tx.users.findUnique({ where: { id: userId }});

  await tx.feedEvents.create({
    data: {
      event_type: 'discovery',
      user_id: userId,
      oreum_id: req.oreum_id,
      occurred_at: discovery.discovered_at,
      publish_at,
      visibility,
      is_anonymous: userSettings.is_anonymous,
      // 캐시 데이터
      user_nickname: user.nickname,
      user_avatar_url: user.avatar_url,
      oreum_name: oreum.name_ko,
      oreum_slug: oreum.slug,
      oreum_illustration_url: oreum.card_illustration_url,
      region: oreum.region
    }
  });

  // 배지·챌린지 트리거 (각자 자기 feed_event 생성)
});
```

### 4.4 사용자 설정 변경 시

사용자가 공개 설정을 변경해도 **이미 생성된 feed_events는 변경되지 않음**.

이유:
- 변경의 일관성: 사용자가 옵션을 자주 바꿔도 시스템이 명확
- 단순성: 과거 row 일괄 업데이트 X
- 신뢰: 한번 노출된 것을 회수하지 않음

이미 노출된 이벤트를 비공개로 만들고 싶으면 별도 "내 활동 숨기기" 기능 (페이즈 2).

---

## 5. 실시간 갱신 메커니즘

### 5.1 두 가지 접근

| 방법 | 장점 | 단점 |
|------|------|------|
| **폴링** (Polling) | 단순, 디버깅 쉬움 | 과도한 요청 |
| **Supabase Realtime** (WebSocket) | 진짜 실시간 | 연결 비용, 복잡도 |

### 5.2 본 프로젝트의 결정

**페이즈 1**: 폴링 30초 간격
- 단순하게 시작
- 사용자 부담 X
- "30초 전 활동" 정도면 충분히 실시간 느낌

**페이즈 2**: Supabase Realtime 도입 검토
- 사용자 1만+ 시점
- 진짜 실시간 활기

### 5.3 폴링 구현

```typescript
function useFeedPolling(filters: FeedFilters) {
  const { data, refetch } = useQuery({
    queryKey: ['feed', filters],
    queryFn: () => fetchFeed(filters),
    refetchInterval: 30 * 1000, // 30초
    refetchOnWindowFocus: true
  });

  return { events: data?.events, refetch };
}
```

### 5.4 Realtime 구현 (페이즈 2)

```typescript
function useFeedRealtime(filters: FeedFilters) {
  const queryClient = useQueryClient();

  // 초기 로드
  const { data } = useQuery({
    queryKey: ['feed', filters],
    queryFn: () => fetchFeed(filters)
  });

  // Realtime 구독
  useEffect(() => {
    const subscription = supabase
      .channel('public:feed_events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'feed_events',
        filter: `visibility=eq.public`
      }, (payload) => {
        // publish_at 체크 (이미 공개 시점인 것만)
        if (new Date(payload.new.publish_at) <= new Date()) {
          // 캐시 업데이트
          queryClient.setQueryData(['feed', filters], (old) => ({
            ...old,
            events: [payload.new, ...old.events].slice(0, 100)
          }));
        }
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [filters]);

  return { events: data?.events };
}
```

### 5.5 publish_at 시점 처리

`publish_at`이 미래인 이벤트는 즉시 노출 X. 시간이 되면 자동으로 노출되어야 함.

**옵션 A**: 클라이언트가 일정 간격 폴링
- 30초마다 새 이벤트 + publish_at <= now() 체크
- 단순, 충분

**옵션 B**: 서버 측 cron으로 publish_queue 처리
- 1분마다 publish_at <= now() AND not_yet_published=true 처리
- Supabase Realtime 발송 트리거
- 페이즈 2 검토

페이즈 1: 옵션 A로 단순하게.

---

## 6. 피드 표시 로직

### 6.1 시간 표시

정확한 시간 노출 X. 상대 시간으로:

```typescript
function formatRelativeTime(occurredAt: Date, lang: string): string {
  const now = Date.now();
  const diff = now - occurredAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  switch (lang) {
    case 'ko':
      if (minutes < 1) return '방금 전';
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      if (days < 7) return `${days}일 전`;
      return formatDate(occurredAt, 'M월 d일');
    case 'en':
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      // ...
  }
}
```

### 6.2 사용자 정확 시간 노출 옵션

마이 탭 본인 활동 페이지에서는 정확한 시간 노출 (본인 정보).
공개 피드에서는 항상 상대 시간만.

### 6.3 익명 표시

```typescript
function getDisplayName(event: FeedEvent, lang: string): string {
  if (event.is_anonymous) {
    return ({
      ko: '익명의 등산가',
      en: 'Anonymous Hiker',
      ja: '匿名のハイカー',
      zh: '匿名登山者'
    })[lang];
  }
  return event.user_nickname;
}
```

### 6.4 자기 이벤트 강조

본인 이벤트가 피드에 노출되면 살짝 다른 스타일:
- 좌측 컬러 보더 (--brand-green-800)
- "나의 활동" 라벨

---

## 7. 카드 페이지 통합

### 7.1 "이 오름의 최근 방문" 영역

`05_oreum_card_page.md` 섹션 9 또는 별도 영역.

```
[카드 페이지의 협력감 표시]

"지난 30일간 234명이 다녀갔어요"
- 이는 oreum_companionship view 활용 (01_data_model.md 8.5)

[이 오름 최근 방문 (페이즈 2)]
- 최근 5명의 발견 이벤트
- 같은 형식의 작은 카드들
- 더보기 → /oreum/{slug}/recent-visits
```

이 영역은:
- 사용자 정보 익명화 (옵션 따름)
- 시간 상대 표시
- 본인이 발견한 적 있으면 강조

### 7.2 협력감 메시지

홈 탭 리듬 카드와 카드 페이지에 노출:

```typescript
function getCompanionshipMessage(oreum: Oreum, lang: string) {
  const visitors30d = oreum.companionship.recent_30d_visitors;
  const visitors7d = oreum.companionship.recent_7d_visitors;

  if (visitors7d > 50) {
    return `이번 주 ${visitors7d}명이 다녀갔어요`;
  } else if (visitors30d > 100) {
    return `지난 30일간 ${visitors30d}명이 다녀갔어요`;
  } else if (visitors30d > 0) {
    return `최근 ${visitors30d}명이 다녀갔어요`;
  } else {
    return null; // 노출 안 함
  }
}
```

**중요**: 1등, 2등 같은 비교 노출 X. 단순 누적 수만.

---

## 8. 지도 모드 (페이즈 2)

### 8.1 지도 위 피드 시각화

```
[/feed?view=map]

[제주 지도 위에 활동 표시]
- 각 오름 위치에 핀
- 핀 크기/색상 = 최근 활동 수 (열지도)
- 클릭 시 해당 오름의 최근 방문자 노출
```

### 8.2 지도 사양

- 카카오맵 기반
- 100선 + 비100선 표시
- 활동 인텐시티 컬러:
  - 회색: 최근 0명
  - 옅은 그린: 1~5명
  - 그린: 5~20명
  - 진한 그린: 20명+

### 8.3 페이즈 1 vs 2

페이즈 1: 지도 모드 X (리스트 모드만)
페이즈 2 도입: 사용자 1만+ 시점

---

## 9. 필터·검색

### 9.1 이벤트 타입 필터

```
[ 전체 ] [ 발견 ] [ 배지 ] [ 챌린지 ]
```

### 9.2 지역 필터

```
[ 전체 ] [ 동 ] [ 서 ] [ 남 ] [ 북 ] [ 중산간 ]
```

### 9.3 시간 필터

```
[ 최근 1시간 ] [ 오늘 ] [ 이번 주 ]
```

### 9.4 사용자 필터 (페이즈 3)

페이즈 3 친구 기능 도입 시:
- 친구 활동만 보기
- 본인 활동 보기

---

## 10. API 명세

### 10.1 GET /api/feed

피드 이벤트 조회.

**Query**:
```
?type=discovery|badge|challenge|all
&region=east|all
&time=hour|today|week|all
&cursor={ISO datetime}
&limit=20
```

**Response**:
```typescript
{
  events: Array<{
    id: string;
    event_type: 'discovery' | 'badge_earned' | 'challenge_completed';
    occurred_at: string;
    occurred_at_label: string; // "5분 전"
    publish_at: string;

    user: {
      nickname: string; // 익명 시 "익명의 등산가"
      avatar_url: string | null; // 익명 시 null
      is_self: boolean; // 본인 이벤트인지
    } | null;

    oreum?: {
      id: string;
      slug: string;
      name_ko: string;
      illustration_url: string;
      region: string;
    };

    badge?: {
      id: string;
      code: string;
      name_ko: string;
      icon_url: string;
    };

    challenge?: {
      id: string;
      title: string;
      cover_url: string;
    };
  }>;
  next_cursor: string | null;
}
```

### 10.2 GET /api/oreums/{slug}/recent-visits

특정 오름의 최근 방문자 (페이즈 2).

```typescript
{
  recent_visits: Array<DiscoveryEvent>;
  total_visitors_30d: number;
  total_visitors_7d: number;
}
```

### 10.3 PATCH /api/me/feed-events/{id}

본인 이벤트 비공개 처리 (페이즈 2 옵션).

```typescript
{ visibility: 'private' }
```

### 10.4 POST /api/feed-events/{id}/report

이벤트 신고 (사용자 정보 부적절 등).

---

## 11. 보안·사생활

### 11.1 좌표 노출 X

피드 이벤트에 정확 좌표 절대 노출 X. 오름 단위 (slug)만.

```typescript
// API response에서 좌표 제외 명시적 확인
const event = await db.feedEvents.findUnique({
  where: { id },
  select: {
    id: true, event_type: true, occurred_at: true,
    user_nickname: true, oreum_slug: true,
    // verification_lat, verification_lng 절대 select X
  }
});
```

### 11.2 사용자 인증 시점 좌표 보호

`user_discoveries` 테이블의 `verification_lat/lng`는:
- 사용자 본인만 read 가능 (RLS)
- 다른 사용자는 절대 접근 X
- 운영자도 audit_logs로 접근 추적

### 11.3 신고·차단

```
[다른 사용자 차단 (페이즈 2)]
- 그 사용자의 활동을 내 피드에서 제외
- 양방향 차단

[이벤트 신고]
- 부적절한 닉네임 등
- 운영자 검토 큐
```

### 11.4 익명 옵션의 영향

익명 옵션 활성 시:
- 피드: "익명의 등산가" 표시
- 본인 활동 화면: 본인 닉네임 그대로
- 다른 곳 (코멘트, 사진 등)도 동일하게 익명 처리 옵션

---

## 12. 성능 최적화

### 12.1 캐시 전략

```typescript
{
  'feed-public-all': { staleTime: 30 * 1000 }, // 30초
  'feed-by-region': { staleTime: 30 * 1000 },
  'feed-by-oreum': { staleTime: 60 * 1000 } // 1분
}
```

### 12.2 페이지네이션

cursor 기반 (offset X):
- `?cursor={iso_datetime}` 형식
- DB 쿼리: `WHERE publish_at < cursor ORDER BY publish_at DESC LIMIT 20`

### 12.3 인덱스

```sql
-- 가장 중요
CREATE INDEX idx_feed_events_publish ON feed_events(publish_at DESC, visibility)
  WHERE visibility = 'public';

-- 지역 필터
CREATE INDEX idx_feed_events_region_publish ON feed_events(region, publish_at DESC)
  WHERE visibility = 'public';

-- 사용자별
CREATE INDEX idx_feed_events_user_publish ON feed_events(user_id, publish_at DESC);

-- 오름별
CREATE INDEX idx_feed_events_oreum_publish ON feed_events(oreum_id, publish_at DESC)
  WHERE visibility = 'public';
```

### 12.4 캐시된 컬럼 갱신

이름·이미지 변경 시:
- 사용자가 닉네임 변경: 미래 이벤트만 새 닉네임 (과거는 옛 이름 그대로)
- 오름 정보 변경: 캐시된 oreum_name 갱신 안 함 (운영자 수동 갱신 가능)

이 정책의 장점: 과거 데이터 일관성 유지. 단점: 정보 약간 stale.
본 프로젝트는 일관성 우선.

### 12.5 Realtime 비용 (페이즈 2)

Supabase Realtime:
- 동시 접속 200명 무료
- Pro 플랜에서 더 많은 동시 접속

활성 사용자 1만+ 시점에 Pro 업그레이드 또는 폴링 유지 결정.

---

## 13. 인터랙션·애니메이션

### 13.1 새 이벤트 등장

```
[새 이벤트 감지]
    ↓
[피드 상단에서 슬라이드인 (300ms)]
- 위에서 아래로 미끄러짐
- 다른 카드들 자리 비켜줌
- 살짝 강조 보더 (1초)
```

### 13.2 풀 투 리프레시

```
[사용자가 풀 다운]
    ↓
[인디케이터 노출 (--brand-green-800)]
    ↓
[갱신 API 호출]
    ↓
[새 이벤트 슬라이드인]
```

### 13.3 카드 탭

```
[발견 이벤트 탭] → /oreum/{slug}
[배지 이벤트 탭] → 배지 정보 모달
[챌린지 이벤트 탭] → /challenges/{id}
```

---

## 14. 다국어 처리

### 14.1 시간 표시

`6.1` 참조. 언어별 형식.

### 14.2 이벤트 메시지

```typescript
// messages/ko.json
{
  "feed": {
    "discovery_label": "{user} 다녀감",
    "badge_earned_label": "{user} 배지 획득",
    "challenge_completed_label": "{user} 챌린지 완주",
    "anonymous_user": "익명의 등산가",
    "self_label": "나의 활동",
    "empty": {
      "title": "아직 활동이 없어요",
      "subtitle": "오늘 첫 인증을 남겨보세요"
    },
    "filter": {
      "all": "전체",
      "discovery": "발견",
      "badge": "배지",
      "challenge": "챌린지"
    }
  }
}
```

### 14.3 오름 이름 다국어

```typescript
// 캐시된 oreum_name은 한국어 그대로
// 사용자 언어가 다를 시 클라이언트에서 변환 (간단 매핑)
const oreumName = lang === 'ko'
  ? event.oreum_name
  : event.oreum_name_translated || event.oreum_name; // 번역 안 됐으면 한국어 fallback
```

또는 캐시된 컬럼을 다국어로:
```sql
oreum_name_ko, oreum_name_en, oreum_name_ja, oreum_name_zh
```

---

## 15. 분석·KPI

### 15.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `feed_viewed` | filter, time_range |
| `feed_event_clicked` | event_id, event_type |
| `feed_filtered` | filter_type, value |
| `feed_pulled_to_refresh` | - |
| `feed_visibility_changed` | new_setting |
| `anonymous_mode_toggled` | new_value |

### 15.2 KPI

- 피드 진입 빈도 (DAU 중 % )
- 피드 → 카드 페이지 전환률
- 사용자 공개 옵션 분포 (즉시 / 10분 / 비공개)
- 익명 모드 사용률
- 새 이벤트 등장 → 즉시 클릭 비율

---

## 16. 테스트 시나리오

### 16.1 단위 테스트

- `calculatePublishTime` 각 옵션
- `formatRelativeTime` 다국어
- 캐시 컬럼 일관성

### 16.2 통합 테스트

- 발견 → 10분 후 피드 노출 (시간 시뮬레이션)
- 즉시 공개 옵션 → 즉시 노출
- 비공개 옵션 → 노출 안 함
- 사용자 닉네임 변경 → 과거 이벤트 영향 없음

### 16.3 시나리오 테스트

- 1000개 이벤트 시뮬레이션 → 페이지네이션 정확성
- 동시에 여러 이벤트 생성 → 정렬 정확성
- 사용자 차단 → 피드 노출 안 됨 (페이즈 2)

### 16.4 성능 테스트

- 1만 이벤트 / 일 → 쿼리 시간 < 200ms
- Realtime 동시 접속 200 → 안정성

---

## 17. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 3단계 공개 옵션, 익명 모드, 피드 화면, 데이터 모델 + 캐시 컬럼, 폴링/Realtime 전략, 카드 페이지 통합, 보안·사생활, API 명세 | 기획+Claude |

---

## 18. 후속 작업

- 피드 화면 와이어프레임 (Figma)
- 폴링 30초 vs Realtime 비용 시뮬레이션
- 새 이벤트 슬라이드인 애니메이션 프로토타입
- 사용자 차단 기능 페이즈 2 명세
- 지도 모드 시각화 페이즈 2 명세
- 부적절 닉네임 신고 처리 정책

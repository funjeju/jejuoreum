# 03. QR / GPS Authentication

> 본 문서는 인쇄물 QR 스캔과 GPS 기반 오름 인증의 모든 로직을 정의한다.
> 사용자 인증 흐름의 가장 핵심적인 진입점이며, 가장 자주 호출되는 기능이다.
> 모든 상세 명세는 즉시 개발 착수 가능한 수준으로 작성되었다.

---

## 0. 설계 원칙

### 0.1 핵심 결정

- **단일 QR**: 인쇄물에 QR 한 개만 인쇄 (표지 안쪽 또는 뒷면)
- **GPS 자동 매칭**: 좌표 기반으로 가장 가까운 오름 자동 인식
- **3단계 매칭**: 거리에 따라 자동/후보/안내 분기
- **느슨한 인증**: 부정 방지보다 사용자 경험 우선
- **제휴 상권 인증과 분리**: 오름 인증은 GPS, 제휴 상권은 아날로그 도장 (디지털 미연동)

### 0.2 UX 원칙

- 한 번 탭으로 인증 완료 (자동 매칭 시)
- 로딩 시간 5초 이내
- GPS 권한 거부해도 사용 가능 (수동 선택)
- 네트워크 약한 산속에서도 작동 (오프라인 큐)

---

## 1. QR 코드 시스템

### 1.1 QR 코드 구조

**단일 진입 URL**: `https://jejuoreum.com/qr`

QR이 모든 패스포트에 동일하게 인쇄됨. 별도 식별자 X. (개인화·암호화 불필요)

### 1.2 QR 스캔 시 흐름

```
[사용자가 QR 스캔]
    ↓
[브라우저가 https://jejuoreum.com/qr 진입]
    ↓
[/qr 페이지가 즉시 GPS 권한 요청 + 메인 로직 실행]
    ↓
[GPS 매칭 또는 분기 처리]
```

### 1.3 인쇄물 QR 사양

- **위치**: 표지 안쪽 (뒷면)
- **크기**: 25mm × 25mm (작지 않게, 야외에서도 잘 스캔되게)
- **에러 정정 레벨**: H (30% 손상 복구) — 인쇄 손상 대비
- **여백**: 4모듈 이상 (스캔 안정성)
- **색상**: 검정 / 흰 배경 (저비용·안정성)
- **위치 안내**: QR 옆에 "스캔하여 시작하기" 텍스트 + 화살표 일러스트

### 1.4 QR 변형 시나리오 (확장 대비)

만약 미래에 패스포트 시리즈가 여러 종류 출시되거나 캠페인용 QR이 필요하면:

```
https://jejuoreum.com/qr?campaign={code}
https://jejuoreum.com/qr?series={year}
```

페이즈 1에서는 단일 QR로 시작.

---

## 2. GPS 위치 측정

### 2.1 권한 요청 흐름

```javascript
// /qr 페이지 진입 시 즉시 실행
async function requestLocationPermission() {
  if (!('geolocation' in navigator)) {
    return { status: 'unsupported' };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });

    if (permission.state === 'granted') {
      return { status: 'granted' };
    } else if (permission.state === 'prompt') {
      return { status: 'prompt' };  // UI에서 안내 후 getCurrentPosition 호출
    } else {
      return { status: 'denied' };
    }
  } catch (e) {
    return { status: 'unknown' };
  }
}
```

### 2.2 위치 측정 API

```javascript
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,  // 미터 단위
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message
        });
      },
      {
        enableHighAccuracy: true,  // GPS 우선 (정확하지만 느림)
        timeout: 15000,             // 15초 타임아웃
        maximumAge: 30000           // 30초 이내 캐시 허용
      }
    );
  });
}
```

### 2.3 정확도별 분기 처리

```javascript
function classifyAccuracy(accuracy) {
  if (accuracy <= 50) return 'high';        // 도시 GPS, 정확
  if (accuracy <= 200) return 'medium';     // 일반적 야외
  if (accuracy <= 500) return 'low';        // 산속, 시야 가림
  return 'very_low';                         // 신뢰 어려움
}
```

| 정확도 | 처리 |
|--------|------|
| `high` (≤50m) | 자동 매칭 임계값 그대로 (300m) 적용 |
| `medium` (50~200m) | 정상 진행, 경고 X |
| `low` (200~500m) | 후보 제시 단계 우선 + "GPS 정확도가 낮아요" 안내 |
| `very_low` (>500m) | 재측정 안내 또는 수동 선택 |

### 2.4 권한 거부 처리

```
[GPS 권한 거부 감지]
    ↓
[안내 화면]
   - "GPS 없이도 다녀온 오름을 기록할 수 있어요"
   - "위시리스트에서 선택" / "검색으로 찾기" 버튼
    ↓
[/select 또는 /search 진입]
```

권한 거부 후에도 다음 진입 시 다시 요청 가능 (브라우저 정책 따름).

---

## 3. GPS 3단계 매칭 알고리즘

### 3.1 매칭 단계 정의

| 단계 | 거리 조건 | 처리 |
|------|----------|------|
| **A. 자동 매칭** | < 300m | 자동 인식 + "이 오름 맞나요?" 확인 |
| **B. 후보 제시** | 300m ~ 1000m | 가까운 오름 2~3개 후보 제시 |
| **C. 오름 없음** | ≥ 1000m | 메인 화면으로 안내 + 위시리스트 옵션 |

### 3.2 거리 계산 (Haversine)

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
}
```

### 3.3 가까운 오름 검색 (서버)

```sql
-- API: POST /api/qr/match
-- Body: { user_lat, user_lng, accuracy }

WITH nearby_oreums AS (
  SELECT
    o.id,
    o.slug,
    o.name_ko,
    o.is_top_100,
    o.tier,
    o.latitude,
    o.longitude,
    -- Haversine 거리 (미터)
    6371000 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(o.latitude - $user_lat) / 2), 2) +
      COS(RADIANS($user_lat)) * COS(RADIANS(o.latitude)) *
      POWER(SIN(RADIANS(o.longitude - $user_lng) / 2), 2)
    )) AS distance_m
  FROM oreums o
  WHERE o.is_published = true
    -- 1차 필터: 위경도 박스로 빠르게 좁히기 (인덱스 활용)
    AND o.latitude BETWEEN $user_lat - 0.02 AND $user_lat + 0.02
    AND o.longitude BETWEEN $user_lng - 0.02 AND $user_lng + 0.02
)
SELECT *
FROM nearby_oreums
WHERE distance_m < 5000  -- 5km 이내만
ORDER BY distance_m ASC
LIMIT 5;
```

> 페이즈 2에서 PostGIS 도입 시 GIST 인덱스로 더 빠르게 가능.

### 3.4 매칭 분기 로직 (서버)

```typescript
type MatchResult =
  | { stage: 'auto'; oreum: Oreum; distance_m: number }
  | { stage: 'candidates'; candidates: Array<{ oreum: Oreum; distance_m: number }> }
  | { stage: 'no_oreum'; nearest_distance_m: number };

async function classifyMatch(
  userLat: number,
  userLng: number,
  accuracy: number
): Promise<MatchResult> {
  const nearby = await queryNearbyOreums(userLat, userLng);

  if (nearby.length === 0) {
    return { stage: 'no_oreum', nearest_distance_m: Infinity };
  }

  const nearest = nearby[0];

  // 정확도가 낮으면 자동 매칭 임계값을 보정
  let autoThreshold = 300;
  if (accuracy > 200) autoThreshold = 200;  // 정확도 낮으면 더 보수적
  if (accuracy > 500) autoThreshold = 0;    // 매우 낮으면 자동 매칭 비활성

  if (nearest.distance_m < autoThreshold) {
    return { stage: 'auto', oreum: nearest, distance_m: nearest.distance_m };
  }

  if (nearest.distance_m < 1000) {
    return {
      stage: 'candidates',
      candidates: nearby.filter(n => n.distance_m < 1500).slice(0, 3)
    };
  }

  return { stage: 'no_oreum', nearest_distance_m: nearest.distance_m };
}
```

---

## 4. 인증 처리 (Discovery Creation)

### 4.1 인증 API

**Endpoint**: `POST /api/discoveries`

**Request**:
```typescript
{
  oreum_id: string;                    // 인증할 오름 ID
  verification_method: 'gps' | 'manual_select' | 'manual_add';
  user_lat?: number;                   // GPS 인증 시
  user_lng?: number;                   // GPS 인증 시
  accuracy?: number;                   // GPS 정확도
  user_note?: string;                  // 메모 (선택)
  visibility?: 'instant' | 'delay_10min' | 'private';  // 개별 공개 옵션
}
```

**Response**:
```typescript
{
  discovery: {
    id: string;
    oreum_id: string;
    oreum_name: string;
    oreum_slug: string;
    discovered_at: string;
    weather_snapshot: {
      condition: string;
      temp: number;
      wind: number;
    };
  };
  newly_earned_badges: Array<{
    id: string;
    code: string;
    name_ko: string;
    icon_url: string;
  }>;
  updated_progress: {
    total: { discovered: number; total: 100 };
    beginner: { discovered: number; total: 30 };
    explorer: { discovered: number; total: 70 };
    master: { discovered: number; total: number };
  };
  challenge_updates: Array<{
    challenge_id: string;
    title: string;
    progress: { completed: number; total: number };
    is_completed: boolean;
  }>;
  rhythm_update: {
    this_month_discoveries: number;
    this_week_discoveries: number;
  };
}
```

### 4.2 서버 처리 로직

```typescript
async function createDiscovery(req: DiscoveryRequest, userId: string) {
  return await db.transaction(async (tx) => {
    // 1. 중복 체크
    const existing = await tx.userDiscoveries.findFirst({
      where: { user_id: userId, oreum_id: req.oreum_id }
    });
    if (existing) {
      throw new DuplicateDiscoveryError('이미 다녀온 오름이에요');
    }

    // 2. GPS 인증 시 거리 검증 (느슨하게)
    let verificationDistance = null;
    if (req.verification_method === 'gps') {
      const oreum = await tx.oreums.findUnique({
        where: { id: req.oreum_id }
      });
      verificationDistance = calculateDistance(
        req.user_lat!, req.user_lng!,
        oreum.latitude, oreum.longitude
      );
      // 부정 인증 차단은 안 함 (느슨한 정책)
      // 단, 비정상적 케이스 (1000km+ 떨어짐)는 로깅
      if (verificationDistance > 100000) {
        logger.warn('Suspicious discovery', { userId, oreumId: req.oreum_id });
      }
    }

    // 3. 날씨 정보 캡처 (비동기, 실패해도 인증은 진행)
    const weather = await fetchWeatherSnapshot(req.user_lat, req.user_lng)
      .catch(() => null);

    // 4. user_discoveries 삽입
    const discovery = await tx.userDiscoveries.create({
      data: {
        user_id: userId,
        oreum_id: req.oreum_id,
        verification_method: req.verification_method,
        verification_distance_m: verificationDistance,
        verification_lat: req.user_lat,
        verification_lng: req.user_lng,
        weather_snapshot: weather,
        user_note: req.user_note,
        visibility: req.visibility ?? 'follow_settings'
      }
    });

    // 5. feed_events 삽입 (공개 옵션에 따라 publish_at 결정)
    const userSettings = await tx.userSettings.findUnique({
      where: { user_id: userId }
    });
    const effectiveVisibility = req.visibility === 'follow_settings'
      ? userSettings.feed_visibility
      : (req.visibility ?? userSettings.feed_visibility);

    let publishAt = new Date();
    if (effectiveVisibility === 'delay_10min') {
      publishAt = new Date(Date.now() + 10 * 60 * 1000);
    }

    const isPublic = effectiveVisibility !== 'private';

    if (isPublic) {
      await tx.feedEvents.create({
        data: {
          event_type: 'discovery',
          user_id: userId,
          oreum_id: req.oreum_id,
          occurred_at: new Date(),
          publish_at: publishAt,
          visibility: 'public',
          // 캐시된 정보
          user_nickname: ...,
          oreum_name: ...,
          oreum_slug: ...
        }
      });
    }

    // 6. 배지 트리거 체크
    const newlyEarnedBadges = await checkAndAwardBadges(userId, tx);

    // 7. 챌린지 진행도 업데이트
    const challengeUpdates = await updateActiveChallenges(userId, req.oreum_id, tx);

    // 8. 리듬 카운트 업데이트 (트리거 또는 배치, 여기선 view 자동)

    return {
      discovery,
      newly_earned_badges: newlyEarnedBadges,
      updated_progress: await getUserProgress(userId, tx),
      challenge_updates: challengeUpdates,
      rhythm_update: await getUserRhythm(userId, tx)
    };
  });
}
```

### 4.3 배지 트리거 함수

```typescript
async function checkAndAwardBadges(userId: string, tx: Transaction) {
  const newBadges: Badge[] = [];

  // 모든 미획득 배지 가져오기
  const unearnedBadges = await tx.badges.findMany({
    where: {
      is_active: true,
      id: {
        notIn: await getUserBadgeIds(userId, tx)
      }
    }
  });

  for (const badge of unearnedBadges) {
    const isEarned = await evaluateBadgeCriteria(
      userId,
      badge.unlock_criteria,
      tx
    );

    if (isEarned) {
      const earned = await tx.userBadges.create({
        data: {
          user_id: userId,
          badge_id: badge.id,
          trigger_event: { type: 'discovery_check' }
        }
      });
      newBadges.push(badge);

      // feed_events에 배지 획득 이벤트
      await tx.feedEvents.create({
        data: {
          event_type: 'badge_earned',
          user_id: userId,
          badge_id: badge.id,
          // ... publish_at 등
        }
      });
    }
  }

  return newBadges;
}

async function evaluateBadgeCriteria(
  userId: string,
  criteria: BadgeCriteria,
  tx: Transaction
): boolean {
  switch (criteria.type) {
    case 'discover_count':
      const total = await tx.userDiscoveries.count({ where: { user_id: userId } });
      return total >= criteria.count;

    case 'discover_tier':
      const tierCount = await tx.userDiscoveries.count({
        where: {
          user_id: userId,
          oreum: { tier: criteria.tier }
        }
      });
      const target = criteria.count === 'all'
        ? await getTierTotal(criteria.tier, tx)
        : criteria.count;
      return tierCount >= target;

    case 'discover_region':
      // ... 유사
    case 'discover_season':
      // ... 인증 시점 weather 또는 계절
    case 'photo_uploaded':
      // ... oreum_visuals.uploaded_by count
    case 'meta_badges':
      // 다른 배지들 모두 획득했는지
      const requiredIds = await getBadgeIdsByCodes(criteria.required, tx);
      const userBadgeIds = await getUserBadgeIds(userId, tx);
      return requiredIds.every(id => userBadgeIds.includes(id));

    default:
      return false;
  }
}
```

---

## 5. 클라이언트 인증 흐름 (Frontend)

### 5.1 /qr 페이지 컴포넌트 흐름

```typescript
// app/[lang]/qr/page.tsx (Next.js App Router)

export default function QRPage() {
  const [stage, setStage] = useState<Stage>('initializing');
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runQRFlow();
  }, []);

  async function runQRFlow() {
    setStage('requesting_permission');

    try {
      const location = await getCurrentLocation();
      setStage('matching');

      const result = await fetch('/api/qr/match', {
        method: 'POST',
        body: JSON.stringify({
          user_lat: location.latitude,
          user_lng: location.longitude,
          accuracy: location.accuracy
        })
      }).then(r => r.json());

      setMatch(result);
      setStage('match_result');
    } catch (e) {
      if (e.code === 1) {  // PERMISSION_DENIED
        setStage('permission_denied');
      } else if (e.code === 3) {  // TIMEOUT
        setStage('timeout');
      } else {
        setStage('error');
        setError(e.message);
      }
    }
  }

  // 단계별 렌더링
  if (stage === 'initializing') return <InitView />;
  if (stage === 'requesting_permission') return <PermissionPrompt />;
  if (stage === 'matching') return <MatchingLoader />;
  if (stage === 'permission_denied') return <PermissionDeniedView />;
  if (stage === 'timeout') return <TimeoutView onRetry={runQRFlow} />;
  if (stage === 'match_result' && match?.stage === 'auto') {
    return <AutoMatchView oreum={match.oreum} distance={match.distance_m} />;
  }
  if (stage === 'match_result' && match?.stage === 'candidates') {
    return <CandidatesView candidates={match.candidates} />;
  }
  if (stage === 'match_result' && match?.stage === 'no_oreum') {
    return <NoOreumView nearestDistance={match.nearest_distance_m} />;
  }
  return <ErrorView message={error} />;
}
```

### 5.2 자동 매칭 화면

```
┌────────────────────────────────────────┐
│ ← 뒤로                              [X] │
├────────────────────────────────────────┤
│                                        │
│  [오름 일러스트 카드 - 풀 화면]           │
│                                        │
│  새별오름                                │
│  현재 위치에서 230m                      │
│                                        │
│  [위치 정확도: 매우 정확]                 │
│                                        │
├────────────────────────────────────────┤
│  이 오름이 맞다면:                       │
│  [    인증하기    ]  ← Primary 버튼      │
│                                        │
│  [ 다른 오름인데... ] ← Secondary       │
└────────────────────────────────────────┘
```

### 5.3 후보 제시 화면

```
┌────────────────────────────────────────┐
│ ← 뒤로                              [X] │
├────────────────────────────────────────┤
│                                        │
│ 어떤 오름에 다녀오셨나요?                 │
│ 주변에 가까운 오름이 있어요               │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ [작은 카드] 영주산                 │   │
│ │ 850m · 동쪽 방향                  │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ [작은 카드] 따라비오름             │   │
│ │ 1.2km · 남동쪽                   │   │
│ └──────────────────────────────────┘   │
│                                        │
│ [ 위에 없어요 - 직접 선택 ]              │
└────────────────────────────────────────┘
```

### 5.4 오름 없음 화면

```
┌────────────────────────────────────────┐
│ ← 뒤로                              [X] │
├────────────────────────────────────────┤
│                                        │
│  [지도 일러스트 또는 아이콘]              │
│                                        │
│  주변에 오름이 없어요                     │
│  가장 가까운 오름이 1.8km 떨어져 있어요    │
│                                        │
│  [지도에서 가까운 오름 보기]               │
│  [위시리스트에서 선택]                    │
│  [메인으로 돌아가기]                      │
└────────────────────────────────────────┘
```

### 5.5 발견 모먼트 컴포넌트

```typescript
function DiscoveryMomentAnimation({ oreum, onComplete }) {
  const [phase, setPhase] = useState<'pre' | 'expand' | 'colorize' | 'check' | 'count' | 'done'>('pre');

  useEffect(() => {
    runSequence();
  }, []);

  async function runSequence() {
    // t=0: 시작
    setPhase('expand');
    // 햅틱
    if ('vibrate' in navigator) navigator.vibrate(40);

    await sleep(200);
    setPhase('colorize');

    await sleep(300);
    setPhase('check');

    await sleep(200);
    setPhase('count');

    await sleep(500);
    setPhase('done');
    onComplete();
  }

  return (
    <motion.div
      animate={{
        scale: phase === 'expand' || phase === 'colorize' ? 1.05 : 1
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.img
        src={oreum.illustration_url}
        animate={{
          filter: phase === 'pre'
            ? 'grayscale(100%) opacity(0.6)'
            : 'grayscale(0%) opacity(1)'
        }}
        transition={{ duration: 0.6 }}
      />
      {phase >= 'check' && <CheckMark animated />}
      {phase >= 'count' && <ProgressCounter from={prev} to={prev + 1} />}
    </motion.div>
  );
}
```

---

## 6. 오프라인 지원

### 6.1 인증 오프라인 큐

산속에서 네트워크 약할 때를 대비.

```typescript
// Service Worker 또는 IndexedDB 사용

async function authenticateOffline(req: DiscoveryRequest) {
  if (navigator.onLine) {
    return await fetch('/api/discoveries', { method: 'POST', body: JSON.stringify(req) });
  }

  // 오프라인 큐에 저장
  await idb.set(`pending_discovery_${Date.now()}`, req);

  // UI에 낙관적 업데이트
  return {
    pending: true,
    discovery: { /* 임시 데이터 */ }
  };
}

// 네트워크 복구 시 자동 동기화
self.addEventListener('online', async () => {
  const pending = await idb.getAllByPrefix('pending_discovery_');

  for (const req of pending) {
    try {
      await fetch('/api/discoveries', { method: 'POST', body: JSON.stringify(req) });
      await idb.delete(req.key);

      // 사용자에게 알림
      self.registration.showNotification('인증 완료', {
        body: `${req.oreum_name} 인증이 완료됐어요`,
        icon: '/icon-192.png'
      });
    } catch (e) {
      // 다음 기회에 재시도
    }
  }
});
```

### 6.2 오프라인 데이터 캐시

PWA 첫 진입 시 다음을 미리 캐시:

- 오름 마스터 데이터 (좌표 + 이름) — 약 100KB
- 사용자의 현재 도감 상태 — 약 50KB
- 카드 일러스트 (이미 발견한 오름) — 약 5MB

이렇게 하면 산속에서도 GPS 매칭은 로컬에서 가능 (서버 호출 X).

```javascript
// 클라이언트 측 매칭 fallback
async function matchOfflineFallback(userLat, userLng) {
  const localOreums = await idb.get('cached_oreums');

  const distances = localOreums.map(o => ({
    ...o,
    distance_m: calculateDistance(userLat, userLng, o.latitude, o.longitude)
  })).sort((a, b) => a.distance_m - b.distance_m);

  return classifyMatch(distances);
}
```

---

## 7. 보안·부정 방지

### 7.1 정책

본 프로젝트의 결정: **부정 인증 방지 시스템 도입 안 함** (느슨한 정책).

이유:
- 부정 인증해도 시스템에 손해 없음 (가입자가 본인 만족도 X)
- 강력한 검증은 사용자 경험 해침
- 도장 욕구는 본인 동기에서 옴 (남이 검증 X)

### 7.2 단, 다음은 모니터링

- 비정상적 거리 (1000km+ 떨어진 곳에서 인증) → 로그
- 동일 사용자가 1분 내 여러 오름 인증 → 로그 (이상 행동 패턴)
- IP·디바이스 기준 비정상 패턴 → 운영자 알림

이 데이터는 향후 정책 결정에 활용 (지금은 차단 X).

### 7.3 Rate Limiting

```
/api/qr/match: 사용자당 60회/분
/api/discoveries: 사용자당 30회/시간
```

API 남용 방지용. 일반 사용자 영향 없음.

---

## 8. 다국어 처리

### 8.1 화면 텍스트

모든 UI 텍스트는 i18n 키로 분리.

```typescript
// messages/ko.json
{
  "qr": {
    "matching": "주변 오름을 찾고 있어요...",
    "auto_match": {
      "title": "{name}에 도착했어요",
      "confirm": "이 오름이 맞다면",
      "cta_confirm": "인증하기",
      "cta_other": "다른 오름인데..."
    },
    "candidates": {
      "title": "어떤 오름에 다녀오셨나요?",
      "subtitle": "주변에 가까운 오름이 있어요"
    },
    "no_oreum": {
      "title": "주변에 오름이 없어요",
      "subtitle": "가장 가까운 오름이 {distance}m 떨어져 있어요"
    }
  }
}

// messages/en.json (페이즈 2 추가)
{
  "qr": {
    "matching": "Finding nearby oreums...",
    ...
  }
}
```

### 8.2 오름 이름 표시

사용자 언어에 따라 적절한 이름 노출:

```typescript
function getOreumName(oreum: Oreum, lang: string) {
  switch (lang) {
    case 'en': return oreum.name_en || oreum.name_ko;
    case 'ja': return oreum.name_ja || oreum.name_ko;
    case 'zh': return oreum.name_zh || oreum.name_ko;
    default: return oreum.name_ko;
  }
}
```

영어/일본어/중국어 미작성 시 한국어 fallback (페이즈 0~1).

---

## 9. 에러 처리

### 9.1 에러 케이스 매트릭스

| 에러 | 사용자 경험 | 처리 |
|------|-----------|------|
| GPS 권한 거부 | 권한 거부 안내 | 수동 선택 옵션 제공 |
| GPS 타임아웃 | "위치 측정 실패" | 재시도 버튼 |
| 네트워크 끊김 | "인증 대기 중" | 오프라인 큐, 백그라운드 동기화 |
| 정확도 너무 낮음 | "GPS 정확도가 낮아요" | 후보 제시 또는 재측정 |
| 중복 인증 | "이미 다녀온 오름이에요" | 카드 페이지로 안내 |
| 비정상 거리 | (사용자에겐 정상 처리) | 서버 로그만 |
| 서버 에러 | "잠시 후 다시 시도해주세요" | 자동 재시도 + 토스트 |

### 9.2 에러 메시지 톤

- 비난하지 않음 ("네트워크가 끊겼어요" → "지금 연결이 약해요")
- 해결책 제시 ("재시도" / "다른 방법")
- 전문 용어 X ("Geolocation API timeout" → "위치를 찾기 어려워요")

---

## 10. 분석·모니터링

### 10.1 추적할 이벤트

| 이벤트 | 속성 |
|--------|------|
| `qr_scan_initiated` | source: 'camera' \| 'shortcut' |
| `gps_permission_requested` | - |
| `gps_permission_granted` | - |
| `gps_permission_denied` | - |
| `match_auto` | oreum_id, distance_m, accuracy |
| `match_candidates_shown` | candidate_count |
| `match_candidates_selected` | oreum_id |
| `match_no_oreum` | nearest_distance_m |
| `discovery_completed` | oreum_id, method, time_to_complete |
| `discovery_duplicate_attempt` | oreum_id |
| `manual_select_used` | reason |

### 10.2 KPI

- 자동 매칭 성공률 (목표: 70%+)
- GPS 권한 허용률 (목표: 80%+)
- 인증 완료 시간 (목표: 평균 10초 이내)
- 권한 거부 → 수동 선택 전환률 (목표: 50%+)

### 10.3 알림 트리거

- 자동 매칭 실패율 > 50% (1시간 평균) → 운영팀 알림
- /qr 페이지 5xx 에러 > 1% → 즉시 알림
- 비정상 거리 인증 시도 > 10건/일 → 로그 검토

---

## 11. 테스트 시나리오

### 11.1 단위 테스트

- `calculateDistance(33.4756, 126.8186, 33.4760, 126.8190)` → 정확한 미터값
- `classifyAccuracy(50)` → 'high'
- `classifyMatch(...)` 각 분기 테스트

### 11.2 통합 테스트

- QR 스캔 → 자동 매칭 → 인증 → 발견 모먼트 (E2E)
- 권한 거부 → 수동 선택 흐름
- 중복 인증 차단
- 배지 트리거 정확성

### 11.3 시나리오 테스트

- 오름 정상에서 GPS 정확도 시뮬레이션 (50m, 200m, 500m)
- 오름 두 개 사이 (300m, 500m, 800m) 위치에서 후보 제시 동작
- 오름 멀리 (1.5km, 5km) 떨어진 곳에서 안내 화면

### 11.4 실제 현장 테스트

- 출시 전 비기너 30개 오름 직접 방문하여 인증 테스트
- GPS 정확도 측정 데이터 수집
- 인증 임계값 조정 근거 확보

---

## 12. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. QR 단일 진입, GPS 3단계 매칭, 인증 처리 트랜잭션, 오프라인 큐, 다국어 처리 명세 | 기획+Claude |

---

## 13. 후속 작업

- `/qr` 페이지 React 컴포넌트 구현
- `/api/qr/match` API 엔드포인트 구현
- `/api/discoveries` API 엔드포인트 구현
- 발견 모먼트 애니메이션 (Framer Motion)
- Service Worker 오프라인 큐 구현
- 100개 오름 좌표 정확성 검증 (현장 측정과 비교)
- 다국어 메시지 파일 작성

# 11. Badges & Challenges

> 본 문서는 배지 시스템과 챌린지 시스템의 모든 명세를 정의한다.
> 두 시스템은 **사용자 장기 동기 부여**의 핵심이며, 본 프로젝트의 게이미피케이션 정체성을 결정한다.

---

## 0. 시스템 철학

### 0.1 두 시스템의 역할

| 시스템 | 성격 | 역할 |
|--------|------|------|
| **배지** | 영구 획득, 전시 | "내가 무엇을 이뤘는가" |
| **챌린지** | 한정 기간, 진행형 | "지금 무엇을 도전할까" |

배지는 평생 자랑할 수 있는 트로피, 챌린지는 시즌 한정 미션. 두 시스템이 맞물려 다음을 만든다:
- **배지**: 큰 단위 성취 (장기 목표)
- **챌린지**: 작은 단위 목표 (주간·월간 활성화)

### 0.2 본 프로젝트의 차별점

`core.md` 2.9 건강한 게이미피케이션 원칙 준수.

**도입 안 함**:
- 사용자 간 직접 비교·랭킹
- 시간·자원 많은 사용자 우대
- 경쟁심 자극

**도입함**:
- 본인 페이스의 성취감
- 협력감 ("함께 도전 중")
- 시즌·이슈에 맞는 큐레이션

### 0.3 핵심 결정

- **배지 트리거는 자동**: 조건 충족 시 즉시 부여
- **챌린지 큐레이션은 운영자**: 시즌·이슈 맞춰 직접 만듦
- **숨겨진 챌린지** 존재: 발견 자체가 재미
- **굿즈 구매 권한 잠금 해제**: 챌린지 → 한정 굿즈 연계 (페이즈 3)

---

## 1. 배지 시스템

### 1.1 배지 분류 (8종 카테고리)

| 카테고리 | 설명 | 개수 |
|---------|------|------|
| **입문** | 첫 활동 격려 | 1 |
| **수집** | 발견 누적 (영역별) | 4 |
| **지역** | 지역별 완주 | 5 + 1 메타 |
| **시즌** | 계절별 활동 | 4 |
| **시간대** | 일출/일몰 등 | 3 |
| **기여** | 사진·코멘트 기여 | 6 |
| **챌린지** | 챌린지 완료 | 가변 (한정) |
| **메타** | 다른 배지들 모음 | 2~3 |

### 1.2 전체 배지 시드 데이터

#### 입문 배지 (1종)

| 코드 | 이름 | 조건 | 희소성 |
|------|------|------|--------|
| `first_discovery` | 첫 걸음 | 첫 오름 발견 | 누구나 |

#### 수집 배지 (4종)

| 코드 | 이름 | 조건 | 희소성 |
|------|------|------|--------|
| `collector_10` | 수집가 | 10개 발견 | 입문자 |
| `beginner_master` | 비기너 마스터 | 비기너 30개 모두 | 중급 |
| `explorer_master` | 익스플로러 마스터 | 익스플로러 70개 모두 | 고급 |
| `centurion` | 100선 마스터 | 100선 모두 | 최고 |

#### 지역 배지 (5 + 1 메타)

| 코드 | 이름 | 조건 |
|------|------|------|
| `region_master_east` | 동부 마스터 | 동부 100선 모두 |
| `region_master_west` | 서부 마스터 | 서부 100선 모두 |
| `region_master_south` | 남부 마스터 | 남부 100선 모두 |
| `region_master_north` | 북부 마스터 | 북부 100선 모두 |
| `region_master_central` | 중산간 마스터 | 중산간 100선 모두 |
| `jeju_master` | 제주 마스터 (메타) | 위 5개 모두 |

#### 시즌 배지 (4종)

| 코드 | 이름 | 조건 |
|------|------|------|
| `spring_explorer` | 봄의 탐험가 | 봄(3~5월)에 5개 발견 |
| `summer_explorer` | 여름의 탐험가 | 여름(6~8월)에 5개 발견 |
| `autumn_explorer` | 가을의 탐험가 | 가을(9~11월)에 5개 발견 |
| `winter_explorer` | 겨울의 탐험가 | 겨울(12~2월)에 5개 발견 |
| `four_seasons` | 사계절 (메타) | 위 4종 모두 |

#### 시간대 배지 (3종)

| 코드 | 이름 | 조건 |
|------|------|------|
| `sunrise_chaser` | 일출 추적자 | 일출 시간대(5~7시)에 3개 발견 |
| `sunset_lover` | 일몰 애호가 | 일몰 시간대(17~19시)에 3개 발견 |
| `night_walker` | 야간 산책자 | 야간(20시~04시)에 1개 발견 |

#### 기여 배지 (6종)

| 코드 | 이름 | 조건 |
|------|------|------|
| `recorder` | 기록자 | 사진 10장 (승인) |
| `archivist` | 아카이비스트 | 사진 50장 (승인) |
| `master_archivist` | 마스터 아카이비스트 | 사진 200장 (승인) |
| `curator` | 큐레이터 | 사진이 대표 사진으로 채택됨 |
| `pioneer` | 선구자 | 어떤 오름의 첫 사진 기록자 |
| `tip_writer` | 팁 작성자 | 코멘트가 현장 팁으로 승격됨 |

#### 챌린지 배지 (가변)

운영자가 챌린지마다 만드는 한정 배지.

예시:
- `weekly_2026_05` (이주의 미션 5월 배지)
- `monthly_winter_2026` (겨울 시즌 미션)
- `hidden_rainy_day` (히든: 비 오는 날 인증)

#### 메타 배지 (2~3종)

| 코드 | 이름 | 조건 |
|------|------|------|
| `jeju_master` | 제주 마스터 | 5개 지역 마스터 모두 |
| `four_seasons` | 사계절 | 4개 시즌 배지 모두 |
| `legend` | 전설 | 100선 마스터 + 제주 마스터 + 사계절 + 마스터 아카이비스트 |

### 1.3 배지 정의 시드 데이터 SQL

```sql
INSERT INTO badges (code, name_ko, description, badge_type, rarity, unlock_criteria, display_order) VALUES
-- 입문
('first_discovery', '첫 걸음', '첫 오름을 발견했어요', 'discovery', 1,
 '{"type": "discover_count", "count": 1}', 100),

-- 수집
('collector_10', '수집가', '10개의 오름을 발견했어요', 'collection', 1,
 '{"type": "discover_count", "count": 10}', 200),
('beginner_master', '비기너 마스터', '비기너 30개 완주', 'collection', 3,
 '{"type": "discover_tier", "tier": "beginner", "count": "all"}', 210),
('explorer_master', '익스플로러 마스터', '익스플로러 70개 완주', 'collection', 4,
 '{"type": "discover_tier", "tier": "explorer", "count": "all"}', 220),
('centurion', '100선 마스터', '100선 모두 발견', 'collection', 5,
 '{"type": "discover_tier", "tier": ["beginner", "explorer"], "count": "all"}', 230),

-- 지역
('region_master_east', '동부 마스터', '동부 100선 모두', 'region', 3,
 '{"type": "discover_region", "region": "east", "count": "all"}', 300),
-- ... (서/남/북/중산간 동일 패턴)
('jeju_master', '제주 마스터', '5개 지역 마스터 모두', 'meta', 5,
 '{"type": "meta_badges", "required": ["region_master_east", "region_master_west", "region_master_south", "region_master_north", "region_master_central"]}', 350),

-- 시즌
('spring_explorer', '봄의 탐험가', '봄에 5개 발견', 'season', 2,
 '{"type": "discover_season", "season": "spring", "count": 5}', 400),
-- ... (여름/가을/겨울 동일)
('four_seasons', '사계절', '4개 시즌 배지 모두', 'meta', 4,
 '{"type": "meta_badges", "required": ["spring_explorer", "summer_explorer", "autumn_explorer", "winter_explorer"]}', 440),

-- 기여
('recorder', '기록자', '사진 10장 기여', 'contribution', 1,
 '{"type": "photo_uploaded", "count": 10, "approved_only": true}', 500),
('archivist', '아카이비스트', '사진 50장 기여', 'contribution', 2,
 '{"type": "photo_uploaded", "count": 50, "approved_only": true}', 510),
-- ... 기타

-- 메타 최상위
('legend', '전설', '모든 마스터 배지 획득', 'meta', 5,
 '{"type": "meta_badges", "required": ["centurion", "jeju_master", "four_seasons", "master_archivist"]}', 990);
```

### 1.4 배지 일러스트 디자인

각 배지 SVG/PNG 일러스트:
- 사이즈: 200×200 (큰 보기), 64×64 (썸네일)
- 스타일: 카드 일러스트와 통일된 톤
- 모양: 원형 또는 방패형 (희소성에 따라)
- 색상:
  - 입문(rarity 1): 그린 톤
  - 수집/지역(rarity 2~3): 골드 톤
  - 마스터(rarity 4~5): 진한 색 + 효과

### 1.5 배지 트리거 함수

```typescript
// 발견 시 호출
async function checkAndAwardBadges(userId: string, trigger: TriggerEvent, tx: Transaction) {
  const newBadges: Badge[] = [];

  // 모든 미획득 활성 배지 가져오기
  const unearnedBadges = await tx.badges.findMany({
    where: {
      is_active: true,
      id: { notIn: await getUserBadgeIds(userId, tx) }
    }
  });

  for (const badge of unearnedBadges) {
    if (await evaluateBadgeCriteria(userId, badge.unlock_criteria, tx)) {
      const earned = await tx.userBadges.create({
        data: {
          user_id: userId,
          badge_id: badge.id,
          earned_at: new Date(),
          trigger_event: trigger
        }
      });
      newBadges.push(badge);

      // feed_events 기록
      await tx.feedEvents.create({
        data: {
          event_type: 'badge_earned',
          user_id: userId,
          badge_id: badge.id,
          occurred_at: new Date(),
          publish_at: getPublishTime(userId), // 사용자 설정 따름
          visibility: 'public'
        }
      });
    }
  }

  return newBadges;
}
```

### 1.6 배지 평가 알고리즘

```typescript
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
      const tiers = Array.isArray(criteria.tier) ? criteria.tier : [criteria.tier];
      const tierCount = await tx.userDiscoveries.count({
        where: {
          user_id: userId,
          oreum: { tier: { in: tiers } }
        }
      });
      const target = criteria.count === 'all'
        ? await getTotalOreumsByTiers(tiers, tx)
        : criteria.count;
      return tierCount >= target;

    case 'discover_region':
      const regionCount = await tx.userDiscoveries.count({
        where: {
          user_id: userId,
          oreum: { region: criteria.region, is_top_100: true }
        }
      });
      const regionTotal = criteria.count === 'all'
        ? await getTotalOreumsByRegion(criteria.region, tx)
        : criteria.count;
      return regionCount >= regionTotal;

    case 'discover_season':
      const seasonCount = await tx.userDiscoveries.count({
        where: {
          user_id: userId,
          // 발견 시점이 해당 시즌인지 (월 기반 판정)
          discovered_at: getSeasonDateRange(criteria.season)
        }
      });
      return seasonCount >= criteria.count;

    case 'discover_time_of_day':
      // 인증 시점의 시간대 분석
      const timeCount = await tx.userDiscoveries.count({
        where: {
          user_id: userId,
          // EXTRACT(HOUR FROM discovered_at) 활용
          ...timeOfDayCondition(criteria.time_of_day)
        }
      });
      return timeCount >= criteria.count;

    case 'photo_uploaded':
      const photoQuery = {
        where: {
          uploaded_by: userId,
          ...(criteria.approved_only ? { approval_status: 'approved' } : {})
        }
      };
      const photoCount = await tx.oreumVisuals.count(photoQuery);
      return photoCount >= criteria.count;

    case 'photo_promoted':
      // 대표 사진으로 채택된 사진 수
      const promotedCount = await tx.oreumVisuals.count({
        where: { uploaded_by: userId, is_representative: true }
      });
      return promotedCount >= criteria.count;

    case 'photo_first_for_oreum':
      // 어떤 오름의 첫 사진 기록자가 된 적 있는지
      const firstPhotos = await tx.$queryRaw`
        SELECT COUNT(DISTINCT oreum_id) as cnt
        FROM (
          SELECT oreum_id, uploaded_by,
                 ROW_NUMBER() OVER (PARTITION BY oreum_id ORDER BY created_at) as rn
          FROM oreum_visuals
          WHERE uploaded_by IS NOT NULL
            AND approval_status = 'approved'
        ) t
        WHERE rn = 1 AND uploaded_by = ${userId}
      `;
      return firstPhotos[0].cnt >= criteria.count;

    case 'comment_promoted_to_tip':
      const tipCount = await tx.userComments.count({
        where: { user_id: userId, is_promoted_to_tip: true }
      });
      return tipCount >= criteria.count;

    case 'meta_badges':
      // 다른 배지들이 모두 있는지
      const requiredCodes = criteria.required;
      const userBadgeCodes = await getUserBadgeCodes(userId, tx);
      return requiredCodes.every(code => userBadgeCodes.includes(code));

    case 'challenge_completed':
      const challengeDone = await tx.userChallenges.findFirst({
        where: { user_id: userId, challenge_id: criteria.challenge_id, status: 'completed' }
      });
      return !!challengeDone;

    default:
      return false;
  }
}
```

### 1.7 배지 획득 모먼트

```
[배지 조건 충족 감지]
    ↓
[발견 모먼트가 끝난 후 배지 모달 등장]
    ↓
[배지 모달 (3초 자동 닫힘)]
- 배지 일러스트 큰 사이즈 (200×200)
- 회전·빛나는 효과
- 배지 이름 + 설명
- "공유하기" 버튼
- "닫기" 또는 자동 닫힘
    ↓
[모달 닫힘 후]
- 마이 탭 배지 영역에 추가
- 알림 배지 (마이 탭에 빨간 점)
```

### 1.8 배지 진열 (마이 탭)

`04_mypage_collection.md` 5.5 참조.

```
"획득한 배지" 섹션
- 8/24 표시
- 그리드 4열
- 획득: 풀컬러 + 빛나는 효과
- 미획득: 흑백 + 잠금 아이콘

탭 시:
- 획득 배지: 획득일, 트리거 정보
- 미획득 배지: 획득 조건 안내, 진척도 ("3/5 완료")
```

### 1.9 배지 진열 사용자 지정

```
[마이 탭 → 배지 진열 설정]
    ↓
[전시할 배지 6개 선택]
- 마이 탭 메인에 표시
- "이 사용자의 메인 배지" 형태
```

페이즈 2 이후 검토.

---

## 2. 챌린지 시스템

### 2.1 챌린지 종류

| 타입 | 설명 | 기간 |
|------|------|------|
| **이주의 미션** (`weekly`) | 짧은 단기 도전 | 1주 |
| **이달의 미션** (`monthly`) | 중기 도전 | 1개월 |
| **시즌 한정** (`seasonal`) | 3개월 시즌 도전 | 3개월 |
| **히든 챌린지** (`hidden`) | 특정 조건 달성 시 등장 | 가변 |
| **영구** (`permanent`) | 항상 도전 가능 | 무기한 |

### 2.2 챌린지 예시

#### 이주의 미션 예시

| 제목 | 조건 | 보상 |
|------|------|------|
| 동부 일출 3선 | 동부 일출 명소 3개 (다랑쉬, 용눈이, 따라비) | 일출 추적자 배지 진척도 |
| 봄 벚꽃 코스 | 4월에 벚꽃 명소 3개 | 한정 배지 |
| 비기너 첫 도전 | 비기너 영역에서 5개 발견 | 비기너 마스터 진척도 + 격려 메시지 |

#### 이달의 미션 예시

| 제목 | 조건 | 보상 |
|------|------|------|
| 5월의 장미 | 5월에 5개 오름 + 사진 5장 | 한정 배지 + 굿즈 권한 |
| 우중 산책 | 비 오는 날 오름 1개 인증 | 히든 트리거 |
| 새 친구 사귀기 | 미발견 오름 3개 | 격려 |

#### 시즌 한정 예시

| 제목 | 조건 | 보상 |
|------|------|------|
| 가을의 절정 | 9~11월에 단풍 명소 5개 | 가을 한정 배지 + 한정 굿즈 권한 |
| 겨울 탐험 시즌 | 12~2월에 10개 오름 | 겨울 한정 배지 |

#### 히든 챌린지 예시

| 트리거 | 챌린지 | 보상 |
|--------|--------|------|
| 비 오는 날 인증 시 등장 | "비의 탐험자" - 비 오는 날 3개 | "비의 탐험자" 배지 |
| 정상 인증 50개 달성 시 | "고독한 정상" - 야간 인증 1개 | "야간 산책자" 배지 |
| 사진 30장 업로드 시 | "사진가의 길" - 카테고리별 1장씩 | "카테고리 마스터" 배지 |

#### 영구 챌린지 예시

| 제목 | 조건 |
|------|------|
| 100선 정복 | 모든 100선 발견 (centurion 배지 연계) |
| 모든 지역 마스터 | 5개 지역 모두 |

### 2.3 챌린지 정의

`01_data_model.md` 5.3 challenges 테이블 참조.

```sql
CREATE TABLE challenges (
  id, code, title, description, cover_image_url,

  challenge_type, -- 'weekly' | 'monthly' | 'seasonal' | 'hidden' | 'permanent'

  starts_at, ends_at,

  -- 조건 정의
  required_oreums UUID[], -- 모두 방문 필요
  required_count INT,     -- N개 중 X개
  available_oreums UUID[], -- N의 후보군
  required_photo_count INT, -- 사진 X장 필요
  required_comment_count INT, -- 코멘트 X개 필요

  -- 시간·상황 조건
  time_constraints JSONB, -- {month: 5, hours: [5, 7]}
  weather_constraints JSONB, -- {must_be: 'rain'}

  unlock_condition JSONB, -- 히든 챌린지 등장 조건

  -- 보상
  reward_badge_id UUID,
  reward_goods_unlock TEXT,
  reward_message TEXT,

  is_active, display_order, created_by, created_at, updated_at
);
```

### 2.4 챌린지 진행도 계산

```typescript
async function calculateChallengeProgress(
  userChallenge: UserChallenge,
  challenge: Challenge,
  tx: Transaction
): Progress {
  const userId = userChallenge.user_id;

  // 발견 진행도
  let discoveryProgress = 0;
  let discoveryTotal = 0;

  if (challenge.required_oreums?.length) {
    const requiredIds = challenge.required_oreums;
    const found = await tx.userDiscoveries.count({
      where: {
        user_id: userId,
        oreum_id: { in: requiredIds }
      }
    });
    discoveryProgress = found;
    discoveryTotal = requiredIds.length;
  } else if (challenge.required_count && challenge.available_oreums?.length) {
    const found = await tx.userDiscoveries.count({
      where: {
        user_id: userId,
        oreum_id: { in: challenge.available_oreums },
        // 챌린지 시작 후 발견한 것만 카운트
        discovered_at: { gte: userChallenge.joined_at }
      }
    });
    discoveryProgress = Math.min(found, challenge.required_count);
    discoveryTotal = challenge.required_count;
  }

  // 사진 진행도
  let photoProgress = 0;
  let photoTotal = 0;
  if (challenge.required_photo_count) {
    const photoCount = await tx.oreumVisuals.count({
      where: {
        uploaded_by: userId,
        approval_status: 'approved',
        created_at: { gte: userChallenge.joined_at }
      }
    });
    photoProgress = Math.min(photoCount, challenge.required_photo_count);
    photoTotal = challenge.required_photo_count;
  }

  // 시간/날씨 조건 체크
  // ... (필요 시)

  return {
    discoveryProgress,
    discoveryTotal,
    photoProgress,
    photoTotal,
    is_completed: discoveryProgress >= discoveryTotal && photoProgress >= photoTotal,
    completion_percent: calculatePercent({...})
  };
}
```

### 2.5 챌린지 자동 완료 처리

```
[사용자가 오름 인증]
    ↓
[활성 챌린지 가져오기]
    ↓
[각 챌린지에 대해 진행도 재계산]
    ↓
[조건 만족 시]
- user_challenges.status = 'completed'
- user_challenges.completed_at = now()
- 보상 배지 자동 지급
- 굿즈 권한 잠금 해제 (해당 시)
- feed_events 'challenge_completed' 기록
- 챌린지 완료 모먼트 트리거
```

### 2.6 히든 챌린지 트리거

```typescript
// 사용자 활동 시마다 체크
async function checkHiddenChallenges(userId: string, event: TriggerEvent) {
  const hiddenChallenges = await db.challenges.findMany({
    where: { challenge_type: 'hidden', is_active: true }
  });

  for (const challenge of hiddenChallenges) {
    const alreadyJoined = await db.userChallenges.findFirst({
      where: { user_id: userId, challenge_id: challenge.id }
    });
    if (alreadyJoined) continue;

    if (await evaluateUnlockCondition(userId, challenge.unlock_condition, event)) {
      // 챌린지 등장
      await sendNotification(userId, {
        type: 'hidden_challenge_unlocked',
        title: `새 챌린지가 등장했어요!`,
        body: challenge.title,
        action_url: `/challenges/${challenge.id}`
      });
    }
  }
}
```

#### 히든 챌린지 트리거 조건 예시

```json
// 비 오는 날 인증 시
{
  "type": "weather_match",
  "condition": "rain"
}

// 발견 50개 달성 시
{
  "type": "discovery_milestone",
  "count": 50
}

// 특정 시간대에 인증 시
{
  "type": "time_of_day",
  "hours": [20, 4]
}

// 사진 30장 업로드 시
{
  "type": "photo_milestone",
  "count": 30
}
```

### 2.7 챌린지 화면

#### A. 챌린지 목록 (`/challenges`)

```
[탭 영역]
[ 진행 중 ] [ 완료 ] [ 추천 ]

진행 중:
┌────────────────────────────────────┐
│ [커버 이미지]                       │
│ 동부 일출 3선                        │
│ 7일 남음                            │
│ 진척도 ▓▓▓░░ 60% (3/5)               │
│ [보상: 일출 추적자 배지]              │
└────────────────────────────────────┘

추천 (참여 안 함):
┌────────────────────────────────────┐
│ [커버 이미지]                       │
│ 5월의 장미                          │
│ 5/31까지                            │
│ 1,247명이 참여 중                    │
│ [참여하기]                          │
└────────────────────────────────────┘
```

#### B. 챌린지 상세 (`/challenges/{id}`)

```
[헤더 이미지 (커버, 다크 오버레이)]
- 제목, 부제, 마감일

[챌린지 정보]
- 설명
- 조건 (오름 리스트, 사진/코멘트 요건)
- 기간

[진척도]
- 발견: 3/5
- 시각적 진척도 (오름 카드 그리드, 발견된 것만 컬러)

[참여자 수]
"1,247명이 함께 도전 중"

[보상]
- 한정 배지
- 굿즈 구매 권한 (있다면)

[액션]
[ 참여하기 ] (참여 전)
[ 완료 / 진행 중 ] (참여 중)
[ 결과 공유 ] (완료 후)
```

#### C. 홈 탭의 챌린지 카드 (`04_mypage_collection.md` 2.9)

진행 중인 챌린지 1개 노출. 다음 목적지 안내.

### 2.8 챌린지 완료 모먼트

```
[챌린지 완료 감지]
    ↓
[큰 모먼트 애니메이션 (3초)]
- 풀 화면 오버레이
- "챌린지 완주!" 큰 텍스트
- 챌린지 보상 배지 등장
- 굿즈 권한 잠금 해제 알림
    ↓
[정산 화면]
- 챌린지 제목, 소요 시간
- 참여 시작일 ~ 완료일
- 함께 완주한 사용자 수 ("234명과 함께 완주!")
- "결과 공유" 버튼
- "다른 챌린지 보기" 버튼
```

### 2.9 챌린지 공유

```
[공유 카드 자동 생성]
- 1080×1080 정사각
- 챌린지 제목 + 커버 이미지
- "○○○님이 챌린지를 완주했어요"
- 보상 배지 표시
- 사이트 워터마크
```

---

## 3. 챌린지 운영 (관리자 측)

### 3.1 챌린지 생성 도구

운영자 백오피스에서:

```
[챌린지 생성 폼]

기본 정보:
- 코드 (예: weekly_2026_05_w3)
- 제목
- 설명 (마크다운)
- 커버 이미지 업로드

타입 선택:
[ ] 이주의 / [ ] 이달의 / [ ] 시즌 / [ ] 히든 / [ ] 영구

기간:
- 시작일, 종료일
- 영구는 종료일 비움

조건 정의:
[조건 빌더 UI]
- 오름 선택 (모두 / N개 중 X개)
- 사진 N장 요구
- 시간/날씨 조건 (옵션)

보상:
- 배지 지정 또는 새로 생성
- 굿즈 권한 코드 (있다면)

미리보기:
- 사용자에게 보일 카드 미리 보기

[저장 → 활성화] 또는 [임시저장]
```

### 3.2 운영자 챌린지 추적

```
[활성 챌린지 대시보드]
- 챌린지명
- 참여자 수
- 완료자 수
- 평균 진척도
- 마감일

각 챌린지 클릭 → 상세 통계
```

### 3.3 챌린지 큐레이션 가이드

운영자가 챌린지 만들 때 고려할 점:
- **시즌 맞춤**: 봄에 벚꽃, 가을에 단풍 등
- **이슈 반영**: 새로 정비된 오름 홍보
- **난이도 적절**: 너무 쉽거나 어렵지 않게
- **참여 동기**: 보상이 매력적이게
- **건강한 게이미피케이션**: 무리한 일정 강요 X

---

## 4. 데이터 모델 (재확인)

### 4.1 user_badges

```sql
CREATE TABLE user_badges (
  id, user_id, badge_id,
  earned_at,
  trigger_event JSONB,
  is_displayed BOOLEAN DEFAULT true,

  UNIQUE(user_id, badge_id)
);
```

### 4.2 user_challenges

```sql
CREATE TABLE user_challenges (
  id, user_id, challenge_id,
  status TEXT, -- 'in_progress' | 'completed' | 'failed' | 'expired'
  progress JSONB, -- 상세 진행도
  joined_at, completed_at,

  UNIQUE(user_id, challenge_id)
);
```

### 4.3 user_goods_unlocks

페이즈 3 굿즈 구매 권한.

```sql
CREATE TABLE user_goods_unlocks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  goods_unlock_code TEXT NOT NULL,
  source_type TEXT, -- 'badge' | 'challenge'
  source_id UUID,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ, -- 구매 시점
  UNIQUE(user_id, goods_unlock_code)
);
```

---

## 5. API 명세

### 5.1 GET /api/me/badges

본인 배지 정보.

```typescript
{
  earned: Array<{
    badge: Badge;
    earned_at: string;
    trigger_event: object;
  }>;
  upcoming: Array<{ // 가까이 도달한 미획득 배지
    badge: Badge;
    progress: number; // 0~1
    progress_text: string; // "3/5"
  }>;
  total_count: number;
  earned_count: number;
}
```

### 5.2 GET /api/badges

모든 배지 정의.

```typescript
{
  badges: Array<Badge>;
  categories: ['discovery', 'collection', 'region', ...]
}
```

### 5.3 GET /api/challenges

활성 챌린지 목록.

**Query**:
```
?status=active|upcoming|completed
&type=weekly|monthly|seasonal|all
```

**Response**:
```typescript
{
  active: Array<Challenge & {
    user_status: 'not_joined' | 'in_progress' | 'completed';
    user_progress?: Progress;
    participant_count: number;
  }>;
}
```

### 5.4 GET /api/challenges/{id}

챌린지 상세.

### 5.5 POST /api/challenges/{id}/join

챌린지 참여.

```typescript
// Response
{
  user_challenge: UserChallenge;
  initial_progress: Progress; // 이미 일부 완료된 경우
}
```

### 5.6 GET /api/me/challenges

본인 참여 챌린지.

```typescript
{
  in_progress: Array<UserChallenge & { challenge: Challenge; progress: Progress }>;
  completed: Array<...>;
}
```

### 5.7 (관리자) POST /api/admin/challenges

챌린지 생성.

### 5.8 (관리자) PATCH /api/admin/challenges/{id}

챌린지 수정.

### 5.9 (관리자) GET /api/admin/challenges/{id}/stats

챌린지 통계.

```typescript
{
  participant_count: number;
  completed_count: number;
  completion_rate: number;
  average_progress: number;
  // ...
}
```

---

## 6. 알림·푸시

### 6.1 푸시 알림 트리거

| 이벤트 | 알림 |
|--------|------|
| 새 챌린지 등장 | "이주의 미션이 새로 등장했어요" |
| 히든 챌린지 등장 | "새로운 챌린지가 잠금 해제됐어요!" |
| 챌린지 마감 임박 | "챌린지가 3일 남았어요" |
| 챌린지 완료 | "챌린지를 완주했어요!" |
| 신규 배지 획득 | "새 배지를 획득했어요" |

### 6.2 푸시 알림 정책

`02_user_flows.md` 16.3 참조.
- 최소화 원칙
- 사용자 설정으로 ON/OFF
- 배지·챌린지 관련은 기본 ON

---

## 7. 인터랙션·애니메이션

### 7.1 배지 획득 모먼트

```
[배지 획득 트리거]
    ↓
[딜레이 500ms (이전 모먼트 완료 후)]
    ↓
[배경 다크닝]
    ↓
[배지 등장 애니메이션 (1.2초)]
- scale 0 → 1.2 → 1.0
- 회전 360°
- 빛나는 효과 (반짝임)
- 햅틱 피드백 (강한 진동)
    ↓
[배지 정보 페이드인]
- 배지 이름
- 설명
    ↓
[액션 버튼들 (3초 후)]
- "공유하기" / "닫기"
- 자동 닫힘 (5초 무반응 시)
```

### 7.2 챌린지 완료 모먼트

```
[챌린지 완료 감지]
    ↓
[발견 모먼트 + 배지 획득 모먼트가 끝난 후]
    ↓
[챌린지 완료 풀 화면 모먼트 (3초)]
- "챌린지 완주!" 큰 텍스트
- 챌린지 커버 이미지 + 모든 오름 카드 빛남
- 진척도 0 → 100% 빠르게 채움
- 보상 배지 강조
- 굿즈 권한 알림 (있다면)
- 박수 효과음 (옵션, 사용자 설정)
    ↓
[정산 화면]
```

### 7.3 진척도 애니메이션

```
[챌린지 진행 중 발견 시]
    ↓
[진척도 바 카운트 업]
- 50% → 60% (300ms ease-out)
    ↓
[발견된 오름 카드 강조 효과]
- 1초 펄스 애니메이션
```

---

## 8. 다국어 처리

### 8.1 배지·챌린지 텍스트

DB에 다국어 컬럼:
```sql
ALTER TABLE badges ADD COLUMN name_en TEXT;
ALTER TABLE badges ADD COLUMN name_ja TEXT;
ALTER TABLE badges ADD COLUMN description_en TEXT;
-- ...

ALTER TABLE challenges ADD COLUMN title_en TEXT;
ALTER TABLE challenges ADD COLUMN description_en TEXT;
-- ...
```

### 8.2 fallback

언어별 콘텐츠 부재 시 ko fallback.

---

## 9. 분석·KPI

### 9.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `badge_earned` | badge_code, trigger_type |
| `badge_modal_shown` | badge_code |
| `badge_shared` | badge_code, channel |
| `challenge_listed_viewed` | filter |
| `challenge_detail_viewed` | challenge_id |
| `challenge_joined` | challenge_id |
| `challenge_completed` | challenge_id, days_taken |
| `challenge_shared` | challenge_id |
| `hidden_challenge_unlocked` | challenge_id, trigger |

### 9.2 KPI

- 사용자당 평균 배지 수
- 배지 획득까지 평균 발견 수
- 챌린지 참여율
- 챌린지 완료율 (목표: 40%+)
- 히든 챌린지 발견율
- 챌린지 → 굿즈 전환률 (페이즈 3)

---

## 10. 테스트 시나리오

### 10.1 단위 테스트

- 각 배지 평가 조건 테스트
- 챌린지 진행도 계산
- 히든 챌린지 트리거 조건

### 10.2 통합 테스트

- 발견 → 배지 자동 획득 (E2E)
- 챌린지 참여 → 진행 → 완료 (E2E)
- 메타 배지 자동 트리거 (지역 마스터 5개 → 제주 마스터)

### 10.3 시나리오 테스트

- 비기너 30개 모두 발견 → beginner_master 자동 획득
- 동부 5개 발견 후 6번째 동부 인증 → 어떤 배지도 동시 획득
- 비 오는 날 인증 → 히든 챌린지 등장

---

## 11. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 배지 8개 카테고리 + 시드 데이터, 챌린지 5타입, 진행도 계산 알고리즘, 히든 챌린지, 운영 도구, 인터랙션, API 명세 | 기획+Claude |

---

## 12. 후속 작업

- 배지 일러스트 디자인 (24개 + 챌린지용)
- 챌린지 시드 데이터 작성 (출시 시점 5~10개 챌린지)
- 챌린지 생성 도구 백오피스 와이어프레임
- 배지 획득 모먼트 애니메이션 프로토타입
- 챌린지 완료 모먼트 애니메이션 프로토타입
- 히든 챌린지 트리거 조건 5~10개 큐레이션

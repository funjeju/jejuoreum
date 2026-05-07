# 01. Data Model

> 본 문서는 제주 오름 패스포트 프로젝트의 데이터베이스 스키마와 엔티티 관계를 정의한다.
> 모든 엔티티는 PostgreSQL (Supabase) 기준으로 작성되었다.
> API 응답 구조 또한 본 문서를 단일 진실 공급원(SSOT)으로 한다.

---

## 0. 설계 원칙

### 0.1 기본 원칙

1. **불변 ID 사용**: 모든 엔티티는 UUID v4 기본 키 사용. 외부 노출 시에도 안전.
2. **timestamp 표준**: 모든 엔티티에 `created_at`, `updated_at` 자동 관리.
3. **Soft Delete**: 사용자 데이터는 삭제 대신 `deleted_at` 표시 (복구 가능).
4. **JSONB 적극 활용**: 자주 바뀌는 비정형 데이터는 JSONB로 (Postgres의 강점).
5. **인덱스 우선 설계**: 자주 조회되는 컬럼은 인덱스 미리 설계.
6. **Row-Level Security (RLS)**: Supabase 기능 활용. 각 테이블에 정책 명시.

### 0.2 명명 규칙

- 테이블: `snake_case`, 복수형 (예: `oreums`, `user_discoveries`)
- 컬럼: `snake_case`, 단수형 (예: `created_at`, `oreum_id`)
- 인덱스: `idx_{테이블}_{컬럼}` (예: `idx_oreums_region`)
- 외래 키: `{관련엔티티}_id` (예: `user_id`, `oreum_id`)
- Boolean: `is_*` 또는 `has_*` 접두 (예: `is_published`, `has_parking`)

### 0.3 ID 전략

- **내부 식별자**: UUID v4
- **공개 식별자 (URL용)**: `slug` 컬럼 별도 운영
- 예: `/oreum/saebyeol` → 내부적으로는 UUID로 매핑

---

## 1. 엔티티 개요

총 21개 엔티티. 카테고리별로 정리.

### 사용자 영역
- `users` — 사용자 계정
- `user_profiles` — 사용자 프로필 상세
- `user_settings` — 사용자 설정 (공개 옵션 등)

### 오름 마스터 데이터
- `oreums` — 360개 오름 마스터
- `oreum_visuals` — 일러스트·사진 자산
- `oreum_routes` — 탐방로 정보
- `oreum_facilities` — 주차장·화장실 등 시설
- `oreum_links` — 오름 간 관계 (가까운, 추천 코스)

### 사용자 활동
- `user_discoveries` — 인증된 발견 기록 (도감의 본체)
- `user_photos` — 사용자 업로드 사진
- `user_comments` — 사용자 코멘트
- `user_wishlist` — 위시리스트
- `user_courses` — 사용자가 짠 코스

### 게이미피케이션
- `badges` — 배지 정의
- `user_badges` — 사용자 배지 획득 기록
- `challenges` — 챌린지 정의
- `user_challenges` — 챌린지 참여·완료 기록

### 커뮤니티·운영
- `feed_events` — 실시간 피드 이벤트
- `partner_merchants` — 제휴 상권 (참고용 메타만, 인증은 아날로그)
- `seo_contents` — SEO 콘텐츠 페이지
- `admin_users` — 관리자
- `audit_logs` — 운영 감사 로그

---

## 2. 사용자 영역

### 2.1 users

Supabase Auth와 연동. Auth 테이블의 `auth.users`를 참조.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  oauth_provider TEXT, -- 'kakao', 'naver', 'google'
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider);
```

**RLS 정책**:
- 자기 데이터는 자유롭게 read/update
- 다른 사용자의 데이터는 nickname, avatar_url만 read 가능

### 2.2 user_profiles

기본 사용자 정보 외 부가 데이터.

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  home_location_lat DOUBLE PRECISION, -- 출발지 기본값
  home_location_lng DOUBLE PRECISION,
  home_location_label TEXT, -- "제주공항", "서귀포 숙소" 등
  fitness_level SMALLINT DEFAULT 2, -- 1: 초보 ~ 5: 고수
  preferred_seasons TEXT[], -- ['spring', 'autumn']
  contributor_level SMALLINT DEFAULT 0, -- 사진 기여 등급
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 user_settings

```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  feed_visibility TEXT DEFAULT 'delay_10min',
    -- 'instant' | 'delay_10min' | 'private'
  show_exact_time BOOLEAN DEFAULT false, -- 정확 시간 노출 여부
  push_notification BOOLEAN DEFAULT true,
  email_notification BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'ko', -- 'ko' | 'en' | 'ja' | 'zh'
  language TEXT DEFAULT 'ko', -- 호환성용 (deprecated, preferred_language 사용)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. 오름 마스터 데이터

### 3.1 oreums

360개 오름 마스터 테이블. 100선·비100선 모두 포함.

```sql
CREATE TABLE oreums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- URL용 (예: 'saebyeol', 'darangshi')

  -- 다국어 이름 (글로벌 우선 설계 원칙)
  name_ko TEXT NOT NULL, -- 한글명 (필수)
  name_en TEXT, -- 영문명 (로마자, SEO에 중요)
  name_ja TEXT, -- 일본어명 (페이즈 4)
  name_zh TEXT, -- 중국어명 (페이즈 4)
  alt_names TEXT[], -- 별칭 (예: ['새벨오름', '효성악'])

  -- 분류
  is_top_100 BOOLEAN DEFAULT false, -- 100선 여부
  tier TEXT, -- 'beginner' | 'explorer' | 'master' | NULL(비100선)
  tier_order SMALLINT, -- 100선 내 번호 (1~100, 비100선은 NULL)
  region TEXT NOT NULL, -- 'east' | 'west' | 'south' | 'north' | 'central'
  district TEXT, -- 행정 구역 (예: '제주시 구좌읍')

  -- 위치
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geohash TEXT, -- 인근 검색 최적화용

  -- 지질·물리
  elevation_m INT, -- 표고 (해발)
  prominence_m INT, -- 비고 (상대 표고)
  crater_type TEXT, -- 'cone' | 'maar' | 'tuff_ring' | 'mixed' | 'none'
  formation_type TEXT, -- 형성 유형 텍스트 설명용

  -- 카드 정보 (다국어 지원)
  one_liner_ko TEXT, -- 한 줄 소개 (한국어)
  one_liner_en TEXT,
  one_liner_ja TEXT,
  one_liner_zh TEXT,
  difficulty SMALLINT, -- 난이도 1~5
  recommended_seasons TEXT[], -- ['spring', 'autumn']
  recommended_times TEXT[], -- ['sunrise', 'sunset']
  emotional_keywords TEXT[], -- ['오름의 여왕', '노을 명소']

  -- MBTI 매칭 (오름 MBTI 기능, 5.14)
  mbti TEXT, -- 'ENFJ', 'INTP' 등 16유형 중 하나
  mbti_secondary TEXT[], -- 보조 매칭 가능한 유형들 (선택)
  mbti_traits JSONB, -- {energy: 'extrovert', sensing: 'intuition', ...}

  -- 권한
  is_private_land BOOLEAN DEFAULT false,
  has_access_restriction BOOLEAN DEFAULT false,
  access_notes TEXT,

  -- 운영
  is_published BOOLEAN DEFAULT false, -- 공개 여부
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oreums_slug ON oreums(slug);
CREATE INDEX idx_oreums_is_top_100 ON oreums(is_top_100);
CREATE INDEX idx_oreums_tier ON oreums(tier);
CREATE INDEX idx_oreums_region ON oreums(region);
CREATE INDEX idx_oreums_geohash ON oreums(geohash);
CREATE INDEX idx_oreums_lat_lng ON oreums(latitude, longitude); -- 거리 계산용
CREATE INDEX idx_oreums_mbti ON oreums(mbti); -- MBTI 매칭용
```

**RLS 정책**: `is_published = true`인 row는 모두 read 가능. write는 관리자만.

### 3.2 oreum_visuals

일러스트와 사진 자산. 한 오름에 여러 비주얼이 붙을 수 있음.

```sql
CREATE TABLE oreum_visuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL,
    -- 'card_illustration' (카드 일러스트, 1개 필수)
    -- 'cover_photo' (페이지 헤더용 사진)
    -- 'gallery_photo' (갤러리용)
    -- 'route_photo' (탐방로 사진)
    -- 'parking_photo' | 'entrance_photo' | 'summit_photo' | 'crater_photo'
  category TEXT, -- 사진 분류 결과 (AI 분류)
  url TEXT NOT NULL, -- Supabase Storage 또는 CDN URL
  thumbnail_url TEXT,
  blur_hash TEXT, -- 로딩 시 placeholder

  -- 메타
  width INT,
  height INT,
  file_size_bytes INT,

  -- AI 일러스트 메타 (visual_type = 'card_illustration')
  ai_seed BIGINT,
  ai_prompt TEXT,
  ai_prompt_version TEXT, -- 'v1', 'v2' 등
  ai_model TEXT, -- 'midjourney_v6', 'sd_xl' 등
  source_photo_refs JSONB, -- [{type:'own'|'web', url, license}]

  -- AI 사진 분류 메타
  ai_quality_score FLOAT, -- 0.0 ~ 1.0
  ai_season TEXT, -- 'spring', 'summer', 'autumn', 'winter'
  ai_time_of_day TEXT, -- 'dawn', 'morning', 'afternoon', 'sunset', 'night'

  -- 큐레이션
  is_representative BOOLEAN DEFAULT false, -- 카드 대표 사진 여부
  uploaded_by UUID REFERENCES users(id), -- 사용자 기여 시
  approved_by UUID REFERENCES admin_users(id),
  approval_status TEXT DEFAULT 'pending',
    -- 'pending' | 'approved' | 'rejected'
  display_order INT DEFAULT 0,

  taken_at TIMESTAMPTZ, -- 촬영 시점
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oreum_visuals_oreum_id ON oreum_visuals(oreum_id);
CREATE INDEX idx_oreum_visuals_type ON oreum_visuals(visual_type);
CREATE INDEX idx_oreum_visuals_status ON oreum_visuals(approval_status);
CREATE INDEX idx_oreum_visuals_uploaded_by ON oreum_visuals(uploaded_by);
```

**중요**: 각 오름은 **반드시** `visual_type='card_illustration'`인 row가 1개 존재해야 함 (페이즈 0 작업 항목).

### 3.3 oreum_routes

탐방로 정보. 한 오름에 여러 코스가 있을 수 있음.

```sql
CREATE TABLE oreum_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  route_name TEXT, -- '메인 코스', '북쪽 우회 코스' 등
  is_main BOOLEAN DEFAULT false, -- 메인 코스 여부
  distance_m INT, -- 거리 (미터)
  duration_min INT, -- 소요 시간 (분)
  elevation_gain_m INT, -- 누적 표고차
  difficulty SMALLINT, -- 1~5

  surface_breakdown JSONB,
    -- {dirt: 0.6, stairs: 0.2, deck: 0.2}
  has_stairs BOOLEAN,
  has_deck BOOLEAN,
  is_loop BOOLEAN, -- 순환 코스 여부

  gpx_url TEXT, -- GPX 트랙 파일

  description TEXT, -- 코스 설명
  warnings TEXT[], -- 주의 사항 배열

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oreum_routes_oreum_id ON oreum_routes(oreum_id);
```

### 3.4 oreum_facilities

주차장·화장실·매점 등 시설 정보.

```sql
CREATE TABLE oreum_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  facility_type TEXT NOT NULL,
    -- 'parking' | 'restroom' | 'kiosk' | 'shelter' | 'sign'
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity INT, -- 주차장 수용 대수 등
  is_free BOOLEAN DEFAULT true,
  fee_amount INT, -- 유료 시 금액 (원)
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_oreum_facilities_oreum_id ON oreum_facilities(oreum_id);
CREATE INDEX idx_oreum_facilities_type ON oreum_facilities(facility_type);
```

### 3.5 oreum_links

오름 간 관계. SEO 내부 링크, 추천 코스, "주변 함께 가볼 곳"에 활용.

```sql
CREATE TABLE oreum_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  to_oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
    -- 'nearby' (가까운 오름)
    -- 'similar_difficulty' (유사 난이도)
    -- 'same_region' (같은 지역)
    -- 'recommended_combo' (추천 코스 조합)
    -- 'similar_view' (유사한 풍경)
  weight FLOAT DEFAULT 1.0, -- 관련도 가중치
  distance_km FLOAT, -- 직선 거리
  notes TEXT,
  is_auto_generated BOOLEAN DEFAULT true, -- 시스템 자동 생성 vs 수동 큐레이션
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_oreum_id, to_oreum_id, link_type)
);

CREATE INDEX idx_oreum_links_from ON oreum_links(from_oreum_id);
CREATE INDEX idx_oreum_links_to ON oreum_links(to_oreum_id);
CREATE INDEX idx_oreum_links_type ON oreum_links(link_type);
```

**자동 생성 규칙** (페이즈 0 배치 작업):
- `nearby`: 직선 거리 5km 이내 오름 자동 연결
- `same_region`: 같은 region 오름 자동 연결
- `similar_difficulty`: difficulty ±1 같은 region 오름 자동 연결

---

## 4. 사용자 활동

### 4.1 user_discoveries

인증된 발견 기록. **도감의 본체**. 흑백→컬러 전환의 데이터 근거.

```sql
CREATE TABLE user_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,

  -- 인증 정보
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_method TEXT NOT NULL,
    -- 'gps' (GPS 자동 매칭)
    -- 'manual_select' (사용자가 후보 중 선택)
    -- 'manual_add' (위시리스트에서 직접 추가)
  verification_distance_m FLOAT, -- 인증 시점 오름까지 거리
  verification_lat DOUBLE PRECISION, -- 인증 시점 사용자 좌표
  verification_lng DOUBLE PRECISION,

  -- 사용자 기록
  user_note TEXT, -- 짧은 메모
  weather_snapshot JSONB, -- 인증 시점 날씨 (자동 캡처)
    -- {condition: 'clear', temp: 15.2, ...}

  -- 공개 옵션 (각 인증마다 별도 설정 가능)
  visibility TEXT DEFAULT 'follow_settings',
    -- 'follow_settings' (사용자 설정 따름)
    -- 'instant' | 'delay_10min' | 'private' (개별 override)

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, oreum_id) -- 한 오름은 한 번만 발견
);

CREATE INDEX idx_user_discoveries_user_id ON user_discoveries(user_id);
CREATE INDEX idx_user_discoveries_oreum_id ON user_discoveries(oreum_id);
CREATE INDEX idx_user_discoveries_discovered_at ON user_discoveries(discovered_at DESC);
```

**중요 비즈니스 규칙**:
- UNIQUE 제약으로 중복 발견 방지
- 첫 발견만 카운트, 재방문은 별도 테이블에 기록 (필요 시 추가)

### 4.2 user_photos

사용자 업로드 사진. `oreum_visuals`에 기록되며 `uploaded_by`로 연결.
별도 테이블 불필요. 단, 사용자별 빠른 조회를 위해 view 제공.

```sql
CREATE VIEW user_photos AS
SELECT
  ov.*,
  o.name_ko AS oreum_name,
  o.slug AS oreum_slug
FROM oreum_visuals ov
JOIN oreums o ON o.id = ov.oreum_id
WHERE ov.uploaded_by IS NOT NULL;
```

### 4.3 user_comments

사용자 코멘트. 사진과 별개로 텍스트만 등록 가능.

```sql
CREATE TABLE user_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  discovery_id UUID REFERENCES user_discoveries(id), -- 인증과 연계 시
  photo_id UUID REFERENCES oreum_visuals(id), -- 사진 코멘트인 경우

  content TEXT NOT NULL,
  comment_type TEXT, -- AI 분류 결과
    -- 'tip' (현장 팁)
    -- 'review' (감상)
    -- 'warning' (주의 정보)
    -- 'photo_caption' (사진 설명)

  -- AI 분석 결과
  ai_keywords TEXT[], -- ['진흙', '미끄러움']
  ai_sentiment TEXT, -- 'positive' | 'neutral' | 'negative'
  ai_quality_score FLOAT, -- 0.0~1.0 (정보 가치)

  -- 큐레이션
  is_promoted_to_tip BOOLEAN DEFAULT false, -- 팁으로 승격 여부
  promoted_by UUID REFERENCES admin_users(id),
  promoted_at TIMESTAMPTZ,

  -- 공개
  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_user_comments_user_id ON user_comments(user_id);
CREATE INDEX idx_user_comments_oreum_id ON user_comments(oreum_id);
CREATE INDEX idx_user_comments_promoted ON user_comments(is_promoted_to_tip);
CREATE INDEX idx_user_comments_created_at ON user_comments(created_at DESC);
```

### 4.4 user_wishlist

위시리스트 (다음 오름 후보).

```sql
CREATE TABLE user_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  priority SMALLINT DEFAULT 0, -- 사용자 정렬용
  added_note TEXT, -- 추가 시 메모 ("정상에서 본 오름")
  source TEXT, -- 'ar_screen' | 'card_page' | 'recommendation' | 'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, oreum_id)
);

CREATE INDEX idx_user_wishlist_user_id ON user_wishlist(user_id);
CREATE INDEX idx_user_wishlist_priority ON user_wishlist(user_id, priority);
```

### 4.5 user_courses

사용자가 짠 코스 (위시리스트 → 동선 설계).

```sql
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,

  -- 출발지
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  start_label TEXT,

  -- 코스 구성 (순서 보존)
  oreum_ids UUID[] NOT NULL, -- 순서 있는 배열
  estimated_duration_min INT,
  estimated_distance_km FLOAT,

  -- 진행 상태 (코스 활성화 시)
  is_active BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_step SMALLINT DEFAULT 0,

  -- 공유
  share_token TEXT UNIQUE, -- 공유 URL용 토큰
  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_share_token ON user_courses(share_token);
CREATE INDEX idx_user_courses_active ON user_courses(user_id, is_active);
```

---

## 5. 게이미피케이션

### 5.1 badges

배지 정의. 시드 데이터로 미리 입력.

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
    -- 'first_discovery'
    -- 'region_master_east' | 'region_master_west' | ...
    -- 'beginner_master' | 'explorer_master'
    -- 'season_master_winter' | ...
    -- 'recorder' | 'archivist' | 'curator' | 'pioneer'
    -- 'jeju_master' (메타 배지)
  name_ko TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  badge_type TEXT NOT NULL,
    -- 'discovery' | 'collection' | 'region' | 'season'
    -- 'contribution' | 'challenge' | 'meta'
  rarity SMALLINT DEFAULT 1, -- 1: 흔함 ~ 5: 전설
  unlock_criteria JSONB NOT NULL,
    -- {type: 'discover_count', count: 1}
    -- {type: 'discover_region', region: 'east', count: 'all'}
    -- {type: 'discover_season', season: 'winter', count: 5}
    -- {type: 'photo_uploaded', count: 50}
    -- {type: 'meta_badges', required: ['region_master_east', ...]}
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_badges_code ON badges(code);
CREATE INDEX idx_badges_type ON badges(badge_type);
```

### 5.2 user_badges

사용자가 획득한 배지.

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  trigger_event JSONB,
    -- 어떤 사건으로 획득했는지 기록
    -- {type: 'discovery', oreum_id: '...'}
  is_displayed BOOLEAN DEFAULT true, -- 마이페이지 노출 여부
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
```

### 5.3 challenges

챌린지 정의. 운영자가 백오피스에서 생성.

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  challenge_type TEXT NOT NULL,
    -- 'weekly' | 'monthly' | 'seasonal' | 'hidden' | 'permanent'

  -- 기간
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- 조건
  required_oreums UUID[], -- 모든 오름 방문 필요한 챌린지 (순서 무관)
  required_count INT, -- N개 중 X개 같은 형식
  available_oreums UUID[], -- required_count와 함께 쓰일 후보군

  unlock_condition JSONB, -- 히든 챌린지의 등장 조건
    -- {type: 'discovery_count', min: 10}
    -- {type: 'weather', condition: 'rain'}

  -- 보상
  reward_badge_id UUID REFERENCES badges(id),
  reward_goods_unlock TEXT, -- 굿즈 구매 권한 코드

  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_challenges_code ON challenges(code);
CREATE INDEX idx_challenges_active ON challenges(is_active, starts_at, ends_at);
```

### 5.4 user_challenges

```sql
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id),

  status TEXT DEFAULT 'in_progress',
    -- 'in_progress' | 'completed' | 'failed' | 'expired'
  progress JSONB,
    -- {completed: ['oreum_id_1', ...], total: 5}
  joined_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
```

### 5.5 mbti_questions

오름 MBTI 설문 문항 정의. 시드 데이터로 미리 입력.

```sql
CREATE TABLE mbti_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_order SMALLINT NOT NULL UNIQUE, -- 1~10
  dimension TEXT NOT NULL, -- 'EI' | 'SN' | 'TF' | 'JP'

  -- 다국어 질문/선택지
  question_ko TEXT NOT NULL,
  question_en TEXT,
  question_ja TEXT,
  question_zh TEXT,

  -- 두 선택지 (하나는 첫 글자, 하나는 두 번째 글자에 해당)
  option_a_text_ko TEXT NOT NULL,
  option_a_text_en TEXT,
  option_a_text_ja TEXT,
  option_a_text_zh TEXT,
  option_a_value TEXT NOT NULL, -- 'E' | 'S' | 'T' | 'J' 중 하나

  option_b_text_ko TEXT NOT NULL,
  option_b_text_en TEXT,
  option_b_text_ja TEXT,
  option_b_text_zh TEXT,
  option_b_value TEXT NOT NULL, -- 'I' | 'N' | 'F' | 'P' 중 하나

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mbti_questions_order ON mbti_questions(question_order);
```

**시드 데이터 예시 (10문항)**:
- 차원 분포: EI 3문항, SN 3문항, TF 2문항, JP 2문항 (총 10)
- 오름 탐방 맥락 활용:
  - "정상에 도착했을 때, 당신은? A) 주변 사람들과 풍경을 나눈다 / B) 혼자 조용히 풍경을 음미한다" (EI)
  - "오름 정보를 볼 때, 당신은? A) 정확한 거리·시간 데이터를 본다 / B) 분위기와 감성 키워드를 본다" (SN)
  - 등등

### 5.6 user_quiz_results

사용자 MBTI 퀴즈 결과 기록.

```sql
CREATE TABLE user_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- 비회원 가능 (NULL)
  session_id TEXT, -- 비회원 식별용 (브라우저 세션)

  -- MBTI 결과
  mbti_result TEXT NOT NULL, -- 'ENFJ' 등
  dimension_scores JSONB NOT NULL,
    -- {EI: {E: 2, I: 1}, SN: {S: 0, N: 3}, ...}

  -- 보조 답변 (지역, 난이도, 계절 선호)
  preferred_region TEXT, -- 'east' | 'west' | ... | 'any'
  preferred_difficulty SMALLINT, -- 1~5 또는 NULL
  preferred_season TEXT, -- 'spring' | ... | 'any'
  preferred_time TEXT, -- 'sunrise' | ... | 'any'

  -- 추천 결과 (캐시)
  recommended_oreum_ids UUID[], -- 추천된 1~3개 오름

  -- 메타
  raw_answers JSONB, -- 원본 답변 데이터
  completed_at TIMESTAMPTZ DEFAULT now(),
  shared_at TIMESTAMPTZ, -- SNS 공유 시점

  -- 분석용
  utm_source TEXT,
  referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_quiz_results_user ON user_quiz_results(user_id);
CREATE INDEX idx_user_quiz_results_session ON user_quiz_results(session_id);
CREATE INDEX idx_user_quiz_results_mbti ON user_quiz_results(mbti_result);
CREATE INDEX idx_user_quiz_results_completed ON user_quiz_results(completed_at DESC);
```

**RLS 정책**:
- 본인 결과는 본인만 read
- 비회원 결과는 session_id 매칭으로 접근
- 통계 집계는 별도 view (개인 식별 불가)

**가입 시 비회원 결과 인계**:
- 사용자가 비회원으로 퀴즈 → 가입 → `session_id` 매칭으로 user_id 채워줌
- 이를 통해 가입 즉시 첫 추천 오름이 마이페이지에 노출

---

## 6. 커뮤니티·운영

### 6.1 feed_events

실시간 인증 피드용 이벤트 저장.

```sql
CREATE TABLE feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
    -- 'discovery' | 'badge_earned' | 'course_completed'
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  oreum_id UUID REFERENCES oreums(id),
  badge_id UUID REFERENCES badges(id),
  course_id UUID REFERENCES user_courses(id),

  -- 공개 시점 제어
  occurred_at TIMESTAMPTZ NOT NULL,
  publish_at TIMESTAMPTZ NOT NULL, -- 10분 딜레이 시 occurred_at + 10min
  visibility TEXT NOT NULL,
    -- 'public' | 'private' (사용자 설정에 따라 자동)

  -- 캐시된 정보 (피드 빠른 노출용)
  user_nickname TEXT,
  user_avatar_url TEXT,
  oreum_name TEXT,
  oreum_slug TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_events_publish_at ON feed_events(publish_at DESC, visibility);
CREATE INDEX idx_feed_events_user_id ON feed_events(user_id);
CREATE INDEX idx_feed_events_oreum_id ON feed_events(oreum_id);
```

**중요**: `publish_at`이 현재 시각 이후면 피드에 노출 안 됨. 배치 또는 쿼리 시 `WHERE publish_at <= now()` 적용.

### 6.2 partner_merchants

제휴 상권 메타. **인증 자체는 아날로그**, 본 테이블은 사용자에게 매장 정보 보여줄 때만 사용.

```sql
CREATE TABLE partner_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  merchant_type TEXT,
    -- 'cafe' | 'restaurant' | 'guesthouse' | 'shop' | 'convenience'
  description TEXT,

  -- 위치
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geohash TEXT,

  -- 영업 정보
  business_hours JSONB, -- {mon: '09:00-18:00', ...}
  contact_phone TEXT,
  website_url TEXT,
  instagram_handle TEXT,

  -- 비주얼
  cover_image_url TEXT,

  -- 제휴 관리
  partnership_status TEXT DEFAULT 'active',
    -- 'active' | 'inactive' | 'pending'
  partnership_started_at DATE,
  partnership_expires_at DATE,
  annual_fee_paid BOOLEAN DEFAULT false,

  -- 연관 오름 (가까운 오름과 묶기)
  related_oreum_ids UUID[],

  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partner_merchants_status ON partner_merchants(partnership_status);
CREATE INDEX idx_partner_merchants_geohash ON partner_merchants(geohash);
CREATE INDEX idx_partner_merchants_oreums ON partner_merchants USING GIN(related_oreum_ids);
```

### 6.3 seo_contents

SEO 콘텐츠 페이지 (360개). 상세는 `18_seo_content.md` 참조.

```sql
CREATE TABLE seo_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oreum_id UUID UNIQUE REFERENCES oreums(id) ON DELETE CASCADE,
    -- 오름별 페이지: oreum_id 필수
    -- 허브/카테고리 페이지: oreum_id NULL

  page_type TEXT NOT NULL,
    -- 'oreum' (개별 오름 페이지)
    -- 'hub' (허브 페이지)
    -- 'category' (카테고리 페이지)
  slug TEXT UNIQUE NOT NULL,

  -- SEO 메타
  meta_title TEXT NOT NULL, -- 60자 이내
  meta_description TEXT NOT NULL, -- 155자 이내
  meta_keywords TEXT[],
  og_image_url TEXT,

  -- 본문 (10개 섹션, 표준 구조)
  content_sections JSONB NOT NULL,
    -- [{section: 'overview', content: '...'},
    --  {section: 'introduction', content: '...'}, ...]

  -- 구조화 데이터
  structured_data JSONB, -- JSON-LD 객체

  -- 운영
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  last_edited_by UUID REFERENCES admin_users(id),

  -- 콘텐츠 제작 추적
  draft_source TEXT, -- 'auto_template' | 'ai_generated' | 'human_written'
  human_revised BOOLEAN DEFAULT false,
  revision_notes TEXT,

  -- 분석
  view_count BIGINT DEFAULT 0,
  search_impression_count BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_seo_contents_slug ON seo_contents(slug);
CREATE INDEX idx_seo_contents_published ON seo_contents(is_published);
CREATE INDEX idx_seo_contents_page_type ON seo_contents(page_type);
```

### 6.4 admin_users

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  role TEXT NOT NULL,
    -- 'super_admin' | 'editor' | 'curator' | 'merchant_manager'
  permissions JSONB,
    -- {can_publish: true, can_delete_users: false, ...}
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_admin_users_role ON admin_users(role);
```

### 6.5 audit_logs

운영 감사 로그.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL, -- 'user' | 'admin' | 'system'
  actor_id UUID,
  action TEXT NOT NULL,
    -- 'photo_approved' | 'comment_promoted' | 'oreum_published' 등
  target_type TEXT, -- 'oreum' | 'photo' | 'comment' | ...
  target_id UUID,
  changes JSONB, -- before/after
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

## 7. 엔티티 관계도

```
users ─┬─ user_profiles (1:1)
       ├─ user_settings (1:1)
       ├─ user_discoveries (1:N) ─── oreums
       ├─ user_wishlist (1:N) ────── oreums
       ├─ user_courses (1:N) ─────── oreums (배열)
       ├─ user_comments (1:N) ────── oreums
       ├─ user_badges (1:N) ──────── badges
       ├─ user_challenges (1:N) ──── challenges
       ├─ user_quiz_results (1:N) ── oreums (recommended_oreum_ids)
       ├─ feed_events (1:N)
       └─ oreum_visuals (1:N, uploaded_by)

oreums ─┬─ oreum_visuals (1:N)
        ├─ oreum_routes (1:N)
        ├─ oreum_facilities (1:N)
        ├─ oreum_links (M:N self-reference)
        ├─ seo_contents (1:1)
        ├─ partner_merchants (M:N via related_oreum_ids)
        └─ user_quiz_results (M:N via recommended_oreum_ids)

challenges ── user_challenges (1:N) ── users
badges ────── user_badges (1:N) ────── users
mbti_questions (시드 데이터, 사용자 활동 시 user_quiz_results 생성)

admin_users ── audit_logs (1:N actor)
```

---

## 8. 핵심 비즈니스 로직 (DB 레벨)

### 8.1 오름 발견 처리

사용자가 인증 시 다음이 트랜잭션으로 처리되어야 함:

```sql
BEGIN;

-- 1. user_discoveries 삽입
INSERT INTO user_discoveries (user_id, oreum_id, ...) VALUES (...);

-- 2. feed_events 삽입 (delay_10min 사용자라면 publish_at = now() + 10min)
INSERT INTO feed_events (...) VALUES (...);

-- 3. 배지 트리거 체크 (서버 로직 또는 트리거)
-- 'first_discovery', 'beginner_master' 등 조건 만족 확인
-- 만족 시 user_badges 삽입 + feed_events에 'badge_earned' 이벤트 추가

-- 4. 챌린지 진행도 업데이트
UPDATE user_challenges SET progress = ... WHERE ...;

COMMIT;
```

### 8.2 발견률 계산

자주 조회되는 값. View 또는 Materialized View로 제공.

```sql
CREATE VIEW user_discovery_stats AS
SELECT
  u.id AS user_id,
  COUNT(*) FILTER (WHERE o.is_top_100) AS total_discoveries,
  COUNT(*) FILTER (WHERE o.tier = 'beginner') AS beginner_count,
  COUNT(*) FILTER (WHERE o.tier = 'explorer') AS explorer_count,
  COUNT(*) FILTER (WHERE o.tier = 'master') AS master_count,
  COUNT(*) FILTER (WHERE o.region = 'east') AS east_count,
  COUNT(*) FILTER (WHERE o.region = 'west') AS west_count,
  COUNT(*) FILTER (WHERE o.region = 'south') AS south_count,
  COUNT(*) FILTER (WHERE o.region = 'north') AS north_count,
  COUNT(*) FILTER (WHERE o.region = 'central') AS central_count
FROM users u
LEFT JOIN user_discoveries ud ON ud.user_id = u.id
LEFT JOIN oreums o ON o.id = ud.oreum_id
GROUP BY u.id;
```

### 8.3 GPS 인근 오름 검색

QR 스캔 시 호출되는 핵심 쿼리.

```sql
-- 사용자 좌표로부터 거리 N미터 이내 오름 검색
SELECT
  o.*,
  -- 직선 거리 계산 (Haversine 근사, 단위: 미터)
  6371000 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(o.latitude - $user_lat) / 2), 2) +
    COS(RADIANS($user_lat)) * COS(RADIANS(o.latitude)) *
    POWER(SIN(RADIANS(o.longitude - $user_lng) / 2), 2)
  )) AS distance_m
FROM oreums o
WHERE o.is_top_100 = true
  AND o.is_published = true
ORDER BY distance_m ASC
LIMIT 5;
```

3단계 매칭 로직 (서버 코드):
- `distance_m < 300`: 자동 매칭
- `300 ≤ distance_m < 1000`: 후보 제시
- `distance_m >= 1000`: 메인 화면 안내

> 더 빠른 처리를 위해 PostGIS 확장 사용을 권장. `geography(Point)` 컬럼 + GIST 인덱스로 최적화 가능.

### 8.4 MBTI 매칭 알고리즘

오름 MBTI 추천 로직.

```sql
-- 1차: MBTI 정확 매칭 (100선 우선)
WITH primary_matches AS (
  SELECT *, 1 AS match_priority
  FROM oreums
  WHERE mbti = $user_mbti
    AND is_top_100 = true
    AND is_published = true
),
-- 2차: 보조 MBTI 매칭 (100선 우선)
secondary_matches AS (
  SELECT *, 2 AS match_priority
  FROM oreums
  WHERE $user_mbti = ANY(mbti_secondary)
    AND is_top_100 = true
    AND is_published = true
    AND id NOT IN (SELECT id FROM primary_matches)
),
-- 3차: 정확 매칭이지만 비100선
fallback_matches AS (
  SELECT *, 3 AS match_priority
  FROM oreums
  WHERE mbti = $user_mbti
    AND is_top_100 = false
    AND is_published = true
)
SELECT * FROM (
  SELECT * FROM primary_matches
  UNION ALL
  SELECT * FROM secondary_matches
  UNION ALL
  SELECT * FROM fallback_matches
) all_matches
ORDER BY
  match_priority,
  -- 보조 변수로 좁히기
  CASE WHEN region = $preferred_region THEN 0 ELSE 1 END,
  CASE WHEN $preferred_season = ANY(recommended_seasons) THEN 0 ELSE 1 END,
  CASE WHEN $preferred_difficulty IS NULL OR difficulty = $preferred_difficulty THEN 0 ELSE 1 END
LIMIT 3;
```

**알고리즘 단계**:
1. 사용자 MBTI 결정 (10문항 답변 분석)
2. 보조 답변 수집 (선호 지역, 난이도, 계절, 시간대)
3. 위 쿼리로 후보 검색
4. 상위 1~3개 추천
5. `user_quiz_results.recommended_oreum_ids`에 캐시

### 8.5 리듬 시스템 (View)

랭킹이 아닌 본인 페이스 + 협력감 표시용 view.

**본인 이번 달 리듬**:
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
  ) AS this_month_regions,
  -- 다양성 점수 (지역 분포)
  COUNT(DISTINCT (
    SELECT region FROM oreums WHERE id = oreum_id
  )) AS total_regions
FROM user_discoveries
GROUP BY user_id;
```

**오름 관점 인기도** (이번 주 가장 많이 발견된 오름):
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
GROUP BY o.id, o.slug, o.name_ko
ORDER BY week_discovery_count DESC;
```

**오름별 협력감 표시** (지난 30일 함께 다녀간 사람 수):
```sql
CREATE VIEW oreum_companionship AS
SELECT
  oreum_id,
  COUNT(DISTINCT user_id) AS recent_30d_visitors,
  COUNT(DISTINCT user_id) FILTER (
    WHERE discovered_at >= date_trunc('week', now())
  ) AS recent_7d_visitors
FROM user_discoveries
WHERE discovered_at >= now() - interval '30 days'
GROUP BY oreum_id;
```

**챌린지 참여 카운트**:
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

**중요**: 위 view들은 모두 **집계 데이터만 노출**. 누가 1등인지, 누가 어떤 점수인지는 절대 노출하지 않음. 2.9 건강한 게이미피케이션 원칙 준수.

---

## 9. API 응답 구조

### 9.1 GET /api/oreums/:slug (오름 상세)

```typescript
{
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  is_top_100: boolean;
  tier: 'beginner' | 'explorer' | 'master' | null;
  tier_order: number | null;
  region: string;
  district: string;
  location: {
    latitude: number;
    longitude: number;
  };
  geo: {
    elevation_m: number;
    prominence_m: number;
    crater_type: string;
    formation_type: string;
  };
  card: {
    illustration_url: string;
    one_liner: string;
    difficulty: number;
    recommended_seasons: string[];
    recommended_times: string[];
    emotional_keywords: string[];
  };
  routes: Array<{
    id: string;
    route_name: string;
    is_main: boolean;
    distance_m: number;
    duration_min: number;
    elevation_gain_m: number;
    surface_breakdown: object;
    gpx_url: string | null;
  }>;
  facilities: Array<{
    type: string;
    name: string;
    location?: { lat: number; lng: number };
    capacity?: number;
    is_free: boolean;
  }>;
  related_oreums: Array<{
    id: string;
    slug: string;
    name_ko: string;
    distance_km: number;
    relation_type: string;
  }>;
  partner_merchants: Array<{
    id: string;
    name: string;
    merchant_type: string;
    distance_km: number;
  }>;
  // 사용자별 정보 (로그인 시)
  user_data?: {
    is_discovered: boolean;
    discovered_at: string | null;
    user_note: string | null;
    is_in_wishlist: boolean;
  };
  // 공개 통계
  stats: {
    total_discoveries: number;
    photo_count: number;
    comment_count: number;
    avg_rating: number;
  };
}
```

### 9.2 POST /api/discoveries (오름 인증)

**Request:**
```typescript
{
  oreum_id: string;
  verification_method: 'gps' | 'manual_select' | 'manual_add';
  user_lat: number;
  user_lng: number;
  user_note?: string;
}
```

**Response:**
```typescript
{
  discovery: {
    id: string;
    oreum_id: string;
    discovered_at: string;
    weather_snapshot: object;
  };
  newly_earned_badges: Array<{
    id: string;
    code: string;
    name_ko: string;
    icon_url: string;
  }>;
  updated_progress: {
    total: number;
    beginner: { discovered: number; total: 30 };
    explorer: { discovered: number; total: 70 };
    master: { discovered: number; total: number };
  };
  challenge_updates: Array<{
    challenge_id: string;
    progress: object;
    is_completed: boolean;
  }>;
}
```

### 9.3 GET /api/me/collection (마이페이지 도감)

**Query params:**
- `tier`: 'beginner' | 'explorer' | 'master' | 'all'
- `region`: 'east' | 'west' | 'south' | 'north' | 'central' | 'all'
- `discovered`: 'true' | 'false' | 'all'
- `sort`: 'discovered_at_desc' | 'tier_order' | 'name'

**Response:**
```typescript
{
  stats: {
    total: { discovered: 36, total: 100 };
    beginner: { discovered: 18, total: 30 };
    explorer: { discovered: 18, total: 70 };
    master: { discovered: 0, total: 0 };
    by_region: { east: 8, west: 12, ... };
  };
  oreums: Array<{
    id: string;
    slug: string;
    name_ko: string;
    tier: string;
    tier_order: number;
    region: string;
    illustration_url: string;
    is_discovered: boolean;
    discovered_at?: string;
  }>;
}
```

### 9.4 GET /api/feed (실시간 피드)

```typescript
{
  events: Array<{
    id: string;
    event_type: 'discovery' | 'badge_earned' | 'course_completed';
    occurred_at_label: string; // "방금 전" | "5분 전"
    user: {
      nickname: string;
      avatar_url: string | null;
    };
    oreum?: {
      slug: string;
      name_ko: string;
    };
    badge?: {
      code: string;
      name_ko: string;
      icon_url: string;
    };
  }>;
  next_cursor: string | null;
}
```

### 9.5 GET /api/ar/nearby (AR 화면 근처 오브젝트)

```typescript
// Query: lat, lng, heading (deg), max_distance_km
{
  oreums: Array<{
    id: string;
    slug: string;
    name_ko: string;
    is_top_100: boolean;
    bearing_deg: number;       // 사용자 기준 방위각
    distance_m: number;
    elevation_m: number;
    is_discovered: boolean;    // 사용자별
    illustration_url?: string; // 100선만
  }>;
  landmarks: Array<{
    type: 'mountain' | 'sea' | 'island';
    name: string;
    bearing_deg: number;
    distance_m: number;
  }>;
  partner_merchants: Array<{
    id: string;
    name: string;
    merchant_type: string;
    bearing_deg: number;
    distance_m: number;
  }>;
}
```

---

## 10. 시드 데이터 (초기 입력)

페이즈 0 작업 항목에 포함되는 초기 데이터.

### 10.1 oreums 시드

- 360개 메타 데이터 (오픈 API에서 일괄 import)
- 100선 큐레이션 (`is_top_100`, `tier`, `tier_order` 수동 지정)

### 10.2 badges 시드

```typescript
[
  { code: 'first_discovery', name_ko: '첫 발견', ... },
  { code: 'beginner_master', name_ko: '비기너 마스터',
    unlock_criteria: { type: 'discover_tier', tier: 'beginner', count: 30 } },
  { code: 'explorer_master', name_ko: '익스플로러 마스터',
    unlock_criteria: { type: 'discover_tier', tier: 'explorer', count: 70 } },
  { code: 'region_master_east', name_ko: '동부 마스터',
    unlock_criteria: { type: 'discover_region', region: 'east', count: 'all' } },
  // ... 5개 지역 마스터
  { code: 'jeju_master', name_ko: '제주 마스터',
    unlock_criteria: { type: 'meta_badges',
      required: ['region_master_east', 'region_master_west',
                 'region_master_south', 'region_master_north',
                 'region_master_central'] } },
  // 시즌 배지 4종
  { code: 'season_master_winter', name_ko: '겨울 탐험가',
    unlock_criteria: { type: 'discover_season', season: 'winter', count: 5 } },
  // ... 봄/여름/가을
  // 기여 배지
  { code: 'recorder', name_ko: '기록자',
    unlock_criteria: { type: 'photo_uploaded', count: 10 } },
  { code: 'archivist', name_ko: '아카이비스트',
    unlock_criteria: { type: 'photo_uploaded', count: 50 } },
  { code: 'curator', name_ko: '큐레이터',
    unlock_criteria: { type: 'photo_promoted', count: 1 } },
  { code: 'pioneer', name_ko: '선구자',
    unlock_criteria: { type: 'first_photo_for_oreum', count: 1 } },
]
```

### 10.3 oreum_links 자동 생성

페이즈 0 마지막 단계에서 일괄 생성:
- 각 오름마다 5km 이내 오름들과 `nearby` 링크
- 같은 region 오름들과 `same_region` 링크
- 비슷한 difficulty 오름들과 `similar_difficulty` 링크

---

## 11. 마이그레이션 전략

### 11.1 페이즈별 마이그레이션

**페이즈 0 (출시 전)**
- 모든 테이블 생성
- 시드 데이터 입력
- 인덱스 구축

**페이즈 1 (출시)**
- 별도 마이그레이션 없음

**페이즈 2 (1차 확장)**
- `feed_events` 테이블 활용 본격화 (출시 시점에는 테이블만 존재)
- AR 관련 인덱스 최적화 (PostGIS 도입 검토)

**페이즈 3 (2차 확장)**
- 굿즈 커머스 테이블 추가 (`goods`, `user_orders` 등)
- 시계열 비교 콘텐츠를 위한 분석 테이블

### 11.2 백업 정책

- Supabase 자동 백업 (일별, 7일 보관 - 무료 티어)
- 운영 시작 후 PITR(Point-in-Time Recovery) 유료 플랜으로 업그레이드

---

## 12. 보안 고려사항

### 12.1 RLS 정책 핵심

| 테이블 | 정책 |
|--------|------|
| `users` | 자기 데이터만 read/write, 다른 사용자는 nickname/avatar만 |
| `user_discoveries` | 자기 데이터 read/write, public(visibility)인 것은 누구나 read |
| `user_photos`(view) | approved 상태만 누구나 read, 자기 것은 모든 상태 read |
| `user_comments` | is_public=true는 누구나 read, 자기 것은 모두 |
| `feed_events` | publish_at <= now() AND visibility='public' 누구나 read |
| `oreums` | is_published=true 누구나 read, write는 admin만 |
| `partner_merchants` | is_published=true 누구나 read, write는 merchant_manager 이상 |

### 12.2 민감 데이터

- 사용자 정확 좌표(`verification_lat`, `verification_lng`)는 본인만 read
- 피드 노출 시 좌표 제외, 오름 단위까지만
- `audit_logs`는 super_admin만 read

### 12.3 API Rate Limiting

- 인증 시도: 사용자당 10회/분
- 사진 업로드: 사용자당 20장/시간
- 코멘트: 사용자당 30개/시간
- AR 위치 쿼리: 사용자당 60회/분

---

## 13. 성능 고려사항

### 13.1 쿼리 최적화 포인트

- **마이페이지 로딩**: `user_discovery_stats` view + `oreums` join → 단일 쿼리
- **AR 화면**: 좌표 기반 거리 계산은 PostGIS GIST 인덱스 필수
- **피드 무한 스크롤**: cursor 기반 페이징 (offset 사용 금지)
- **SEO 페이지**: SSG로 빌드 시점에 모든 쿼리 실행, 런타임 DB 쿼리 최소

### 13.2 캐시 전략

- **오름 마스터 데이터**: 거의 변하지 않음 → CDN 캐시 1일
- **사용자 발견률**: Redis 캐시 (5분 TTL)
- **피드**: 1분 단위 캐시, publish_at 기반 정확성 유지

### 13.3 Materialized View

발견률·인기 오름 등 자주 조회되는 집계는 Materialized View로:

```sql
CREATE MATERIALIZED VIEW oreum_popularity AS
SELECT
  oreum_id,
  COUNT(*) AS discovery_count,
  COUNT(*) FILTER (WHERE discovered_at > now() - interval '7 days') AS recent_count
FROM user_discoveries
GROUP BY oreum_id;

-- 매일 새벽 4시 갱신
CREATE INDEX idx_oreum_popularity ON oreum_popularity(discovery_count DESC);
```

---

## 14. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 21개 엔티티 정의, RLS 정책, API 응답 구조, 시드 데이터 명세 | 기획+Claude |
| 2026-05-07 | 0.2 | 5가지 신규 기능 반영. oreums에 MBTI 컬럼·다국어 컬럼(name_en/ja/zh, one_liner_en/ja/zh) 추가, user_settings에 preferred_language 추가, mbti_questions/user_quiz_results 테이블 신설, 8.4 MBTI 매칭 알고리즘 추가, 8.5 리듬 시스템 view 4종 추가, 엔티티 관계도 업데이트 | 기획+Claude |

---

## 15. 후속 작업

- 본 스키마를 Supabase 마이그레이션 파일로 변환
- TypeScript 타입 자동 생성 (`supabase gen types typescript`)
- PostGIS 확장 도입 결정 (페이즈 2 AR 본격화 시점)
- ERD 시각화 (dbdiagram.io 등으로 다이어그램)
- 시드 데이터 작성 (badges 부터)

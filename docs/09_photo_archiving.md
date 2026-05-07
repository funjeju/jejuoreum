# 09. Photo Archiving & AI Classification

> 본 문서는 사용자 사진 업로드, AI 자동 분류, 갤러리 운영, 데이터 자산화의 모든 명세를 정의한다.
> 본 시스템은 **출시 첫날부터 작동**해야 한다 — 6개월 뒤 추가하면 그동안의 데이터가 사라진다.

---

## 0. 시스템의 위상

### 0.1 왜 출시 시점부터 필요한가

본 시스템은 단순 갤러리 기능이 아니다. **시간이 지날수록 가치가 누적되는 데이터 자산**이다.

- 사용자 사진 → AI 분류 → 카테고리별 시각 아카이브
- 사용자 코멘트 → AI 분석 → 탐방로 상태 시계열 데이터
- 5년 후: 학술·공공 가치를 가진 제주 오름 시각 아카이브 데이터셋

**출시 후 추가하면 그동안 사용자가 활동한 데이터가 사라진다.** 그래서 1일차부터 작동해야 한다.

### 0.2 시장 부재

- 제주 오름 360개에 대한 체계적 시각 아카이브가 사실상 부재
- 한라산국립공원 등 일부 공식 자료는 있으나, 360개 전체를 카테고리별·계절별·시간대별로 정리한 데이터는 없음
- 본 시스템이 작동하면 **공공적 가치를 가진 자산**이 됨

### 0.3 핵심 결정

- **사용자가 분류 안 함**: AI가 자동 분류 (UX 마찰 최소화)
- **AI 분류 → 운영자 큐레이션**: 두 단계 필터
- **대표 사진은 운영자 지정**: 카드 페이지 미감 보존
- **갤러리는 사용자 기여로 풍부**: 시간이 지날수록 풍성

---

## 1. 사진 카테고리 체계

### 1.1 카테고리 정의 (8종)

| 카테고리 | 코드 | 설명 |
|---------|------|------|
| **주차장** | `parking` | 차량, 아스팔트, 입구 표지판 |
| **입구** | `entrance` | 등산로 시작점, 안내판, 입장 게이트 |
| **탐방로** | `trail` | 길, 계단, 데크, 숲 사이 |
| **정상 뷰** | `summit_view` | 능선, 멀리 보이는 풍경 |
| **분화구** | `crater` | 둥근 함몰 지형 (분화구 있는 오름만) |
| **식생** | `flora` | 풀, 꽃, 나무 클로즈업 |
| **표지석/안내판** | `signage` | 글자 있는 비석, 안내판 |
| **인증샷** | `selfie` | 사람이 주피사체 |

### 1.2 메타데이터

각 사진에 AI가 추출:

| 필드 | 값 | 용도 |
|------|-----|------|
| `category` | 위 8종 중 | 갤러리 분류 |
| `quality_score` | 0.0~1.0 | 갤러리 노출 우선순위 |
| `season` | spring/summer/autumn/winter | 시즌별 갤러리 |
| `time_of_day` | dawn/morning/afternoon/sunset/night | 시간대별 갤러리 |
| `weather` | clear/cloudy/rain/snow/fog | 날씨별 데이터 |
| `is_appropriate` | true/false | 부적절 콘텐츠 필터 |
| `contains_face` | true/false | 인물 사진 식별 |
| `dominant_colors` | [...] | 색감 분석 (페이즈 3 시각 검색) |

### 1.3 다중 카테고리 (가능)

한 사진이 여러 카테고리에 속할 수 있음:
- 정상 뷰 + 인증샷 (사람과 풍경 동시)
- 탐방로 + 식생 (길 옆 꽃)

이 경우 `category` 필드는 메인, `secondary_categories` 배열에 보조 카테고리.

---

## 2. 사진 업로드 흐름

### 2.1 업로드 진입점

| 진입점 | 컨텍스트 |
|--------|---------|
| 카드 페이지 "사진 추가" 버튼 | 발견한 오름 |
| 인증 직후 "사진 추가하기" | 방금 인증한 오름 |
| 갤러리 탭 "+" 버튼 | 카드 페이지 갤러리 |
| 마이 탭 "내 사진 추가" | 사후 추가 |

### 2.2 흐름 (단일 사진)

```
[업로드 트리거]
    ↓
[사진 선택 (네이티브 picker)]
    ↓
[업로드 전 미리보기]
- 사진 크롭/회전 (옵션)
- 코멘트 입력 (선택, 1줄)
    ↓
[업로드 시작 (백그라운드)]
- 진행률 표시
- 다른 작업 가능 (블로킹 X)
    ↓
[클라이언트: Supabase Storage 업로드]
   - 원본 + 썸네일 (Cloudflare Images로 변환)
    ↓
[서버: oreum_visuals 삽입 (approval_status='pending')]
    ↓
[비동기 워커: AI 분류 트리거]
   - GPT-4 Vision 또는 Claude Vision
   - 약 5~15초 소요
    ↓
[AI 결과로 oreum_visuals 메타 업데이트]
- category, quality_score, season 등
    ↓
[운영자 큐레이션 큐에 진입]
    ↓
[운영자 승인 시 갤러리에 노출]
- 사용자에게 알림 (옵션)
- 기여 배지 트리거 체크
```

### 2.3 다중 업로드

```
[여러 사진 선택]
    ↓
[모두 일괄 업로드 (병렬, 최대 5개 동시)]
    ↓
[각 사진별 진행률 + 전체 진행률 표시]
    ↓
[모두 완료 시 토스트]
- "사진 N장이 검토 중이에요"
```

### 2.4 EXIF 데이터 활용

사진에서 자동 추출:
- 촬영 시점 → `taken_at` 컬럼
- 촬영 위치 (GPS EXIF) → 검증용 (실제 오름 좌표와 비교)
- 디바이스 모델 (참고용)

```typescript
import exifr from 'exifr';

async function extractExifData(file: File) {
  try {
    const exif = await exifr.parse(file);
    return {
      taken_at: exif?.DateTimeOriginal,
      latitude: exif?.latitude,
      longitude: exif?.longitude,
      camera: exif?.Make ? `${exif.Make} ${exif.Model}` : null
    };
  } catch (e) {
    return {};
  }
}
```

### 2.5 사진 사이즈 처리

업로드 시 자동 리사이징:

| 용도 | 사이즈 | 포맷 |
|------|--------|------|
| 원본 백업 | 원본 | JPEG/HEIC |
| 갤러리 큰 보기 | 1920×1080 | WebP |
| 갤러리 썸네일 | 400×400 | WebP |
| 카드 페이지 헤더 (대표) | 1200×900 | WebP |

Cloudflare Images로 자동 처리.

```typescript
// 클라이언트 측 사전 압축
async function compressImage(file: File): Promise<Blob> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(
    Math.min(img.width, 2400),
    Math.min(img.height, 2400) * (img.height / img.width)
  );
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}
```

---

## 3. AI 분류 파이프라인

### 3.1 처리 큐

```
[사진 업로드 완료]
    ↓
[큐에 진입 (Supabase Edge Function)]
    ↓
[Worker가 큐에서 작업 가져옴]
    ↓
[Vision API 호출]
    ↓
[결과 파싱 → DB 업데이트]
    ↓
[다음 작업]
```

큐 구현:
- Supabase에서 `pg_cron` + `processing_queue` 테이블
- 또는 Vercel Cron + Supabase Edge Functions

### 3.2 AI 호출 (Claude Vision)

**프롬프트 템플릿**:

```typescript
const CLASSIFICATION_PROMPT = `
당신은 제주 오름 사진 분류 전문가입니다.
다음 사진을 분석하고 JSON 형식으로 응답하세요.

분류 카테고리:
- parking (주차장)
- entrance (입구)
- trail (탐방로)
- summit_view (정상 뷰)
- crater (분화구)
- flora (식생)
- signage (표지석/안내판)
- selfie (인증샷, 사람이 주피사체)

응답 형식 (JSON만, 다른 설명 X):
{
  "category": "primary_category",
  "secondary_categories": ["..."],
  "quality_score": 0.0~1.0,
  "season": "spring|summer|autumn|winter|unknown",
  "time_of_day": "dawn|morning|afternoon|sunset|night|unknown",
  "weather": "clear|cloudy|rain|snow|fog|unknown",
  "is_appropriate": true|false,
  "contains_face": true|false,
  "description": "한 줄 설명 (한국어)",
  "notable_features": ["식별된 특징들"]
}

품질 점수 기준:
- 1.0: 매우 좋음 (선명, 구도, 빛)
- 0.7: 좋음
- 0.5: 보통
- 0.3: 흐림 또는 구도 부적절
- 0.0: 알아볼 수 없음

부적절 콘텐츠:
- 폭력적, 선정적, 모욕적 내용
- 광고성 콘텐츠
- 다른 사람의 얼굴이 명확히 식별 가능 (개인정보)
`;

async function classifyPhoto(imageUrl: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: imageUrl }},
        { type: 'text', text: CLASSIFICATION_PROMPT }
      ]
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱 (간혹 코드 블록으로 감싸서 옴)
  const cleanText = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanText);
}
```

### 3.3 비용 분석

Claude 3.5 Sonnet 기준:
- 입력 (이미지): 약 1,500 토큰
- 출력: 약 200 토큰
- 단가: $3/1M 입력, $15/1M 출력
- 사진 1장당: 약 $0.0075 (한화 약 10원)

월 1만 장 처리 시: 약 10만원

대안: GPT-4o mini 또는 Claude Haiku (저렴, 정확도 약간 낮음)

### 3.4 분류 정확도 향상

#### A. Few-shot 예시

프롬프트에 좋은 예시 5~10개 첨부:
```
참고 예시:
- [사진 A] → category: "summit_view", quality_score: 0.9
- [사진 B] → category: "trail", quality_score: 0.7
...
```

#### B. 후속 검증

- AI 결과의 `quality_score < 0.5` → 운영자에게 우선 노출
- AI 결과의 `is_appropriate=false` → 자동 비공개, 운영자 검토 큐
- 카테고리 confidence가 낮으면 (모호한 경우) 운영자에게 표시

#### C. 학습 루프

운영자가 AI 결과를 수정하면:
- 수정 전후 데이터 저장
- 분기별 fine-tuning 또는 prompt 개선

---

## 4. 운영자 큐레이션

### 4.1 큐레이션 큐

운영자 백오피스에 다음 화면:

```
[승인 대기 사진 큐]
- 신규 업로드 사진들
- 정렬: 오래된 것부터 (FIFO) 또는 AI quality_score 낮은 것 우선
- 필터: 카테고리, 오름, 업로드자, AI 결과
```

### 4.2 Tinder 스와이프 UI

```
┌────────────────────────────────────┐
│  [큰 사진 미리보기]                  │
│                                    │
│  [AI 분류 결과 표시]                  │
│  카테고리: 탐방로                    │
│  품질: 0.82                         │
│  계절: 가을                         │
│                                    │
│  [코멘트 (있다면)]                   │
│  "단풍이 정말 예뻤어요"               │
│                                    │
│  [업로드자: 홍길동 / 새별오름]        │
│                                    │
└────────────────────────────────────┘

좌 스와이프: 거절 (또는 J 키)
우 스와이프: 승인 (또는 L 키)
위 스와이프: 대표 사진 지정 (또는 K 키)
탭: 카테고리 수정 모달
```

### 4.3 일괄 처리

```
[빠른 처리 모드]
- 전체 화면 사진 + 키보드 단축키
- 1초당 1~2장 처리 가능
- 익숙해지면 시간당 1,000장+ 처리
```

### 4.4 거절 사유 입력 (옵션)

```
[거절 시 사유 선택]
- 흐림/구도 안 좋음 (자동 알림 X)
- 부적절한 콘텐츠
- 카테고리 불명확
- 광고성
- 기타 (텍스트 입력)
```

거절된 사진은:
- DB에 보관 (deleted_at = NULL, approval_status='rejected')
- 사용자 본인에게는 보임 (마이 탭)
- 갤러리에는 노출 X

### 4.5 카테고리 수정

```
[탭하여 카테고리 수정]
    ↓
[드롭다운 선택]
- AI 결과를 운영자가 override
- 수정 데이터는 학습용으로 저장
```

### 4.6 대표 사진 지정

각 오름의 카드 페이지 헤더에 노출되는 대표 사진.

```
[위로 스와이프 또는 별 아이콘 탭]
    ↓
[대표 사진 모달]
- 현재 대표 사진과 비교
- 카테고리별 대표 (정상 뷰 대표, 탐방로 대표 등)
- 시즌별 대표 (페이즈 2)
    ↓
[지정 시]
- is_representative = true
- 기존 대표 사진은 자동 해제
- 사진 업로더에게 알림 + 큐레이터 배지 트리거
```

### 4.7 큐레이션 KPI

운영자 대시보드:
- 큐 잔여 사진 수
- 일평균 처리량
- 승인률 / 거절률
- AI 정확도 (운영자 수정률)

목표:
- 큐 잔여: 50개 이하 유지
- 처리 시간: 업로드 후 평균 12시간 이내 검토
- 일 처리량: 운영자 1명당 200~500장

---

## 5. 갤러리 화면 (사용자 측)

### 5.1 카드 페이지 갤러리 영역

`05_oreum_card_page.md` 섹션 7과 연계.

```
[갤러리 영역]

상단 탭/필터:
[ 전체 ] [ 정상 뷰 ] [ 탐방로 ] [ 분화구 ] [ 식생 ] [ 분위기 ]

그리드 3열:
[썸네일][썸네일][썸네일]
[썸네일][썸네일][썸네일]
...

각 사진:
- 정사각 비율
- 썸네일 (400x400 WebP)
- 우상단: 별 아이콘 (대표 사진 표시)
- 좌하단: 업로더 닉네임 (옵션)

탭 시: 라이트박스
```

### 5.2 라이트박스

```
[풀 화면 사진 보기]

상단:
- 닫기 버튼
- 공유 버튼
- 신고 버튼 (...)

중앙:
- 큰 사진
- 좌우 스와이프 / 화살표 키 / 핀치 줌

하단:
- 캡션 (있다면)
- 업로더 닉네임 + 촬영 일자
- 카테고리 라벨
- "이 사용자의 다른 사진" 링크
```

### 5.3 정렬·필터

```
정렬:
- 최신순 (기본)
- 인기순 (좋아요 - 페이즈 3)
- 품질순 (AI quality_score)

필터:
- 카테고리 (8종)
- 시즌
- 시간대
```

### 5.4 빈 상태

```
"아직 사진이 없어요"
[ 첫 사진 남기기 ] (로그인 사용자 + 발견한 오름)
또는
"이 오름의 첫 사진을 남기면 '선구자' 배지를 받을 수 있어요"
```

---

## 6. 사용자 기여 동기

### 6.1 기여 배지

`11_badge_challenge.md`와 연계.

| 배지 | 조건 |
|------|------|
| **기록자** (recorder) | 사진 10장 업로드 (승인됨) |
| **아카이비스트** (archivist) | 사진 50장 업로드 |
| **마스터 아카이비스트** | 사진 200장 업로드 |
| **큐레이터** (curator) | 내 사진이 대표 사진으로 채택됨 |
| **선구자** (pioneer) | 어떤 오름의 첫 번째 기록자 |
| **시즌 기록자** (season_recorder_*) | 4계절 모두 사진 업로드 |
| **카테고리 마스터** (category_*) | 한 카테고리 사진 30장+ |

### 6.2 크레딧 표기

대표 사진으로 채택될 시:
```
[카드 페이지 헤더]
"사진: ○○○님 (2026.05)"
- 작은 텍스트로 표기
- 사용자 프로필 링크
```

이게 강한 동기 부여:
- 자기 사진이 모든 사용자에게 노출
- "내가 만든 도감" 느낌

### 6.3 "이번 주 베스트 기록자" 같은 노출

페이즈 2~3 검토:
- 마이 탭에 "이번 주 가장 많은 사진을 올린 사람들" (랭킹 X, 인정 표시)
- 단, 경쟁 X — 단순 인정

랭킹과의 차이:
- 랭킹: 1등, 2등, 3등 노출 (경쟁 자극)
- 인정: "이번 주에 활발히 활동한 ○명" (협력감)

---

## 7. 데이터 자산화 활용 (페이즈 4)

### 7.1 시계열 콘텐츠

같은 오름의 같은 카테고리 사진을 시간순으로:
- "다랑쉬오름 정상 뷰의 1년"
- 봄→여름→가을→겨울 자동 슬라이드쇼

### 7.2 환경 모니터링

탐방로 카테고리 사진의 시계열 분석:
- 침식 진행
- 식생 변화
- 인공 시설 변화

→ 환경 단체·지자체에 데이터 라이선싱 가능

### 7.3 시각 검색 (페이즈 4)

사진의 `dominant_colors`, `notable_features` 활용:
- "단풍이 보이는 오름 사진들"
- "푸른 하늘 + 능선" 분위기 사진들

### 7.4 AI 학습 데이터

- 분류 정확도 fine-tuning 학습 데이터로 활용
- 카테고리 분류 모델 자체 학습 (외부 의존 감소)

### 7.5 출판물·콘텐츠

5년치 자산이 쌓이면:
- 사진집 출판
- 가이드북 콘텐츠
- 다큐멘터리 협업 자료

---

## 8. 데이터 모델 (재확인)

### 8.1 oreum_visuals 테이블

`01_data_model.md` 3.2 참조. 주요 컬럼:

```sql
CREATE TABLE oreum_visuals (
  -- 기본
  id, oreum_id, visual_type, category, url, thumbnail_url, blur_hash,

  -- 메타
  width, height, file_size_bytes,

  -- AI 일러스트 메타 (visual_type = 'card_illustration')
  ai_seed, ai_prompt, ai_prompt_version, ai_model, source_photo_refs,

  -- AI 사진 분류 메타
  ai_quality_score, ai_season, ai_time_of_day,
  -- ↑ 본 문서에서 추가:
  ai_weather, ai_is_appropriate, ai_contains_face,
  ai_secondary_categories, ai_description, ai_notable_features,

  -- 큐레이션
  is_representative, uploaded_by, approved_by, approval_status,
  approval_rejection_reason, display_order,

  -- 시간
  taken_at, created_at, updated_at
);
```

### 8.2 추가 필드 (본 문서에서)

```sql
ALTER TABLE oreum_visuals ADD COLUMN ai_weather TEXT;
ALTER TABLE oreum_visuals ADD COLUMN ai_is_appropriate BOOLEAN DEFAULT true;
ALTER TABLE oreum_visuals ADD COLUMN ai_contains_face BOOLEAN DEFAULT false;
ALTER TABLE oreum_visuals ADD COLUMN ai_secondary_categories TEXT[];
ALTER TABLE oreum_visuals ADD COLUMN ai_description TEXT;
ALTER TABLE oreum_visuals ADD COLUMN ai_notable_features TEXT[];
ALTER TABLE oreum_visuals ADD COLUMN ai_dominant_colors TEXT[];
ALTER TABLE oreum_visuals ADD COLUMN approval_rejection_reason TEXT;
ALTER TABLE oreum_visuals ADD COLUMN exif_camera TEXT;
ALTER TABLE oreum_visuals ADD COLUMN exif_lat DOUBLE PRECISION;
ALTER TABLE oreum_visuals ADD COLUMN exif_lng DOUBLE PRECISION;

CREATE INDEX idx_oreum_visuals_approval_status ON oreum_visuals(approval_status, created_at);
CREATE INDEX idx_oreum_visuals_quality ON oreum_visuals(ai_quality_score DESC);
```

### 8.3 사진 큐 테이블

```sql
CREATE TABLE photo_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_id UUID NOT NULL REFERENCES oreum_visuals(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  attempts SMALLINT DEFAULT 0,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_photo_queue_status ON photo_processing_queue(status, scheduled_for);
```

---

## 9. API 명세

### 9.1 POST /api/photos/upload

**Multipart form data**:
```
- file: 사진 파일
- oreum_id: UUID
- category_hint: string (사용자 선택, 옵션)
- comment: string (옵션)
```

**Response**:
```typescript
{
  visual: {
    id: string;
    url: string;
    thumbnail_url: string;
    approval_status: 'pending';
    ai_classification: null; // 비동기 처리 후 채워짐
  };
  comment_id?: string;
}
```

### 9.2 GET /api/oreums/{slug}/photos

**Query**:
```
?category=trail|all
&season=autumn|all
&sort=newest|quality
&page=1&limit=30
```

**Response**:
```typescript
{
  photos: Array<{
    id: string;
    url: string;
    thumbnail_url: string;
    blur_hash: string;
    category: string;
    secondary_categories: string[];
    season: string;
    time_of_day: string;
    description: string;
    is_representative: boolean;
    uploader: { nickname: string; user_id: string } | null;
    taken_at: string;
    created_at: string;
  }>;
  pagination: {
    page: number;
    has_next: boolean;
  };
}
```

### 9.3 GET /api/me/photos

내가 업로드한 사진들.

```typescript
{
  photos: Array<Photo & {
    approval_status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
  }>;
}
```

### 9.4 DELETE /api/me/photos/{id}

본인 사진 삭제 (soft delete).

### 9.5 POST /api/photos/{id}/report

사진 신고.

```typescript
{
  reason: 'inappropriate' | 'spam' | 'wrong_oreum' | 'copyright' | 'other';
  details?: string;
}
```

### 9.6 (관리자) POST /api/admin/photos/{id}/approve

```typescript
{
  category_override?: string;
  is_representative?: boolean;
  approver_note?: string;
}
```

### 9.7 (관리자) POST /api/admin/photos/{id}/reject

```typescript
{
  reason: string;
  send_user_notification: boolean;
}
```

### 9.8 (서버) POST /internal/photo-classify

비동기 AI 분류 트리거. 큐 워커가 호출.

---

## 10. 기술 구현

### 10.1 업로드 클라이언트 (Next.js)

```typescript
async function uploadPhoto(
  file: File,
  oreumId: string,
  comment?: string
): Promise<UploadResult> {
  // 1. 클라이언트 압축
  const compressed = await compressImage(file);

  // 2. EXIF 추출
  const exif = await extractExifData(file);

  // 3. Supabase Storage 직접 업로드
  const filename = `${oreumId}/${userId}/${Date.now()}.webp`;
  const { data: upload, error } = await supabase.storage
    .from('user-photos')
    .upload(filename, compressed);

  if (error) throw error;

  // 4. 서버에 메타데이터 등록
  const response = await fetch('/api/photos/upload', {
    method: 'POST',
    body: JSON.stringify({
      oreum_id: oreumId,
      file_path: upload.path,
      width: ..., height: ...,
      exif,
      comment
    })
  });

  return response.json();
}
```

### 10.2 큐 워커 (Supabase Edge Function)

```typescript
// supabase/functions/photo-classifier/index.ts

import { Anthropic } from '@anthropic-ai/sdk';

Deno.serve(async (req) => {
  // 1. 큐에서 미처리 항목 가져오기
  const { data: queueItems } = await supabase
    .from('photo_processing_queue')
    .select('*, visual:oreum_visuals(*)')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for')
    .limit(10);

  for (const item of queueItems || []) {
    try {
      // 2. 처리 중 표시
      await supabase
        .from('photo_processing_queue')
        .update({ status: 'processing', started_at: new Date(), attempts: item.attempts + 1 })
        .eq('id', item.id);

      // 3. AI 분류
      const classification = await classifyPhoto(item.visual.url);

      // 4. 결과 저장
      await supabase
        .from('oreum_visuals')
        .update({
          category: classification.category,
          ai_secondary_categories: classification.secondary_categories,
          ai_quality_score: classification.quality_score,
          ai_season: classification.season,
          ai_time_of_day: classification.time_of_day,
          ai_weather: classification.weather,
          ai_is_appropriate: classification.is_appropriate,
          ai_contains_face: classification.contains_face,
          ai_description: classification.description,
          ai_notable_features: classification.notable_features
        })
        .eq('id', item.visual_id);

      // 5. 부적절 콘텐츠면 자동 비공개
      if (!classification.is_appropriate) {
        await supabase
          .from('oreum_visuals')
          .update({
            approval_status: 'rejected',
            approval_rejection_reason: 'AI 자동 거절: 부적절 콘텐츠'
          })
          .eq('id', item.visual_id);
      }

      // 6. 완료 표시
      await supabase
        .from('photo_processing_queue')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', item.id);

    } catch (error) {
      // 실패 처리
      await supabase
        .from('photo_processing_queue')
        .update({
          status: item.attempts >= 3 ? 'failed' : 'pending',
          error_message: error.message,
          scheduled_for: new Date(Date.now() + 60000) // 1분 후 재시도
        })
        .eq('id', item.id);
    }
  }

  return new Response('OK');
});
```

### 10.3 큐 트리거

```sql
-- pg_cron으로 1분마다 워커 호출
SELECT cron.schedule(
  'process-photo-queue',
  '*/1 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/photo-classifier',
      headers := '{"Authorization": "Bearer ..."}'::jsonb
    );
  $$
);
```

---

## 11. 인터랙션·애니메이션

### 11.1 업로드 진행

```
[사진 선택]
    ↓
[미리보기 화면 (코멘트 입력 가능)]
    ↓
[업로드 시작 버튼]
    ↓
[진행률 표시 (0% → 100%)]
- 작은 토스트 또는 하단 띠
- 다른 작업 가능
    ↓
[완료 토스트]
- "사진이 업로드됐어요. 검토 후 갤러리에 추가됩니다"
- 3초 자동 닫힘
```

### 11.2 갤러리 라이트박스

```
[썸네일 탭]
    ↓
[scale 0.9 → 1.0 fade-in]
    ↓
[풀 화면]
- 좌우 스와이프 (다른 사진)
- 핀치 줌
- 더블 탭 줌
- 위 스와이프 (닫기)
```

### 11.3 대표 사진 채택 알림

```
[운영자가 대표 사진 지정]
    ↓
[업로더에게 푸시 알림]
- "당신의 사진이 대표 사진으로 채택됐어요!"
- 탭 시 해당 카드 페이지로 이동
    ↓
[큐레이터 배지 자동 트리거 (첫 채택 시)]
```

---

## 12. 다국어 처리

### 12.1 화면 텍스트

```typescript
{
  "photos": {
    "upload_button": "사진 추가",
    "comment_placeholder": "한 줄 메모를 남겨보세요 (선택)",
    "uploaded_toast": "사진이 업로드됐어요",
    "pending_review": "검토 후 갤러리에 추가됩니다",
    "categories": {
      "parking": "주차장",
      "entrance": "입구",
      "trail": "탐방로",
      "summit_view": "정상 뷰",
      "crater": "분화구",
      "flora": "식생",
      "signage": "표지석",
      "selfie": "인증샷"
    }
  }
}
```

### 12.2 AI 분류는 한국어 기준

AI 분류 자체는 한국어 프롬프트로 작동. 결과 라벨은 영문 코드 (`category: 'trail'`).
사용자에게 보이는 텍스트만 i18n 변환.

---

## 13. 보안·개인정보

### 13.1 부적절 콘텐츠

- AI 자동 필터 1차
- 사용자 신고
- 운영자 검토
- 반복 위반자 계정 제재

### 13.2 인물 사진 처리

- AI가 `contains_face=true` 감지
- 운영자 검토 시 명확히 식별 가능한 얼굴이 있으면 거절 또는 모자이크 요청
- 본인 인증샷은 OK
- 다른 사람 얼굴이 명확히 식별되면 거절

### 13.3 EXIF GPS 처리

- 사진의 EXIF GPS는 백엔드에 저장
- 클라이언트에 노출 X (사용자 사생활)
- 단, 인증 검증용으로 활용

### 13.4 저작권

- 사용자 사진의 저작권은 업로더 보유
- 약관에 명시: "본 서비스에서 비상업적 사용 권한 부여"
- 페이즈 4 학술·공공 활용 시 재동의 필요

---

## 14. 분석·KPI

### 14.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `photo_upload_started` | oreum_id, source |
| `photo_upload_completed` | oreum_id, file_size, duration |
| `photo_upload_failed` | error_type |
| `gallery_viewed` | oreum_id |
| `lightbox_opened` | photo_id |
| `photo_reported` | photo_id, reason |
| `representative_changed` | photo_id, oreum_id |

### 14.2 KPI

- 인증당 사진 업로드율 (목표: 30%+)
- 사용자당 누적 사진 수
- AI 분류 정확도 (운영자 수정률 < 15%)
- 부적절 콘텐츠 감지율
- 검토 → 승인 평균 시간 (목표: 24시간 이내)
- 갤러리 페이지 체류 시간

---

## 15. 테스트 시나리오

### 15.1 단위 테스트

- AI 분류 결과 파싱
- EXIF 추출
- 사진 압축
- 큐 워커 재시도 로직

### 15.2 통합 테스트

- 업로드 → AI 분류 → 큐레이션 → 갤러리 노출 (E2E)
- 다양한 카테고리 사진 분류 정확성
- 부적절 콘텐츠 자동 거절
- 다중 업로드 병렬 처리

### 15.3 부하 테스트

- 동시 업로드 100건
- 큐 1,000건 처리 시간
- 갤러리 10,000장 페이지네이션 성능

### 15.4 시나리오 테스트

- 정상에서 사진 찍어 업로드 → 자동 분류 정확성
- 흐린 사진 → quality_score 낮게 + 운영자 우선 검토
- 인물 사진 → 적절히 거절
- 광고 사진 → 부적절 감지

---

## 16. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 8개 카테고리 정의, AI 분류 파이프라인, 운영자 큐레이션 Tinder UI, 큐 워커, 갤러리 화면, 기여 동기, 데이터 자산화 활용, API 명세 | 기획+Claude |

---

## 17. 후속 작업

- AI 분류 프롬프트 5~10개 샘플 사진으로 검증
- 사진 100장 수동 분류해서 ground truth 만들고 정확도 측정
- 운영자 큐레이션 백오피스 와이어프레임
- 큐 시스템 부하 테스트
- 라이트박스 컴포넌트 개발
- 시각 자산 라이선스 정책 법무 검토

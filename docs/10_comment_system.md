# 10. Comment System & AI Text Analysis

> 본 문서는 사용자 코멘트 시스템, AI 텍스트 분석, 시계열 상태 알림의 모든 명세를 정의한다.
> 단순 후기가 아니라 **현장 정보의 살아있는 데이터베이스**가 되는 것이 목표다.

---

## 0. 시스템의 위상

### 0.1 단순 후기가 아닌 이유

본 시스템은 일반적인 "리뷰 시스템"이 아니다. 다음과 같은 차별점:

- **AI 분류**: 단순 감상 vs 가치 있는 정보를 자동 분류
- **현장 팁 승격**: 가치 있는 정보는 카드 페이지의 별도 영역으로 승격
- **시계열 분석**: 코멘트들을 누적 분석해 "최근 탐방로 상태 변화" 같은 알림 자동 생성
- **데이터 자산화**: 시간이 지날수록 가치 있는 시계열 데이터

### 0.2 일반 리뷰와의 차이

| 영역 | 일반 리뷰 | 본 시스템 |
|------|----------|----------|
| 분류 | 별점 위주 | 의도/내용 기반 4종 분류 |
| 시각화 | 별점 평균 | 카테고리별 노출 + 시계열 알림 |
| AI 활용 | 거의 없음 | 분류·필터·시계열 분석 |
| 큐레이션 | 보통 없음 | 운영자가 팁으로 승격 |
| 보존 가치 | 낮음 | 시계열 데이터로 자산화 |

### 0.3 핵심 결정

- **별점 시스템 단순화**: 1~5점 + 코멘트, 단 별점은 옵션
- **AI가 4종 분류**: tip / review / warning / photo_caption
- **운영자 승격**: 가치 있는 코멘트를 "현장 팁"으로 승격
- **시계열 키워드 분석**: "최근 진흙·미끄러움 키워드 증가" → 자동 알림

---

## 1. 코멘트 종류 (AI 분류)

### 1.1 4종 분류

| 코드 | 이름 | 설명 | 예시 |
|------|------|------|------|
| `tip` | 현장 팁 | 다음 방문자에게 유용한 정보 | "주차장이 작아서 일찍 가야 해요" |
| `review` | 후기 | 개인 감상, 분위기 | "정말 예뻤어요. 일출 추천!" |
| `warning` | 주의 | 위험·불편 정보 | "최근 비 후 미끄러움 주의" |
| `photo_caption` | 사진 설명 | 사진과 함께 올린 짧은 메모 | "정상에서 본 풍경" |

### 1.2 분류 우선순위

한 코멘트가 여러 카테고리에 해당할 수 있으나 메인 카테고리 1개를 정함:
- `warning` > `tip` > `review` > `photo_caption` 우선순위

### 1.3 부가 메타데이터

AI가 추출:

| 필드 | 값 | 용도 |
|------|-----|------|
| `keywords` | `["진흙", "미끄러움"]` | 시계열 분석, 키워드 검색 |
| `sentiment` | positive / neutral / negative | 분위기 분석 |
| `quality_score` | 0.0~1.0 | 정보 가치 (팁 승격 후보 판단) |
| `language` | ko / en / ja / zh | 다국어 처리 |
| `is_appropriate` | true / false | 부적절 콘텐츠 필터 |
| `contains_personal_info` | true / false | 개인정보 노출 감지 |

---

## 2. 코멘트 작성 화면

### 2.1 진입점

| 진입점 | 컨텍스트 |
|--------|---------|
| 카드 페이지 "후기 남기기" 버튼 | 발견한 오름의 카드 페이지 |
| 인증 직후 "메모 추가" | 방금 인증한 오름 |
| 사진 업로드 시 함께 입력 | 사진 코멘트로 첨부 |
| 마이 탭 "내 코멘트 추가" | 사후 추가 |

### 2.2 작성 폼

```
┌────────────────────────────────────┐
│  새별오름 후기 남기기                │
├────────────────────────────────────┤
│                                    │
│  별점 (선택):                       │
│  ☆ ☆ ☆ ☆ ☆                         │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  유도 프롬프트 (랜덤 1개):            │
│  "오늘의 탐방로 상태는 어땠나요?"     │
│  또는                               │
│  "특별히 기억에 남는 포인트가 있나요?" │
│  또는                               │
│  "다음에 오는 사람에게 알려주고 싶은 │
│   팁?"                              │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ [텍스트 입력 영역]              │  │
│  │ 200~500자 권장                  │  │
│  │                                │  │
│  └──────────────────────────────┘  │
│                                    │
│  사진 첨부 (선택):                   │
│  [📷 사진 추가]                      │
│                                    │
│  공개 옵션:                          │
│  [●] 다른 사람에게도 보이기          │
│  [ ] 내 도감에만 저장                │
│                                    │
│  [   후기 남기기   ]                  │
└────────────────────────────────────┘
```

### 2.3 유도 프롬프트

```typescript
const PROMPTS = [
  "오늘의 탐방로 상태는 어땠나요?",
  "특별히 기억에 남는 포인트가 있나요?",
  "다음에 오는 사람에게 알려주고 싶은 팁?",
  "이 오름의 베스트 시간대는 언제인가요?",
  "주차장 상황은 어떠셨나요?",
  "사진 명소를 발견하셨나요?",
  "이 오름만의 매력이 무엇이었나요?"
];

// 랜덤 선택 또는 컨텍스트별:
// - 인증 직후: "오늘 어떠셨나요?"
// - 카드 페이지: "다음 방문자에게 도움될 정보가 있다면?"
// - 사진 첨부 시: "이 사진의 한 줄 설명을 남겨보세요"
```

### 2.4 입력 검증

```typescript
function validateComment(text: string): ValidationResult {
  if (text.length < 5) {
    return { valid: false, error: '최소 5자 이상 입력해주세요' };
  }
  if (text.length > 1000) {
    return { valid: false, error: '1000자 이하로 입력해주세요' };
  }
  // 욕설·스팸 사전 체크 (간단)
  if (containsProfanity(text) || isSpam(text)) {
    return { valid: false, error: '부적절한 표현이 포함되어 있어요' };
  }
  return { valid: true };
}
```

### 2.5 익명 옵션

```
[작성자 표시 옵션]
- 닉네임으로 (기본)
- 익명으로
```

익명 시 닉네임 대신 "익명의 등산가" 같이 표시.

---

## 3. AI 텍스트 분석 파이프라인

### 3.1 처리 흐름

```
[코멘트 작성 → 제출]
    ↓
[user_comments 삽입 (즉시 노출, AI 분석 결과 대기)]
    ↓
[비동기 큐에 진입]
    ↓
[Worker가 LLM 호출]
    ↓
[결과로 user_comments 메타 업데이트]
- comment_type
- ai_keywords
- ai_sentiment
- ai_quality_score
    ↓
[부적절 콘텐츠 자동 비공개]
    ↓
[가치 점수 높으면 운영자 큐레이션 큐에 우선 표시]
```

### 3.2 LLM 호출 (Claude Haiku)

코멘트는 사진보다 가벼우므로 더 저렴한 모델 사용.

```typescript
const COMMENT_ANALYSIS_PROMPT = `
당신은 제주 오름 후기 분류 전문가입니다.
다음 사용자 코멘트를 분석하고 JSON 형식으로 응답하세요.

분류 카테고리:
- tip (현장 팁): 다음 방문자에게 유용한 실용적 정보
- review (후기): 개인 감상, 분위기 묘사
- warning (주의): 위험, 불편, 주의해야 할 정보
- photo_caption (사진 설명): 사진과 함께 올린 짧은 메모

응답 형식 (JSON만):
{
  "comment_type": "tip|review|warning|photo_caption",
  "keywords": ["키워드1", "키워드2", ...],  // 5개 이내, 핵심 단어
  "sentiment": "positive|neutral|negative",
  "quality_score": 0.0~1.0,
  "language": "ko|en|ja|zh",
  "is_appropriate": true|false,
  "contains_personal_info": true|false,
  "summary": "한 줄 요약"
}

품질 점수 기준:
- 0.9~1.0: 매우 유용한 구체적 정보
- 0.7~0.9: 유용한 정보
- 0.5~0.7: 일반적 후기
- 0.3~0.5: 짧은 감상
- 0.0~0.3: 의미 없거나 너무 짧음

키워드 추출 가이드:
- 명사 위주 (예: "주차장", "탐방로", "단풍")
- 형용사·동사도 의미 있다면 포함 (예: "미끄러움", "춥다")
- 일반적 단어 제외 (예: "오름", "정상", "갔다")

부적절 콘텐츠:
- 욕설, 비방
- 광고, 스팸
- 다른 사용자 비방
- 개인정보 (전화번호, 주소 등)

사용자 코멘트:
"""
{comment_text}
"""
`;

async function analyzeComment(text: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022', // 저렴한 모델
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: COMMENT_ANALYSIS_PROMPT.replace('{comment_text}', text)
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleanText = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleanText);
}
```

### 3.3 비용 분석

Claude Haiku 기준:
- 입력: 약 800 토큰
- 출력: 약 100 토큰
- 단가: $0.80/1M 입력, $4/1M 출력
- 코멘트 1개당: 약 $0.001 (한화 약 1.5원)

월 1만 코멘트 처리 시: 약 1.5만원 (사진보다 훨씬 저렴)

---

## 4. 코멘트 노출

### 4.1 카드 페이지의 두 영역

**섹션 9 "방문자 후기"** (`05_oreum_card_page.md` 참조):

```
┌────────────────────────────────────┐
│  ⭐ 운영자 큐레이션 팁                │
│  ─────────────────────                │
│  "최근 비 후 미끄러움 주의하세요"    │
│  ─ 운영자 (2026.05.18)               │
└────────────────────────────────────┘

[현장 팁 (승격된 코멘트)]
┌────────────────────────────────────┐
│  💡 현장 팁                          │
│                                    │
│  "주차장이 입구에서 100m 더 가야  │
│   해요. 처음 보이는 곳은 사유지!"  │
│  ─ ○○○님 (2026.05.10)              │
└────────────────────────────────────┘

[일반 후기]
┌────────────────────────────────────┐
│  ○○○ · 2026.05.20                  │
│  ⭐⭐⭐⭐⭐                            │
│                                    │
│  "정상에서 본 일출이 정말 좋았어요" │
│                                    │
│  [좋아요 5] [신고]                  │
└────────────────────────────────────┘

...
```

### 4.2 정렬 옵션

- **최신순** (기본)
- **도움순**: 좋아요 많은 순 (페이즈 2)
- **별점 높은순**

### 4.3 필터

- 별점별 (1~5)
- 카테고리별 (tip / review / warning)
- 시즌별 (봄에 다녀온 사람들 후기)

### 4.4 페이징

- 첫 5개 노출
- "더보기" 버튼으로 5개씩 추가 로드

---

## 5. 운영자 큐레이션

### 5.1 큐레이션 큐

운영자 백오피스에 다음 화면:

```
[코멘트 큐레이션 큐]

필터:
- AI 카테고리: tip 우선 표시
- 품질 점수: 0.7+ 우선
- 미검토 vs 검토 완료

각 코멘트 행:
┌────────────────────────────────────┐
│ 새별오름 · ○○○님 · 2026.05.20      │
│ AI: tip (품질 0.85)                 │
│ 키워드: 주차장, 사유지              │
│                                    │
│ "주차장이 입구에서 100m 더 가야    │
│  해요. 처음 보이는 곳은 사유지!"   │
│                                    │
│ [👍 팁으로 승격] [👎 일반 유지]     │
│ [🚫 비공개 처리]                     │
└────────────────────────────────────┘
```

### 5.2 팁 승격 흐름

```
[운영자가 "팁으로 승격" 클릭]
    ↓
[user_comments.is_promoted_to_tip = true]
[promoted_by, promoted_at 기록]
    ↓
[카드 페이지의 "현장 팁" 영역에 노출]
- 강조 박스로 표시
- 운영자 검수 표시
    ↓
[작성자에게 알림 (옵션)]
- "당신의 후기가 현장 팁으로 채택됐어요!"
- 큐레이터 배지 트리거 체크 (페이즈 2)
    ↓
[작성자에게 기여 배지 가능성]
- 첫 팁 채택 → "큐레이터" 배지 (사진과 공유)
```

### 5.3 비공개 처리

```
[부적절 콘텐츠로 판단]
    ↓
[is_public = false]
    ↓
[갤러리·후기 영역에서 노출 X]
[작성자 본인은 자기 마이 탭에서만 볼 수 있음]
```

### 5.4 키보드 단축키

```
J: 다음 코멘트
K: 이전 코멘트
1: 일반 후기 유지
2: 팁으로 승격
3: 비공개 처리
S: 사진 함께 보기 (있을 때)
```

빠른 처리 가능 (시간당 200~500개).

---

## 6. 시계열 알림 시스템

### 6.1 핵심 개념

**같은 오름의 코멘트들을 시간순으로 누적 분석 → 최근 경향 변화 감지 → 카드 페이지에 자동 알림**

예시:
- "최근 2주간 '진흙', '미끄러움' 키워드가 증가했어요" → 카드에 "비 후 미끄러움 주의" 알림
- "최근 한 달간 '단풍' 키워드가 급증했어요" → "지금 단풍 시즌이에요" 알림
- "지난주부터 '공사 중' 키워드 등장" → "탐방로 일부 보수 중" 알림

### 6.2 분석 파이프라인

```
[매일 새벽 4시 배치 작업]
    ↓
[각 오름별로 최근 30일 코멘트 가져오기]
    ↓
[키워드 빈도 집계]
- 최근 7일 vs 그 이전 23일 비교
    ↓
[유의미한 변화 감지]
- 새로 등장한 키워드 (이전 0회 → 최근 3회+)
- 빈도 급증 (3배 이상)
- 부정적 키워드 비중 증가
    ↓
[운영자 검토 큐에 알림 후보 추가]
    ↓
[운영자 승인 시 카드 페이지에 알림 노출]
- 자동 만료: 14일 (재검토 또는 자동 제거)
```

### 6.3 키워드 패턴 매칭

```typescript
const NEGATIVE_KEYWORDS = [
  '진흙', '미끄러움', '미끄럽', '위험', '주의',
  '공사', '폐쇄', '통제', '오염', '쓰레기'
];

const SEASONAL_KEYWORDS = {
  spring: ['벚꽃', '진달래', '철쭉', '신록'],
  summer: ['더위', '풀', '벌레', '진드기'],
  autumn: ['단풍', '억새', '갈대'],
  winter: ['눈', '얼음', '바람', '추위']
};

const POSITIVE_KEYWORDS = [
  '일출', '일몰', '풍경', '예쁜', '좋다', '추천'
];

function detectTrendChange(
  oreumId: string,
  recentDays: 7 | 14,
  comparisonDays: 23 | 60
): TrendAlert[] {
  const recent = getCommentsKeywords(oreumId, recentDays);
  const past = getCommentsKeywords(oreumId, recentDays + comparisonDays, recentDays);

  const alerts: TrendAlert[] = [];

  for (const keyword of Object.keys(recent)) {
    const recentFreq = recent[keyword] || 0;
    const pastFreq = past[keyword] || 0;
    const ratio = recentFreq / Math.max(pastFreq, 1);

    if (recentFreq >= 3 && (pastFreq === 0 || ratio > 3)) {
      alerts.push({
        keyword,
        type: classifyKeyword(keyword), // 'warning' | 'seasonal' | 'positive'
        recent_count: recentFreq,
        past_count: pastFreq,
        confidence: calculateConfidence(recentFreq, pastFreq)
      });
    }
  }

  return alerts;
}
```

### 6.4 알림 타입

```typescript
interface TrendAlert {
  oreum_id: string;
  alert_type: 'warning' | 'seasonal' | 'general';
  keyword: string;
  message: string; // 사용자에게 보일 메시지
  detected_at: Date;
  expires_at: Date; // 자동 만료
  is_approved: boolean; // 운영자 승인
  approved_by: string | null;
}
```

메시지 자동 생성 예시:
```typescript
const ALERT_TEMPLATES = {
  warning: {
    '미끄러움': '최근 비 후 미끄러움 주의가 보고됐어요',
    '공사': '최근 탐방로 일부 보수 중이라는 후기가 있어요',
    '폐쇄': '최근 일부 구간 폐쇄 안내가 있어요'
  },
  seasonal: {
    '단풍': '🍁 지금 단풍이 절정이에요',
    '벚꽃': '🌸 벚꽃이 피기 시작했어요',
    '억새': '🌾 억새가 한창이에요'
  }
};
```

### 6.5 카드 페이지 노출

```
[카드 비주얼 영역 하단 또는 상단]

[알림 박스 (작은 색상 강조)]
┌────────────────────────────────────┐
│ ⚠️ 최근 비 후 미끄러움 주의가 보고  │
│   됐어요                            │
│                                    │
│ (감지: 2주 전부터 / 자동 갱신)      │
└────────────────────────────────────┘

또는 시즌:
┌────────────────────────────────────┐
│ 🍁 지금 단풍이 절정이에요            │
│ 가을 시즌 베스트                    │
└────────────────────────────────────┘
```

### 6.6 자동 만료

- warning 알림: 14일 후 재검토 또는 자동 제거
- seasonal 알림: 시즌 종료 시 자동 제거
- 운영자 강제 종료 가능

---

## 7. 별점 시스템

### 7.1 단순 별점

- 1~5점, 옵션 (필수 X)
- 입력 안 해도 OK
- 별점 없는 코멘트가 더 많을 가능성

### 7.2 별점 집계

각 오름에:
- 평균 별점 (별점 있는 후기만)
- 별점 분포 (1점, 2점, 3점, 4점, 5점 각 비율)
- 별점 부여 후기 수

### 7.3 노출

카드 페이지에:
```
"⭐⭐⭐⭐ 4.3 (123개 후기 중 87개 평가)"
```

별점 분포 차트 (선택):
```
5점 ▓▓▓▓▓▓▓▓ 60%
4점 ▓▓▓▓▓ 25%
3점 ▓▓ 10%
2점 ▓ 3%
1점 ▓ 2%
```

### 7.4 SEO 효과

JSON-LD에 AggregateRating으로 포함되어 검색 결과 별점 노출.

```json
{
  "@type": "TouristAttraction",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.3,
    "reviewCount": 87
  }
}
```

---

## 8. 좋아요·신고 (페이즈 2)

### 8.1 좋아요

```sql
CREATE TABLE comment_likes (
  comment_id UUID NOT NULL REFERENCES user_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
```

좋아요 수가 많은 코멘트:
- 정렬 옵션 "도움순"으로 노출
- 운영자 큐레이션 큐에서 팁 승격 후보로 우선 표시

### 8.2 신고

```sql
CREATE TABLE comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES user_comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

신고 사유:
- 부적절한 표현
- 광고/스팸
- 잘못된 정보
- 다른 사용자 비방
- 개인정보 노출
- 기타

신고 누적 시 운영자 알림 (3회+ 신고 → 자동 비공개).

---

## 9. 데이터 모델

### 9.1 user_comments 테이블

`01_data_model.md` 4.3 참조. 주요 컬럼 + 추가:

```sql
CREATE TABLE user_comments (
  id, user_id, oreum_id, discovery_id, photo_id,

  content TEXT NOT NULL,
  rating SMALLINT, -- 1~5, NULL 가능
  is_anonymous BOOLEAN DEFAULT false,

  comment_type TEXT, -- AI 분류 결과
  ai_keywords TEXT[],
  ai_sentiment TEXT,
  ai_quality_score FLOAT,
  ai_language TEXT,
  ai_is_appropriate BOOLEAN DEFAULT true,
  ai_contains_personal_info BOOLEAN DEFAULT false,
  ai_summary TEXT,

  is_promoted_to_tip BOOLEAN DEFAULT false,
  promoted_by UUID REFERENCES admin_users(id),
  promoted_at TIMESTAMPTZ,

  is_public BOOLEAN DEFAULT true,
  like_count INT DEFAULT 0,
  report_count INT DEFAULT 0,

  created_at, updated_at, deleted_at
);

CREATE INDEX idx_user_comments_oreum_promoted ON user_comments(oreum_id, is_promoted_to_tip);
CREATE INDEX idx_user_comments_quality ON user_comments(ai_quality_score DESC);
CREATE INDEX idx_user_comments_keywords ON user_comments USING GIN(ai_keywords);
```

### 9.2 추가 테이블

```sql
-- 시계열 알림
CREATE TABLE oreum_trend_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oreum_id UUID NOT NULL REFERENCES oreums(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'warning' | 'seasonal' | 'general'
  keyword TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  recent_keyword_count INT,
  past_keyword_count INT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trend_alerts_oreum_active ON oreum_trend_alerts(oreum_id, is_active);

-- 코멘트 분석 큐
CREATE TABLE comment_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES user_comments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  attempts SMALLINT DEFAULT 0,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## 10. API 명세

### 10.1 POST /api/oreums/{slug}/comments

**Request**:
```typescript
{
  content: string;
  rating?: number;        // 1~5
  is_anonymous?: boolean;
  is_public?: boolean;    // 기본 true
  photo_id?: string;      // 사진 코멘트로 첨부
  discovery_id?: string;  // 인증과 연계
}
```

**Response**:
```typescript
{
  comment: {
    id: string;
    content: string;
    rating: number | null;
    created_at: string;
    user: { nickname: string } | null;  // 익명이면 null
    // AI 결과는 비동기 처리 후 채워짐
  };
}
```

### 10.2 GET /api/oreums/{slug}/comments

**Query**:
```
?type=tip|review|warning|all
&sort=newest|helpful|rating
&rating_min=1&rating_max=5
&page=1&limit=10
```

**Response**:
```typescript
{
  promoted_tips: Array<Comment>; // 팁 승격된 코멘트
  comments: Array<Comment>;
  pagination: { page: number; has_next: boolean; total: number };
  rating_summary: {
    average: number;
    count: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
}
```

### 10.3 PATCH /api/me/comments/{id}

본인 코멘트 수정.

```typescript
{ content?: string; rating?: number; is_public?: boolean }
```

### 10.4 DELETE /api/me/comments/{id}

본인 코멘트 삭제 (soft delete).

### 10.5 POST /api/comments/{id}/like

좋아요 (페이즈 2).

### 10.6 POST /api/comments/{id}/report

신고.

```typescript
{ reason: string; details?: string }
```

### 10.7 GET /api/oreums/{slug}/alerts

오름의 활성 트렌드 알림.

```typescript
{
  alerts: Array<{
    alert_type: string;
    keyword: string;
    message: string;
    detected_at: string;
  }>;
}
```

### 10.8 (관리자) PATCH /api/admin/comments/{id}/promote

팁으로 승격.

### 10.9 (관리자) PATCH /api/admin/comments/{id}/hide

비공개 처리.

### 10.10 (관리자) GET /api/admin/trend-alerts

트렌드 알림 검토 큐.

### 10.11 (관리자) PATCH /api/admin/trend-alerts/{id}/approve

알림 활성화.

---

## 11. 클라이언트 구현

### 11.1 코멘트 작성 컴포넌트

```typescript
function CommentForm({ oreumId, onSubmit }) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [prompt] = useState(() => getRandomPrompt());

  async function handleSubmit() {
    const validation = validateComment(content);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const result = await fetch(`/api/oreums/${oreumId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, rating, is_anonymous: isAnonymous, is_public: isPublic })
    }).then(r => r.json());

    toast.success('후기를 남겨주셔서 감사해요!');
    onSubmit(result.comment);
  }

  return (
    <form>
      <StarRating value={rating} onChange={setRating} />
      <p>{prompt}</p>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        maxLength={1000}
      />
      <span>{content.length} / 1000</span>
      <Toggle value={isAnonymous} onChange={setIsAnonymous}>익명으로</Toggle>
      <Toggle value={isPublic} onChange={setIsPublic}>다른 사람에게도 보이기</Toggle>
      <button onClick={handleSubmit}>후기 남기기</button>
    </form>
  );
}
```

### 11.2 시계열 알림 노출

```typescript
// 카드 페이지의 비주얼 영역 하단
function TrendAlertBanner({ oreumSlug }) {
  const { data: alerts } = useQuery({
    queryKey: ['trend-alerts', oreumSlug],
    queryFn: () => fetch(`/api/oreums/${oreumSlug}/alerts`).then(r => r.json())
  });

  if (!alerts || alerts.alerts.length === 0) return null;

  return (
    <div className="trend-alerts">
      {alerts.alerts.map(alert => (
        <Alert key={alert.keyword} type={alert.alert_type}>
          {alert.message}
        </Alert>
      ))}
    </div>
  );
}
```

---

## 12. 시계열 분석 워커

### 12.1 일일 배치

```typescript
// supabase/functions/trend-analyzer/index.ts
// pg_cron으로 매일 새벽 4시 호출

async function analyzeAllOreums() {
  const { data: oreums } = await supabase
    .from('oreums')
    .select('id')
    .eq('is_published', true);

  for (const oreum of oreums || []) {
    await analyzeOreumTrends(oreum.id);
  }
}

async function analyzeOreumTrends(oreumId: string) {
  // 1. 최근 30일 + 그 이전 60일 코멘트 수집
  const recent = await getCommentsLastDays(oreumId, 7);
  const past = await getCommentsBetween(oreumId, 8, 30);

  // 2. 키워드 빈도 집계
  const recentKeywords = aggregateKeywords(recent);
  const pastKeywords = aggregateKeywords(past);

  // 3. 변화 감지
  const trendChanges = detectTrendChange(recentKeywords, pastKeywords);

  // 4. 알림 후보 생성
  for (const change of trendChanges) {
    if (change.confidence > 0.7) {
      await createTrendAlert(oreumId, change);
    }
  }

  // 5. 만료된 알림 자동 비활성
  await expireOldAlerts(oreumId);
}
```

### 12.2 알림 자동 생성 vs 운영자 승인

**자동 활성화** (위험도 낮은 시즌 알림):
- "단풍이 시작됐어요"
- "벚꽃이 피었어요"

**운영자 승인 필요** (위험·실용 정보):
- "탐방로 폐쇄"
- "공사 중"
- "위험" 관련 모든 알림

이유: 오해의 소지가 큰 정보는 사람이 한 번 봐야 함.

---

## 13. 다국어 처리

### 13.1 사용자 언어별 코멘트

코멘트는 사용자 언어로 작성됨. AI가 `language` 필드로 식별.

### 13.2 노출 정책

기본: 같은 언어 사용자에게만 우선 노출
```sql
-- 한국어 사용자의 카드 페이지
SELECT * FROM user_comments
WHERE oreum_id = $1
  AND ai_language = 'ko'  -- 우선
  AND is_public = true
ORDER BY created_at DESC;

-- 한국어 코멘트 적으면 다른 언어도 노출
```

### 13.3 자동 번역 (페이즈 4)

검토:
- 외국 사용자가 자기 언어로 후기 보고 싶어할 때
- 자동 번역 표시 + "원문 보기" 옵션
- 단, 정확도 이슈로 페이즈 4 이후 검토

---

## 14. 부적절 콘텐츠 처리

### 14.1 자동 필터

AI가 `is_appropriate=false` 또는 `contains_personal_info=true`:
- 즉시 비공개 (`is_public=false`)
- 운영자 검토 큐에 추가
- 작성자에게 알림

### 14.2 사용자 신고

3회 이상 신고 누적:
- 자동 비공개
- 운영자 검토 후 복원 또는 영구 삭제

### 14.3 작성자 제재 (반복 위반)

운영자 백오피스에서:
- 경고 (1차)
- 일시 정지 (2차)
- 영구 정지 (3차+)

---

## 15. 분석·KPI

### 15.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `comment_started` | oreum_id |
| `comment_submitted` | oreum_id, length, has_rating |
| `comment_promoted_to_tip` | comment_id |
| `comment_liked` | comment_id |
| `comment_reported` | comment_id, reason |
| `trend_alert_shown` | oreum_id, alert_type |

### 15.2 KPI

- 인증당 코멘트 작성률 (목표: 30%+)
- 사용자당 누적 코멘트 수
- AI 분류 정확도 (운영자 수정률)
- 팁 승격률 (전체 코멘트의 5%+ 목표)
- 트렌드 알림 정확도 (운영자 승인률)
- 부적절 콘텐츠 감지 정확도

---

## 16. 테스트 시나리오

### 16.1 단위 테스트

- AI 분석 결과 파싱
- 키워드 추출 정확성
- 시계열 변화 감지 알고리즘
- 별점 집계

### 16.2 통합 테스트

- 코멘트 작성 → AI 분석 → 큐레이션 → 노출 (E2E)
- 부적절 코멘트 자동 비공개
- 시계열 알림 자동 생성

### 16.3 시나리오 테스트

- 100개 코멘트 시뮬레이션 데이터 → 정확한 분류
- 시즌별 키워드 → 알림 자동 활성화
- 워닝 키워드 → 운영자 검토 큐 진입

---

## 17. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 4종 코멘트 분류, AI 텍스트 분석, 운영자 큐레이션, 시계열 알림 시스템, 별점, 좋아요·신고, 데이터 모델, API 명세 | 기획+Claude |

---

## 18. 후속 작업

- AI 분석 프롬프트 검증 (50개 샘플 코멘트로 정확도 측정)
- 시계열 알림 알고리즘 시뮬레이션 (가상 데이터로)
- 운영자 백오피스 코멘트 검토 화면 와이어프레임
- 키워드 사전 (negative/seasonal/positive) 보강
- 다국어 코멘트 처리 정책 확정
- 부적절 콘텐츠 가이드라인 문서화

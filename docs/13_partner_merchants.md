# 13. Partner Merchants

> 본 문서는 제휴 상권의 운영 정책, 입점 모델, 아날로그 도장 시스템의 모든 명세를 정의한다.
> 제휴 상권은 본 프로젝트의 **두 번째 수익원**이자 **로컬 경제 연계 채널**이며,
> 디지털과 의도적으로 분리된 **아날로그 인증의 상징적 영역**이다.

---

## 0. 시스템 철학

### 0.1 제휴 상권의 역할

본 프로젝트에서 제휴 상권은 다음을 담당한다:

- **두 번째 수익원**: 연 입점료
- **사용자에게 추가 동기**: 코스 사이 자연스러운 휴식·먹거리
- **로컬 경제 연계**: 제주 중소상공인과의 공생
- **아날로그 인증의 매력**: 도장 받는 손맛, 디지털 미연동의 의미

### 0.2 핵심 결정

**제휴 상권 인증은 의도적으로 디지털 연동 X.**

- 점주가 직접 손도장 → 사용자 패스포트에 찍어줌
- 디지털 시스템과 분리 (기록 X, 카운트 X)
- 이유:
  - 점주 부담 최소화 (앱·태블릿 X)
  - 디지털 위·변조 가능성 회피
  - 손도장의 아날로그 매력 보존

### 0.3 명확히 하는 것

본 시스템에서 다루는 것:
- 제휴 상권 정보를 **앱에 표시**
- 사용자에게 가까운 상권 **추천**
- 제휴 상권 **모집·관리**

다루지 않는 것:
- 제휴 상권에서의 **인증 추적** (아날로그)
- 제휴 상권 **결제 시스템** (직접 결제, 우리 미연동)
- 점주용 **앱·태블릿** (없음)

---

## 1. 비즈니스 모델

### 1.1 수익 구조

**연 입점료 모델**:
- 카페/식당: 연 30~50만원 (1년 단위)
- 게스트하우스/숙박: 연 50~100만원
- 일반 매장: 연 30만원
- 첫 해 할인: 50% 옵션 (페이즈 1 모집 단계)

### 1.2 입점료 대비 가치 제공

점주가 받는 것:
- 앱 내 위치 노출 (오름과 묶여 표시)
- 동선 설계 시 자동 추천 후보
- 제휴 상권 페이지 입점 (검색 가능)
- SEO 트래픽 일부 흡수
- 인쇄물 패스포트의 부록 페이지에 등재
- 점주 도장 디자인 + 발송

### 1.3 경쟁 대비 매력

기존 제주 가이드앱 비교:
- 단순 광고 노출 → 우리는 **사용자 동선에 자연 통합**
- 일회성 노출 → 우리는 **연중 누적 노출**
- 정량 효과 측정 어려움 → 우리는 **방문자 통계 공유 (페이즈 2)**

### 1.4 1차 모집 목표

페이즈 0 출시 전:
- 100선 100개 오름 중 **80%에 1개 이상의 상권 매칭**
- 총 제휴 상권 **80~150곳**
- 우선 카테고리: 카페 > 식당 > 게스트하우스

---

## 2. 제휴 상권 카테고리

### 2.1 메인 카테고리

| 카테고리 | 코드 | 설명 |
|---------|------|------|
| **카페** | `cafe` | 카페, 디저트 |
| **식당** | `restaurant` | 한식, 양식, 분식 |
| **게스트하우스** | `guesthouse` | 숙박 |
| **편의점·마트** | `convenience` | 편의점, 슈퍼 |
| **잡화** | `shop` | 기념품, 잡화점 |
| **렌터카** | `rentcar` | 렌터카 |
| **체험** | `experience` | 한라봉 농장, 체험 시설 |
| **기타** | `other` | 그 외 |

### 2.2 카테고리별 노출 위치

| 카테고리 | 동선 설계 | 카드 페이지 주변 | 부록 페이지 |
|---------|----------|---------------|-----------|
| 카페 | 높은 우선 | 노출 | 등재 |
| 식당 | 점심·저녁 시간 | 노출 | 등재 |
| 게스트하우스 | 출발지 옵션 | 노출 (선택) | 등재 |
| 편의점·마트 | 그날의 첫 stop | 노출 (옵션) | 등재 |
| 잡화 | 노출 X | 노출 | 등재 |
| 렌터카 | 출발지 옵션 | 노출 X | 등재 |
| 체험 | 노출 X | 노출 (옵션) | 등재 |

---

## 3. 데이터 모델

### 3.1 partner_merchants 테이블

`01_data_model.md` 6.2 참조. 주요 필드 +α:

```sql
CREATE TABLE partner_merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name TEXT NOT NULL,
  name_en TEXT,
  name_ja TEXT,
  name_zh TEXT,
  merchant_type TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  -- ...

  -- 위치
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  geohash TEXT,

  -- 영업 정보
  business_hours JSONB,
  -- {mon: '09:00-18:00', tue: '09:00-18:00', ..., sun: 'closed', special_notes: '...'}
  contact_phone TEXT,
  website_url TEXT,
  instagram_handle TEXT,
  naver_map_url TEXT,
  kakao_map_url TEXT,

  -- 비주얼
  cover_image_url TEXT,
  gallery_image_urls TEXT[],
  logo_url TEXT,

  -- 메뉴·상품 (옵션)
  signature_items JSONB,
  -- [{name: '한라봉 라떼', price: 6000, image_url: '...'}, ...]

  -- 제휴 관리
  partnership_status TEXT DEFAULT 'pending',
    -- 'pending' (계약 진행 중)
    -- 'active' (활성)
    -- 'inactive' (휴면)
    -- 'expired' (만료)
    -- 'terminated' (해지)
  partnership_started_at DATE,
  partnership_expires_at DATE,
  annual_fee_amount INT,
  annual_fee_paid BOOLEAN DEFAULT false,
  payment_method TEXT, -- 'bank_transfer' | 'card' | ...
  contract_signed_at DATE,
  contract_url TEXT,

  -- 점주 정보 (운영자 전용)
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  business_registration_number TEXT, -- 사업자등록번호

  -- 도장 관리
  stamp_design_url TEXT, -- 점주에게 발송된 도장 디자인
  stamp_delivered_at DATE,
  stamp_design_version INT DEFAULT 1,

  -- 연관 오름
  related_oreum_ids UUID[], -- 가까운 오름 자동 매칭 + 운영자 큐레이션
  primary_oreum_id UUID REFERENCES oreums(id),

  -- 노출
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false, -- 우대 노출
  display_order INT DEFAULT 0,

  -- 통계 (페이즈 2)
  view_count BIGINT DEFAULT 0,
  click_count BIGINT DEFAULT 0,
  course_inclusion_count BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partner_merchants_status ON partner_merchants(partnership_status);
CREATE INDEX idx_partner_merchants_geohash ON partner_merchants(geohash);
CREATE INDEX idx_partner_merchants_oreums ON partner_merchants USING GIN(related_oreum_ids);
CREATE INDEX idx_partner_merchants_expires ON partner_merchants(partnership_expires_at);
```

### 3.2 연관 오름 매칭

자동 매칭 (페이즈 0 일괄 처리):

```sql
-- 각 상권에 대해 5km 이내 100선 오름 자동 연결
UPDATE partner_merchants
SET related_oreum_ids = (
  SELECT ARRAY_AGG(o.id)
  FROM oreums o
  WHERE o.is_top_100 = true
    AND ST_DWithin(
      ST_Point(o.longitude, o.latitude)::geography,
      ST_Point(partner_merchants.longitude, partner_merchants.latitude)::geography,
      5000 -- 5km
    )
);
```

운영자가 추가 큐레이션 가능 (`primary_oreum_id` 지정).

---

## 4. 사용자 측 노출

### 4.1 카드 페이지의 "주변 함께 가볼 곳"

`05_oreum_card_page.md` 섹션 8 참조.

```
[카드 페이지의 주변 영역]

[제휴 상권 가로 스크롤 카드]
┌──────────────┐ ┌──────────────┐
│ [상점 사진]   │ │ [상점 사진]   │
│ 카페 오롯     │ │ 다랑쉬 식당   │
│ 0.6km · 카페  │ │ 1.2km · 식당  │
│ ☎️ XXX-XXXX  │ │ ☎️ XXX-XXXX  │
└──────────────┘ └──────────────┘

각 카드 사양:
- 폭 160px, 높이 200px
- 모서리 --radius-md
- 사진: 70% 높이
- 정보: 30% 높이

탭 시: 상권 상세 페이지
```

### 4.2 상권 상세 페이지

```
[/merchant/{id}]

상단:
- 커버 사진 (큰 이미지)
- 상점 이름
- 카테고리 라벨
- 평균 별점 (있다면, 페이즈 2)

핵심 정보:
- 주소 (지도 핀)
- 영업 시간 (현재 영업 중 표시)
- 연락처
- 인스타그램·홈페이지 링크

설명:
- 200~300자 상점 소개

대표 메뉴 (옵션):
- 시그니처 아이템 3~5개

연관 오름:
- 가까운 오름 카드 노출
- "이 상점 근처 오름 보기"

지도:
- 카카오맵 인터랙티브
- 길찾기 버튼 (카카오·네이버맵)

전화·문의:
- 즉시 통화 버튼
- 인스타그램 메시지 옵션
```

### 4.3 상권 검색·둘러보기

```
[/merchants 또는 별도 탭]

필터:
- 카테고리
- 지역
- 영업 중 (현재)
- 가까운 순

리스트 또는 지도 모드 (페이즈 2)

각 상권 카드:
- 사진, 이름, 거리
- 영업 중 / 영업 종료 표시
- 연관 오름
```

### 4.4 동선 설계 통합

`06_wishlist_routing.md` 3.7 알고리즘 참조.

옵션 활성 시:
- 오름 사이에 카페·식당 자동 끼워넣기
- 점심 시간 고려 시 식당 우선
- 우천 시 카페 우선 노출 (페이즈 3)

---

## 5. 인쇄물 패스포트 통합

### 5.1 인쇄물 부록 페이지

`12_print_passport.md` 섹션 7 참조.

```
[제휴 상권 리스트 페이지 4페이지]

각 페이지에 4~6개 상권:
- 이름, 위치, 종류, 연락처
- 도장 자리 1개 (원형 25mm)
```

### 5.2 도장 시스템 (아날로그)

#### 5.2.1 도장 디자인

운영팀이 점주별로 통일된 디자인 도장 발주:

```
도장 사양:
- 직경: 25mm 원형
- 디자인 요소:
  · 상권명 (한글)
  · 일러스트 (오름 또는 상점 마스코트)
  · 작은 영문/연관 오름명
- 잉크: 검정 또는 진한 그린
- 재질: 일반 도장 또는 셀프 잉크 도장 (점주 선택)
```

#### 5.2.2 점주에게 발송

```
[제휴 계약 → 결제 완료]
    ↓
[운영자가 도장 디자인 시안 작성]
    ↓
[점주 검토·승인]
    ↓
[도장 제작 발주 (외주)]
    ↓
[점주에게 우편 발송]
    ↓
[점주가 매장에 비치]
```

#### 5.2.3 사용자 측 사용

```
[사용자가 패스포트 들고 매장 방문]
    ↓
[점주가 도장 찍어줌]
    ↓
[패스포트의 해당 상권 자리에 도장 흔적]
    ↓
[디지털 시스템과 연동 X]
```

#### 5.2.4 도장 받는 횟수

- 같은 상권: 1회만 (의미 X) — 점주가 알아서 정함
- 사용자 입장: 컬렉션 차원의 도장 모으기

---

## 6. 점주 모집·운영

### 6.1 모집 채널

페이즈 0:
- **직접 컨택**: 100선 인근 카페·식당 직접 방문
- **인스타그램 메시지**: 제주 인기 카페 위주
- **제주 상공회의소 협력**
- **블로그·SNS 광고**: 점주 대상

페이즈 1+:
- **사용자 추천**: "여기 좋은데 입점 안 했나?" 신청
- **점주 자발적 신청**: 우리 사이트의 신청 페이지

### 6.2 입점 신청 페이지

```
[/become-partner]

설명:
- 제휴 혜택 안내
- 입점료 정보
- 가입 방법

신청 폼:
- 상점 이름
- 카테고리
- 위치 (주소)
- 점주 정보 (이름·연락처·이메일)
- 사업자등록번호
- 인스타그램·홈페이지 (옵션)
- 가입 동기

[신청하기]
```

### 6.3 운영자 처리

```
[신청 접수]
    ↓
[운영자 검토 (1주 이내)]
- 위치·카테고리 적합성
- 기존 상권과 중복 여부
- 대중성·평판
    ↓
[승인 시]
- 점주에게 계약서·결제 안내 이메일
    ↓
[계약·결제 완료]
- partnership_status='active'
- 도장 발주
- 앱·인쇄물 등재
    ↓
[입점 완료 안내]
- 점주에게 입점 완료 + 도장 도착 일정 안내
```

### 6.4 만료·갱신

```
[partnership_expires_at 30일 전]
    ↓
[자동 알림 이메일 점주에게 발송]
- "갱신하시겠어요?"
    ↓
[점주가 갱신 또는 종료]
    ↓
[갱신 시: 결제 → expires_at 1년 연장]
[종료 시: status='inactive', 앱·인쇄물에서 제거]
```

### 6.5 해지·이슈 처리

```
점주 해지 요청 → 즉시 status='terminated'
이슈 발생 (위생 문제, 갑질 등) → 운영자 검토 후 status 변경
```

---

## 7. 운영자 백오피스 통합

상세는 `14_admin_backoffice.md` 참조. 핵심 화면만 정리.

### 7.1 제휴 상권 관리 화면

```
[/admin/merchants]

상단:
- 통계 (활성 N개, 만료 임박 N개)
- 신규 신청 N개

리스트:
- 정렬: 입점일, 만료 임박, 활성 상태
- 필터: 카테고리, 지역, 상태

각 row:
- 이름, 카테고리, 위치
- 상태 (active/inactive/expired)
- 만료 일자
- 액션 (수정, 사진 추가, 종료)
```

### 7.2 신규 신청 검토

```
[/admin/merchants/applications]

신청 리스트:
- 신청일 순
- 검토 액션:
  - 승인 → 계약 단계
  - 거절 → 사유 입력
  - 보류
```

### 7.3 통계 (페이즈 2)

```
[각 상권의 통계]
- 카드 페이지에서 노출된 횟수
- 사용자가 클릭한 횟수
- 동선에 포함된 횟수
- 길찾기 클릭 횟수

이 데이터를 점주에게 분기별 리포트로 제공 (입점료 가치 증명)
```

---

## 8. API 명세

### 8.1 GET /api/merchants

상권 검색.

**Query**:
```
?category=cafe|restaurant|all
&region=east|all
&open_now=true|false
&near_oreum_id={uuid}
&max_distance_km=5
&page=1&limit=20
```

**Response**:
```typescript
{
  merchants: Array<{
    id: string;
    name: string;
    merchant_type: string;
    cover_image_url: string | null;
    location: { lat: number; lng: number };
    distance_km?: number;
    is_open_now: boolean;
    business_hours_today: string;
    related_oreum_count: number;
  }>;
  pagination: { page: number; has_next: boolean; total: number };
}
```

### 8.2 GET /api/merchants/{id}

상권 상세.

```typescript
{
  merchant: {
    id: string;
    name: string;
    description: string;
    merchant_type: string;
    address: string;
    location: { lat: number; lng: number };
    cover_image_url: string;
    gallery_image_urls: string[];
    business_hours: BusinessHours;
    is_open_now: boolean;
    contact_phone: string;
    website_url: string | null;
    instagram_handle: string | null;
    signature_items: Array<{ name: string; price: number; image_url: string }>;
    related_oreums: Array<Oreum>;
  };
}
```

### 8.3 GET /api/oreums/{slug}/merchants

특정 오름 근처 상권.

```typescript
{
  merchants: Array<Merchant>;
}
```

### 8.4 POST /api/partners/apply

제휴 신청.

```typescript
{
  store_name: string;
  category: string;
  address: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  business_registration_number: string;
  instagram_handle?: string;
  motivation: string;
}
```

### 8.5 (관리자) GET /api/admin/merchants

관리 리스트.

### 8.6 (관리자) PATCH /api/admin/merchants/{id}

수정.

### 8.7 (관리자) GET /api/admin/applications

신청 리스트.

### 8.8 (관리자) POST /api/admin/applications/{id}/approve

승인.

### 8.9 (관리자) POST /api/admin/applications/{id}/reject

거절.

---

## 9. 영업 시간 처리

### 9.1 데이터 형식

```json
{
  "mon": "09:00-21:00",
  "tue": "09:00-21:00",
  "wed": "09:00-21:00",
  "thu": "09:00-21:00",
  "fri": "09:00-22:00",
  "sat": "09:00-22:00",
  "sun": "10:00-21:00",
  "special_notes": "매주 첫째 화요일 휴무",
  "holidays": ["2026-05-05", "2026-09-29"]
}
```

### 9.2 현재 영업 중 판단

```typescript
function isOpenNow(hours: BusinessHours, now: Date = new Date()): boolean {
  // 휴일 체크
  const dateStr = format(now, 'yyyy-MM-dd');
  if (hours.holidays?.includes(dateStr)) return false;

  // 요일 체크
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
  const dayHours = hours[dayKey];
  if (!dayHours || dayHours === 'closed') return false;

  // 시간 체크
  const [open, close] = dayHours.split('-');
  const currentTime = format(now, 'HH:mm');
  return currentTime >= open && currentTime < close;
}
```

### 9.3 표시 로직

```
[현재 영업 중] (그린 도트)
[영업 종료] (회색 도트)
[곧 영업 시작 (1시간 이내)] (옐로우 도트)
[곧 영업 종료 (30분 이내)] (오렌지 도트)
```

---

## 10. 다국어 처리

### 10.1 상권 정보 다국어

DB에 `name_en`, `name_ja`, `name_zh`, `description_en` 등 컬럼.

페이즈별:
- 페이즈 1: 한국어만
- 페이즈 2: 영어 추가 (UI + 일부 상권)
- 페이즈 4: 일본어·중국어 검토

### 10.2 fallback

```typescript
const merchantName = lang === 'ko'
  ? merchant.name
  : merchant[`name_${lang}`] || merchant.name;
```

---

## 11. 분석·KPI

### 11.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `merchant_viewed` | merchant_id, source |
| `merchant_clicked` | merchant_id, source |
| `merchant_directions_clicked` | merchant_id, app |
| `merchant_call_clicked` | merchant_id |
| `merchant_added_to_course` | merchant_id, course_id |
| `partner_application_started` | - |
| `partner_application_submitted` | category |

### 11.2 KPI

- 활성 제휴 상권 수
- 카드 페이지 진입 → 상권 클릭 비율
- 동선 설계에서 상권 포함 비율
- 입점료 갱신율 (목표: 80%+)
- 신규 신청 수 (월간)
- 점주 만족도 (분기별 설문, 페이즈 2)

### 11.3 점주에게 제공할 통계 리포트 (페이즈 2)

분기별 PDF 리포트:
- 카드 페이지 노출 횟수
- 클릭 횟수
- 길찾기 클릭 횟수
- 동선 포함 횟수
- 같은 카테고리 평균 대비 위치

---

## 12. 점주와의 커뮤니케이션

### 12.1 정기 안내

- **분기별 뉴스레터**: 신규 기능, 상권 통계, 운영 팁
- **시즌 캠페인 안내**: "가을 단풍 시즌 코스에 포함됐어요"
- **갱신 30일 전 알림**

### 12.2 이슈 발생 시

- 사용자 신고 → 운영자 검토 → 점주 컨택
- 영업 시간 변경 → 점주 자기 정보 업데이트 요청 (이메일)

### 12.3 점주 자가 정보 수정 (페이즈 2)

페이즈 2 검토:
- 점주 전용 간단 로그인
- 영업 시간, 사진, 메뉴 직접 수정
- 단, 신뢰 검증 후 활성화

페이즈 1: 운영자가 점주 요청받아 수정.

---

## 13. 제휴 상권 약관·계약

### 13.1 표준 계약 사항

- 입점료 (연 단위)
- 등재 기간 (1년)
- 노출 영역 (앱 + 인쇄물)
- 도장 디자인·발송 책임 (운영팀)
- 점주 책임:
  - 정확한 영업 정보 제공
  - 도장 비치
  - 손도장 협조
  - 사용자에 대한 친절한 응대

### 13.2 해지 사유

- 점주 자발적 해지 (즉시)
- 입점료 미납 (30일 유예 후 자동 해지)
- 사용자 중대 신고 (검증 후)
- 매장 폐업 (즉시)

### 13.3 계약 문서 관리

- 표준 계약서 PDF 템플릿
- 점주 서명 후 contract_url에 저장
- 운영자가 백오피스에서 접근

---

## 14. 페이즈별 도입

### 14.1 페이즈 0 (출시 전)

- 80~150개 상권 1차 모집·계약
- 데이터 입력 + 사진 수집
- 도장 디자인·발송
- 부록 페이지 등재

### 14.2 페이즈 1 (출시)

- 카드 페이지·동선 설계에 노출
- 길찾기·전화 액션
- 신규 신청 페이지

### 14.3 페이즈 2 (확장)

- 점주 통계 리포트 제공
- 점주 자가 정보 수정 (제한적)
- 영어 정보 추가
- 매장 후기 시스템 (페이즈 2 후반)

### 14.4 페이즈 3 (수익 다각화)

- 시즌 캠페인 (예: "여름 카페 베스트")
- 추천·우대 노출 (입점료 차등)
- 굿즈 위탁 판매 (제휴 상권에서 패스포트·굿즈 판매)

---

## 15. 테스트 시나리오

### 15.1 단위 테스트

- 영업 시간 판단 로직
- 거리·연관 오름 자동 매칭
- 만료 알림 트리거

### 15.2 통합 테스트

- 카드 페이지 → 상권 클릭 → 길찾기
- 동선 설계 → 상권 자동 포함
- 신청 → 승인 → 활성화 흐름

### 15.3 시나리오 테스트

- 만료 30일 전 → 자동 알림 발송
- 미납 30일 → 자동 해지
- 매장 폐업 신고 → 운영자 검토

---

## 16. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. 비즈니스 모델 (연 입점료), 8개 카테고리, 데이터 모델, 사용자 측 노출 (카드·상세·동선), 아날로그 도장 시스템, 점주 모집·운영, 백오피스 통합, API 명세, 페이즈별 도입 | 기획+Claude |

---

## 17. 후속 작업

- 표준 계약서 템플릿 (법무 검토)
- 입점료 견적 시뮬레이션 (지역·카테고리별)
- 도장 디자인 템플릿 5종 (점주 선택)
- 도장 외주 인쇄소 견적 (도장 100~150개)
- 점주 모집 자료 (PDF, 이메일 템플릿)
- 표준 입점 안내 페이지 카피 작성
- 페이즈 0 모집 일정 수립

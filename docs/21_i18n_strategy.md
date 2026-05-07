# 21. Internationalization (i18n) Strategy

> 본 문서는 다국어 전략의 모든 명세를 정의한다.
> 출시 첫날부터 i18n 인프라를 깔되, 콘텐츠는 한국어부터 점진 확장한다.
> 페이즈 4까지 글로벌 확장의 명확한 로드맵을 제시한다.

---

## 0. 전략 철학

### 0.1 왜 처음부터 i18n인가

`core.md` 2.8 글로벌 우선 원칙에 근거.

**처음부터 i18n 인프라를 깔지 않으면**:
- 모든 컴포넌트의 텍스트가 하드코딩
- 페이즈 2~3에 영어 도입 시 **모든 페이지 재구성** 필요
- 추가 비용 200%+ (실제로 2배 이상)

**처음부터 깔면**:
- 추가 비용 30% 정도
- 영어 콘텐츠만 작성하면 즉시 활성화
- 일본어·중국어도 동일 인프라로 추가 가능

### 0.2 콘텐츠는 한국어부터

**도입 일정**:

| 시점 | 한국어 | 영어 | 일본어 | 중국어 |
|------|--------|------|--------|--------|
| 페이즈 0~1 (출시) | ✅ 100% | ❌ | ❌ | ❌ |
| 페이즈 2 (+3~6개월) | ✅ | UI 100% + SEO 100선 | ❌ | ❌ |
| 페이즈 3 (+6~12개월) | ✅ | SEO 360개 완성 | 검토 | 검토 |
| 페이즈 4 (1년+) | ✅ | ✅ | UI + SEO 일부 | UI + SEO 일부 |

### 0.3 핵심 결정

- **next-intl 채택** (Next.js 14 App Router 친화)
- **URL 라우팅**: `/{lang}/...` 구조 (예: `/ko/oreum/darangshi`)
- **DB 다국어 컬럼**: `name_ko`, `name_en`, `name_ja`, `name_zh`
- **fallback 정책**: 콘텐츠 부재 시 한국어로 자동 리다이렉트 (SEO 페널티 회피)
- **언어 감지 기본값**: Accept-Language 헤더 → 사용자 명시적 선택 우선

---

## 1. 기술 스택

### 1.1 next-intl 채택 이유

| 기준 | next-intl | next-i18next | react-intl |
|------|-----------|--------------|------------|
| App Router 호환 | ✅ 우수 | ⚠️ 제한적 | ❌ 직접 통합 |
| Server Component | ✅ | ⚠️ | ❌ |
| TypeScript 타입 | ✅ 자동 | ⚠️ 수동 | ⚠️ |
| 메시지 파일 형식 | JSON (간단) | JSON | JSON/TS |
| 번역 함수 | `useTranslations` | `useTranslation` | `useIntl` |
| 학습 곡선 | 낮음 | 중간 | 중간 |

**결론: next-intl**

### 1.2 설치·설정

```bash
npm install next-intl
```

**기본 설정**:

```typescript
// next.config.js
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

module.exports = withNextIntl({
  // 기존 설정
});
```

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export const defaultLocale = 'ko';
export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ko', 'en', 'ja', 'zh'],
  defaultLocale: 'ko',
  localeDetection: true // Accept-Language 자동 감지
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 1.3 디렉토리 구조

```
app/
├── [locale]/
│   ├── layout.tsx          # 루트 레이아웃 (NextIntlClientProvider)
│   ├── page.tsx            # 홈
│   ├── oreum/
│   │   ├── [slug]/
│   │   │   └── page.tsx
│   │   └── region/
│   │       └── [region]/
│   │           └── page.tsx
│   ├── quiz/
│   │   ├── page.tsx
│   │   └── result/
│   │       └── [mbti]/
│   │           └── page.tsx
│   └── ...
├── api/                    # API는 locale 무관
└── ...

messages/
├── ko.json
├── en.json
├── ja.json
└── zh.json

i18n.ts
middleware.ts
```

---

## 2. URL 구조

### 2.1 라우팅 패턴

모든 사용자 페이지는 `/{lang}/...` 형식:

```
/ko (홈, 한국어)
/en (홈, 영어)
/ko/oreum/darangshi
/en/oreum/darangshi
/ko/quiz
/en/quiz
/ko/quiz/result/enfj
/en/quiz/result/enfj
```

### 2.2 Slug 정책

**일관성**: 모든 언어에서 같은 slug 사용.

```
/ko/oreum/darangshi
/en/oreum/darangshi  ← 영어도 같은 slug
/ja/oreum/darangshi
/zh/oreum/darangshi
```

이유:
- URL 일관성으로 SEO 권한 통합
- 언어 전환 시 같은 페이지 유지 가능
- 관리·디버깅 단순

### 2.3 기본 언어 처리

**옵션 A**: `/`도 `/ko/`로 리다이렉트
**옵션 B**: `/`는 한국어, `/en/`만 영어 (next-intl 기본)

**본 프로젝트의 선택: 옵션 B (또는 A의 변형)**

이유:
- 한국 사용자 90%+, 한국어가 사실상 기본
- `/`가 한국어로 동작하면 기존 URL 호환
- `/en/`만 별도 prefix

```typescript
// middleware 설정
export default createMiddleware({
  locales: ['ko', 'en', 'ja', 'zh'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed' // ko는 prefix 없음, 다른 언어만 /en/, /ja/, /zh/
});
```

결과:
```
/ → 한국어 (기본, prefix 없음)
/oreum/darangshi → 한국어
/en/ → 영어
/en/oreum/darangshi → 영어
```

### 2.4 hreflang 태그

각 페이지 메타에 다국어 버전 명시:

```html
<head>
  <link rel="alternate" hreflang="ko" href="https://jejuoreum.com/oreum/darangshi" />
  <link rel="alternate" hreflang="en" href="https://jejuoreum.com/en/oreum/darangshi" />
  <link rel="alternate" hreflang="ja" href="https://jejuoreum.com/ja/oreum/darangshi" />
  <link rel="alternate" hreflang="zh" href="https://jejuoreum.com/zh/oreum/darangshi" />
  <link rel="alternate" hreflang="x-default" href="https://jejuoreum.com/oreum/darangshi" />
</head>
```

자동 생성:

```typescript
// app/[locale]/oreum/[slug]/page.tsx
export async function generateMetadata({ params }) {
  return {
    alternates: {
      canonical: `/${params.locale}/oreum/${params.slug}`,
      languages: {
        'ko': `/oreum/${params.slug}`,
        'en': `/en/oreum/${params.slug}`,
        'ja': `/ja/oreum/${params.slug}`,
        'zh': `/zh/oreum/${params.slug}`,
        'x-default': `/oreum/${params.slug}`
      }
    }
  };
}
```

---

## 3. 메시지 파일

### 3.1 파일 구조

```
messages/
├── ko.json
├── en.json
├── ja.json
└── zh.json
```

### 3.2 메시지 키 컨벤션

계층 구조 + 점 표기법:

```json
{
  "common": {
    "buttons": {
      "save": "저장",
      "cancel": "취소",
      "submit": "제출"
    },
    "validation": {
      "required": "필수 입력입니다",
      "min_length": "{count}자 이상 입력해주세요"
    }
  },
  "home": {
    "greeting": {
      "morning": "좋은 아침이에요",
      "afternoon": "좋은 오후네요"
    },
    "cards": {
      "today_recommendation": "오늘의 추천 오름",
      "rhythm": "이번 달 리듬"
    }
  },
  "oreum": {
    "card_page": {
      "tabs": {
        "overview": "한눈에",
        "trail": "탐방",
        "around": "주변"
      }
    }
  }
}
```

### 3.3 영어 메시지 예시 (페이즈 2)

```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "submit": "Submit"
    },
    "validation": {
      "required": "This field is required",
      "min_length": "Please enter at least {count} characters"
    }
  },
  "home": {
    "greeting": {
      "morning": "Good morning",
      "afternoon": "Good afternoon"
    },
    "cards": {
      "today_recommendation": "Today's Pick",
      "rhythm": "This Month's Rhythm"
    }
  }
}
```

### 3.4 메시지 키 네이밍 규칙

| 영역 | 키 |
|------|---|
| 공통 (버튼, 폼) | `common.*` |
| 페이지별 | `home.*`, `oreum.card_page.*`, `quiz.*` |
| 컴포넌트별 | `components.{name}.*` |
| 에러 메시지 | `errors.*` |
| 알림 | `notifications.*` |

규칙:
- 영문 소문자 + snake_case
- 명사 위주 (예: `card_title` not `the_card_title`)
- 길이 < 60자

### 3.5 변수·복수형

```json
{
  "discoveries_count": "{count}개의 오름을 발견했어요",
  "visitors_label": "{count}명이 다녀갔어요",
  "discoveries_plural": {
    "one": "{count}개의 오름",
    "other": "{count}개의 오름들"
  }
}
```

ICU 메시지 형식 지원.

```typescript
const t = useTranslations('home');
t('discoveries_count', { count: 5 });
// 한국어: "5개의 오름을 발견했어요"
// 영어: "Discovered 5 oreums"
```

---

## 4. 컴포넌트에서 사용

### 4.1 Server Component

```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('home');

  return (
    <div>
      <h1>{t('greeting.morning')}</h1>
      <p>{t('cards.today_recommendation')}</p>
    </div>
  );
}
```

### 4.2 Client Component

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Greeting() {
  const t = useTranslations('home.greeting');

  return <h1>{t('morning')}</h1>;
}
```

### 4.3 변수 사용

```typescript
const t = useTranslations('home');

return <p>{t('discoveries_count', { count: 5 })}</p>;
```

### 4.4 마크업 포함

```typescript
const t = useTranslations('common');

return (
  <p>
    {t.rich('agreement', {
      link: (chunks) => <a href="/terms">{chunks}</a>
    })}
  </p>
);

// JSON: { "agreement": "<link>이용약관</link>에 동의합니다" }
```

### 4.5 날짜·숫자 포맷

```typescript
import { useFormatter } from 'next-intl';

function PriceLabel({ price }) {
  const format = useFormatter();
  return <span>{format.number(price, { style: 'currency', currency: 'KRW' })}</span>;
}

function DateLabel({ date }) {
  const format = useFormatter();
  return <span>{format.dateTime(date, { dateStyle: 'medium' })}</span>;
  // 한국어: "2026. 5. 20."
  // 영어: "May 20, 2026"
}
```

---

## 5. DB 다국어 전략

### 5.1 다국어 컬럼 패턴

자주 쓰이는 컬럼은 언어별 별도:

```sql
-- 오름
oreums.name_ko, name_en, name_ja, name_zh
oreums.one_liner_ko, one_liner_en, one_liner_ja, one_liner_zh

-- 배지
badges.name_ko, name_en, name_ja, name_zh
badges.description_ko, description_en, ja, zh

-- 챌린지
challenges.title_ko, title_en, ...
challenges.description_ko, description_en, ...

-- 제휴 상권
partner_merchants.name_ko, name_en, ...
partner_merchants.description_ko, description_en, ...

-- AR 랜드마크
ar_landmarks.name_ko, name_en, name_ja, name_zh

-- MBTI 문항
mbti_questions.question_ko, question_en, ...
```

### 5.2 SEO 콘텐츠 (별도 row)

본문이 긴 SEO 콘텐츠는 언어별 별도 row:

```sql
CREATE TABLE seo_contents (
  id UUID PRIMARY KEY,
  oreum_id UUID,
  language TEXT NOT NULL, -- 'ko' | 'en' | 'ja' | 'zh'
  slug TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  content_sections JSONB NOT NULL,
  -- ...
  UNIQUE(oreum_id, language)
);
```

이유:
- 본문 데이터량 큼 (1,500~2,500자)
- 언어별 발행 시점 다름
- 언어별 별도 검색·관리 편함

### 5.3 fallback 헬퍼 함수

```typescript
function getLocalizedField<T>(
  obj: T,
  fieldBase: keyof T,
  lang: string
): string {
  const key = `${String(fieldBase)}_${lang}` as keyof T;
  return (obj[key] as string) || (obj[`${String(fieldBase)}_ko` as keyof T] as string);
}

// 사용
const oreumName = getLocalizedField(oreum, 'name', currentLang);
const oneLiner = getLocalizedField(oreum, 'one_liner', currentLang);
```

### 5.4 사용자 언어 우선순위

```typescript
async function getUserLanguage(req): Promise<Locale> {
  // 1. URL prefix
  const urlLocale = getLocaleFromUrl(req.url);
  if (urlLocale) return urlLocale;

  // 2. 로그인 사용자 설정
  const user = await getUser(req);
  if (user?.preferred_language) return user.preferred_language;

  // 3. Accept-Language 헤더
  const browserLocale = parseAcceptLanguage(req.headers['accept-language']);
  if (locales.includes(browserLocale)) return browserLocale;

  // 4. 기본값
  return 'ko';
}
```

---

## 6. 콘텐츠 부재 시 fallback

### 6.1 정책: 한국어로 자동 리다이렉트

영어 콘텐츠가 없는 페이지 영어로 접근 시:

**본 프로젝트의 결정: 한국어 페이지로 자동 리다이렉트**

이유:
- 영어 본문 위치에 한국어 콘텐츠 노출 → SEO 페널티 위험
- Google이 영어 검색에 한국어 페이지 노출하면 신뢰 하락
- 사용자에게 명확한 안내 필요

### 6.2 fallback 흐름

```
[/en/oreum/{slug} 진입]
    ↓
[seo_contents 조회 (oreum_id + language='en')]
    ↓
─── 영어 콘텐츠 존재 → 영어 페이지 표시
─── 영어 콘텐츠 부재
    ↓
    [한국어로 리다이렉트]
    /ko/oreum/{slug}? lang_fallback=true
    ↓
    [페이지 상단 안내 배너]
    "Korean version shown. English coming soon."
```

### 6.3 sitemap 처리

영어 콘텐츠 없는 페이지는 영어 sitemap에 X.

```typescript
// app/[locale]/sitemap.ts
export default async function sitemap({ params }) {
  const lang = params.locale;
  const oreums = await getOreumsWithContentInLanguage(lang);

  return oreums.map(o => ({
    url: `https://jejuoreum.com/${lang}/oreum/${o.slug}`,
    lastModified: o.updated_at
  }));
}
```

---

## 7. 언어 전환 UI

### 7.1 전환 버튼 위치

| 위치 | 컨텍스트 |
|------|---------|
| 헤더 (데스크탑) | 우상단 드롭다운 |
| 마이 탭 → 설정 | 명시적 선택 |
| 모바일 메뉴 | 햄버거 메뉴 안 |

### 7.2 헤더 드롭다운

```
[언어 선택 드롭다운]

현재: 🇰🇷 한국어 ▼

펼치면:
┌──────────────────────┐
│ 🇰🇷 한국어 (현재)      │
│ 🇺🇸 English          │
│ 🇯🇵 日本語            │
│ 🇨🇳 中文              │
└──────────────────────┘
```

### 7.3 전환 흐름

```
[언어 선택]
    ↓
[현재 페이지의 같은 slug로 새 언어 페이지로 이동]
- /oreum/darangshi → /en/oreum/darangshi
    ↓
[로그인 사용자: user_settings.preferred_language 업데이트]
[비로그인: 쿠키에 저장 (locale)]
```

### 7.4 콘텐츠 부재 시 안내

```typescript
async function switchLanguage(newLang: string) {
  const currentPath = usePathname();
  const newPath = changeLocale(currentPath, newLang);

  // 새 언어 페이지 콘텐츠 존재 여부 확인
  const exists = await checkPageExistsInLanguage(currentPath, newLang);

  if (!exists) {
    showToast(`${newLang} version is not available. Showing Korean instead.`);
    router.push(currentPath); // 한국어 유지
  } else {
    router.push(newPath);
  }
}
```

---

## 8. 콘텐츠 번역 워크플로우

### 8.1 4단계 워크플로우

```
[1단계: 한국어 원본 작성]
    ↓
[2단계: 전문 번역가 번역]
    ↓
[3단계: 검수 (해당 언어 원어민 + 도메인 이해자)]
    ↓
[4단계: 백오피스에 등록]
```

### 8.2 1단계: 한국어 원본

`18_seo_content.md` 6번 워크플로우 참조.

### 8.3 2단계: 전문 번역가

**번역가 선정 기준**:
- 한→영 (또는 한→일/중) 전문
- 한국 관광 도메인 이해
- 시간당 또는 글자당 단가

**비용 추정** (영어):
- 글자당 약 30~80원
- 1페이지 평균 2,000자 = 약 6~16만원
- 100선 100개 = 약 600~1,600만원

**대안**: AI 번역 (DeepL, GPT-4) + 인간 검수
- 비용 절감 50%+
- 단, 검수 필수

### 8.4 3단계: 검수

원어민 검수자가 확인:
- 자연스러운 영어 표현
- 한국 고유 명사·개념 처리
  - "오름"을 "Oreum"으로 그대로? "Volcanic cone"으로?
  - 본 프로젝트 선택: "Oreum (volcanic cone)" 같이 병기
- SEO 키워드 현지화 (직역 X)

### 8.5 4단계: 백오피스 등록

`14_admin_backoffice.md` 7번 SEO 편집기 활용:
- 언어별 탭 (ko / en / ja / zh)
- 미리보기
- 발행

---

## 9. 언어별 SEO 전략

### 9.1 검색엔진 등록

| 언어 | 검색엔진 |
|------|---------|
| 한국어 | Google + 네이버 + 다음 |
| 영어 | Google (글로벌) |
| 일본어 | Google + Yahoo Japan |
| 중국어 | Google (해외 화교) + Baidu (중국 본토) |

### 9.2 키워드 현지화 (예시)

**한국어**:
- "다랑쉬오름 등산", "제주 동부 오름"

**영어**:
- "Darangshi Oreum hiking" (직역)
- "Jeju volcanic cone hiking", "Jeju east oreums"

**일본어**:
- "ダランシオルム 登山" (오름은 발음 차용)
- "済州島 オルム" (제주 + 오름)

**중국어 간체**:
- "达朗希岳 登山"
- "济州岳 推荐"

각 언어권에서 자연스러운 검색어 분석 + 적용.

### 9.3 메타 데이터 현지화

직역 X. 각 언어권에서 클릭 유도되는 카피:

**한국어**:
> "제주 동부의 다랑쉬오름은 표고 382m로 '오름의 여왕'으로 불립니다."

**영어**:
> "Discover Darangshi Oreum, the 'Queen of Oreums' in eastern Jeju Island, standing 382m tall."

**일본어**:
> "済州島東部のダランシオルム——「オルムの女王」と呼ばれる標高382mの絶景。"

각 언어권 어조에 맞게 조정.

### 9.4 도메인 전략

**옵션 A**: `jejuoreum.com` 단일 도메인
**옵션 B**: 언어별 서브도메인 (`en.jejuoreum.com`, `ja.jejuoreum.com`)

**본 프로젝트 선택: 옵션 A** (단일 도메인 + 언어 prefix)

이유:
- 도메인 권위 통합
- 운영 복잡도 낮음
- hreflang으로 언어 명확

옵션 B는 언어별 별도 SEO 권위가 필요할 때 검토 (페이즈 4 이후).

---

## 10. 페이즈별 도입 일정

### 10.1 페이즈 0~1 (출시)

**완료해야 할 것**:
- next-intl 인프라 구축
- 모든 UI 텍스트 i18n 키로 분리
- 한국어 메시지 파일 100% 작성
- DB 다국어 컬럼 (ko + en/ja/zh 빈 컬럼)
- URL 구조 (/{lang}/...) 동작
- 언어 감지·전환 미들웨어
- hreflang 태그 (한국어만 채워짐)

**미완성**:
- 영어/일본어/중국어 메시지 파일 (빈 상태로 두거나 한국어 fallback)
- 외국어 콘텐츠

### 10.2 페이즈 2 (출시 +3~6개월)

**도입**:
- 영어 메시지 파일 작성 (UI 100%)
- 영어 SEO 콘텐츠 100선 100개 우선 번역
- Google Search Console 영어 등록
- 언어 전환 드롭다운 활성화

**비용**: 약 600~1,000만원 (UI + 100선 SEO)

### 10.3 페이즈 3 (출시 +6~12개월)

**도입**:
- 영어 SEO 360개 완성
- 일본어·중국어 시장성 분석
- 일본어 UI 검토 시작

### 10.4 페이즈 4 (1년+)

**도입**:
- 일본어 UI 100% + SEO 100개
- 중국어 UI 100% + SEO 100개
- Yahoo Japan, Baidu 등록

**비용**: 약 800~1,500만원 (일/중 추가)

---

## 11. 비용 추정

### 11.1 페이즈 0~1 (인프라)

| 항목 | 비용 |
|------|------|
| 개발 (next-intl 통합) | 100~150만 |
| 한국어 메시지 키 분리·작성 | 50만 (포함 가능) |
| **합계 (페이즈 0~1)** | **약 150~200만** |

### 11.2 페이즈 2 (영어)

| 항목 | 비용 |
|------|------|
| 영어 UI 번역 (메시지 파일) | 50~100만 |
| 영어 SEO 콘텐츠 100선 (100개 × 평균 2,000자) | 600~1,600만 |
| 검수 비용 | 100~200만 |
| **합계 (페이즈 2)** | **약 750~1,900만** |

### 11.3 페이즈 3 (영어 확장)

| 항목 | 비용 |
|------|------|
| 영어 SEO 비100선 260개 | 1,000~2,500만 |

### 11.4 페이즈 4 (일/중)

| 항목 | 비용 |
|------|------|
| 일본어 UI + SEO 100선 | 800~1,500만 |
| 중국어 UI + SEO 100선 | 800~1,500만 |
| **합계 (페이즈 4)** | **약 1,600~3,000만** |

### 11.5 비용 절감 옵션

- **AI 번역 + 인간 검수**: 비용 50% 절감 (품질 유지)
- **점진 도입**: 처음에 100선 100개만, 나머지는 트래픽 보고 결정

---

## 12. 사용자 정보 다국어

### 12.1 사용자가 입력하는 콘텐츠

사용자가 작성한 코멘트·메모는 입력한 언어 그대로:

```sql
-- user_comments 테이블에 ai_language 컬럼 (10번 문서 참조)
SELECT * FROM user_comments
WHERE oreum_id = $1
  AND ai_language = $user_lang
  AND is_public = true;
```

### 12.2 노출 우선순위

```typescript
// 사용자 언어 우선
async function getCommentsForOreum(oreumId: string, userLang: string) {
  // 1. 사용자 언어 코멘트 우선
  const sameLang = await db.userComments.findMany({
    where: { oreum_id: oreumId, ai_language: userLang, is_public: true }
  });

  // 2. 부족하면 한국어 fallback
  if (sameLang.length < 5) {
    const ko = await db.userComments.findMany({
      where: {
        oreum_id: oreumId,
        ai_language: 'ko',
        is_public: true,
        id: { notIn: sameLang.map(c => c.id) }
      },
      take: 10 - sameLang.length
    });
    return [...sameLang, ...ko];
  }

  return sameLang;
}
```

### 12.3 자동 번역 (페이즈 4)

다른 언어 코멘트:
- "원문 보기" / "번역 보기" 토글
- Google Translate API 또는 DeepL
- 단, 자동 번역 명확히 표시

---

## 13. 외국 사용자 진입 동선

### 13.1 진입 시나리오

| 사용자 | 진입 경로 |
|--------|---------|
| 검색 (영어) | "Jeju Oreum hiking" → /en/... |
| SNS 공유 | 다른 사용자가 영어 페이지 공유 |
| 직접 URL | jejuoreum.com → /en/...로 자동 이동 (Accept-Language) |
| 한국 친구 추천 | /ko/...로 시작 → 언어 전환 |

### 13.2 외국 사용자 첫 진입 안내

```
[비로그인 외국 사용자]
    ↓
[Accept-Language 영어 감지]
    ↓
[/en/ 경로 자동 이동]
    ↓
[홈 화면]

상단 안내 배너:
"You're viewing in English. Switch language anytime."
[ 🇰🇷 ] [ 🇯🇵 ] [ 🇨🇳 ]
```

### 13.3 영어 사용자를 위한 추가 가이드

- 제주 도착 안내 (공항에서 어떻게 오는지)
- 외국인 친화 코스 (대중교통 + 쉬운 오름)
- 영어 가능 제휴 상권 표시 (페이즈 3)

### 13.4 해외 결제 (페이즈 3)

영어 인쇄물 패키지 출시 시:
- 토스페이먼츠 (한국 카드)
- Stripe 또는 PayPal (해외 카드)
- 해외 배송비 명확히 안내

---

## 14. 검증·테스트

### 14.1 테스트 시나리오

- 모든 언어 페이지 정상 렌더링
- 언어 전환 → 같은 페이지 유지
- 콘텐츠 부재 → 한국어 fallback
- hreflang 태그 정확성
- Accept-Language 자동 감지
- 사용자 설정 우선순위

### 14.2 테스트 도구

- **Lighthouse**: Core Web Vitals (언어별)
- **Google Rich Results Test**: 구조화 데이터
- **hreflang Tags Tester**: hreflang 검증
- **Google Search Console**: 언어별 색인

### 14.3 출시 전 체크리스트

- [ ] 모든 UI 텍스트 i18n 키 분리 (하드코딩 0%)
- [ ] 한국어 메시지 파일 100%
- [ ] 영어 메시지 파일 비어있어도 빌드 OK (페이즈 2 추가)
- [ ] DB 다국어 컬럼 동작
- [ ] middleware 언어 감지 동작
- [ ] hreflang 자동 생성
- [ ] sitemap 언어별 분리

---

## 15. 분석·KPI

### 15.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `language_detected` | detected_lang, source (header / cookie / user_setting) |
| `language_switched` | from_lang, to_lang |
| `language_fallback_shown` | requested_lang, fallback_lang |
| `non_korean_user_visited` | lang, country |

### 15.2 KPI

페이즈 2 시작:
- 영어 페이지뷰 비율
- 영어 사용자 전환율 (가입)
- 언어 전환 빈도

페이즈 3 이후:
- 외국 사용자 비율 (목표: 페이즈 3 5%, 페이즈 4 15%)
- 언어별 검색 유입
- 언어별 사용자 LTV

---

## 16. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. next-intl 채택, URL 구조, 메시지 파일 컨벤션, DB 다국어 전략, fallback 정책, 콘텐츠 번역 워크플로우, 언어별 SEO 전략, 페이즈별 도입 일정, 비용 추정 | 기획+Claude |

---

## 17. 후속 작업

- next-intl 보일러플레이트 셋업
- 한국어 메시지 파일 100% 채우기 (출시 전)
- DB 다국어 컬럼 마이그레이션
- 영어 번역 외주 견적 (페이즈 2 시작 시)
- 일본어·중국어 시장 분석 (페이즈 3)
- 외국 사용자 첫 진입 가이드 페이지 디자인
- 검색엔진 언어별 등록 가이드 작성

# 08. AR System (GPS-based)

> 본 문서는 GPS 기반 AR 시스템의 모든 명세를 정의한다.
> 정상에 도착한 사용자가 카메라를 들면 보이는 풍경 위에 오름·바다·랜드마크 정보가 겹쳐 표시된다.
> 본 시스템은 **페이즈 2의 핵심 차별화 요소**다.

---

## 0. 시스템 철학

### 0.1 왜 AR인가

본 프로젝트가 단순 가이드앱과 차별되는 핵심 이유 중 하나:

- **정보를 풍경 위에 겹친다**: 정상에서 "저 멀리 보이는 게 뭐지?"를 즉시 해결
- **다음 목적지의 자연 발견**: 다음 갈 오름이 시각적으로 등장
- **인증의 보상**: 정상에 오른 사람만 누리는 특별한 경험
- **데이터 자산 활용**: 100선 좌표 + 지형 데이터의 시각화

### 0.2 페이즈 결정

**페이즈 1 출시 시점에는 AR 미도입.**
- 페이즈 2 (출시 후 3~6개월) 도입
- 이유:
  - AR.js + 기기 호환성 검증 시간 필요
  - 사용자 베이스 확보 후 차별화 카드로 출시
  - 페이즈 1은 인증·도감·SEO에 집중

### 0.3 핵심 기술 결정

- **WebAR**: AR.js + A-Frame (앱 설치 X)
- **GPS 기반 AR**: 지형 인식 X (비용 대비 효용 낮음)
- **4 레이어 토글**: 오름 / 산 / 바다 / 상권
- **방위각·각도 계산**: 표시할 라벨 위치 결정

### 0.4 의도적으로 안 하는 것

- **지형 인식 AR**: 8th Wall 같은 상용 솔루션은 비싸고 복잡 (~$3,000/월)
- **건물 인식 AR**: 제주 자연 환경에는 부적합
- **AR 배지 사냥**: 위험 (사용자가 위험한 곳에 가도록 유도 X)
- **NFT·가상 자산**: 페이즈 4 검토

---

## 1. AR 진입 흐름

### 1.1 진입점

| 진입점 | 컨텍스트 |
|--------|---------|
| 인증 직후 자동 안내 | 정상 도착 인증 후 "AR로 둘러보기" 제안 |
| 카드 페이지 "AR 둘러보기" 버튼 | 발견한 오름의 카드 페이지 |
| 홈 탭 "AR 둘러보기" | GPS가 정상 근처일 때 활성 |
| 마이 탭 "AR 모드" | 명시적 진입 |

### 1.2 진입 흐름

```
[AR 모드 시작 트리거]
    ↓
[인트로 안내 (첫 사용 시)]
- "휴대폰을 들어 풍경을 비춰보세요"
- "오름·산·바다 정보가 표시됩니다"
- "안전한 곳에서 사용하세요"
    ↓
[권한 요청]
   - 카메라
   - GPS
   - 자기장 센서 (DeviceOrientation)
    ↓
[권한 모두 허용]
    ↓
[AR 화면 진입]
    ↓
[측정 중...]
- GPS 정확도 측정
- 자기장 보정
    ↓
[라벨 렌더링]
```

### 1.3 권한 거부 처리

각 권한별:

```
[카메라 거부]
- "카메라 권한이 필요해요"
- 설정 안내 + 일반 지도 모드 fallback

[GPS 거부]
- "위치 권한이 필요해요"
- AR 모드 종료 안내

[자기장 거부 또는 미지원]
- "방향 정보를 가져올 수 없어요"
- 정적 모드 (좌우 회전 안 됨, 단순 정보만)
```

### 1.4 안전 안내

```
[AR 진입 전 1회 노출, 이후 설정으로 ON/OFF]

⚠️ 안전 안내
- "걸으면서 사용하지 마세요"
- "정상의 가장자리에서 멀리 떨어져 사용하세요"
- "AR 사용 중에도 주변을 살피세요"

[알겠습니다] 버튼 → AR 모드 진입
```

---

## 2. AR 화면 구조

### 2.1 전체 레이아웃

```
┌────────────────────────────────────┐
│  [닫기]              [레이어 토글]   │ ← 56px (반투명 헤더)
├────────────────────────────────────┤
│                                    │
│                                    │
│                                    │
│  [카메라 영상 배경]                  │
│                                    │
│                                    │
│  [라벨 1: 오름]                     │
│      "다랑쉬오름"                    │
│      "1.8km · 동쪽"                 │
│                                    │
│             [라벨 2: 산]            │
│                "한라산"             │
│                "8.5km · 남서쪽"      │
│                                    │
│  [라벨 3: 바다]                     │
│  "성산 일출봉 방향"                  │
│                                    │
│                                    │
├────────────────────────────────────┤
│  [현재 위치 표시]                   │ ← 64px (반투명 하단)
│  새별오름 정상 (519m)               │
│                                    │
│  [컴퍼스: N]                         │
└────────────────────────────────────┘
```

### 2.2 4개 레이어

| 레이어 | 표시 대상 | 색상 |
|--------|----------|------|
| **오름** | 100선 + 비100선 | 그린 |
| **산** | 한라산 + 주요 봉우리 | 청보라 |
| **바다** | 해안선·섬·등대 | 블루 |
| **상권** | 제휴 카페·식당 | 골드 |

### 2.3 레이어 토글 UI

```
[우상단 토글 버튼]
    ↓
[탭 시 모달 또는 인라인 패널]

┌────────────────────────┐
│ ☑ 오름 (45개 표시)      │
│ ☑ 산 (3개 표시)         │
│ ☐ 바다                 │
│ ☐ 상권                 │
└────────────────────────┘

[적용] 또는 자동 적용
```

기본값:
- 오름 ON
- 산 ON
- 바다 OFF
- 상권 OFF

너무 많은 라벨은 시야 어지럽게 함. 사용자가 필요한 것만 켜기.

### 2.4 라벨 디자인

#### 발견한 오름 (100선)

```
[라벨 카드]
- 배경: 풀 컬러 (--brand-green-800 + 흰 텍스트)
- 모서리: --radius-md
- 패딩: 8px 12px

내용:
✓ 다랑쉬오름
1.8km · 동쪽
[작은 카드 일러스트]
```

#### 미발견 100선

```
[라벨 카드]
- 배경: 반투명 흰색 + 짙은 보더
- 점선 테두리 (수집 가능 표시)

내용:
? 다랑쉬오름
1.8km · 동쪽
[흑백 실루엣]
```

#### 100선 외

```
[라벨 카드]
- 배경: 회색 톤
- 작은 텍스트

내용:
영주산 (100선 외)
0.9km · 북쪽
```

#### 산·랜드마크

```
[라벨 카드]
- 배경: 청보라 톤
- 산 아이콘

내용:
🏔️ 한라산
8.5km · 남서쪽
1,950m
```

#### 바다·등대·섬

```
🌊 우도
12km · 동쪽
```

#### 제휴 상권

```
☕ 카페 오롯
0.6km · 북동쪽
[작은 가게 사진 썸네일]
```

### 2.5 거리별 시각 처리

가까운 라벨은 크게, 먼 라벨은 작게:

```
거리 0~500m: 라벨 크기 100%
거리 500m~1km: 90%
거리 1km~3km: 75%
거리 3km~10km: 60%
거리 10km+: 50% (아주 작게, 옅게)
```

### 2.6 시야각 안 라벨만 표시

```
[사용자 방향 = heading]
[시야각: ±30° (총 60° 시야)]

각 객체의 방위각 계산
   ↓
방위각이 시야각 안에 있는 객체만 화면에 표시
   ↓
화면 X 좌표 = (객체_방위각 - 사용자_방위각) / 시야각 × 화면폭
```

### 2.7 라벨 클릭 동작

```
[라벨 탭]
    ↓
[라벨 살짝 확대 (햅틱)]
    ↓
[하단 슬라이드업 패널 노출]

발견한 오름 (100선):
- 카드 일러스트
- 발견일, 메모
- "카드 페이지 보기" 버튼

미발견 100선:
- 미리보기 정보
- 핵심 메타 (표고, 난이도)
- "위시리스트에 추가" 버튼

100선 외:
- 외부 정보 페이지 링크 (SEO 페이지)

산·랜드마크:
- 간단 정보
- "더 보기" (위키피디아 링크 등)

상권:
- 가게 정보
- 영업 시간
- 길찾기
```

---

## 3. 좌표·각도 계산

### 3.1 방위각 (Bearing) 계산

두 GPS 좌표 간 방위각 (북쪽 0°, 시계방향).

```typescript
function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360; // 0~360
}
```

### 3.2 사용자 방위각 (Device Heading)

```typescript
let userHeading = 0;

window.addEventListener('deviceorientationabsolute', (e) => {
  // alpha = 회전 각도 (북쪽 0°, 시계방향)
  if (e.alpha !== null) {
    userHeading = 360 - e.alpha; // 보정
  }
});

// iOS는 별도 권한 요청
async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permission = await DeviceOrientationEvent.requestPermission();
    return permission === 'granted';
  }
  return true;
}
```

### 3.3 화면 좌표 계산

```typescript
function calculateScreenPosition(
  objectBearing: number,
  userHeading: number,
  fieldOfView: number = 60, // 카메라 시야각 (°)
  screenWidth: number
): number | null {
  let relativeBearing = objectBearing - userHeading;

  // 0~360 정규화
  if (relativeBearing > 180) relativeBearing -= 360;
  if (relativeBearing < -180) relativeBearing += 360;

  // 시야각 밖이면 표시 X
  if (Math.abs(relativeBearing) > fieldOfView / 2) {
    return null;
  }

  // 화면 X 좌표 (0 = 좌측, screenWidth = 우측)
  const x = (relativeBearing / fieldOfView + 0.5) * screenWidth;
  return x;
}
```

### 3.4 Y 좌표 (높이·거리 보정)

먼 객체는 화면 위쪽에, 가까운 객체는 아래쪽에:

```typescript
function calculateScreenY(
  objectElevation: number, // 객체 표고
  userElevation: number,   // 사용자 표고 (정상이면 보통 높음)
  distance: number,        // 거리 (m)
  screenHeight: number
): number {
  const elevationDiff = objectElevation - userElevation;
  const angleRad = Math.atan2(elevationDiff, distance);
  const angleDeg = (angleRad * 180) / Math.PI;

  // 시야각 수직 ±30° 가정
  const verticalFOV = 60;

  // 화면 중앙(0)에서 위 음수, 아래 양수
  const yPercent = -angleDeg / verticalFOV;
  return (0.5 + yPercent) * screenHeight;
}
```

---

## 4. AR 객체 데이터

### 4.1 객체 종류

```typescript
interface ArObject {
  id: string;
  type: 'oreum' | 'mountain' | 'sea_landmark' | 'merchant';
  name: string;
  latitude: number;
  longitude: number;
  elevation_m: number;

  // 오름 전용
  is_top_100?: boolean;
  is_discovered?: boolean;
  illustration_url?: string;
  slug?: string;

  // 산 전용
  prominence?: string; // "한라산", "산방산" 등 알려진 이름

  // 상권 전용
  merchant_type?: string;
  cover_image_url?: string;
}
```

### 4.2 산·랜드마크 시드 데이터

오름 외 객체는 별도 테이블 또는 시드 데이터:

```sql
CREATE TABLE ar_landmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'mountain' | 'sea_landmark' | 'lighthouse' | 'island'
  name_ko TEXT NOT NULL,
  name_en TEXT,
  name_ja TEXT,
  name_zh TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  elevation_m INT,
  description TEXT,
  external_url TEXT, -- 위키피디아 등
  is_active BOOLEAN DEFAULT true
);

INSERT INTO ar_landmarks VALUES
('...', 'mountain', '한라산', 'Hallasan', '...', 33.3617, 126.5292, 1947, '...', '...'),
('...', 'mountain', '산방산', 'Sanbangsan', '...', 33.2380, 126.3094, 395, '...', '...'),
('...', 'island', '우도', 'Udo', '...', 33.5036, 126.9472, 132, '...', '...'),
-- ... (제주 주요 산·섬·등대)
;
```

### 4.3 거리 필터

```typescript
const DISTANCE_LIMITS = {
  oreum: 30000,       // 30km
  mountain: 50000,    // 50km
  sea_landmark: 30000,
  merchant: 5000      // 5km
};

function filterByDistance(
  userLocation: { lat: number; lng: number },
  objects: ArObject[]
): ArObject[] {
  return objects.filter(obj => {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      obj.latitude, obj.longitude
    );
    return distance <= DISTANCE_LIMITS[obj.type];
  });
}
```

---

## 5. 기술 구현

### 5.1 라이브러리 선택

**AR.js + A-Frame**:
- AR.js: WebAR 엔진 (브라우저에서 AR)
- A-Frame: WebVR/AR 컴포넌트 프레임워크
- GPS-based AR 지원
- 오픈소스, 무료

```bash
# 설치
npm install aframe ar.js
```

### 5.2 AR 컴포넌트 구조

```typescript
// app/[lang]/ar/page.tsx

'use client';

export default function ARPage() {
  const [permissions, setPermissions] = useState({
    camera: false, location: false, orientation: false
  });
  const [arObjects, setArObjects] = useState<ArObject[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [userHeading, setUserHeading] = useState(0);
  const [activeLayers, setActiveLayers] = useState({
    oreum: true, mountain: true, sea: false, merchant: false
  });

  useEffect(() => {
    initAR();
  }, []);

  async function initAR() {
    // 1. 권한 요청
    await requestCameraPermission();
    await requestLocationPermission();
    await requestOrientationPermission();

    // 2. 위치·방향 추적 시작
    startLocationTracking();
    startHeadingTracking();

    // 3. 주변 객체 가져오기
    const objects = await fetchNearbyObjects();
    setArObjects(objects);
  }

  // 5초마다 객체 갱신
  useEffect(() => {
    const interval = setInterval(async () => {
      if (userLocation) {
        const objects = await fetchNearbyObjects(userLocation);
        setArObjects(objects);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userLocation]);

  return (
    <div className="ar-container">
      <CameraBackground />

      <ArOverlay
        objects={arObjects}
        userLocation={userLocation}
        userHeading={userHeading}
        activeLayers={activeLayers}
      />

      <ArControls
        layers={activeLayers}
        onLayerToggle={setActiveLayers}
        onClose={() => router.back()}
      />

      <CompassIndicator heading={userHeading} />
    </div>
  );
}
```

### 5.3 카메라 배경

```typescript
function CameraBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    startCamera();
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
```

### 5.4 라벨 렌더링

```typescript
function ArOverlay({ objects, userLocation, userHeading, activeLayers }) {
  if (!userLocation) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {objects.map(obj => {
        // 레이어 필터
        if (!activeLayers[obj.type]) return null;

        // 좌표 계산
        const bearing = calculateBearing(
          userLocation.lat, userLocation.lng,
          obj.latitude, obj.longitude
        );
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          obj.latitude, obj.longitude
        );
        const x = calculateScreenPosition(bearing, userHeading, 60, window.innerWidth);

        if (x === null) return null;

        const y = calculateScreenY(
          obj.elevation_m, userLocation.elevation,
          distance, window.innerHeight
        );

        return (
          <ArLabel
            key={obj.id}
            object={obj}
            screenX={x}
            screenY={y}
            distance={distance}
            onClick={() => openObjectDetail(obj)}
          />
        );
      })}
    </div>
  );
}
```

### 5.5 라벨 컴포넌트

```typescript
function ArLabel({ object, screenX, screenY, distance, onClick }) {
  const sizeRatio = getDistanceSizeRatio(distance);
  const opacity = distance > 10000 ? 0.6 : 1.0;

  return (
    <div
      className="ar-label pointer-events-auto"
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: `translate(-50%, -50%) scale(${sizeRatio})`,
        opacity
      }}
      onClick={onClick}
    >
      {object.type === 'oreum' && (
        <OreumLabel
          oreum={object}
          distance={distance}
          isDiscovered={object.is_discovered}
        />
      )}
      {object.type === 'mountain' && (
        <MountainLabel mountain={object} distance={distance} />
      )}
      {/* ... */}
    </div>
  );
}
```

### 5.6 컴퍼스

```typescript
function CompassIndicator({ heading }: { heading: number }) {
  const direction = getDirection(heading); // 'N' | 'NE' | 'E' | ...

  return (
    <div className="absolute bottom-20 right-4 bg-black/50 text-white p-3 rounded-full">
      <div style={{ transform: `rotate(${-heading}deg)` }}>
        ↑
      </div>
      <div className="text-xs mt-1">{direction}</div>
    </div>
  );
}

function getDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}
```

---

## 6. 성능 최적화

### 6.1 객체 수 제한

너무 많은 라벨은 성능 + 시각 어지러움.

```typescript
const MAX_LABELS_PER_LAYER = {
  oreum: 30,
  mountain: 5,
  sea_landmark: 10,
  merchant: 10
};

function limitObjects(objects: ArObject[]): ArObject[] {
  // 거리순 정렬 후 상위 N개
  return objects
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_LABELS_PER_LAYER[type]);
}
```

### 6.2 렌더링 최적화

- React.memo 사용
- useMemo로 좌표 계산 캐시
- requestAnimationFrame으로 부드러운 업데이트

```typescript
const memoizedPosition = useMemo(() => {
  return calculateScreenPosition(...);
}, [object.latitude, object.longitude, userHeading]);
```

### 6.3 GPS 갱신 빈도

```typescript
navigator.geolocation.watchPosition(
  (position) => setUserLocation(...),
  (error) => {...},
  {
    enableHighAccuracy: true,
    maximumAge: 5000, // 5초 캐시
    timeout: 10000
  }
);
```

### 6.4 자기장 갱신 빈도

브라우저 기본은 충분히 빠름. 단, throttle로 너무 잦은 업데이트 방지:

```typescript
const throttledHeading = useThrottledValue(rawHeading, 100); // 100ms
```

---

## 7. 정확도·보정

### 7.1 GPS 정확도

| 정확도 | 처리 |
|--------|------|
| ≤ 50m | AR 정상 작동 |
| 50~200m | 라벨 위치 부정확, "GPS 정확도 보통" 표시 |
| 200m+ | "GPS 정확도 낮음" 경고 + 외곽 라벨만 표시 |

### 7.2 자기장 보정

자기장 센서는 보정 필요:

```
[AR 진입 시 보정 안내]
"휴대폰을 8자 모양으로 흔들어주세요"
[3초 후 보정 완료]
```

이 동작이 자기장 센서를 보정하는 표준 방법.

### 7.3 사용자 피드백

```
[라벨이 부정확해 보이면]
- "AR 보정하기" 버튼 항상 노출
- 다시 8자 흔들기 안내
```

### 7.4 AR 정밀도 한계 안내

```
[하단 안내 텍스트]
"AR은 GPS 기반으로 약 10~50m 오차가 있을 수 있어요"
```

---

## 8. AR 화면 종료

### 8.1 종료 트리거

- 닫기 버튼 (좌상단)
- 뒤로 가기 (브라우저)
- 카메라 권한 회수
- 백그라운드 진입

### 8.2 종료 처리

```typescript
function cleanup() {
  // 카메라 스트림 종료
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
  }

  // 위치 추적 해제
  navigator.geolocation.clearWatch(watchId);

  // 자기장 이벤트 해제
  window.removeEventListener('deviceorientationabsolute', orientationHandler);
}
```

---

## 9. API 명세

### 9.1 GET /api/ar/nearby

주변 AR 객체 조회.

**Query**:
```
?lat={number}&lng={number}
&heading={number} (선택, 시야각 필터)
&max_distance_km={number}
&layers=oreum,mountain,sea,merchant
```

**Response**:
```typescript
{
  user_position: {
    elevation_m: number; // 추정 표고 (오름 정상이면 해당 오름의 표고)
    nearest_oreum?: { name: string; distance_m: number };
  };
  objects: Array<{
    id: string;
    type: 'oreum' | 'mountain' | 'sea_landmark' | 'merchant';
    name: string;
    latitude: number;
    longitude: number;
    elevation_m: number;
    distance_m: number;
    bearing_deg: number;

    // 오름 전용
    slug?: string;
    is_top_100?: boolean;
    is_discovered?: boolean; // 사용자별
    illustration_url?: string;

    // 산 전용
    prominence?: string;

    // 상권 전용
    merchant_type?: string;
    cover_image_url?: string;
    open_now?: boolean;
  }>;
}
```

### 9.2 GET /api/ar/landmarks

랜드마크 마스터 데이터.

```typescript
{
  landmarks: Array<ArLandmark>;
}
```

---

## 10. 다국어 처리

### 10.1 라벨 텍스트

```typescript
// 객체 이름은 사용자 언어로
const name = lang === 'ko'
  ? obj.name_ko
  : obj[`name_${lang}`] || obj.name_ko;

// 거리·방향
const distanceLabel = formatDistance(obj.distance_m, lang);
const directionLabel = getDirectionLabel(bearing, lang);
```

### 10.2 안내 문구

```typescript
{
  "ar": {
    "intro_title": "AR 모드에 오신 걸 환영해요",
    "intro_subtitle": "휴대폰을 들어 풍경을 비춰보세요",
    "calibration_title": "AR 보정",
    "calibration_subtitle": "휴대폰을 8자 모양으로 흔들어주세요",
    "permissions": {
      "camera_required": "카메라 권한이 필요해요",
      "location_required": "위치 권한이 필요해요",
      "orientation_required": "방향 정보가 필요해요"
    },
    "safety_warning": "AR 사용 중 주변을 살피세요. 가장자리에서 멀리!",
    "gps_accuracy": {
      "high": "GPS 정확도 높음",
      "medium": "GPS 정확도 보통",
      "low": "GPS 정확도 낮음"
    }
  }
}
```

---

## 11. 분석·KPI

### 11.1 추적 이벤트

| 이벤트 | 속성 |
|--------|------|
| `ar_entered` | source |
| `ar_permission_granted` | permission_type |
| `ar_permission_denied` | permission_type |
| `ar_layer_toggled` | layer, new_state |
| `ar_label_clicked` | object_type, object_id |
| `ar_oreum_added_to_wishlist` | oreum_id |
| `ar_calibrated` | - |
| `ar_session_duration` | seconds |
| `ar_exit` | reason |

### 11.2 KPI

- AR 모드 진입률 (정상 인증자 중 %)
- 평균 AR 사용 시간 (목표: 2분+)
- AR → 위시리스트 추가 비율
- 권한 허용률
- 디바이스별 호환성 (iPhone vs Android)

---

## 12. 기기 호환성

### 12.1 iOS

- iOS 13+ 필요
- Safari에서 deviceorientation 별도 권한 (`requestPermission`)
- 카메라 권한 명시적 요청

### 12.2 Android

- Chrome, Samsung Internet 권장
- 자기장 센서 보유 기기 (대부분 보유)
- WebRTC 지원

### 12.3 미지원 기기

```
[기기 호환성 체크]
    ↓
[미지원 시]
- "이 기기에서는 AR 모드를 사용할 수 없어요"
- 대안: 정적 지도 모드 제공
```

### 12.4 테스트 기기 목록

페이즈 2 출시 전 테스트:
- iPhone (12, 13, 14, 15)
- Galaxy S22, S23
- Pixel 7
- iPad

---

## 13. 보안·사생활

### 13.1 카메라 영상

- 영상은 클라이언트에서만 처리
- 서버로 전송 안 함
- 녹화·저장 안 함 (사용자 자발적 스크린샷은 OK)

### 13.2 위치 데이터

- AR 사용 중 위치는 메모리에만
- 서버로 전송: 5초마다 좌표 (객체 갱신용)
- DB에 저장 안 함 (인증 시점 좌표만 user_discoveries에 저장)

---

## 14. 테스트 시나리오

### 14.1 단위 테스트

- 방위각 계산 정확성
- 화면 좌표 계산 정확성
- 시야각 필터링

### 14.2 통합 테스트

- 권한 요청 → AR 모드 진입
- 라벨 클릭 → 상세 패널
- 레이어 토글 동작

### 14.3 현장 테스트

페이즈 2 출시 전 실제 정상에서:
- 다랑쉬오름 정상 (다양한 방향 확인)
- 한라산 1100고지 (멀리 보이는 객체 정확성)
- 우도 (바다 레이어 검증)

### 14.4 정확도 측정

각 정상에서 가시 거리 ~30km 객체들의 라벨 위치 정확성 측정. 보통 5~10° 오차 허용.

---

## 15. 변경 이력

| 일자 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-05-07 | 0.1 | 초안 작성. AR.js + A-Frame 채택, 4개 레이어, 좌표 계산 알고리즘, 기술 구현, 정확도·보정, 기기 호환성, API 명세 | 기획+Claude |

---

## 16. 후속 작업

- AR.js 프로토타입 (1~2개 정상에서 테스트)
- 산·랜드마크 시드 데이터 작성 (제주 주요 30~50개)
- 기기 호환성 매트릭스
- 정확도 보정 알고리즘 검증
- 라벨 디자인 Figma
- 안전 안내 문구 다국어 번역
- 페이즈 2 출시 전 베타 테스트 모집

export type ArObjectType = "oreum" | "mountain" | "sea_landmark" | "merchant";

export interface ArObject {
  id: string;
  type: ArObjectType;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  // 오름 전용
  isTop100?: boolean;
  isDiscovered?: boolean;
  slug?: string;
  tier?: string | null;
  thumbnailUrl?: string | null;
  // 상권 전용
  merchantType?: string;
  coverImageUrl?: string | null;
}

export interface ArObjectWithScreen extends ArObject {
  distM: number;
  bearingDeg: number;
  screenX: number;
  screenY: number;
  scale: number;
}

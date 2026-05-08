import type { ArObject } from "@/types/ar";

export const STATIC_LANDMARKS: ArObject[] = [
  // 산
  { id: "hallasan",    type: "mountain", name: "한라산",    lat: 33.3617, lng: 126.5292, elevation: 1950 },
  { id: "sanbangsan", type: "mountain", name: "산방산",    lat: 33.2361, lng: 126.3106, elevation: 395 },
  { id: "gwaneumsa",  type: "mountain", name: "관음사 능선", lat: 33.3961, lng: 126.5195, elevation: 1200 },
  // 바다·섬
  { id: "seongsan",   type: "sea_landmark", name: "성산 일출봉", lat: 33.4609, lng: 126.9422, elevation: 182 },
  { id: "udo",        type: "sea_landmark", name: "우도",        lat: 33.5020, lng: 126.9507, elevation: 132 },
  { id: "biyangdo",   type: "sea_landmark", name: "비양도",      lat: 33.3975, lng: 126.2378, elevation: 114 },
  { id: "mara",       type: "sea_landmark", name: "마라도",      lat: 33.1148, lng: 126.2669, elevation: 39  },
  { id: "chagwido",   type: "sea_landmark", name: "차귀도",      lat: 33.3159, lng: 126.1520, elevation: 40  },
];

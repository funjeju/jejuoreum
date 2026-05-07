export type Tier = "beginner" | "explorer" | "master";
export type Region = "east" | "west" | "south" | "north" | "central";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night";

// ── 오름 마스터 ──────────────────────────────────────────────
export interface OreumLocation {
  lat: number;
  lng: number;
  address: string | null;
  dongAddress: string | null;
}

export interface Oreum {
  id: string;
  slug: string;
  nameKo: string;
  nameEn: string | null;
  altNames: string[];
  isTop100: boolean;
  tier: Tier | null;
  tierOrder: number | null;
  region: Region;
  district: string | null;
  location: OreumLocation;
  elevationM: number | null;
  prominenceM: number | null;
  oneLinerKo: string | null;
  oneLinerEn: string | null;
  descriptionKo: string | null;
  difficulty: number | null;        // 1~5
  trailLengthKm: number | null;
  estimatedMinutes: number | null;
  recommendedSeasons: Season[];
  recommendedTimes: TimeOfDay[];
  emotionalKeywords: string[];
  mbti: string | null;
  photoUrls: string[];
  thumbnailUrl: string | null;
  isPrivateLand: boolean;
  hasAccessRestriction: boolean;
  accessNotes: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 도감 카드 경량 타입
export interface OreumCard {
  id: string;
  slug: string;
  nameKo: string;
  tier: Tier | null;
  tierOrder: number | null;
  region: Region;
  difficulty: number | null;
  thumbnailUrl: string | null;
  emotionalKeywords: string[];
  isPublished: boolean;
}

// ── 사용자 ──────────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  nickname: string;
  avatarUrl: string | null;
  oreumMbti: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDiscovery {
  id: string;
  oreumId: string;
  oreumSlug: string;
  oreumNameKo: string;
  oreumRegion: Region;
  oreumTier: Tier | null;
  oreumThumbnailUrl: string | null;
  discoveredAt: string;
  verificationMethod: "gps" | "manual_select" | "qr_code";
  verificationDistanceM: number | null;
  userNote: string | null;
  visibility: "public" | "delay_10min" | "private";
}

export interface WishlistItem {
  id: string;
  oreumId: string;
  oreumSlug: string;
  oreumNameKo: string;
  oreumThumbnailUrl: string | null;
  oreumRegion: Region;
  oreumDifficulty: number | null;
  priority: number;
  addedNote: string | null;
  source: string;
  createdAt: string;
}

// ── 배지 ────────────────────────────────────────────────────
export interface Badge {
  id: string;
  code: string;
  nameKo: string;
  descriptionKo: string;
  iconType: string;
  condition: Record<string, unknown>;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface UserBadge {
  id: string;
  badgeCode: string;
  badgeNameKo: string;
  badgeTier: Badge["tier"];
  earnedAt: string;
}

// ── 피드 ────────────────────────────────────────────────────
export interface FeedEvent {
  id: string;
  eventType: "discovery" | "badge_earned" | "wishlist_completed";
  uid: string;
  userNickname: string;
  userAvatarUrl: string | null;
  oreumId: string | null;
  oreumSlug: string | null;
  oreumNameKo: string | null;
  badgeCode: string | null;
  badgeNameKo: string | null;
  visibility: "public" | "private";
  occurredAt: string;
}

// ── 챌린지 ──────────────────────────────────────────────────
export interface Challenge {
  id: string;
  code: string;
  nameKo: string;
  descriptionKo: string;
  conditionType: "region_complete" | "tier_complete" | "count" | "specific_set";
  conditionValue: Record<string, unknown>;
  rewardBadgeCode: string | null;
  isActive: boolean;
  participantCount: number;
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  challengeNameKo: string;
  progress: number;
  goal: number;
  isCompleted: boolean;
  completedAt: string | null;
  startedAt: string;
}

// ── 코멘트 ──────────────────────────────────────────────────
export interface Comment {
  id: string;
  oreumSlug: string;
  oreumId: string;
  userId: string;
  userNickname: string;
  userAvatarUrl: string | null;
  isAnonymous: boolean;
  content: string;
  rating: number | null;
  commentType: "tip" | "review" | "warning" | "photo_caption" | null;
  isPublic: boolean;
  isPromotedToTip: boolean;
  createdAt: string;
}

// ── 사진 ────────────────────────────────────────────────────
export type PhotoCategory = "parking" | "entrance" | "trail" | "summit_view" | "crater" | "flora" | "signage" | "selfie";

export interface Photo {
  id: string;
  oreumSlug: string;
  oreumId: string;
  userId: string;
  userNickname: string;
  storageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  category: PhotoCategory | null;
  isApproved: boolean;
  isRepresentative: boolean;
  createdAt: string;
}

// ── GPS 매칭 ─────────────────────────────────────────────────
export interface NearbyOreum extends OreumCard {
  distanceM: number;
}

export interface GpsMatchResult {
  status: "auto" | "candidates" | "no_match";
  distance: number | null;
  matchedOreum: NearbyOreum | null;
  candidates: NearbyOreum[];
}

// ── SEO 콘텐츠 ───────────────────────────────────────────────
export interface SeoContent {
  id: string;          // oreum slug as document id
  oreumId: string;
  oreumSlug: string;
  oreumNameKo: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string[];
  ogImageUrl: string | null;
  sections: SeoSection[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeoSection {
  key: string;
  titleKo: string;
  bodyKo: string;
}

// ── 제휴 상권 ────────────────────────────────────────────────
export type MerchantType = "cafe" | "restaurant" | "guesthouse" | "convenience" | "shop" | "rentcar" | "experience" | "other";

export interface Merchant {
  id: string;
  name: string;
  merchantType: MerchantType;
  description: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  coverImageUrl: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  instagramHandle: string | null;
  naverMapUrl: string | null;
  kakaoMapUrl: string | null;
  businessHours: Record<string, string> | null;
  signatureItems: Array<{ name: string; price: number; imageUrl?: string }>;
  relatedOreumSlugs: string[];
  primaryOreumSlug: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  partnershipStatus: "pending" | "active" | "inactive" | "expired" | "terminated";
  createdAt: string;
  updatedAt: string;
}

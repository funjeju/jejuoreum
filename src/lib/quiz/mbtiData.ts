export interface QuizQuestion {
  id: string;
  text: string;
  a: { text: string; score: Record<string, number> };
  b: { text: string; score: Record<string, number> };
}

// E/I, N/S, T/F, J/P 각 축별 점수 누적
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "오름 탐방을 계획할 때 나는…",
    a: { text: "친구들과 함께! 같이 가면 더 신나잖아요", score: { E: 2 } },
    b: { text: "혼자만의 조용한 시간이 필요해요", score: { I: 2 } },
  },
  {
    id: "q2",
    text: "오름 정상에서 나를 사로잡는 것은…",
    a: { text: "눈앞의 장엄한 풍경과 현실 감각", score: { S: 2 } },
    b: { text: "이 풍경 너머에 무엇이 있을지 상상", score: { N: 2 } },
  },
  {
    id: "q3",
    text: "오름 코스를 고를 때 나는…",
    a: { text: "난이도·시간·거리를 꼼꼼히 따진다", score: { T: 2 } },
    b: { text: "감성 사진이 잘 나올 것 같은 곳을 찾는다", score: { F: 2 } },
  },
  {
    id: "q4",
    text: "오름 탐방 계획은…",
    a: { text: "미리 루트와 시간을 정해두는 편", score: { J: 2 } },
    b: { text: "그날 기분 따라 즉흥적으로 결정", score: { P: 2 } },
  },
  {
    id: "q5",
    text: "오름에서 사람이 많으면…",
    a: { text: "활기차서 좋아요! 같이 즐기는 느낌", score: { E: 2 } },
    b: { text: "사람 없는 한적한 코스로 바꾸고 싶다", score: { I: 2 } },
  },
  {
    id: "q6",
    text: "오름에서 나를 설레게 하는 건…",
    a: { text: "분화구·용암 지형 등 지질학적 특이함", score: { N: 2 } },
    b: { text: "탁 트인 바다와 한라산이 한눈에 들어오는 전망", score: { S: 2 } },
  },
  {
    id: "q7",
    text: "탐방 후 피로할 때 나는…",
    a: { text: "혼자 조용히 쉬며 에너지를 채운다", score: { I: 2 } },
    b: { text: "친구들과 수다 떨며 활력을 찾는다", score: { E: 2 } },
  },
  {
    id: "q8",
    text: "이번 달 탐방 계획은…",
    a: { text: "이미 달력에 표시해뒀어요", score: { J: 2 } },
    b: { text: "날씨 좋으면 그냥 가요", score: { P: 2 } },
  },
  {
    id: "q9",
    text: "오름에서 길을 잃었을 때 나는…",
    a: { text: "GPS·지도를 즉시 확인, 논리적으로 파악", score: { T: 2 } },
    b: { text: "일단 편안해 보이는 길로 느낌을 따른다", score: { F: 2 } },
  },
  {
    id: "q10",
    text: "오름 정상 인증 후 나는…",
    a: { text: "도전 완료! 다음 오름 리스트를 떠올린다", score: { J: 1, T: 1 } },
    b: { text: "이 순간을 오래 기억하고 싶어 사진을 찍는다", score: { F: 1, P: 1 } },
  },
];

// 보조 4문항 (개인화용)
export interface AuxQuestion {
  id: string;
  text: string;
  options: { value: string; label: string }[];
  multi: boolean;
}

export const AUX_QUESTIONS: AuxQuestion[] = [
  {
    id: "region",
    text: "어느 지역의 오름이 끌리세요?",
    options: [
      { value: "east",    label: "동부 (성산·구좌)" },
      { value: "west",    label: "서부 (한경·애월)" },
      { value: "south",   label: "남부 (서귀포·남원)" },
      { value: "north",   label: "북부 (제주시 인근)" },
      { value: "central", label: "중산간 (한라산 자락)" },
      { value: "any",     label: "상관없어요" },
    ],
    multi: false,
  },
  {
    id: "difficulty",
    text: "어떤 난이도가 좋으세요?",
    options: [
      { value: "1", label: "쉬워요 (★~★★)" },
      { value: "3", label: "보통 (★★★)" },
      { value: "5", label: "도전적 (★★★★~★★★★★)" },
      { value: "0", label: "상관없어요" },
    ],
    multi: false,
  },
  {
    id: "season",
    text: "어느 계절을 선호하세요?",
    options: [
      { value: "spring", label: "봄" },
      { value: "summer", label: "여름" },
      { value: "autumn", label: "가을" },
      { value: "winter", label: "겨울" },
      { value: "any",    label: "사계절 모두" },
    ],
    multi: false,
  },
  {
    id: "time",
    text: "어떤 시간대가 좋으세요?",
    options: [
      { value: "dawn",      label: "일출 (이른 새벽)" },
      { value: "morning",   label: "오전" },
      { value: "afternoon", label: "오후" },
      { value: "evening",   label: "일몰" },
      { value: "any",       label: "상관없어요" },
    ],
    multi: false,
  },
];

export interface AuxAnswers {
  region: string;
  difficulty: string;
  season: string;
  time: string;
}

export type MbtiType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISTP" | "ESTJ" | "ESTP"
  | "ISFJ" | "ISFP" | "ESFJ" | "ESFP";

export interface MbtiResult {
  type: MbtiType;
  title: string;
  desc: string;
  oreumName: string;
  oreumSlug: string;
  keywords: string[];
  color: string;
}

export const MBTI_RESULTS: Record<MbtiType, MbtiResult> = {
  INTJ: {
    type: "INTJ",
    title: "완벽주의 깊이파",
    desc: "오름의 형태 하나하나에 의미를 찾는 당신. 다랑쉬오름의 완벽한 원형 분화구가 당신을 기다립니다.",
    oreumName: "다랑쉬오름",
    oreumSlug: "darangshwi",
    keywords: ["깊이", "완벽", "분석"],
    color: "from-slate-800 to-slate-600",
  },
  INTP: {
    type: "INTP",
    title: "호기심 탐구자",
    desc: "독특한 지질 구조에 매료되는 당신. 산굼부리의 신비로운 분화구가 당신의 지적 호기심을 자극합니다.",
    oreumName: "산굼부리",
    oreumSlug: "sangumburi",
    keywords: ["탐구", "독창", "발견"],
    color: "from-blue-900 to-blue-700",
  },
  ENTJ: {
    type: "ENTJ",
    title: "정복형 리더",
    desc: "정상을 향한 도전을 즐기는 당신. 제주 최고봉의 위용을 지닌 어승생악이 당신의 목표입니다.",
    oreumName: "어승생악",
    oreumSlug: "eoseungsaengak",
    keywords: ["도전", "정복", "리더십"],
    color: "from-red-900 to-red-700",
  },
  ENTP: {
    type: "ENTP",
    title: "모험적 실험가",
    desc: "언제나 새로운 루트를 찾는 당신. 노꼬메오름의 다양한 풍경이 당신의 모험심을 채워줍니다.",
    oreumName: "노꼬메오름",
    oreumSlug: "nokkome",
    keywords: ["모험", "실험", "다양성"],
    color: "from-orange-800 to-orange-600",
  },
  INFJ: {
    type: "INFJ",
    title: "깊은 신비주의자",
    desc: "영적인 경험을 찾는 당신. 영주산의 일출이 당신의 영혼에 깊이 닿을 것입니다.",
    oreumName: "영주산",
    oreumSlug: "yeongjusan",
    keywords: ["신비", "영성", "일출"],
    color: "from-purple-900 to-purple-700",
  },
  INFP: {
    type: "INFP",
    title: "감성적 시인",
    desc: "오름의 부드러운 능선에서 시 한 편을 쓰고 싶은 당신. 용눈이오름의 곡선이 당신을 부릅니다.",
    oreumName: "용눈이오름",
    oreumSlug: "yongnuni",
    keywords: ["감성", "시적", "야생화"],
    color: "from-pink-800 to-pink-600",
  },
  ENFJ: {
    type: "ENFJ",
    title: "모두를 품는 리더",
    desc: "함께하는 감동을 만드는 당신. 따라비오름의 사방 전망이 당신의 따뜻함을 담습니다.",
    oreumName: "따라비오름",
    oreumSlug: "ttalabi",
    keywords: ["따뜻함", "공유", "전망"],
    color: "from-emerald-800 to-emerald-600",
  },
  ENFP: {
    type: "ENFP",
    title: "자유로운 영혼",
    desc: "어디든 달려가고 싶은 당신. 새별오름의 드넓은 초원이 당신의 자유를 맞이합니다.",
    oreumName: "새별오름",
    oreumSlug: "saebyeol",
    keywords: ["자유", "활기", "광활함"],
    color: "from-yellow-700 to-yellow-500",
  },
  ISTJ: {
    type: "ISTJ",
    title: "꼼꼼한 기록가",
    desc: "모든 탐방을 기록으로 남기는 당신. 역사적 가치가 깊은 거문오름이 당신에게 어울립니다.",
    oreumName: "거문오름",
    oreumSlug: "geomun",
    keywords: ["기록", "신중", "역사"],
    color: "from-gray-800 to-gray-600",
  },
  ISTP: {
    type: "ISTP",
    title: "실용적 탐험가",
    desc: "장비 완벽 준비하고 혼자 떠나는 당신. 한적한 백약이오름이 당신만의 공간입니다.",
    oreumName: "백약이오름",
    oreumSlug: "baekyak",
    keywords: ["실용", "혼자", "한적"],
    color: "from-teal-800 to-teal-600",
  },
  ESTJ: {
    type: "ESTJ",
    title: "체계적인 탐방가",
    desc: "루트를 완벽히 계획하고 목표를 달성하는 당신. 성산일출봉의 명확한 정상이 당신을 맞이합니다.",
    oreumName: "성산일출봉",
    oreumSlug: "seongsan-ilchulbong",
    keywords: ["계획", "효율", "목표"],
    color: "from-indigo-800 to-indigo-600",
  },
  ESTP: {
    type: "ESTP",
    title: "역동적인 모험가",
    desc: "지금 이 순간을 즐기는 당신. 우도에서 바라보는 성산일출봉처럼 현재를 즐기세요.",
    oreumName: "성산일출봉",
    oreumSlug: "seongsan-ilchulbong",
    keywords: ["역동", "현재", "스릴"],
    color: "from-cyan-800 to-cyan-600",
  },
  ISFJ: {
    type: "ISFJ",
    title: "따뜻한 수호자",
    desc: "소중한 사람을 위해 탐방을 계획하는 당신. 모두에게 좋은 추억을 주는 사라봉이 어울려요.",
    oreumName: "사라봉",
    oreumSlug: "sarabong",
    keywords: ["배려", "소중함", "가족"],
    color: "from-rose-800 to-rose-600",
  },
  ISFP: {
    type: "ISFP",
    title: "조용한 예술가",
    desc: "오름의 색과 빛을 감상하는 당신. 억새밭이 아름다운 따라비오름의 노을이 당신의 팔레트입니다.",
    oreumName: "따라비오름",
    oreumSlug: "ttalabi",
    keywords: ["예술", "감각", "자연"],
    color: "from-violet-800 to-violet-600",
  },
  ESFJ: {
    type: "ESFJ",
    title: "따뜻한 분위기 메이커",
    desc: "모두가 즐거운 탐방을 만드는 당신. 누구나 오를 수 있는 새별오름에서 함께하세요.",
    oreumName: "새별오름",
    oreumSlug: "saebyeol",
    keywords: ["사교", "분위기", "함께"],
    color: "from-amber-700 to-amber-500",
  },
  ESFP: {
    type: "ESFP",
    title: "즉흥적인 즐거움꾼",
    desc: "지금 당장 출발하고 싶은 당신! 어디에서도 흥이 넘치는 용머리해안 근처 오름들이 기다려요.",
    oreumName: "송악산",
    oreumSlug: "songaksan",
    keywords: ["즐거움", "즉흥", "활발"],
    color: "from-lime-700 to-lime-500",
  },
};

export function calculateMbti(scores: Record<string, number>): MbtiType {
  const e = scores.E ?? 0;
  const i = scores.I ?? 0;
  const n = scores.N ?? 0;
  const s = scores.S ?? 0;
  const t = scores.T ?? 0;
  const f = scores.F ?? 0;
  const j = scores.J ?? 0;
  const p = scores.P ?? 0;

  return [
    e >= i ? "E" : "I",
    n >= s ? "N" : "S",
    t >= f ? "T" : "F",
    j >= p ? "J" : "P",
  ].join("") as MbtiType;
}

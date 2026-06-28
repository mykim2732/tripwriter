export const FREE_CREDITS = 5;

export const CREDIT_COSTS = {
  generatePost: 1,
  polishPost: 1,
  analyzePhotos: 1,
} as const;

export const plans = [
  {
    name: "Free",
    price: "0원",
    description: "로그인하면 5회 체험",
    credits: "5회",
    features: ["AI 글 생성", "기본 저장함", "복사해서 발행"],
  },
  {
    name: "Pro",
    price: "월 6,900원 예정",
    description: "꾸준히 콘텐츠를 만드는 사용자용",
    credits: "월 100회",
    features: ["사진 분석", "AI 디자인", "발행 준비", "블로그/리뷰"],
  },
  {
    name: "Creator",
    price: "월 12,900원 예정",
    description: "여러 플랫폼과 상세페이지까지 운영하는 크리에이터용",
    credits: "월 300회",
    features: ["상세페이지", "다중 플랫폼", "고급 사진 꾸미기", "우선 기능"],
  },
];

export function getCreditCostLabel(kind: keyof typeof CREDIT_COSTS) {
  return `${CREDIT_COSTS[kind]} 크레딧`;
}

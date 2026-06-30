export type PostyContentPlan = {
  contentGoal: string;
  targetReader: string;
  photoStoryline: string[];
  suggestedSections: string[];
  coverPhotoReason: string;
  tonePlan: string;
  seoPlan: string;
  designPlan: string;
  publishPlan: string;
};

export type PostyPlanInput = {
  title?: string;
  place?: string;
  keywords?: string;
  memo?: string;
  style?: string;
  persona?: string;
  platform?: string;
  contentType?: string;
  photoCaptions?: string[];
  photoAnalysis?: unknown[];
  photoSummary?: string;
  coverPhotoUrl?: string;
  reviewResearch?: unknown;
};

export function fallbackContentPlan(input: PostyPlanInput): PostyContentPlan {
  const platform = input.platform || "general";
  const goal =
    platform === "detail"
      ? "상품 장점을 빠르게 이해시키는 모바일 상세페이지 만들기"
      : platform === "review"
        ? "사진과 실제 사용감을 중심으로 신뢰감 있는 리뷰 만들기"
        : "사진 흐름에 따라 자연스럽게 읽히는 콘텐츠 만들기";
  const captions = input.photoCaptions?.filter(Boolean).slice(0, 5) || [];

  return {
    contentGoal: goal,
    targetReader: input.keywords
      ? `${input.keywords}를 검색하거나 비교 중인 독자`
      : "사진과 경험을 보고 빠르게 판단하려는 독자",
    photoStoryline: captions.length
      ? captions.map((caption, index) => `${index + 1}. ${caption}`)
      : [
          "대표 사진으로 첫인상 만들기",
          "본문 사진으로 경험 디테일 보여주기",
          "마무리 사진으로 다음 행동 유도하기",
        ],
    suggestedSections:
      platform === "detail"
        ? ["Hero", "핵심 장점", "사용 장면", "스펙/구성", "FAQ", "CTA"]
        : ["도입", "대표사진 설명", "경험/사용감", "장점", "아쉬운 점", "마무리 CTA"],
    coverPhotoReason: input.coverPhotoUrl
      ? "이미 선택한 대표 사진을 첫 화면의 신뢰 요소로 사용합니다."
      : "첫 번째 사진 또는 AI 추천 사진을 대표 사진 후보로 사용합니다.",
    tonePlan: `${input.style || "자연스러운"} 톤을 유지하되 AI 느낌이 나는 반복 표현은 줄입니다.`,
    seoPlan: input.keywords
      ? `${input.keywords}를 제목, 첫 문단, 소제목에 자연스럽게 분산합니다.`
      : "검색자가 궁금해할 표현을 제목과 소제목에 자연스럽게 배치합니다.",
    designPlan: "사진 캡션, 짧은 메모, 강조 박스를 과하지 않게 사용합니다.",
    publishPlan: "발행 전 제목, 대표 사진, 사진 포함 본문, 태그, CTA를 점검합니다.",
  };
}

export function normalizeContentPlan(
  value: Partial<PostyContentPlan>,
  fallback: PostyContentPlan,
): PostyContentPlan {
  return {
    contentGoal: typeof value.contentGoal === "string" ? value.contentGoal : fallback.contentGoal,
    targetReader: typeof value.targetReader === "string" ? value.targetReader : fallback.targetReader,
    photoStoryline: Array.isArray(value.photoStoryline)
      ? value.photoStoryline.map(String).filter(Boolean).slice(0, 12)
      : fallback.photoStoryline,
    suggestedSections: Array.isArray(value.suggestedSections)
      ? value.suggestedSections.map(String).filter(Boolean).slice(0, 12)
      : fallback.suggestedSections,
    coverPhotoReason:
      typeof value.coverPhotoReason === "string" ? value.coverPhotoReason : fallback.coverPhotoReason,
    tonePlan: typeof value.tonePlan === "string" ? value.tonePlan : fallback.tonePlan,
    seoPlan: typeof value.seoPlan === "string" ? value.seoPlan : fallback.seoPlan,
    designPlan: typeof value.designPlan === "string" ? value.designPlan : fallback.designPlan,
    publishPlan: typeof value.publishPlan === "string" ? value.publishPlan : fallback.publishPlan,
  };
}

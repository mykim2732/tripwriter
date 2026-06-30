export type ReviewProviderId = "google_places" | "kakao_local" | "naver_search" | "manual";

export type ReviewProviderStatus = "mock" | "ready" | "missing-env";

export type ReviewProviderDescriptor = {
  id: ReviewProviderId;
  label: string;
  mode: "official-api-ready" | "manual";
  status: ReviewProviderStatus;
  envRequired: string[];
  availableFields: string[];
  searchUrl: string;
  note: string;
};

export type ReviewProviderSearchInput = {
  query?: string;
  location?: string;
};

export function getReviewProviderDescriptors(input: ReviewProviderSearchInput = {}): ReviewProviderDescriptor[] {
  const query = normalizeQuery(input.query, input.location);
  return [
    {
      id: "google_places",
      label: "Google Places",
      mode: "official-api-ready",
      status: process.env.GOOGLE_PLACES_API_KEY ? "ready" : "missing-env",
      envRequired: ["GOOGLE_PLACES_API_KEY"],
      availableFields: ["placeId", "name", "address", "rating", "reviewCount", "mapUrl"],
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      note: "공식 Places API 연결 준비. 리뷰 원문은 수집하지 않고 평점/리뷰 수/장소 정보 중심으로만 사용합니다.",
    },
    {
      id: "kakao_local",
      label: "Kakao Local",
      mode: "official-api-ready",
      status: process.env.KAKAO_REST_API_KEY ? "ready" : "missing-env",
      envRequired: ["KAKAO_REST_API_KEY"],
      availableFields: ["placeName", "address", "category", "mapUrl", "phone"],
      searchUrl: `https://map.kakao.com/?q=${encodeURIComponent(query)}`,
      note: "카카오 로컬 장소 검색 연결 준비. 장소명, 주소, 카테고리, 지도 URL 중심으로 사용합니다.",
    },
    {
      id: "naver_search",
      label: "Naver Search",
      mode: "official-api-ready",
      status: process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET ? "ready" : "missing-env",
      envRequired: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
      availableFields: ["title", "link", "description", "bloggerName", "postDate"],
      searchUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`,
      note: "네이버 검색/블로그 검색 연결 준비. 제목, 링크, 요약만 참고하고 원문 복제는 금지합니다.",
    },
    {
      id: "manual",
      label: "Manual memo",
      mode: "manual",
      status: "ready",
      envRequired: [],
      availableFields: ["reviewMemo", "pros", "cons", "rating", "links"],
      searchUrl: "",
      note: "사용자가 직접 확인한 리뷰 메모를 최우선 근거로 사용합니다.",
    },
  ];
}

export function normalizeProviderId(value: unknown): ReviewProviderId | "all" {
  if (value === "google_places" || value === "kakao_local" || value === "naver_search" || value === "manual") return value;
  if (value === "google") return "google_places";
  if (value === "kakao") return "kakao_local";
  if (value === "naver") return "naver_search";
  return "all";
}

function normalizeQuery(query?: string, location?: string) {
  return [query?.trim() || "리뷰", location?.trim(), "리뷰"].filter(Boolean).join(" ");
}

export type ReviewSourceProvider = "google" | "kakao" | "naver";

export type ReviewSourceSearchInput = {
  query?: string;
  provider?: ReviewSourceProvider | "all";
  location?: string;
};

export type ReviewSourceSearchLink = {
  provider: ReviewSourceProvider;
  label: string;
  url: string;
  mode: "search-link";
  ready: boolean;
  note: string;
};

export type ReviewSourceSearchResult = {
  query: string;
  mode: "mock/search-link";
  links: ReviewSourceSearchLink[];
  apiReady: Record<ReviewSourceProvider, boolean>;
  message: string;
};

const providers: ReviewSourceProvider[] = ["google", "kakao", "naver"];

export function searchReviewSources(input: ReviewSourceSearchInput): ReviewSourceSearchResult {
  const query = normalizeQuery(input.query);
  const selected = input.provider && input.provider !== "all" ? [input.provider] : providers;
  const apiReady = getReviewApiReadiness();

  return {
    query,
    mode: "mock/search-link",
    apiReady,
    links: selected.map((provider) => ({
      provider,
      label: getProviderLabel(provider),
      url: getProviderSearchUrl(provider, query, input.location),
      mode: "search-link",
      ready: apiReady[provider],
      note: apiReady[provider]
        ? "공식 API 키가 감지됐지만 현재 Sprint에서는 검색 링크 모드로만 동작합니다."
        : "공식 API 키가 없어 검색 링크만 제공합니다.",
    })),
    message: "Posty AI는 현재 리뷰 원문을 수집하지 않고, 사용자가 직접 확인할 수 있는 검색 링크만 제공합니다.",
  };
}

export function getReviewApiReadiness(): Record<ReviewSourceProvider, boolean> {
  return {
    google: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    kakao: Boolean(process.env.KAKAO_REST_API_KEY),
    naver: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
  };
}

function normalizeQuery(query?: string) {
  const trimmed = query?.trim();
  return trimmed || "리뷰";
}

function getProviderLabel(provider: ReviewSourceProvider) {
  if (provider === "google") return "Google";
  if (provider === "kakao") return "Kakao Map";
  return "Naver";
}

function getProviderSearchUrl(provider: ReviewSourceProvider, query: string, location?: string) {
  const fullQuery = [query, location, "리뷰"].filter(Boolean).join(" ");
  const encoded = encodeURIComponent(fullQuery);
  if (provider === "google") return `https://www.google.com/search?q=${encoded}`;
  if (provider === "kakao") return `https://map.kakao.com/?q=${encoded}`;
  return `https://search.naver.com/search.naver?query=${encoded}`;
}

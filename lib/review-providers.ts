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

export type ReviewProviderPlaceResult = {
  provider: ReviewProviderId;
  title: string;
  address?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
  source: "official-api" | "search-link";
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

export async function searchGooglePlaces(input: ReviewProviderSearchInput): Promise<ReviewProviderPlaceResult[]> {
  const query = normalizeQuery(input.query, input.location);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [fallbackPlace("google_places", query)];

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: query, languageCode: "ko", maxResultCount: 5 }),
    });
    if (!response.ok) throw new Error(`Google Places ${response.status}`);
    const data = await response.json() as { places?: Record<string, unknown>[] };
    return (data.places || []).map((place) => ({
      provider: "google_places",
      title: getLocalizedText(place.displayName) || "Google place",
      address: typeof place.formattedAddress === "string" ? place.formattedAddress : undefined,
      category: getLocalizedText(place.primaryTypeDisplayName),
      rating: typeof place.rating === "number" ? place.rating : undefined,
      reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : undefined,
      url: typeof place.googleMapsUri === "string" ? place.googleMapsUri : `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: "official-api",
    }));
  } catch {
    return [fallbackPlace("google_places", query)];
  }
}

export async function searchKakaoLocal(input: ReviewProviderSearchInput): Promise<ReviewProviderPlaceResult[]> {
  const query = normalizeQuery(input.query, input.location);
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return [fallbackPlace("kakao_local", query)];

  try {
    const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });
    if (!response.ok) throw new Error(`Kakao Local ${response.status}`);
    const data = await response.json() as { documents?: Record<string, unknown>[] };
    return (data.documents || []).map((place) => ({
      provider: "kakao_local",
      title: String(place.place_name || "Kakao place"),
      address: String(place.road_address_name || place.address_name || ""),
      category: String(place.category_name || ""),
      url: String(place.place_url || `https://map.kakao.com/?q=${encodeURIComponent(query)}`),
      source: "official-api",
    }));
  } catch {
    return [fallbackPlace("kakao_local", query)];
  }
}

export function fallbackPlace(provider: ReviewProviderId, query: string): ReviewProviderPlaceResult {
  const descriptor = getReviewProviderDescriptors({ query }).find((item) => item.id === provider);
  return {
    provider,
    title: query,
    url: descriptor?.searchUrl || "",
    source: "search-link",
  };
}

function getLocalizedText(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const text = (value as Record<string, unknown>).text;
  return typeof text === "string" ? text : undefined;
}

function normalizeQuery(query?: string, location?: string) {
  return [query?.trim() || "리뷰", location?.trim(), "리뷰"].filter(Boolean).join(" ");
}

import type { ContentPlatform } from "@/types/editor";

export type PublishCapabilityStatus = "copy_ready" | "html_copy_ready" | "api_uncertain" | "api_limited" | "api_ready_if_token";

export type PublishCapability = {
  platform: ContentPlatform;
  status: PublishCapabilityStatus;
  badge: "자동 발행 가능" | "복사 발행 권장" | "API 연결 준비 중";
  title: string;
  description: string;
  actionHint: string;
};

const capabilities: Partial<Record<ContentPlatform, PublishCapability>> = {
  naver: {
    platform: "naver",
    status: "api_uncertain",
    badge: "복사 발행 권장",
    title: "네이버 블로그는 복사 발행이 가장 안정적이에요",
    description: "공식 자동 발행 API 사용 범위가 제한적이어서 현재는 HTML/사진 포함 복사 흐름을 우선 제공합니다.",
    actionHint: "사진 포함 복사 후 네이버 에디터에 붙여넣고, 이미지가 빠지면 사진 URL 목록을 참고하세요.",
  },
  tistory: {
    platform: "tistory",
    status: "api_limited",
    badge: "복사 발행 권장",
    title: "티스토리는 HTML 복사 발행을 우선 지원해요",
    description: "API 연결은 가능성이 있지만 권한과 블로그 설정 제약이 있어 베타에서는 HTML 복사를 우선합니다.",
    actionHint: "HTML 복사를 먼저 사용하고, 깨지는 경우 본문 텍스트와 이미지 설명을 나눠 붙여넣으세요.",
  },
  threads: {
    platform: "threads",
    status: "api_ready_if_token",
    badge: "API 연결 준비 중",
    title: "스레드는 토큰이 있으면 자동 발행 구조로 확장 가능해요",
    description: "Threads API 토큰과 권한이 연결되면 텍스트 게시부터 실제 발행에 가장 가깝게 테스트할 수 있습니다.",
    actionHint: "현재는 mock 발행과 복사 발행을 함께 제공합니다.",
  },
  review: {
    platform: "review",
    status: "copy_ready",
    badge: "복사 발행 권장",
    title: "리뷰는 쇼핑몰/블로그에 맞춰 복사 발행하세요",
    description: "쇼핑몰 리뷰 에디터마다 붙여넣기 정책이 달라 한줄평, 전체 리뷰, 사진 설명을 나눠 복사합니다.",
    actionHint: "제휴 링크가 있으면 광고/제휴 표시를 함께 확인하세요.",
  },
  detail: {
    platform: "detail",
    status: "html_copy_ready",
    badge: "복사 발행 권장",
    title: "상세페이지는 HTML 복사가 준비됐어요",
    description: "판매사이트 에디터에 따라 HTML 지원 범위가 달라 섹션별 텍스트와 이미지 설명 fallback도 제공합니다.",
    actionHint: "HTML 복사 후 쇼핑몰 에디터에서 Hero, 장점, FAQ, CTA 순서를 확인하세요.",
  },
};

export function getPublishCapability(platform: ContentPlatform): PublishCapability {
  return capabilities[platform] || {
    platform,
    status: "copy_ready",
    badge: "복사 발행 권장",
    title: "복사 발행으로 안정적으로 게시하세요",
    description: "아직 자동 발행 API가 연결되지 않은 플랫폼입니다.",
    actionHint: "제목, 본문, 사진 설명, 태그를 순서대로 복사하세요.",
  };
}

import { NextRequest, NextResponse } from "next/server";

type ThreadsPublishRequest = {
  text?: string;
  imageUrls?: string[];
  accessToken?: string;
  mock?: boolean;
};

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as ThreadsPublishRequest;
  const token = input.accessToken || process.env.THREADS_ACCESS_TOKEN;
  const shouldMock = input.mock !== false || !token;

  if (!input.text?.trim()) {
    return NextResponse.json({ message: "스레드에 올릴 본문이 필요해요." }, { status: 400 });
  }

  if (!token && !shouldMock) {
    return NextResponse.json({ message: "Threads 계정을 먼저 연결해주세요." }, { status: 401 });
  }

  if (shouldMock) {
    return NextResponse.json({
      mode: "mock",
      platform: "threads",
      message: token ? "Threads 테스트 발행 mock이 완료됐어요." : "Threads 계정 토큰이 없어 mock 발행으로 처리했어요.",
      platformPostUrl: `https://www.threads.net/@posty_ai/post/mock-${Date.now()}`,
      prepared: {
        text: input.text,
        imageUrls: input.imageUrls || [],
        mediaContainerReady: Boolean(input.imageUrls?.length),
      },
    });
  }

  // Future real publish flow:
  // 1. Create text/media container with Threads Graph API.
  // 2. Poll publishing status when media is included.
  // 3. Publish the container and return the permalink.
  return NextResponse.json({
    mode: "prepared",
    platform: "threads",
    message: "Threads API 토큰이 확인됐고 실제 발행 호출 구조가 준비됐어요. 외부 승인 후 publish endpoint를 연결하세요.",
    platformPostUrl: "",
    prepared: {
      text: input.text,
      imageUrls: input.imageUrls || [],
      mediaContainerReady: Boolean(input.imageUrls?.length),
    },
  });
}

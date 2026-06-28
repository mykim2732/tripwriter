import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    platform: "naver",
    message: "네이버 자동 발행은 각 플랫폼 API 정책에 맞춰 연결 준비 중입니다. 지금은 복사해서 발행하기를 사용해주세요.",
  }, { status: 501 });
}

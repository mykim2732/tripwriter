import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    platform: "threads",
    message: "스레드 OAuth callback은 아직 연결 준비 중입니다.",
    requiredEnv: ["_CLIENT_ID", "_CLIENT_SECRET"],
  }, { status: 501 });
}

import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logger";
import { createCheckoutSession, type CheckoutRequest } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as CheckoutRequest;
  if (!input.plan || !["pro", "creator", "business"].includes(input.plan)) {
    return NextResponse.json({ message: "결제할 요금제를 선택해주세요." }, { status: 400 });
  }

  try {
    const session = createCheckoutSession(input);
    logInfo("payment", "checkout stub requested", `${session.provider}:${session.plan}:${session.mode}`);
    return NextResponse.json(session);
  } catch (error) {
    logError("payment", error, "checkout stub failed");
    return NextResponse.json({ message: "결제 준비 중 문제가 발생했어요." }, { status: 500 });
  }
}

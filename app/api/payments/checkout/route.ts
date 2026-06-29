import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, type CheckoutRequest } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const input = await request.json().catch(() => ({})) as CheckoutRequest;
  if (!input.plan || !["pro", "creator", "business"].includes(input.plan)) {
    return NextResponse.json({ message: "결제할 요금제를 선택해주세요." }, { status: 400 });
  }

  const session = createCheckoutSession(input);
  return NextResponse.json(session);
}

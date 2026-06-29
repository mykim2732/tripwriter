export type PaymentProvider = "toss" | "stripe";
export type PaymentPlan = "pro" | "creator" | "business";

export type CheckoutRequest = {
  plan: PaymentPlan;
  provider?: PaymentProvider;
  mode?: "subscription" | "credit_pack";
};

export type CheckoutSession = {
  mode: "mock" | "ready";
  provider: PaymentProvider;
  plan: PaymentPlan;
  checkoutUrl: string;
  message: string;
};

const planNames: Record<PaymentPlan, string> = {
  pro: "Pro",
  creator: "Creator",
  business: "Business",
};

export function createCheckoutSession(input: CheckoutRequest): CheckoutSession {
  const provider = input.provider || "toss";
  const hasProviderKey = provider === "toss" ? Boolean(process.env.TOSS_PAYMENTS_SECRET_KEY) : Boolean(process.env.STRIPE_SECRET_KEY);
  const mode = hasProviderKey ? "ready" : "mock";
  return {
    mode,
    provider,
    plan: input.plan,
    checkoutUrl: mode === "mock" ? `/billing/success?mock=1&plan=${input.plan}&provider=${provider}` : "",
    message: mode === "mock"
      ? `${planNames[input.plan]} 결제는 준비 중이에요. mock checkout으로 전환합니다.`
      : `${provider} checkout 연결 준비가 확인됐어요. 실제 SDK 호출을 연결하세요.`,
  };
}

"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";

const pricingPlans = [
  {
    name: "Free",
    price: "0원",
    badge: "Start",
    description: "Posty AI를 가볍게 테스트하는 무료 플랜입니다.",
    features: ["무료 크레딧 5개", "내 말투 1개", "기본 글 생성", "기본 사진 분석"],
  },
  {
    name: "Pro",
    price: "월 6,900원 예정",
    badge: "Popular",
    description: "블로그, 리뷰, SNS 콘텐츠를 꾸준히 만드는 크리에이터용 플랜입니다.",
    features: ["월 100 크레딧", "내 말투 3개", "AI 디자인", "AI 사진 분석", "블로그/리뷰/SNS"],
    featured: true,
  },
  {
    name: "Creator",
    price: "월 12,900원 예정",
    badge: "Growth",
    description: "상세페이지와 다중 플랫폼 콘텐츠까지 운영하는 사용자에게 맞습니다.",
    features: ["월 300 크레딧", "내 말투 5개", "상세페이지", "AI 썸네일", "다중 플랫폼"],
  },
  {
    name: "Business",
    price: "월 29,000원 예정",
    badge: "Team",
    description: "팀과 브랜드 스타일을 관리하는 운영형 플랜입니다.",
    features: ["월 1,000 크레딧", "내 말투 10개", "팀/브랜드 스타일", "고급 상세페이지"],
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState("");

  async function startCheckout(plan: string) {
    if (plan === "free") return;
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, provider: "toss", mode: "subscription" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "결제 준비에 실패했어요.");
      window.alert(data.message || "결제 준비 중입니다.");
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "결제 준비에 실패했어요.");
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Pricing</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">요금제</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            베타 기간에는 결제 없이 핵심 기능을 테스트할 수 있어요. 결제 기능은 곧 연결됩니다.
          </p>
        </div>

        <div className="grid gap-4">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={`rounded-3xl p-5 shadow-sm ring-1 ${plan.featured ? "bg-blue-600 text-white ring-blue-500" : "bg-white text-slate-950 ring-slate-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${plan.featured ? "bg-white/15 text-white" : "bg-blue-50 text-blue-700"}`}>{plan.badge}</span>
                  <h2 className="mt-3 text-2xl font-black">{plan.name}</h2>
                  <p className={`mt-1 text-sm font-black ${plan.featured ? "text-blue-100" : "text-blue-600"}`}>{plan.price}</p>
                </div>
                <Sparkles className={plan.featured ? "text-white" : "text-blue-600"} size={24} />
              </div>
              <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-blue-50" : "text-slate-500"}`}>{plan.description}</p>
              <div className="mt-4 grid gap-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm font-bold">
                    <CheckCircle2 size={16} className={plan.featured ? "text-white" : "text-blue-600"} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button type="button" disabled={plan.name === "Free" || loadingPlan === plan.name.toLowerCase()} onClick={() => startCheckout(plan.name.toLowerCase())} className={`mt-5 min-h-12 w-full rounded-2xl px-4 text-sm font-black disabled:opacity-60 ${plan.featured ? "bg-white text-blue-700" : "bg-slate-950 text-white"}`}>
                {plan.name === "Free" ? "무료로 시작" : loadingPlan === plan.name.toLowerCase() ? "준비 중" : `${plan.name} 시작하기`}
              </button>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <h2 className="text-base font-black">크레딧이 부족한가요?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">리워드 센터에서 출석 체크와 베타 미션으로 추가 크레딧을 받을 수 있어요.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/rewards" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">리워드 받기</Link>
            <Link href="/account" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-black text-slate-950">계정 보기</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

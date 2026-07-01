"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

export type PlanName = "free" | "lite" | "pro" | "creator" | "business";

const planRank: Record<PlanName, number> = {
  free: 0,
  lite: 1,
  pro: 2,
  creator: 3,
  business: 4,
};

export function canUseFeature(currentPlan: string | undefined, requiredPlan: PlanName) {
  const current = normalizePlan(currentPlan);
  return planRank[current] >= planRank[requiredPlan];
}

export function normalizePlan(plan: string | undefined): PlanName {
  if (plan === "lite" || plan === "pro" || plan === "creator" || plan === "business") return plan;
  return "free";
}

export function FeatureGate({
  currentPlan = "free",
  requiredPlan = "pro",
  feature,
  children,
}: {
  currentPlan?: string;
  requiredPlan?: PlanName;
  feature: string;
  children?: React.ReactNode;
}) {
  if (canUseFeature(currentPlan, requiredPlan)) return <>{children}</>;

  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Lock size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-slate-950">{feature}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {requiredPlan.toUpperCase()} 플랜부터 사용할 수 있는 기능이에요. 리워드로 먼저 체험하거나 요금제를 확인해보세요.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/pricing" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-black text-white">
              요금제 보기
            </Link>
            <Link href="/rewards" className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-700">
              <Sparkles size={15} /> 리워드 체험
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

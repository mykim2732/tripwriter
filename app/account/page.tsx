import { Coins, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { FREE_CREDITS, plans } from "@/lib/credits";

export default function AccountPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">프로필</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">계정</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            로그인, 크레딧, 요금제를 연결해 AI 콘텐츠 스튜디오 계정 공간으로 확장할 예정이에요.
          </p>
        </div>

        <div className="space-y-3">
          <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Coins size={25} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-black">무료 크레딧 {FREE_CREDITS}회 준비 중</h2>
                <p className="mt-1 text-sm leading-6 text-blue-100">
                  로그인하면 AI 글 생성, AI 디자인, 사진 분석을 체험할 수 있게 연결할 예정이에요.
                </p>
              </div>
            </div>
          </article>

          {plans.map((plan) => (
            <article key={plan.name} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-950">{plan.name}</h2>
                  <p className="mt-1 text-sm font-bold text-blue-600">{plan.price}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{plan.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{plan.credits}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.features.map((feature) => (
                  <span key={feature} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{feature}</span>
                ))}
              </div>
              <button type="button" disabled className="mt-4 min-h-11 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-400">
                결제 기능 준비 중
              </button>
            </article>
          ))}

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck size={25} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Supabase Auth 연동 예정</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  이메일 로그인과 사용자별 저장함, 월별 크레딧 차감을 연결할 예정입니다.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <LockKeyhole size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">로그인 준비 중</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  실제 결제와 크레딧 차감은 로그인/DB 스키마 연결 후 활성화합니다.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6">
          <Button type="button" disabled className="cursor-not-allowed opacity-50">
            로그인 기능 준비 중
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

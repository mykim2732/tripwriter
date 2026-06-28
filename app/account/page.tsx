"use client";

import { Coins, Loader2, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { FREE_CREDITS, plans } from "@/lib/credits";
import { browserSupabase } from "@/lib/supabase";

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = browserSupabase.client;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    setMessage("");
    setLoading(true);
    const { error } = await browserSupabase.client.auth.signOut();
    if (error) setMessage(error.message);
    else setMessage("로그아웃됐어요.");
    setLoading(false);
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">프로필</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">계정</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            로그인, 크레딧, 플랫폼 연결 상태를 한곳에서 확인해요.
          </p>
        </div>

        <div className="space-y-3">
          <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Coins size={25} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-black">무료 크레딧 {FREE_CREDITS}회 준비 중</h2>
                <p className="mt-1 text-sm leading-6 text-blue-100">
                  Sprint 43~44에서 프로필과 실제 크레딧 차감 DB가 연결되면 계정별 잔여 횟수가 표시돼요.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck size={25} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-950">로그인 상태</h2>
                {loading ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-slate-400"><Loader2 className="animate-spin" size={16} /> 확인 중</p>
                ) : session?.user ? (
                  <>
                    <p className="mt-1 truncate text-sm font-bold text-blue-700">{session.user.email}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">현재 로그인된 계정입니다. 저장 데이터의 사용자별 분리는 다음 DB 정책 단계에서 완성됩니다.</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-slate-500">로그인하면 무료 크레딧 5개와 사용자별 저장함을 사용할 수 있어요.</p>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {session?.user ? (
                <button type="button" onClick={logout} disabled={loading} className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 disabled:opacity-60">
                  <LogOut size={17} /> 로그아웃
                </button>
              ) : (
                <Button href="/login" className="col-span-2">로그인 / 회원가입</Button>
              )}
            </div>
            {message && <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <LockKeyhole size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Supabase Auth 연결됨</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  이메일 로그인과 로그아웃이 동작합니다. 사용자별 글 저장과 크레딧 차감은 다음 스키마 단계에서 연결됩니다.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

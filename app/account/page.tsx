"use client";

import { Coins, Loader2, LogOut, PenLine, ShieldCheck, UserRound } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { FREE_CREDITS, ensureProfile, plans, type Profile } from "@/lib/credits";
import { getPosts } from "@/lib/posts";
import { browserSupabase } from "@/lib/supabase";

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contentCount, setContentCount] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

  useEffect(() => {
    const supabase = browserSupabase.client;

    async function load(nextSession?: Session | null) {
      setLoading(true);
      setMessage("");
      const currentSession = nextSession ?? (await supabase.auth.getSession()).data.session;
      setSession(currentSession);
      if (currentSession?.user) {
        try {
          const nextProfile = await ensureProfile(currentSession.user, supabase);
          setProfile(nextProfile);
          const posts = await getPosts();
          setContentCount(posts.length);
          const { data: logs } = await supabase
            .from("credit_logs")
            .select("created_at")
            .eq("user_id", currentSession.user.id)
            .gte("created_at", firstDayOfMonth());
          setMonthlyUsage(logs?.length || 0);
        } catch (error) {
          console.error("Account load failed", error);
          setMessage("계정 정보를 불러오지 못했어요. Supabase SQL 적용 상태를 확인해주세요.");
        }
      } else {
        setProfile(null);
        setContentCount(0);
        setMonthlyUsage(0);
      }
      setLoading(false);
    }

    void load();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void load(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function logout() {
    setMessage("");
    setLoading(true);
    const { error } = await browserSupabase.client.auth.signOut();
    if (error) setMessage(error.message);
    else {
      setProfile(null);
      setSession(null);
      setMessage("로그아웃됐어요.");
    }
    setLoading(false);
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">마이페이지</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">프로필, 크레딧, 콘텐츠 현황, 플랫폼 연결 상태를 확인해요.</p>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : session?.user ? (
          <div className="space-y-3">
            <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-3xl bg-white/15">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="프로필" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><UserRound size={30} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-black">{profile?.display_name || "Posty Creator"}</h2>
                  <p className="mt-1 truncate text-sm font-bold text-blue-100">{session.user.email}</p>
                  <p className="mt-1 text-xs font-bold text-blue-100">가입 방식: {providerLabel(profile?.provider || session.user.app_metadata?.provider)}</p>
                </div>
              </div>
              <Link href="/profile" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-blue-700"><PenLine size={17} /> 프로필 설정</Link>
            </article>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="요금제" value={profile?.plan || "free"} />
              <MetricCard label="남은 크레딧" value={`${profile?.credits ?? FREE_CREDITS}회`} />
              <MetricCard label="이번 달 AI 사용" value={`${monthlyUsage}회`} />
              <MetricCard label="내 콘텐츠" value={`${contentCount}개`} />
            </div>

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
                  {plan.features.map((feature) => <span key={feature} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{feature}</span>)}
                </div>
                <button type="button" disabled className="mt-4 min-h-11 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-400">결제 기능 준비 중</button>
              </article>
            ))}

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck size={25} /></div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-slate-950">플랫폼 연결 준비</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">네이버, 티스토리, 스레드 자동 발행은 각 플랫폼 API 정책에 맞춰 연결 예정이에요.</p>
                </div>
              </div>
            </article>

            <button type="button" onClick={logout} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 disabled:opacity-60"><LogOut size={17} /> 로그아웃</button>
          </div>
        ) : (
          <div className="space-y-3">
            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Coins size={25} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-950">로그인하면 무료 크레딧 5개</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Google/Kakao 또는 이메일로 가입하고 내 콘텐츠를 안전하게 저장해요.</p>
                </div>
              </div>
              <Button href="/login" className="mt-4">로그인 / 회원가입</Button>
            </article>
          </div>
        )}

        {message && <p className="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
      </section>
    </PageShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function providerLabel(value: unknown) {
  if (value === "google") return "Google";
  if (value === "kakao") return "Kakao";
  if (value === "email") return "Email";
  return "Email";
}

function firstDayOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

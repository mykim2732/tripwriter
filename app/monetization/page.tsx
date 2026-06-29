"use client";

import { BarChart3, BadgeDollarSign, Gift, Megaphone, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import type { Profile } from "@/lib/credits";
import { getCurrentProfile } from "@/lib/profile";
import { browserSupabase } from "@/lib/supabase";

const adChannels = [
  { name: "Google AdMob", fit: "앱 리워드 영상과 배너", placement: "리워드 센터, 모바일 앱 하단 배너", status: "SDK 준비 필요" },
  { name: "Google AdSense", fit: "웹 배너/네이티브 광고", placement: "대시보드 하단, 발행 완료 화면", status: "심사 전" },
  { name: "Kakao AdFit", fit: "국내 웹/앱 배너", placement: "저장함 하단, 공지/지원 페이지", status: "연결 준비" },
  { name: "Coupang Partners", fit: "리뷰/상세페이지 제휴 CTA", placement: "리뷰 링크, 상세페이지 구매 링크", status: "제휴 고지 필수" },
];

const rewardPolicy = [
  "광고 1회 = 0.25 크레딧 상당 포인트",
  "광고 4회 = AI 글 생성 1회",
  "하루 광고 최대 8회 = 최대 2크레딧 상당",
  "프로필 완성/내 말투 등록은 0.5크레딧 상당",
  "첫 발행 완료와 친구 초대 수락은 1크레딧",
];

export default function MonetizationPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await browserSupabase.client.auth.getUser();
        if (!data.user) {
          setError("로그인이 필요합니다.");
          return;
        }
        setProfile(await getCurrentProfile());
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "수익화 정보를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const isAdmin = profile?.role === "admin";

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Monetization</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">수익화 운영 가이드</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">광고, 제휴 링크, 결제 플랜을 어디에 붙일지 한 번에 점검합니다.</p>
        </div>

        {loading && <LoadingCard title="관리자 권한 확인 중" description="수익화 페이지 접근 권한을 확인하고 있어요." />}
        {!loading && error && <ErrorCard title="접근 오류" message={error} action={<Link href="/login" className="inline-flex rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">로그인</Link>} />}
        {!loading && !error && !isAdmin && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><ShieldAlert size={28} /></div>
            <h2 className="mt-4 text-lg font-black text-slate-950">관리자 권한이 필요합니다.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">광고/제휴/결제 운영 정보는 admin 계정만 볼 수 있어요.</p>
          </div>
        )}

        {!loading && !error && isAdmin && (
          <div className="space-y-4">
            <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><BadgeDollarSign size={25} /></div>
                <div>
                  <h2 className="text-base font-black">베타 수익화 구조</h2>
                  <p className="mt-1 text-sm leading-6 text-blue-100">초기에는 구독 전환, 리워드 광고, 리뷰/상세페이지 제휴 링크를 함께 테스트합니다.</p>
                </div>
              </div>
            </article>

            <div className="grid gap-3">
              {adChannels.map((channel) => (
                <article key={channel.name} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Megaphone size={21} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-black text-slate-950">{channel.name}</h2>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">{channel.status}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{channel.fit}</p>
                      <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">권장 위치: {channel.placement}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-center gap-2"><Gift size={19} className="text-blue-600" /><h2 className="text-base font-black text-slate-950">리워드 광고 권장 정책</h2></div>
              <div className="grid gap-2">
                {rewardPolicy.map((item) => <p key={item} className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">{item}</p>)}
              </div>
            </article>

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-center gap-2"><Sparkles size={19} className="text-blue-600" /><h2 className="text-base font-black text-slate-950">제휴 링크 운영 원칙</h2></div>
              <p className="text-sm leading-6 text-slate-500">리뷰와 상세페이지의 구매 링크는 반드시 광고/제휴 표시를 함께 노출합니다. AI 생성 프롬프트도 제휴 링크를 숨기지 않도록 연결되어 있어요.</p>
              <Link href="/write?platform=review" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">리뷰 작성으로 테스트</Link>
            </article>

            <article className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
              <div className="mb-3 flex items-center gap-2"><BarChart3 size={19} className="text-blue-200" /><h2 className="text-base font-black">연결 상태</h2></div>
              <div className="grid gap-2 text-sm font-bold text-slate-300">
                <p>결제: Toss Payments / Stripe Stub 준비</p>
                <p>광고: SDK 연결 전 Placeholder 운영</p>
                <p>제휴: 링크 타입과 발행 고지 UX 준비</p>
                <p>관리자 지표: credit_logs 기반 확장 예정</p>
              </div>
            </article>
          </div>
        )}
      </section>
    </PageShell>
  );
}

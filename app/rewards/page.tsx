"use client";

import { CheckCircle2, Gift, Loader2, PlayCircle, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import { AdSlot } from "@/components/AdSlot";
import { browserSupabase } from "@/lib/supabase";
import { getImageCreditPolicyText } from "@/lib/image-credit-policy";
import { POINTS_PER_CREDIT, canClaimReward, claimReward, getRewardSummary, getTodayRewardPoints, rewardDefinitions, type RewardAction } from "@/lib/rewards";
import type { CreditLog, Profile } from "@/lib/credits";

const rewardOrder: RewardAction[] = ["watch_ad", "daily_checkin", "complete_profile", "add_writing_style", "first_publish", "invite_friend"];

export default function RewardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<RewardAction | "">("");
  const [adCountdown, setAdCountdown] = useState(0);
  const [adReady, setAdReady] = useState(false);
  const [burst, setBurst] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rewardLogs = useMemo(() => logs.filter((log) => log.action.startsWith("reward_")), [logs]);
  const watchAdCount = rewardLogs.filter((log) => log.action === "reward_watch_ad").length;
  const remainingAds = Math.max(0, 8 - watchAdCount);
  const todayPoints = getTodayRewardPoints(logs);
  const gaugePoints = todayPoints % POINTS_PER_CREDIT;
  const gaugePercent = Math.min(100, (gaugePoints / POINTS_PER_CREDIT) * 100);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data } = await browserSupabase.client.auth.getUser();
      if (!data.user) {
        setError("Log in to receive reward credits.");
        return;
      }
      const summary = await getRewardSummary();
      setProfile(summary.profile);
      setLogs(summary.todayLogs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load rewards.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (adCountdown <= 0) {
      if (adCountdown === 0 && claiming === "watch_ad") {
        setAdReady(true);
        setClaiming("");
        setMessage("광고 시청이 완료됐어요. 이제 보상 받기를 눌러주세요.");
      }
      return;
    }
    const timer = window.setTimeout(() => setAdCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [adCountdown, claiming]);

  async function claim(action: RewardAction) {
    if (action === "watch_ad" && !adReady) {
      if (claiming) return;
      setClaiming("watch_ad");
      setMessage("광고를 끝까지 보면 보상이 지급돼요.");
      setAdCountdown(5);
      return;
    }
    setClaiming(action);
    setMessage("");
    try {
      const result = await claimReward(action);
      setMessage(result.amount > 0 ? `${rewardDefinitions[action].label} 보상으로 ${result.amount}크레딧을 받았어요.` : `${rewardDefinitions[action].label} 보상 ${result.points}포인트가 기록됐어요.`);
      if (action === "watch_ad") setAdReady(false);
      setBurst(true);
      window.setTimeout(() => setBurst(false), 1200);
      await load();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not claim this reward.");
    } finally {
      setClaiming("");
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI 혜택</p>
          <div className="flex items-center justify-between gap-3">
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">리워드센터</h1>
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">🪙 {todayPoints}P</div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">광고, 출석, 미션으로 AI 글쓰기 포인트를 모아보세요.</p>
          <div className="mt-3 flex flex-wrap gap-2"><Link href="/pricing" className="inline-flex rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">요금제 보기</Link><Link href="/invite" className="inline-flex rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">친구 초대</Link></div>
        </div>

        {loading && <LoadingCard title="리워드를 불러오는 중" description="오늘 받을 수 있는 혜택과 포인트를 확인하고 있어요." />}
        {!loading && error && <ErrorCard title="리워드를 사용할 수 없어요" message={error} action={<Link href="/login" className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">로그인</Link>} />}
        {!loading && !error && (
          <div className="space-y-4">
            <article className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-5 text-white shadow-sm">
              {burst && <div className="pointer-events-none absolute inset-0 animate-ping rounded-[32px] bg-white/20" />}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
              <div className="absolute right-9 top-16 text-5xl opacity-30">✨</div>
              <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-white/20"><Gift size={31} /></div>
                <div>
                  <p className="text-sm font-black text-blue-100">내 AI 사용권</p>
                  <h2 className="text-3xl font-black">{profile?.credits ?? 0}크레딧</h2>
                  <p className="mt-1 text-sm font-bold text-blue-50">오늘 {rewardLogs.length}개 보상 완료</p>
                </div>
              </div>
              <div className="relative mt-5 rounded-3xl bg-white p-4 text-slate-900 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">크레딧 게이지</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{gaugePoints}/{POINTS_PER_CREDIT} 포인트 · 4포인트 모으면 1크레딧</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">🪙 {todayPoints}P</span>
                </div>
                <div className="mt-4 h-4 overflow-hidden rounded-full bg-blue-50">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${gaugePercent}%` }} />
                </div>
              </div>
            </article>

            <article className="rounded-[32px] border-4 border-rose-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-black text-slate-950">오늘의 보상 상자</p>
                  <p className="mt-1 text-sm font-bold text-slate-500">광고 4번 보면 AI 글 1회 생성 가능</p>
                </div>
                <Trophy className="text-amber-400" size={30} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[1, 2, 3, 4].map((step) => <div key={step} className={`rounded-2xl px-3 py-3 text-center text-sm font-black ${watchAdCount >= step ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-300"}`}>{watchAdCount >= step ? "✓" : step}</div>)}
              </div>
              <p className="mt-3 text-xs font-bold text-blue-700">오늘 광고 가능 횟수 {remainingAds}/8 · 현재 {watchAdCount}회 완료</p>
            </article>

            <AdSlot type="reward_video" title="리워드 광고 슬롯" description="실제 SDK 연결 전까지는 아래 광고 보기 미션으로 보상 흐름을 테스트해요." />


            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-black text-slate-950">포인트를 크레딧으로 전환</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">4포인트를 모으면 1크레딧으로 전환하는 구조를 준비 중이에요.</p>
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">오늘 적립 포인트: {todayPoints}P · 전환 가능 예상: {Math.floor(todayPoints / POINTS_PER_CREDIT)}크레딧</div>
              <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-500">{getImageCreditPolicyText()}</p>
              <button type="button" disabled className="mt-4 min-h-11 w-full cursor-not-allowed rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-400">전환 기능 준비 중</button>
            </article>
            <div className="grid gap-3">
              {rewardOrder.map((action) => {
                const reward = rewardDefinitions[action];
                const state = canClaimReward(action, logs);
                const claimed = !state.ok;
                return (
                  <article key={action} className={`rounded-[28px] p-5 shadow-sm ring-1 transition ${claimed ? "bg-slate-50 ring-slate-100" : "bg-white ring-blue-100 active:scale-[0.99]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-950">{reward.label}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{reward.description}</p>
                        <p className="mt-2 text-xs font-black text-blue-600">+{reward.points}포인트 {reward.credit > 0 ? `· +${reward.credit}크레딧` : ""}</p>
                      </div>
                      {claimed ? <CheckCircle2 className="shrink-0 text-blue-300" size={24} /> : <Sparkles className="shrink-0 animate-pulse text-blue-600" size={24} />}
                    </div>
                    <button type="button" onClick={() => claim(action)} disabled={!state.ok || claiming === action} className="mt-4 min-h-11 w-full rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition active:scale-[0.99] disabled:bg-slate-100 disabled:text-slate-400">
                      {claiming === action ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> {action === "watch_ad" && adCountdown > 0 ? `${adCountdown}초 남음` : "받는 중"}</span> : state.ok ? action === "watch_ad" && !adReady ? "광고 보고 보상 받기" : "보상 받기" : state.reason}
                    </button>
                    {action === "watch_ad" && <p className="mt-2 text-center text-[11px] font-bold text-slate-400">광고를 끝까지 보면 보상이 지급돼요. 실제 SDK 연결 지점은 이 버튼 흐름입니다.</p>}
                  </article>
                );
              })}
            </div>

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-black text-slate-950">최근 받은 보상</h2>
              <div className="mt-3 grid gap-2">
                {rewardLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    <span>{rewardDefinitions[log.action.replace("reward_", "") as RewardAction]?.label || log.action}</span>
                    <span className="text-blue-600">+{Math.abs(log.amount)}</span>
                  </div>
                ))}
                {rewardLogs.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">오늘 받은 보상이 아직 없어요.</p>}
              </div>
            </article>
          </div>
        )}
        {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
      </section>
    </PageShell>
  );
}





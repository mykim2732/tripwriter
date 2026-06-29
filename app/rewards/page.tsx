"use client";

import { CheckCircle2, Gift, Loader2, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import { AdSlot } from "@/components/AdSlot";
import { browserSupabase } from "@/lib/supabase";
import { POINTS_PER_CREDIT, canClaimReward, claimReward, getRewardSummary, getTodayRewardPoints, rewardDefinitions, type RewardAction } from "@/lib/rewards";
import type { CreditLog, Profile } from "@/lib/credits";

const rewardOrder: RewardAction[] = ["watch_ad", "daily_checkin", "complete_profile", "add_writing_style", "first_publish", "invite_friend"];

export default function RewardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<RewardAction | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const rewardLogs = useMemo(() => logs.filter((log) => log.action.startsWith("reward_")), [logs]);
  const watchAdCount = rewardLogs.filter((log) => log.action === "reward_watch_ad").length;
  const remainingAds = Math.max(0, 8 - watchAdCount);
  const todayPoints = getTodayRewardPoints(logs);

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

  async function claim(action: RewardAction) {
    setClaiming(action);
    setMessage("");
    try {
      const result = await claimReward(action);
      setMessage(result.amount > 0 ? `${rewardDefinitions[action].label} 보상으로 ${result.amount}크레딧을 받았어요.` : `${rewardDefinitions[action].label} 보상 ${result.points}포인트가 기록됐어요.`);
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
          <p className="text-sm font-bold text-blue-600">Posty AI Rewards</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Reward Center</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Earn extra AI credits from check-ins, creator missions, and beta ad rewards.</p>
          <Link href="/pricing" className="mt-3 inline-flex rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">View pricing plans</Link>
        </div>

        {loading && <LoadingCard title="Loading rewards" description="Checking your credit balance and today's reward history." />}
        {!loading && error && <ErrorCard title="Rewards unavailable" message={error} action={<Link href="/login" className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">Log in</Link>} />}
        {!loading && !error && (
          <div className="space-y-4">
            <article className="overflow-hidden rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-3xl bg-white/15"><Gift size={28} /></div>
                <div>
                  <h2 className="text-2xl font-black">{profile?.credits ?? 0} credits</h2>
                  <p className="mt-1 text-sm font-bold text-blue-100">Today claimed: {rewardLogs.length} rewards</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-blue-50">오늘 광고 가능 횟수: {remainingAds}/8 · 오늘 적립 {todayPoints}포인트</div>
            </article>

            <AdSlot type="reward_video" title="리워드 광고 준비" description="광고 4회 시청 = 1크레딧 상당입니다. 실제 SDK 연결 전까지는 mock 보상으로 흐름을 테스트합니다." />

            <div className="grid gap-3">
              {rewardOrder.map((action) => {
                const reward = rewardDefinitions[action];
                const state = canClaimReward(action, logs);
                const claimed = !state.ok;
                return (
                  <article key={action} className={`rounded-3xl p-5 shadow-sm ring-1 ${claimed ? "bg-slate-50 ring-slate-100" : "bg-white ring-blue-100"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-950">{reward.label}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{reward.description}</p>
                        <p className="mt-2 text-xs font-black text-blue-600">+{reward.points}포인트 {reward.credit > 0 ? `· +${reward.credit}크레딧` : ""}</p>
                      </div>
                      {claimed ? <CheckCircle2 className="shrink-0 text-slate-300" size={22} /> : <Sparkles className="shrink-0 text-blue-600" size={22} />}
                    </div>
                    <button type="button" onClick={() => claim(action)} disabled={!state.ok || claiming === action} className="mt-4 min-h-11 w-full rounded-2xl bg-blue-600 px-4 text-sm font-black text-white transition active:scale-[0.99] disabled:bg-slate-100 disabled:text-slate-400">
                      {claiming === action ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Claiming</span> : state.ok ? "Claim reward" : state.reason}
                    </button>
                  </article>
                );
              })}
            </div>

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-black text-slate-950">Recent reward history</h2>
              <div className="mt-3 grid gap-2">
                {rewardLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    <span>{rewardDefinitions[log.action.replace("reward_", "") as RewardAction]?.label || log.action}</span>
                    <span className="text-blue-600">+{Math.abs(log.amount)}</span>
                  </div>
                ))}
                {rewardLogs.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">No rewards claimed today yet.</p>}
              </div>
            </article>
          </div>
        )}
        {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
      </section>
    </PageShell>
  );
}



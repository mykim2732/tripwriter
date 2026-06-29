"use client";

import { Gift, Loader2, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import { browserSupabase } from "@/lib/supabase";
import { canClaimReward, claimReward, getRewardSummary, rewardDefinitions, type RewardAction } from "@/lib/rewards";
import type { CreditLog, Profile } from "@/lib/credits";

const rewardOrder: RewardAction[] = ["watch_ad", "daily_checkin", "complete_profile", "add_writing_style", "first_publish", "invite_friend"];

export default function RewardsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<RewardAction | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      setMessage(`${rewardDefinitions[action].label} added ${result.amount} credit.`);
      await load();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not claim this reward.");
    } finally {
      setClaiming("");
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Rewards</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Reward Center</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Earn extra AI credits through check-ins, profile setup, writing style memory, and future ad rewards.</p>
        </div>

        {loading && <LoadingCard title="Loading rewards" description="Checking your credit balance and today's reward history." />}
        {!loading && error && <ErrorCard title="Rewards unavailable" message={error} action={<Link href="/login" className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">Log in</Link>} />}
        {!loading && !error && (
          <div className="space-y-4">
            <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Gift size={25} /></div>
                <div>
                  <h2 className="text-lg font-black">{profile?.credits ?? 0} credits left</h2>
                  <p className="mt-1 text-sm font-bold text-blue-100">Rewards claimed today: {logs.filter((log) => log.action.startsWith("reward_")).length}</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><PlayCircle size={25} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-950">Ad reward SDK coming soon</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">For beta testing, the mock ad reward button grants credits with the same daily limit logic.</p>
                </div>
              </div>
            </article>

            <div className="grid gap-3">
              {rewardOrder.map((action) => {
                const reward = rewardDefinitions[action];
                const state = canClaimReward(action, logs);
                return (
                  <article key={action} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black text-slate-950">{reward.label}</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{reward.description}</p>
                        <p className="mt-2 text-xs font-black text-blue-600">+{reward.credit} credit</p>
                      </div>
                      <Sparkles className="shrink-0 text-blue-600" size={22} />
                    </div>
                    <button type="button" onClick={() => claim(action)} disabled={!state.ok || claiming === action} className="mt-4 min-h-11 w-full rounded-2xl bg-blue-600 px-4 text-sm font-black text-white disabled:bg-slate-100 disabled:text-slate-400">
                      {claiming === action ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Claiming</span> : state.ok ? "Claim reward" : state.reason}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        )}
        {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
      </section>
    </PageShell>
  );
}

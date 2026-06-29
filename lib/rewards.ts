
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureProfile, type CreditLog, type Profile } from "@/lib/credits";
import { browserSupabase } from "@/lib/supabase";

export type RewardAction = "daily_checkin" | "watch_ad" | "complete_profile" | "add_writing_style" | "first_publish" | "invite_friend";
export const rewardDefinitions: Record<RewardAction, { label: string; credit: number; dailyLimit?: number; description: string; ready?: boolean }> = {
  daily_checkin: { label: "Daily check-in", credit: 1, dailyLimit: 1, description: "Visit once a day and receive 1 credit." },
  watch_ad: { label: "Watch an ad", credit: 1, dailyLimit: 2, description: "Mock ad reward until the ad SDK is connected." },
  complete_profile: { label: "Complete profile", credit: 1, description: "Receive 1 credit after completing your profile." },
  add_writing_style: { label: "Add writing style", credit: 1, description: "Receive 1 credit after saving your first writing style." },
  first_publish: { label: "First publish", credit: 2, description: "Receive 2 credits after marking your first content as published." },
  invite_friend: { label: "Invite friend", credit: 3, description: "Invite rewards are coming soon.", ready: false },
};
export type RewardSummary = { todayLogs: CreditLog[]; profile: Profile | null };
export async function getRewardSummary(client?: SupabaseClient): Promise<RewardSummary> { const supabase = client || browserSupabase.client; const profile = await ensureProfile(undefined, supabase); if (!profile) return { profile: null, todayLogs: [] }; const { data, error } = await supabase.from("credit_logs").select("*").eq("user_id", profile.id).gte("created_at", startOfDay()).order("created_at", { ascending: false }); if (error) throw error; return { profile, todayLogs: (data || []) as CreditLog[] }; }
export function canClaimReward(action: RewardAction, logs: CreditLog[]) { const definition = rewardDefinitions[action]; if (definition.ready === false) return { ok: false, reason: "Coming soon." }; const actionLogs = logs.filter((log) => log.action === `reward_${action}`); if (definition.dailyLimit && actionLogs.length >= definition.dailyLimit) return { ok: false, reason: "Daily limit reached." }; if (!definition.dailyLimit && actionLogs.length > 0) return { ok: false, reason: "Already claimed." }; return { ok: true, reason: "Available." }; }
export async function claimReward(action: RewardAction, client?: SupabaseClient) { const supabase = client || browserSupabase.client; const { profile, todayLogs } = await getRewardSummary(supabase); if (!profile) throw new Error("Please log in to claim rewards."); const claimable = canClaimReward(action, todayLogs); if (!claimable.ok) throw new Error(claimable.reason); const definition = rewardDefinitions[action]; const nextCredits = (profile.credits || 0) + definition.credit; const { error: updateError } = await supabase.from("profiles").update({ credits: nextCredits }).eq("id", profile.id); if (updateError) throw updateError; const { error: logError } = await supabase.from("credit_logs").insert({ user_id: profile.id, action: `reward_${action}`, amount: definition.credit, balance_after: nextCredits, memo: definition.label }); if (logError) throw logError; return { credits: nextCredits, amount: definition.credit }; }
function startOfDay() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); }

import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureProfile, type CreditLog, type Profile } from "@/lib/credits";
import { browserSupabase } from "@/lib/supabase";

export type RewardAction = "daily_checkin" | "watch_ad" | "complete_profile" | "add_writing_style" | "first_publish" | "invite_friend";
export type RewardDefinition = { label: string; credit: number; points: number; dailyLimit?: number; description: string; ready?: boolean };

export const POINTS_PER_CREDIT = 4;

export const rewardDefinitions: Record<RewardAction, RewardDefinition> = {
  daily_checkin: { label: "출석 체크", credit: 0, points: 1, dailyLimit: 1, description: "출석 1회는 1포인트로 기록됩니다. 포인트 전환은 준비 중입니다." },
  watch_ad: { label: "광고 보기", credit: 0, points: 1, dailyLimit: 8, description: "광고 4회 시청으로 AI 글 생성 1회에 해당하는 1크레딧을 준비합니다." },
  complete_profile: { label: "프로필 완성", credit: 0, points: 2, description: "프로필 완성 보상은 0.5크레딧 상당의 2포인트입니다." },
  add_writing_style: { label: "내 말투 등록", credit: 0, points: 2, description: "내 말투 등록 보상은 0.5크레딧 상당의 2포인트입니다." },
  first_publish: { label: "첫 발행 완료", credit: 1, points: 4, description: "첫 발행을 완료하면 1크레딧을 지급합니다." },
  invite_friend: { label: "친구 초대", credit: 1, points: 4, description: "친구 초대 수락 시 1크레딧 지급 예정입니다.", ready: false },
};

export type RewardSummary = { todayLogs: CreditLog[]; profile: Profile | null };

export async function getRewardSummary(client?: SupabaseClient): Promise<RewardSummary> {
  const supabase = client || browserSupabase.client;
  const profile = await ensureProfile(undefined, supabase);
  if (!profile) return { profile: null, todayLogs: [] };
  const { data, error } = await supabase.from("credit_logs").select("*").eq("user_id", profile.id).gte("created_at", startOfDay()).order("created_at", { ascending: false });
  if (error) throw error;
  return { profile, todayLogs: (data || []) as CreditLog[] };
}

export function canClaimReward(action: RewardAction, logs: CreditLog[]) {
  const definition = rewardDefinitions[action];
  if (definition.ready === false) return { ok: false, reason: "준비 중" };
  const actionLogs = logs.filter((log) => log.action === `reward_${action}`);
  if (definition.dailyLimit && actionLogs.length >= definition.dailyLimit) return { ok: false, reason: "오늘 한도 완료" };
  if (!definition.dailyLimit && actionLogs.length > 0) return { ok: false, reason: "이미 받음" };
  return { ok: true, reason: "받을 수 있음" };
}

export function getTodayRewardPoints(logs: CreditLog[]) {
  return logs.filter((log) => log.action.startsWith("reward_")).reduce((sum, log) => {
    const action = log.action.replace("reward_", "") as RewardAction;
    return sum + (rewardDefinitions[action]?.points || Math.max(0, log.amount * POINTS_PER_CREDIT));
  }, 0);
}

export async function claimReward(action: RewardAction, client?: SupabaseClient) {
  const supabase = client || browserSupabase.client;
  const { profile, todayLogs } = await getRewardSummary(supabase);
  if (!profile) throw new Error("로그인 후 리워드를 받을 수 있어요.");
  const claimable = canClaimReward(action, todayLogs);
  if (!claimable.ok) throw new Error(claimable.reason);
  const definition = rewardDefinitions[action];
  const nextCredits = (profile.credits || 0) + definition.credit;
  if (definition.credit > 0) {
    const { error: updateError } = await supabase.from("profiles").update({ credits: nextCredits }).eq("id", profile.id);
    if (updateError) throw updateError;
  }
  const { error: logError } = await supabase.from("credit_logs").insert({ user_id: profile.id, action: `reward_${action}`, amount: definition.credit, balance_after: nextCredits, memo: `${definition.label} · ${definition.points}포인트` });
  if (logError) throw logError;
  return { credits: nextCredits, amount: definition.credit, points: definition.points };
}

function startOfDay() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

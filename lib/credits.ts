import type { SupabaseClient, User } from "@supabase/supabase-js";
import { browserSupabase } from "@/lib/supabase";

export const FREE_CREDITS = 5;

export const CREDIT_COSTS = {
  generatePost: 1,
  polishPost: 1,
  analyzePhotos: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS | "signup" | "manual" | "generateTitles";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: "free" | "pro" | "creator" | string;
  credits: number;
  avatar_url?: string | null;
  bio?: string | null;
  provider?: string | null;
  content_fields?: string[] | null;
  preferred_tone?: string | null;
  role?: "user" | "admin" | string;
  onboarding_completed?: boolean | null;
  profile_completed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditLog = {
  id: string;
  user_id: string;
  action: string;
  amount: number;
  balance_after: number;
  memo: string | null;
  created_at: string;
};

export const plans = [
  {
    name: "Free",
    price: "0원",
    description: "로그인하면 AI 콘텐츠 제작을 5회 체험할 수 있어요.",
    credits: "5회",
    features: ["AI 글 생성", "기본 저장함", "복사해서 발행"],
  },
  {
    name: "Pro",
    price: "월 6,900원 예정",
    description: "꾸준히 블로그와 리뷰 콘텐츠를 만드는 사용자용 플랜입니다.",
    credits: "월 100회",
    features: ["사진 분석", "AI 디자인", "발행 준비", "블로그/리뷰"],
  },
  {
    name: "Creator",
    price: "월 12,900원 예정",
    description: "여러 플랫폼과 상세페이지까지 운영하는 크리에이터용 플랜입니다.",
    credits: "월 300회",
    features: ["상세페이지", "다중 플랫폼", "고급 사진 꾸미기", "우선 기능"],
  },
];

export function getCreditCostLabel(kind: keyof typeof CREDIT_COSTS) {
  return `${CREDIT_COSTS[kind]} 크레딧`;
}

function createPostyNickname(userId: string) {
  const prefixes = ["Posty", "포스티작가", "콘텐츠메이커", "블로그메이커", "리뷰크리에이터"];
  const numberSeed = Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const suffix = String((numberSeed % 1000000) + 1).padStart(6, "0");
  return `${prefixes[numberSeed % prefixes.length]}${suffix}`;
}

function getUserDisplayName(currentUser: User) {
  const metadata = currentUser.user_metadata || {};
  const fromMetadata =
    typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : typeof metadata.full_name === "string" && metadata.full_name.trim()
        ? metadata.full_name.trim()
        : typeof metadata.preferred_username === "string" && metadata.preferred_username.trim()
          ? metadata.preferred_username.trim()
          : "";

  return fromMetadata || createPostyNickname(currentUser.id);
}
export async function ensureProfile(user?: User | null, client?: SupabaseClient) {
  const supabase = client || browserSupabase.client;
  const currentUser = user || (await supabase.auth.getUser()).data.user;

  if (!currentUser) return null;

  const email = currentUser.email || null;
  const displayName = getUserDisplayName(currentUser);

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) {
    const profile = existing as Profile;
    const provider = currentUser.app_metadata?.provider ? String(currentUser.app_metadata.provider) : profile.provider || "email";
    if (!profile.display_name || !profile.provider) {
      const { data, error } = await supabase
        .from("profiles")
        .update({ display_name: profile.display_name || displayName, provider })
        .eq("id", currentUser.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Profile;
    }
    return profile;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: currentUser.id,
      email,
      display_name: displayName,
      provider: currentUser.app_metadata?.provider ? String(currentUser.app_metadata.provider) : "email",
      plan: "free",
      credits: FREE_CREDITS,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}


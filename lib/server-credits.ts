import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { CREDIT_COSTS, ensureProfile, type CreditAction, type Profile } from "@/lib/credits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type CreditSuccess = {
  ok: true;
  guest: boolean;
  user: User | null;
  profile: Profile | null;
  headers: Record<string, string>;
};

type CreditFailure = {
  ok: false;
  response: NextResponse;
};

export type CreditResult = CreditSuccess | CreditFailure;

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

function createAuthedClient(token: string): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 연결 정보가 비어 있습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function consumeApiCredit(request: NextRequest, action: keyof typeof CREDIT_COSTS, memo: string): Promise<CreditResult> {
  const cost = CREDIT_COSTS[action];
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: true,
      guest: true,
      user: null,
      profile: null,
      headers: {
        "x-tripwriter-credit-mode": "guest",
        "x-tripwriter-credit-cost": String(cost),
      },
    };
  }

  try {
    const supabase = createAuthedClient(token);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return {
        ok: false,
        response: NextResponse.json({ message: "로그인이 만료되었어요. 다시 로그인한 뒤 시도해주세요." }, { status: 401 }),
      };
    }

    const profile = await ensureProfile(userData.user, supabase);
    if (!profile) {
      return {
        ok: false,
        response: NextResponse.json({ message: "프로필을 준비하지 못했어요. 잠시 후 다시 시도해주세요." }, { status: 500 }),
      };
    }

    if (profile.credits < cost) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "무료 크레딧을 모두 사용했어요. 리워드 센터에서 1크레딧을 받거나 요금제를 확인해주세요.", code: "CREDIT_EMPTY", actions: ["rewards", "pricing"] },
          { status: 402 },
        ),
      };
    }

    const nextBalance = profile.credits - cost;
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ credits: nextBalance })
      .eq("id", userData.user.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const { error: logError } = await supabase.from("credit_logs").insert({
      user_id: userData.user.id,
      action,
      amount: -cost,
      balance_after: nextBalance,
      memo,
    });

    if (logError) console.error("Credit log insert failed", logError);

    return {
      ok: true,
      guest: false,
      user: userData.user,
      profile: updatedProfile as Profile,
      headers: {
        "x-tripwriter-credit-mode": "authenticated",
        "x-tripwriter-credit-cost": String(cost),
        "x-tripwriter-credit-balance": String(nextBalance),
      },
    };
  } catch (error) {
    console.error("Credit consumption failed", error);
    return {
      ok: false,
      response: NextResponse.json(
        { message: error instanceof Error ? `크레딧 처리 실패: ${error.message}` : "크레딧 처리 중 문제가 생겼어요." },
        { status: 500 },
      ),
    };
  }
}

export function freeCreditLogHeaders(action: CreditAction) {
  return {
    "x-tripwriter-credit-action": action,
  };
}


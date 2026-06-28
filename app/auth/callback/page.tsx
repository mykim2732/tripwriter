"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ensureProfile } from "@/lib/credits";
import { browserSupabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="로그인 정보를 확인하고 있어요." />}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("소셜 로그인 정보를 확인하고 있어요.");

  useEffect(() => {
    let active = true;

    async function completeOAuth() {
      try {
        const supabase = browserSupabase.client;
        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/account";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          await supabase.auth.getSession();
        }

        if (!active) return;
        setMessage("로그인이 완료됐어요. 계정 화면으로 이동합니다.");
        window.setTimeout(() => {
          router.replace(next.startsWith("/") ? next : "/account");
          router.refresh();
        }, 500);
      } catch (error) {
        console.error("OAuth callback failed", error);
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "소셜 로그인 처리 중 문제가 생겼어요.");
      }
    }

    void completeOAuth();
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return <CallbackShell message={message} />;
}

function CallbackShell({ message }: { message: string }) {
  return (
    <PageShell>
      <section className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="w-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Loader2 className="animate-spin" size={26} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-950">로그인 처리 중</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{message}</p>
        </div>
      </section>
    </PageShell>
  );
}

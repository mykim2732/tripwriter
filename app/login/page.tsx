"use client";

import { Loader2, Mail, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { browserSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setMessage("");

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상으로 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      const supabase = browserSupabase.client;
      const result = mode === "signup"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) throw result.error;

      if (mode === "signup" && !result.data.session) {
        setMessage("회원가입 메일을 확인해주세요. 이메일 인증 후 로그인할 수 있어요.");
        return;
      }

      setMessage(mode === "signup" ? "회원가입과 로그인이 완료됐어요." : "로그인됐어요.");
      router.push("/account");
      router.refresh();
    } catch (submitError) {
      console.error("Supabase auth failed", submitError);
      setError(submitError instanceof Error ? submitError.message : "로그인 처리 중 문제가 생겼어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-7">
          <p className="text-sm font-bold text-blue-600">TripWriter Account</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">로그인</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            로그인하면 무료 크레딧 5개와 내 콘텐츠 저장함을 더 안정적으로 사용할 수 있어요.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
            <button type="button" onClick={() => setMode("login")} className={`min-h-11 rounded-xl text-sm font-black ${mode === "login" ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>로그인</button>
            <button type="button" onClick={() => setMode("signup")} className={`min-h-11 rounded-xl text-sm font-black ${mode === "signup" ? "bg-white text-blue-700 shadow-sm" : "text-slate-400"}`}>회원가입</button>
          </div>

          <label className="mt-5 block">
            <span className="text-xs font-black text-slate-400">이메일</span>
            <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-blue-200">
              <Mail size={18} className="text-slate-400" aria-hidden="true" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none" />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-black text-slate-400">비밀번호</span>
            <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-blue-200">
              <LockKeyhole size={18} className="text-slate-400" aria-hidden="true" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6자 이상" className="h-12 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none" />
            </div>
          </label>

          {error && <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-700">{error}</div>}
          {message && <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">{message}</div>}

          <Button type="button" onClick={submit} disabled={loading} className="mt-5 disabled:opacity-60">
            {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> 처리 중</span> : mode === "login" ? "로그인하기" : "회원가입하기"}
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

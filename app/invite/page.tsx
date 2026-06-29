"use client";

import { Copy, Gift, Share2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { browserSupabase } from "@/lib/supabase";

export default function InvitePage() {
  const [userId, setUserId] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    browserSupabase.client.auth.getUser().then(({ data }) => setUserId(data.user?.id || "guest"));
  }, []);

  const inviteCode = useMemo(() => createInviteCode(userId), [userId]);
  const inviteLink = typeof window === "undefined" ? "" : `${window.location.origin}/login?ref=${inviteCode}`;

  async function copy(value: string, message: string) {
    await navigator.clipboard.writeText(value);
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Invite</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">친구 초대</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">친구가 가입하면 1크레딧 지급 예정입니다. 실제 지급은 추천 추적 연결 후 활성화됩니다.</p>
        </div>

        <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Gift size={25} /></div>
            <div>
              <h2 className="text-lg font-black">초대 코드</h2>
              <p className="mt-1 text-2xl font-black tracking-wide">{inviteCode}</p>
            </div>
          </div>
        </article>

        <div className="mt-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <p className="text-xs font-black text-slate-400">초대 링크</p>
            <p className="mt-2 break-all rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{inviteLink}</p>
          </div>
          <button type="button" onClick={() => copy(inviteLink, "초대 링크를 복사했어요.")} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"><Copy size={17} /> 링크 복사</button>
          <button type="button" onClick={() => copy(inviteCode, "초대 코드를 복사했어요.")} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700"><Share2 size={17} /> 코드 복사</button>
        </div>

        <article className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserPlus size={24} /></div>
            <div>
              <h2 className="text-base font-black text-slate-950">추천 리워드 준비 중</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">profiles.referral_code와 추천 수락 로그는 다음 DB 확장 시 연결할 예정입니다. 현재는 초대 링크 공유 UX를 먼저 테스트합니다.</p>
            </div>
          </div>
        </article>

        {toast && <p className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white">{toast}</p>}
      </section>
    </PageShell>
  );
}

function createInviteCode(userId: string) {
  const source = userId || "guest";
  const sum = Array.from(source).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `POSTY${String(sum % 1000000).padStart(6, "0")}`;
}

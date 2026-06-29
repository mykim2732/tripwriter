"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import type { Profile } from "@/lib/credits";
import { contentFieldOptions, getCurrentProfile, toneOptions, updateProfile } from "@/lib/profile";
import { browserSupabase } from "@/lib/supabase";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [tone, setTone] = useState("담백하게");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await browserSupabase.client.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const nextProfile = await getCurrentProfile();
      setProfile(nextProfile);
      setDisplayName(nextProfile?.display_name || "");
      setFields(nextProfile?.content_fields || []);
      setTone(nextProfile?.preferred_tone || "담백하게");
      setLoading(false);
    }
    void load();
  }, [router]);

  function toggleField(field: string) {
    setFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  }

  async function complete() {
    setSaving(true);
    await updateProfile({
      display_name: displayName.trim() || profile?.display_name || "Posty Creator",
      content_fields: fields,
      preferred_tone: tone,
      onboarding_completed: true,
      profile_completed_at: new Date().toISOString(),
    });
    router.replace("/dashboard");
    router.refresh();
  }

  if (loading) {
    return <PageShell><section className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={30} /></section></PageShell>;
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Onboarding</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">내 스타일 설정</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">3단계만 설정하면 AI가 더 빠르게 내 콘텐츠 스타일을 맞춰요.</p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex gap-2">
            {[1, 2, 3].map((item) => <span key={item} className={`h-2 flex-1 rounded-full ${step >= item ? "bg-blue-600" : "bg-slate-100"}`} />)}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-black text-slate-950">닉네임을 확인해주세요</h2>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-4 h-12 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-black text-slate-950">주로 만들 콘텐츠는?</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {contentFieldOptions.map((field) => <button key={field} type="button" onClick={() => toggleField(field)} className={`rounded-full px-3 py-2 text-xs font-black ${fields.includes(field) ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"}`}>{field}</button>)}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-black text-slate-950">선호 말투</h2>
              <select value={tone} onChange={(event) => setTone(event.target.value)} className="mt-4 h-12 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">
                {toneOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => router.replace("/dashboard")} className="min-h-12 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-500">나중에</button>
            {step < 3 ? <Button type="button" onClick={() => setStep((current) => current + 1)}>다음</Button> : <Button type="button" onClick={complete} disabled={saving}>{saving ? "저장 중" : <span className="inline-flex items-center gap-2">완료 <ArrowRight size={17} /></span>}</Button>}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

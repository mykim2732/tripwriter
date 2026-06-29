"use client";

import { Camera, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import type { Profile } from "@/lib/credits";
import { contentFieldOptions, getCurrentProfile, toneOptions, updateProfile, uploadProfileImage } from "@/lib/profile";
import { browserSupabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await browserSupabase.client.auth.getUser();
        if (!data.user) {
          router.replace("/login");
          return;
        }
        const nextProfile = await getCurrentProfile();
        setProfile(nextProfile);
        setDisplayName(nextProfile?.display_name || "");
        setBio(nextProfile?.bio || "");
        setAvatarUrl(nextProfile?.avatar_url || null);
        setFields(nextProfile?.content_fields || []);
        setTone(nextProfile?.preferred_tone || "담백하게");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "프로필을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  async function onImageChange(file?: File) {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const url = await uploadProfileImage(file);
      setAvatarUrl(url);
      setMessage("프로필 사진을 업로드했어요. 저장 버튼을 눌러 반영해주세요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "프로필 사진 업로드에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  function toggleField(field: string) {
    setFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateProfile({
        display_name: displayName.trim() || profile?.display_name || "Posty Creator",
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        content_fields: fields,
        preferred_tone: tone,
        onboarding_completed: true,
        profile_completed_at: new Date().toISOString(),
      });
      setProfile(updated);
      setMessage("프로필을 저장했어요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "프로필 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Profile</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">프로필 설정</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">닉네임, 사진, 콘텐츠 분야, 선호 말투를 설정하면 AI가 더 내 스타일에 맞게 도와줘요.</p>
        </div>

        {loading && <LoadingCard title="프로필을 불러오는 중" description="계정 정보를 확인하고 있어요." />}
        {!loading && error && <ErrorCard title="프로필 오류" message={error} />}

        {!loading && !error && (
          <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl bg-blue-50 text-blue-600">
                {avatarUrl ? <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-black">P</div>}
              </div>
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-black text-blue-700">
                <Camera size={17} /> 사진 업로드
                <input type="file" accept="image/*" className="hidden" onChange={(event) => onImageChange(event.target.files?.[0])} />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-black text-slate-400">닉네임</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 h-12 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" />
            </label>

            <label className="block">
              <span className="text-xs font-black text-slate-400">자기소개</span>
              <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="어떤 콘텐츠를 만드는 사람인지 적어주세요." className="mt-2 min-h-24 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" />
            </label>

            <div>
              <p className="text-xs font-black text-slate-400">주 콘텐츠 분야</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {contentFieldOptions.map((field) => (
                  <button key={field} type="button" onClick={() => toggleField(field)} className={`rounded-full px-3 py-2 text-xs font-black ${fields.includes(field) ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"}`}>{field}</button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-black text-slate-400">선호 말투</span>
              <select value={tone} onChange={(event) => setTone(event.target.value)} className="mt-2 h-12 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">
                {toneOptions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
            <Button type="button" onClick={save} disabled={saving} className="disabled:opacity-60">
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> 저장 중</span> : <span className="inline-flex items-center gap-2"><Save size={18} /> 프로필 저장</span>}
            </Button>
          </div>
        )}
      </section>
    </PageShell>
  );
}

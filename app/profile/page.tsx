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
import type { WatermarkProfile } from "@/types/editor";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [tone, setTone] = useState("");
  const [watermark, setWatermark] = useState<WatermarkProfile>({
    name: "",
    imageUrl: "",
    position: "bottom-right",
    opacity: 60,
    size: "medium",
    scope: "all",
  });
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
        try {
          const storedWatermark = window.localStorage.getItem("posty-watermark-profile");
          if (storedWatermark) setWatermark((current) => ({ ...current, ...JSON.parse(storedWatermark) }));
        } catch {
          // Local watermark is optional and should never block profile loading.
        }
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

  async function onWatermarkChange(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"].includes(file.type)) {
      setError("png, jpg, jpeg, gif, webp 파일만 워터마크로 사용할 수 있어요.");
      return;
    }
    const imageUrl = await fileToDataUrl(file);
    setWatermark((current) => ({ ...current, imageUrl, name: current.name || file.name.replace(/\.[^.]+$/, "") }));
    setMessage("워터마크 이미지를 불러왔어요. 프로필 저장을 눌러 반영해주세요.");
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
      window.localStorage.setItem("posty-watermark-profile", JSON.stringify(watermark));
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

            <div className="rounded-3xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">내 워터마크</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">사진 위에 로고나 출처 이미지를 CSS 오버레이로 표시할 수 있어요.</p>
                </div>
                {watermark.imageUrl && <img src={watermark.imageUrl} alt="워터마크 미리보기" className="h-12 w-12 rounded-xl object-contain ring-1 ring-slate-200" />}
              </div>
              <div className="mt-3 grid gap-3">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                  <Camera size={17} /> 워터마크 업로드
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" className="hidden" onChange={(event) => onWatermarkChange(event.target.files?.[0])} />
                </label>
                <input value={watermark.name} onChange={(event) => setWatermark((current) => ({ ...current, name: event.target.value }))} placeholder="워터마크 이름" className="h-11 rounded-2xl bg-white px-3 text-sm font-bold text-slate-800 outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <Select label="위치" value={watermark.position} onChange={(value) => setWatermark((current) => ({ ...current, position: value as WatermarkProfile["position"] }))} options={[["top-left", "좌상단"], ["top-right", "우상단"], ["center", "중앙"], ["bottom-left", "좌하단"], ["bottom-right", "우하단"]]} />
                  <Select label="투명도" value={String(watermark.opacity)} onChange={(value) => setWatermark((current) => ({ ...current, opacity: Number(value) as WatermarkProfile["opacity"] }))} options={["20", "40", "60", "80", "100"].map((value) => [value, `${value}%`])} />
                  <Select label="크기" value={watermark.size} onChange={(value) => setWatermark((current) => ({ ...current, size: value as WatermarkProfile["size"] }))} options={[["small", "작게"], ["medium", "보통"], ["large", "크게"]]} />
                  <Select label="적용 범위" value={watermark.scope} onChange={(value) => setWatermark((current) => ({ ...current, scope: value as WatermarkProfile["scope"] }))} options={[["all", "모든 사진"], ["cover", "대표사진만"], ["selected", "선택 사진만"]]} />
                </div>
              </div>
            </div>

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

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-2xl bg-white px-3 text-xs font-black text-slate-700 outline-none">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("파일을 읽지 못했어요."));
    reader.readAsDataURL(file);
  });
}

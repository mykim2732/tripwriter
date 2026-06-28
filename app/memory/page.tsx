"use client";

import { Brain, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";

const storageKey = "posty-ai-memory-profile";

type MemoryProfile = {
  tone: string;
  cta: string;
  emojiLevel: string;
  favoriteDesign: string;
  referenceText: string;
};

const defaultProfile: MemoryProfile = {
  tone: "담백하지만 친근하게",
  cta: "댓글과 저장을 자연스럽게 유도",
  emojiLevel: "보통",
  favoriteDesign: "감성 다이어리",
  referenceText: "",
};

export default function MemoryPage() {
  const [profile, setProfile] = useState<MemoryProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      setProfile({ ...defaultProfile, ...JSON.parse(raw) });
    } catch {
      setProfile(defaultProfile);
    }
  }, []);

  function patch(partial: Partial<MemoryProfile>) {
    setProfile((current) => ({ ...current, ...partial }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">AI Memory</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">내 말투 학습</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">자주 쓰는 말투, CTA, 이모지, 디자인 취향을 저장해 다음 글의 기준으로 삼을 수 있게 준비했어요.</p>
        </div>

        <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Brain size={25} /></div>
            <div>
              <h2 className="text-base font-black">사용자 스타일 프로필</h2>
              <p className="mt-1 text-sm leading-6 text-blue-100">이번 Sprint에서는 브라우저에 저장하고, 다음 단계에서 로그인 계정별 Supabase 저장으로 확장할 수 있어요.</p>
            </div>
          </div>
        </article>

        <div className="mt-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <MemoryField label="기본 말투" value={profile.tone} onChange={(value) => patch({ tone: value })} />
          <MemoryField label="CTA 스타일" value={profile.cta} onChange={(value) => patch({ cta: value })} />
          <label className="block">
            <span className="text-xs font-black text-slate-400">이모지 빈도</span>
            <select value={profile.emojiLevel} onChange={(event) => patch({ emojiLevel: event.target.value })} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">
              <option>적게</option>
              <option>보통</option>
              <option>많게</option>
            </select>
          </label>
          <MemoryField label="선호 디자인" value={profile.favoriteDesign} onChange={(value) => patch({ favoriteDesign: value })} />
          <label className="block">
            <span className="text-xs font-black text-slate-400">기존 글 샘플</span>
            <textarea value={profile.referenceText} onChange={(event) => patch({ referenceText: event.target.value })} placeholder="내가 쓴 블로그 글이나 리뷰를 붙여넣어 주세요." className="mt-2 min-h-40 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" />
          </label>
          <button type="button" onClick={save} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
            <Save size={18} /> {saved ? "저장 완료" : "메모리 저장"}
          </button>
        </div>
      </section>
    </PageShell>
  );
}

function MemoryField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-400">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200" />
    </label>
  );
}

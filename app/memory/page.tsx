"use client";

import { Brain, Loader2, Save, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { getCurrentProfile } from "@/lib/profile";
import { getPlanLabel, getWritingStyleLimit } from "@/lib/plan-limits";
import type { Profile } from "@/lib/credits";

const memoryKey = "posty-ai-memory-profile";
const stylesKey = "posty-ai-writing-styles";

type MemoryProfile = { tone: string; cta: string; emojiLevel: string; favoriteDesign: string; referenceText: string };
type WritingStyle = {
  id: string;
  styleName: string;
  sampleText: string;
  toneSummary: string;
  sentenceStyle: string;
  vocabulary: string[];
  emojiStyle: string;
  paragraphStyle: string;
  titleStyle: string;
  ctaStyle: string;
  doRules: string[];
  dontRules: string[];
  createdAt: string;
};

const defaultProfile: MemoryProfile = {
  tone: "Warm and practical",
  cta: "Invite comments naturally",
  emojiLevel: "Medium",
  favoriteDesign: "Clean diary",
  referenceText: "",
};

export default function MemoryPage() {
  const [memoryProfile, setMemoryProfile] = useState<MemoryProfile>(defaultProfile);
  const [styles, setStyles] = useState<WritingStyle[]>([]);
  const [styleName, setStyleName] = useState("My writing style");
  const [sampleText, setSampleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [accountProfile, setAccountProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      setMemoryProfile({ ...defaultProfile, ...JSON.parse(window.localStorage.getItem(memoryKey) || "{}") });
    } catch {
      setMemoryProfile(defaultProfile);
    }
    try {
      setStyles(JSON.parse(window.localStorage.getItem(stylesKey) || "[]"));
    } catch {
      setStyles([]);
    }
  }, []);

  const maxStyles = useMemo(() => getWritingStyleLimit(accountProfile?.plan), [accountProfile?.plan]);
  const planLabel = getPlanLabel(accountProfile?.plan);

  function patch(partial: Partial<MemoryProfile>) {
    setMemoryProfile((current) => ({ ...current, ...partial }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem(memoryKey, JSON.stringify(memoryProfile));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  async function analyzeStyle() {
    if (!sampleText.trim()) {
      setMessage("Paste a sample text first.");
      return;
    }
    if (styles.length >= maxStyles) {
      setMessage(`${planLabel} plan can save ${maxStyles} writing style${maxStyles > 1 ? "s" : ""}. Visit Pricing to unlock more.`);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/analyze-writing-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleName, sampleText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not analyze this style.");
      const next: WritingStyle = { ...data, id: `style-${Date.now()}`, sampleText, createdAt: new Date().toISOString() };
      const nextStyles = [...styles, next];
      setStyles(nextStyles);
      window.localStorage.setItem(stylesKey, JSON.stringify(nextStyles));
      setMemoryProfile((current) => ({
        ...current,
        referenceText: sampleText,
        tone: data.toneSummary || current.tone,
        emojiLevel: data.emojiStyle || current.emojiLevel,
        cta: data.ctaStyle || current.cta,
      }));
      setSampleText("");
      setMessage("Writing style saved.");
      window.dispatchEvent(new Event("posty-writing-style-added"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this style.");
    } finally {
      setLoading(false);
    }
  }

  function removeStyle(id: string) {
    const next = styles.filter((style) => style.id !== id);
    setStyles(next);
    window.localStorage.setItem(stylesKey, JSON.stringify(next));
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">AI Memory</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">My voice</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Save your tone, CTA style, emoji habits, and favorite design direction so Posty AI can write closer to you.
          </p>
        </div>

        <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Brain size={25} /></div>
            <div>
              <h2 className="text-base font-black">Personal style memory</h2>
              <p className="mt-1 text-sm leading-6 text-blue-100">{planLabel} plan: {styles.length}/{maxStyles} writing styles saved.</p>
            </div>
          </div>
        </article>

        <div className="mt-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <MemoryField label="Tone" value={memoryProfile.tone} onChange={(value) => patch({ tone: value })} />
          <MemoryField label="CTA style" value={memoryProfile.cta} onChange={(value) => patch({ cta: value })} />
          <label className="block">
            <span className="text-xs font-black text-slate-400">Emoji level</span>
            <select value={memoryProfile.emojiLevel} onChange={(event) => patch({ emojiLevel: event.target.value })} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </label>
          <MemoryField label="Favorite design" value={memoryProfile.favoriteDesign} onChange={(value) => patch({ favoriteDesign: value })} />
          <button type="button" onClick={save} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
            <Save size={18} /> {saved ? "Saved" : "Save memory"}
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div>
            <div className="flex items-center justify-between gap-3"><h2 className="text-base font-black text-slate-950">Analyze a writing sample</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{styles.length}/{maxStyles}</span></div>
            <p className="mt-1 text-sm leading-6 text-slate-500">Paste a blog post, review, or SNS caption. Posty AI stores the style summary, not a copy of the text.</p>
          </div>
          <input value={styleName} onChange={(event) => setStyleName(event.target.value)} className="h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none" />
          <textarea value={sampleText} onChange={(event) => setSampleText(event.target.value)} placeholder="Paste a writing sample here. We will summarize tone, sentence flow, emoji habits, and CTA style." className="min-h-44 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none" />
          <button type="button" onClick={analyzeStyle} disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Analyze style
          </button>
          {message && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
        </div>

        <div className="mt-4 space-y-3">
          {styles.map((style) => (
            <article key={style.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-950">{style.styleName}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{style.toneSummary}</p>
                </div>
                <button type="button" onClick={() => removeStyle(style.id)} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-400">Remove</button>
              </div>
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500">
                <p>Sentence: {style.sentenceStyle}</p>
                <p>Emoji: {style.emojiStyle}</p>
                <p>CTA: {style.ctaStyle}</p>
              </div>
            </article>
          ))}
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




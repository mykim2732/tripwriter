"use client";

import { CheckCircle2, Clipboard, Image as ImageIcon, Link as LinkIcon, Tags } from "lucide-react";
import { useState } from "react";

export type PublishPackageItem = {
  key: string;
  label: string;
  value: string;
  icon?: "title" | "body" | "photos" | "tags" | "links" | "cta" | "captions";
};

type Props = {
  items: PublishPackageItem[];
  onCopy: (value: string, label: string) => void | Promise<void>;
  onCopyAll: () => void | Promise<void>;
  onMarkPublished: () => void | Promise<void>;
};

export function PublishPackageCard({ items, onCopy, onCopyAll, onMarkPublished }: Props) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">발행 패키지</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">발행에 필요한 요소를 한 번에 확인하고 항목별로 복사하세요.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">Package</span>
      </div>
      <div className="mt-4 grid gap-2">
        {items.filter((item) => item.value.trim()).map((item) => (
          <article key={item.key} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">{iconFor(item.icon)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-400">{item.label}</p>
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">{item.value}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={async () => { await onCopy(item.value, item.label); setDone((prev) => ({ ...prev, [item.key]: true })); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 text-xs font-black text-white"><Clipboard size={14} />복사</button>
              <button type="button" onClick={() => setDone((prev) => ({ ...prev, [item.key]: !prev[item.key] }))} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black ${done[item.key] ? "bg-blue-50 text-blue-700" : "bg-white text-slate-500"}`}><CheckCircle2 size={14} />{done[item.key] ? "완료" : "체크"}</button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onCopyAll} className="min-h-12 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">전체 복사</button>
        <button type="button" onClick={onMarkPublished} className="min-h-12 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">발행 완료</button>
      </div>
    </section>
  );
}

function iconFor(icon: PublishPackageItem["icon"]) {
  if (icon === "photos" || icon === "captions") return <ImageIcon size={18} />;
  if (icon === "tags") return <Tags size={18} />;
  if (icon === "links") return <LinkIcon size={18} />;
  return <Clipboard size={18} />;
}

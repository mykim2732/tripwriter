"use client";

import { ExternalLink } from "lucide-react";
import type { ReviewPreviewItem } from "@/types/editor";

type Props = {
  items: ReviewPreviewItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function ReviewPreviewCarousel({ items, selectedIds, onToggle }: Props) {
  if (!items.length) return null;

  return (
    <div className="mt-4 -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
      {items.slice(0, 5).map((item) => (
        <PreviewCard key={item.id} item={item} selected={selectedIds.includes(item.id)} onToggle={() => onToggle(item.id)} />
      ))}
    </div>
  );
}

function PreviewCard({ item, selected, onToggle }: { item: ReviewPreviewItem; selected: boolean; onToggle: () => void }) {
  return (
    <article className="min-w-[230px] snap-start rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">{item.sourceLabel}</span>
        {item.rating && <span className="text-xs font-black text-amber-500">★ {item.rating}</span>}
      </div>
      <p className="mt-3 line-clamp-3 min-h-14 text-sm font-bold leading-5 text-slate-800">{item.summary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.keywords.slice(0, 3).map((keyword) => (
          <span key={keyword} className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-blue-700">{keyword}</span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={onToggle} className={`min-h-9 flex-1 rounded-2xl px-3 text-xs font-black ${selected ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}>
          {selected ? "반영 중" : "글에 반영"}
        </button>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-500" aria-label="리뷰 출처 열기">
            <ExternalLink size={15} />
          </a>
        )}
      </div>
    </article>
  );
}

"use client";

import { ExportImageButton } from "@/components/ExportImageButton";

export type ThumbnailPlan = {
  headline: string;
  subText: string;
  badgeText: string;
  style: "minimal" | "diary" | "review" | "detail";
  overlayColor: string;
  accentColor: string;
  memoText: string;
  photoUrl: string;
  mode?: "ai" | "mock";
};

type Props = {
  plan: ThumbnailPlan;
  onCopy?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onDownloadError?: (message: string) => void;
};

export function ThumbnailStudio({ plan, onCopy, onSave, onDownload, onDownloadError }: Props) {
  const skin = getSkin(plan.style);

  return (
    <div className="mt-3 overflow-hidden rounded-3xl bg-slate-950 p-3 text-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800">
        <img src={plan.photoUrl} alt={plan.headline} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <div className={`absolute inset-0 ${skin.overlay}`} />
        <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black shadow-sm" style={{ backgroundColor: plan.accentColor, color: plan.overlayColor }}>
          {plan.badgeText}
        </div>
        {plan.mode === "mock" && <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700">mock preview</div>}
        <div className="absolute bottom-5 left-4 right-4">
          <p className={`mb-2 inline-flex rotate-[-2deg] rounded-2xl px-3 py-2 text-xs font-black shadow-sm ${skin.memo}`}>{plan.memoText}</p>
          <h3 className="text-2xl font-black leading-tight drop-shadow">{plan.headline}</h3>
          <p className="mt-1 text-sm font-bold text-white/85">{plan.subText}</p>
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 300" aria-hidden="true">
          <path d="M42 74 C88 48, 128 52, 166 70" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.92" />
          <path d="M306 76 l18 18 l34 -42" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
          <path d="M314 220 c22 -22 47 -22 62 0" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85" />
        </svg>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={onSave} className="min-h-10 rounded-2xl bg-white px-3 text-xs font-black text-slate-950">
          저장
        </button>
        <button type="button" onClick={onCopy} className="min-h-10 rounded-2xl bg-white px-3 text-xs font-black text-slate-950">
          복사
        </button>
        <ExportImageButton
          imageUrl={plan.photoUrl}
          fileName={`posty-thumbnail-${Date.now()}.png`}
          overlay={plan}
          onSuccess={onDownload}
          onError={onDownloadError}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl bg-white px-3 text-xs font-black text-slate-950 disabled:opacity-60"
        />
      </div>
    </div>
  );
}

function getSkin(style: ThumbnailPlan["style"]) {
  if (style === "diary") return { overlay: "bg-gradient-to-t from-rose-950/70 via-rose-900/10 to-white/10", memo: "bg-rose-50/95 text-rose-950" };
  if (style === "review") return { overlay: "bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent", memo: "bg-yellow-100 text-slate-950" };
  if (style === "detail") return { overlay: "bg-gradient-to-t from-blue-950/80 via-blue-900/15 to-transparent", memo: "bg-blue-50 text-blue-950" };
  return { overlay: "bg-gradient-to-t from-black/65 via-black/10 to-transparent", memo: "bg-white/90 text-slate-900" };
}

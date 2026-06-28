"use client";

export type ThumbnailPlan = {
  headline: string;
  subText: string;
  badgeText: string;
  style: "blog" | "review" | "detail" | "sns";
  overlayColor: string;
  accentColor: string;
  memoText: string;
  photoUrl: string;
};

type Props = {
  plan: ThumbnailPlan;
  onCopy?: () => void;
};

export function ThumbnailStudio({ plan, onCopy }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-3xl bg-slate-950 p-3 text-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-800">
        <img src={plan.photoUrl} alt={plan.headline} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black shadow-sm" style={{ backgroundColor: plan.accentColor, color: plan.overlayColor }}>
          {plan.badgeText}
        </div>
        <div className="absolute bottom-5 left-4 right-4">
          <p className="mb-2 inline-flex rotate-[-2deg] rounded-2xl bg-white/90 px-3 py-2 text-xs font-black text-slate-900 shadow-sm">{plan.memoText}</p>
          <h3 className="text-2xl font-black leading-tight drop-shadow">{plan.headline}</h3>
          <p className="mt-1 text-sm font-bold text-white/85">{plan.subText}</p>
        </div>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 400 300" aria-hidden="true">
          <path d="M42 74 C88 48, 128 52, 166 70" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.92" />
          <path d="M306 76 l18 18 l34 -42" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
          <path d="M314 220 c22 -22 47 -22 62 0" stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.85" />
        </svg>
      </div>
      <button type="button" onClick={onCopy} className="mt-3 min-h-10 w-full rounded-2xl bg-white px-3 text-sm font-black text-slate-950">
        썸네일 문구 복사
      </button>
    </div>
  );
}

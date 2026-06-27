import type { ReactNode } from "react";

type StatsCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  tone?: "blue" | "sky" | "slate" | "violet";
};

const toneClasses: Record<NonNullable<StatsCardProps["tone"]>, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  sky: "bg-sky-50 text-sky-700 ring-sky-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export function StatsCard({ label, value, description, icon, tone = "blue" }: StatsCardProps) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">{value}</p>
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}>
            {icon}
          </div>
        )}
      </div>
      {description && <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{description}</p>}
    </article>
  );
}

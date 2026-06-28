import { Loader2 } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export function LoadingCard({ title = "불러오는 중", description = "잠시만 기다려주세요." }: Props) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
      <Loader2 className="animate-spin text-blue-600" size={30} aria-hidden="true" />
      <p className="mt-4 text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

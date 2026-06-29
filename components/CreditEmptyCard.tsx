import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";

export function CreditEmptyCard({ message = "AI credits are not enough for this action." }: { message?: string }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Sparkles size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950">크레딧이 부족해요</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{message}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/rewards" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
          <Gift size={16} /> 리워드 받기
        </Link>
        <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700">
          요금제 보기
        </Link>
      </div>
    </article>
  );
}

export function isCreditError(message: string) {
  return /크레딧|credit|Pro 요금제|무료 크레딧/i.test(message);
}

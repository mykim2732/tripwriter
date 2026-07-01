import Link from "next/link";
import { CreditCard, Gift, PlayCircle, Sparkles } from "lucide-react";
import { getImageCreditPolicyText } from "@/lib/image-credit-policy";

export function CreditEmptyCard({ message = "AI credits are not enough for this action." }: { message?: string }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-blue-100">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Sparkles size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-slate-950">잠깐만 채우면 이어서 만들 수 있어요</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{normalizeCreditMessage(message)}</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{getImageCreditPolicyText()}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {["리워드 센터에서 무료 크레딧 받기", "필요하면 요금제로 한 번에 늘리기", "광고 리워드는 mock 상태에서 안내만 확인"].map((item) => (
          <p key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-600">{item}</p>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/rewards" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
          <Gift size={16} /> 무료로 채우기
        </Link>
        <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700">
          <CreditCard size={16} /> 업그레이드
        </Link>
        <Link href="/monetization" className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-black text-blue-700">
          <PlayCircle size={16} /> 광고 리워드 안내 보기
        </Link>
      </div>
    </article>
  );
}

function normalizeCreditMessage(message: string) {
  if (/AI credits are not enough/i.test(message)) {
    return "이번 AI 작업을 실행할 크레딧이 부족해요. 입력한 내용은 유지되니 크레딧을 채운 뒤 바로 다시 시도할 수 있어요.";
  }
  return message;
}

export function isCreditError(message: string) {
  return /크레딧|credit|Pro 요금제|무료 크레딧/i.test(message);
}

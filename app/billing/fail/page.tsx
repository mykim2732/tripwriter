import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export default function BillingFailPage() {
  return (
    <PageShell>
      <section className="px-5 pb-28 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600"><AlertCircle size={34} /></div>
        <h1 className="mt-5 text-3xl font-black text-slate-950">결제가 완료되지 않았어요</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">실제 결제 연결 전에는 이 화면을 실패/취소 fallback으로 사용합니다.</p>
        <Link href="/pricing" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">요금제 다시 보기</Link>
      </section>
    </PageShell>
  );
}

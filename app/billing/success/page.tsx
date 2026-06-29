import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export default function BillingSuccessPage() {
  return (
    <PageShell>
      <section className="px-5 pb-28 pt-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600"><CheckCircle2 size={34} /></div>
        <h1 className="mt-5 text-3xl font-black text-slate-950">결제 준비 완료</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">현재는 mock 결제 흐름입니다. Toss Payments 또는 Stripe 키를 연결하면 실제 결제 완료 화면으로 전환할 수 있어요.</p>
        <Link href="/account" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">계정으로 이동</Link>
      </section>
    </PageShell>
  );
}

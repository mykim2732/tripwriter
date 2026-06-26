import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";

export default function AccountPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">프로필</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            계정
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            로그인 기능은 Supabase Auth 기반으로 준비 중이에요.
          </p>
        </div>

        <div className="space-y-3">
          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShieldCheck size={25} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  Supabase Auth 연동 예정
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  이메일 로그인과 사용자별 저장함을 연결할 예정입니다.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <LockKeyhole size={24} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">
                  로그인 준비 중
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  현재 Sprint에서는 화면만 준비하고 실제 로그인은 연결하지 않습니다.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-6">
          <Button type="button" disabled className="cursor-not-allowed opacity-50">
            로그인 기능 준비 중
          </Button>
        </div>
      </section>
    </PageShell>
  );
}


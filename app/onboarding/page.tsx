import { ArrowRight, Eye, Images, PenLine, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

const steps = [
  { title: "사진 넣기", body: "대표 장면 몇 장과 장소/상품명, 한 줄 메모만 넣어요.", icon: Images },
  { title: "AI가 글 작성", body: "Posty AI가 제목, 키워드, 사진 흐름, 말투, 소제목을 자동으로 잡아요.", icon: PenLine },
  { title: "복사/발행", body: "완성된 글과 사진 포함 HTML을 복사해서 네이버, 티스토리, 리뷰, 상세페이지에 옮겨요.", icon: Send },
];

export default function OnboardingPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="rounded-[32px] bg-blue-600 p-6 text-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Sparkles size={25} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-normal">Posty AI 시작하기</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-blue-100">
            로그인 전에도 흐름을 먼저 볼 수 있어요. 실제 작성은 사진, 장소/상품명, 한 줄 메모만 있으면 됩니다.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <article key={step.title} className="flex gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <step.icon size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-600">STEP {index + 1}</p>
                <h2 className="text-base font-black text-slate-950">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{step.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <Link href="/write" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
            새 콘텐츠 만들기 <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700">
            <Eye size={18} aria-hidden="true" /> 예시 먼저 보기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

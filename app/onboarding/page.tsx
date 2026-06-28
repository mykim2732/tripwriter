import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

const steps = [
  { title: "플랫폼 선택", body: "네이버, 티스토리, 스레드, 리뷰, 상세페이지 중 목적에 맞게 시작해요." },
  { title: "사진과 메모 추가", body: "사진을 드래그앤드롭하고 키워드나 상황 메모를 적으면 AI 품질이 올라가요." },
  { title: "AI 초안 생성", body: "사진 설명, 말투, 스타일을 반영한 초안을 만들어요." },
  { title: "AI 디자인", body: "템플릿, 썸네일, 이미지 오버레이, Rewrite Pro로 콘텐츠를 다듬어요." },
  { title: "복사 발행", body: "플랫폼별 복사 순서에 맞춰 제목, 본문, 태그를 옮겨 발행해요." },
];

export default function OnboardingPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="rounded-[32px] bg-blue-600 p-6 text-white shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Sparkles size={25} /></div>
          <h1 className="mt-5 text-3xl font-black tracking-normal">Posty AI 시작하기</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-blue-100">사진과 메모를 넣고, AI가 글쓰기부터 디자인, 발행 준비까지 이어주는 콘텐츠 스튜디오예요.</p>
        </div>
        <div className="mt-5 space-y-3">
          {steps.map((step, index) => (
            <article key={step.title} className="flex gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">{index + 1}</div>
              <div>
                <h2 className="text-base font-black text-slate-950">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-2">
          <Link href="/write" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">새 콘텐츠 만들기 <ArrowRight size={18} /></Link>
          <Link href="/qa" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700"><CheckCircle2 size={18} /> 출시 전 점검</Link>
        </div>
      </section>
    </PageShell>
  );
}

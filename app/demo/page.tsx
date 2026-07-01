import { ArrowRight, Camera, ReceiptText, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

const demos = [
  {
    type: "여행",
    icon: Camera,
    title: "후지산 보이는 캠핑장 1박 기록",
    memo: "도착했을 때 구름이 걷히면서 산이 보였고, 밤에는 조용해서 좋았어요.",
    sections: ["도착 첫인상", "텐트 치고 보인 풍경", "밤에 좋았던 점", "다음에 챙길 것"],
    tags: ["후지산캠핑", "일본여행", "캠핑기록"],
    color: "bg-blue-600",
  },
  {
    type: "리뷰",
    icon: Star,
    title: "무선 미니 가습기 솔직 후기",
    memo: "책상 위에 두기 좋았고 소음은 작았지만 물통은 생각보다 자주 채워야 했어요.",
    sections: ["한줄평", "좋았던 점", "아쉬운 점", "추천 대상"],
    tags: ["미니가습기", "사무실템", "제품리뷰"],
    color: "bg-amber-500",
  },
  {
    type: "상세페이지",
    icon: ReceiptText,
    title: "감성 캠핑 컵 상세페이지 초안",
    memo: "가볍고 손잡이가 편한 컵. 캠핑 사진에 잘 어울리는 베이지 컬러.",
    sections: ["Hero 문구", "핵심 장점 3개", "사용 장면", "FAQ", "구매 CTA"],
    tags: ["캠핑컵", "감성캠핑", "상세페이지"],
    color: "bg-slate-950",
  },
];

export default function DemoPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">로그인 전 체험</p>
          <h1 className="mt-4 text-3xl font-black tracking-normal text-slate-950">샘플 결과 먼저 보기</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            실제 OpenAI 호출 없이 Posty AI가 어떤 식으로 초안을 잡는지 미리 볼 수 있어요.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {demos.map((demo) => (
            <article key={demo.type} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className={`${demo.color} p-5 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <demo.icon size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white/70">{demo.type} 예시</p>
                    <h2 className="text-lg font-black">{demo.title}</h2>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">{demo.memo}</p>
                <div className="mt-4 grid gap-2">
                  {demo.sections.map((section, index) => (
                    <div key={section} className="flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-sm font-black text-blue-800">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[11px]">{index + 1}</span>
                      {section}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {demo.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">#{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-2">
          <Link href="/write" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
            내 사진으로 만들기 <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/onboarding" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700">
            <Sparkles size={18} aria-hidden="true" /> 사용 흐름 보기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

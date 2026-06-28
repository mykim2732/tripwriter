import { HelpCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";

const faqs = [
  { q: "자동 발행이 되나요?", a: "현재는 복사해서 발행하기 UX와 플랫폼별 발행 API stub까지 준비되어 있어요. 실제 자동 발행은 각 플랫폼 OAuth/API 정책에 맞춰 연결할 예정입니다." },
  { q: "크레딧은 어떻게 차감되나요?", a: "로그인 사용자는 AI 글 생성, AI 디자인, 사진 분석, Rewrite/Trend/Thumbnail 같은 Pro 기능에서 1크레딧씩 차감됩니다. 게스트 흐름은 테스트용으로 유지됩니다." },
  { q: "사진은 실제로 수정되나요?", a: "현재는 원본 사진을 바꾸지 않고 CSS/SVG 오버레이로 스티커, 손그림, 메모를 보여줍니다. 다음 단계에서 이미지 편집 모델 연결을 준비할 수 있어요." },
  { q: "상세페이지도 만들 수 있나요?", a: "상세페이지 플랫폼은 상품 사진과 장점 중심으로 Hero, 장점 카드, FAQ, CTA 섹션을 생성하고 DetailEditor에서 편집할 수 있습니다." },
  { q: "Google/Kakao 로그인은 어디서 하나요?", a: "/login에서 Google과 Kakao OAuth 버튼을 사용할 수 있습니다. Supabase Auth provider와 redirect URL 설정이 필요합니다." },
];

export default function FaqPage() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">FAQ</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">자주 묻는 질문</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">베타 테스트 전에 꼭 확인할 내용을 정리했어요.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-base font-black text-slate-950">
                <HelpCircle className="shrink-0 text-blue-600" size={20} /> {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-500">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

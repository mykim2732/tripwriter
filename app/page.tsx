import Link from "next/link";
import { BookOpenText, Camera, FileText, Globe2, MessageCircle, PenLine, Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";

const platforms = [
  { key: "naver", title: "네이버 블로그", description: "검색과 사진 흐름에 맞춘 긴 글", icon: Search, active: true },
  { key: "tistory", title: "티스토리", description: "정보성·구조화 중심의 긴 글", icon: FileText, active: true },
  { key: "threads", title: "스레드", description: "짧고 공감 가는 대화형 글", icon: MessageCircle, active: true },
  { key: "brunch", title: "브런치", description: "에세이처럼 자연스러운 문장", icon: BookOpenText, active: false },
  { key: "instagram", title: "인스타그램", description: "짧은 캡션과 해시태그", icon: Camera, active: false },
  { key: "wordpress", title: "워드프레스", description: "SEO와 구조화 중심 글", icon: Globe2, active: false },
  { key: "general", title: "일반 글쓰기", description: "플랫폼 상관없이 자유롭게", icon: PenLine, active: false },
];

export default function Home() {
  return (
    <PageShell>
      <section className="px-5 pb-8 pt-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            AI 콘텐츠 스튜디오
          </p>
          <h1 className="text-4xl font-black tracking-normal text-slate-950">트립라이터</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            사진과 키워드만 넣으면 블로그와 스레드용 콘텐츠를 만들어드려요.
          </p>
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">어디에 올릴까요?</h2>
          <span className="text-sm font-semibold text-blue-600">MVP</span>
        </div>

        <div className="grid gap-3">
          {platforms.map(({ key, title, description, icon: Icon, active }) => {
            const body = (
              <>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-bold ${active ? "text-slate-950" : "text-slate-400"}`}>{title}</h3>
                    {!active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">준비중</span>}
                  </div>
                  <p className={`mt-1 text-sm leading-6 ${active ? "text-slate-500" : "text-slate-400"}`}>{description}</p>
                </div>
              </>
            );

            if (!active) {
              return <div key={key} className="flex gap-4 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">{body}</div>;
            }

            return (
              <Link key={key} href={`/write?platform=${key}`} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]">
                {body}
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

"use client";

import { CheckCircle2, CircleDashed, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { browserSupabase } from "@/lib/supabase";

type QaItem = {
  label: string;
  status: "ok" | "ready" | "warn";
  description: string;
};

export default function QaPage() {
  const [supabaseStatus, setSupabaseStatus] = useState<QaItem>({
    label: "Supabase 연결",
    status: "ready",
    description: "확인 중입니다.",
  });
  const [authStatus, setAuthStatus] = useState<QaItem>({
    label: "로그인 상태",
    status: "ready",
    description: "확인 중입니다.",
  });

  useEffect(() => {
    async function checkClientState() {
      try {
        const supabase = browserSupabase.client;
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSupabaseStatus({ label: "Supabase 연결", status: "ok", description: "브라우저 클라이언트가 정상 초기화됐어요." });
        setAuthStatus({
          label: "로그인 상태",
          status: data.session ? "ok" : "ready",
          description: data.session?.user.email ? `${data.session.user.email} 로그인 중` : "비로그인 상태입니다. guest 플로우로 테스트할 수 있어요.",
        });
      } catch (error) {
        setSupabaseStatus({
          label: "Supabase 연결",
          status: "warn",
          description: error instanceof Error ? error.message : "Supabase 연결을 확인하지 못했어요.",
        });
        setAuthStatus({ label: "로그인 상태", status: "warn", description: "Supabase 연결 후 다시 확인해주세요." });
      }
    }

    checkClientState();
  }, []);

  const items: QaItem[] = [
    supabaseStatus,
    authStatus,
    { label: "OpenAI 연결", status: "ready", description: "서버 API 호출 시 OPENAI_API_KEY 존재 여부를 확인해요. 키 값은 표시하지 않습니다." },
    { label: "사진 업로드", status: "ready", description: "PhotoManager에서 image/* 업로드와 Storage 저장을 확인하세요." },
    { label: "사진 분석 API", status: "ready", description: "사진 패널의 AI 사진 분석 버튼으로 확인하세요. 로그인 사용자는 1크레딧 차감됩니다." },
    { label: "AI 글 생성", status: "ready", description: "/write에서 플랫폼별 생성 플로우를 확인하세요." },
    { label: "AI 디자인", status: "ready", description: "편집기 하단 디자인 패널에서 테마를 선택해 확인하세요." },
    { label: "저장함 불러오기", status: "ready", description: "/saved에서 프로젝트 그룹과 플랫폼 필터를 확인하세요." },
    { label: "발행 화면", status: "ready", description: "/publish/[id]에서 플랫폼별 복사 순서를 확인하세요." },
    { label: "크레딧 상태", status: "ready", description: "/account에서 로그인 후 남은 크레딧을 확인하세요." },
  ];

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">운영 점검</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">QA 체크리스트</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            배포 전 핵심 기능을 빠르게 점검하는 페이지입니다. 민감한 환경변수 값은 표시하지 않습니다.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-3">
                <StatusIcon status={item.status} />
                <div>
                  <h2 className="text-base font-black text-slate-950">{item.label}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function StatusIcon({ status }: { status: QaItem["status"] }) {
  if (status === "ok") return <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={22} aria-hidden="true" />;
  if (status === "warn") return <ShieldAlert className="mt-0.5 shrink-0 text-amber-500" size={22} aria-hidden="true" />;
  return <CircleDashed className="mt-0.5 shrink-0 text-slate-300" size={22} aria-hidden="true" />;
}

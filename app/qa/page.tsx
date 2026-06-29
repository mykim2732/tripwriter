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
    { label: "사진 포함 복사", status: "ready", description: "발행 화면에서 전체 내용 복사하기(사진 포함)와 이미지 URL fallback을 확인하세요." },
    { label: "플랫폼별 복사", status: "ready", description: "네이버, 티스토리, 스레드, 리뷰, 상세페이지별 복사 순서와 안내 문구를 확인하세요." },
    { label: "발행 패키지", status: "ready", description: "PublishPackageCard에서 제목, 본문, 사진, 태그, 링크, CTA, 이미지 설명을 개별 복사하세요." },
    { label: "크레딧 상태", status: "ready", description: "/account에서 로그인 후 남은 크레딧을 확인하세요." },
    { label: "리워드 센터", status: "ready", description: "/rewards에서 4포인트=1크레딧 전환 준비, 광고 8회 제한, 출석/미션 보상을 확인하세요." },
    { label: "광고 슬롯", status: "ready", description: "AdSlot placeholder가 리워드, 대시보드, 발행 하단에 노출되는지 확인하세요." },
    { label: "친구 초대", status: "ready", description: "/invite에서 초대 코드와 링크 복사가 동작하는지 확인하세요." },
    { label: "제휴 링크", status: "ready", description: "리뷰/상세페이지 링크 타입에서 제휴 링크를 선택하고 발행 복사에 광고/제휴 표시가 붙는지 확인하세요." },
    { label: "수익화 가이드", status: "ready", description: "/monetization은 관리자만 접근 가능하며 광고/제휴/결제 연결 상태를 점검합니다." },
    { label: "내 말투", status: "ready", description: "/memory에서 저장 개수 제한, 스타일 분석, /write 적용 강도를 확인하세요." },
    { label: "요금제", status: "ready", description: "/pricing에서 Free, Pro, Creator, Business 플랜과 결제 준비 상태를 확인하세요." },
    { label: "PWA", status: "ready", description: "/manifest.webmanifest와 홈 화면 추가 안내 카드가 보이는지 확인하세요." },
    { label: "알림 센터", status: "ready", description: "/notifications와 /account 알림 벨을 확인하세요." },
    { label: "OAuth Redirect URI", status: "ready", description: "Supabase Auth Redirect URL에 /auth/callback을 등록했는지 확인하세요." },
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


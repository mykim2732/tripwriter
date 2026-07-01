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
    { label: "리뷰 리서치", status: "ready", description: "/write의 블로그/리뷰/상세페이지 입력 단계에서 리뷰 참고하기, 검색 링크, AI 리뷰 요약을 확인하세요." },
    { label: "대표사진", status: "ready", description: "PhotoManager에서 대표사진 지정 후 저장함 썸네일과 발행 패키지 대표사진 항목을 확인하세요." },
    { label: "워터마크", status: "ready", description: "/profile에서 워터마크를 등록하고 PhotoManager 사진 위 오버레이를 확인하세요." },
    { label: "사진 수정 패널", status: "ready", description: "PhotoManager 사진 카드의 수정 버튼으로 캡션, 교체, 대표사진, 꾸미기, 워터마크 범위 변경을 확인하세요." },
    { label: "복사 액션 시트", status: "ready", description: "/publish/[id] 상단 복사 아이콘을 눌러 전체/사진 포함/HTML/태그/링크 복사를 확인하세요." },
    { label: "사진 누락 검사", status: "ready", description: "발행 화면에서 업로드 사진 수와 발행 HTML 포함 여부를 비교하고 자동 배치를 확인하세요." },
    { label: "AI CTR 코치", status: "ready", description: "발행 화면에서 제목, 대표사진, 첫 문장, CTA 기반 예상 개선 포인트와 제목 개선 버튼을 확인하세요." },
    { label: "수익화 가이드", status: "ready", description: "/monetization은 관리자만 접근 가능하며 광고/제휴/결제 연결 상태를 점검합니다." },
    { label: "발행 가능성 점검", status: "ready", description: "/publish/[id]에서 자동 발행 가능, 복사 발행 권장, API 연결 준비 중 배지를 확인하세요." },
    { label: "Threads mock 발행", status: "ready", description: "스레드 발행 화면에서 테스트 발행 mock을 누르고 published 상태와 platformPostUrl 저장을 확인하세요." },
    { label: "발행 URL 저장", status: "ready", description: "발행 URL 입력 후 저장함, 대시보드, 캘린더에서 URL 저장 표시를 확인하세요." },
    { label: "리워드 애니메이션", status: "ready", description: "리워드센터의 포인트 게이지, 보상 상자, 광고 5초 카운트다운, 완료 피드백을 확인하세요." },
    { label: "결제 Stub", status: "ready", description: "/pricing에서 Pro/Creator/Business 시작하기를 눌러 mock checkout과 billing success/fail 경로를 확인하세요." },
    { label: "FeatureGate", status: "ready", description: "유료 기능 잠금 카드가 요금제와 리워드 센터로 안내하는지 확인하세요." },
    { label: "베타 피드백", status: "ready", description: "/feedback에서 별점, 불편한 점, 기능 요청, 버그 신고 mock 저장을 확인하세요." },
    { label: "내 말투", status: "ready", description: "/memory에서 저장 개수 제한, 스타일 분석, /write 적용 강도를 확인하세요." },
    { label: "AI 구성 계획", status: "ready", description: "/write에서 AI 구성 계획 먼저 보기를 눌러 독자, 사진 흐름, 섹션 계획을 확인하세요." },
    { label: "Human-Like Writer 2.0", status: "ready", description: "생성/디자인 결과에서 AI 티 나는 상투어, 반복 문장, 과장 표현이 줄었는지 확인하세요." },
    { label: "사진 기반 다시 쓰기", status: "ready", description: "사진 분석 후 에디터 하단 액션에서 사진 기반 다시 쓰기를 눌러 대표사진→본문→마무리 흐름을 확인하세요." },
    { label: "리뷰 검색 링크", status: "ready", description: "리뷰 참고하기에서 Google, Naver, Kakao Map 링크가 열리고 직접 입력한 메모만 요약되는지 확인하세요." },
    { label: "리뷰 API 준비층", status: "ready", description: "/api/review-sources/search가 mock/search-link mode와 provider 준비 상태를 반환하는지 확인하세요." },
    { label: "이미지 AI 준비층", status: "ready", description: "/api/images/generate와 /api/images/edit가 원본을 덮어쓰지 않고 mock 또는 새 후보만 반환하는지 확인하세요." },
    { label: "AI 썸네일 UX", status: "ready", description: "/saved/[id] 고급 편집에서 미니멀/다이어리/리뷰/상세페이지 썸네일 mock preview와 placeholder 액션을 확인하세요." },
    { label: "AI 품질 검수", status: "ready", description: "/write의 생성 후 AI 품질 검수가 기본 ON이며 점수, 이슈, 개선 본문이 반영되는지 확인하세요." },
    { label: "이미지 PNG 다운로드", status: "ready", description: "AI 썸네일 preview에서 워터마크와 오버레이가 보이는 합성 상태로 PNG 다운로드가 되는지 확인하세요." },
    { label: "썸네일 저장/대표 지정", status: "ready", description: "AI 썸네일 저장 후 대표 썸네일을 지정하고 /publish/[id]와 저장함 카드 우선 표시를 확인하세요." },
    { label: "품질 검수 적용/되돌리기", status: "ready", description: "/write에서 improvedContent 적용, 원문 되돌리기, 개선 제목 후보 적용, 이력 저장을 확인하세요." },
    { label: "사진 스토리라인 편집", status: "ready", description: "사진별 소제목, 문단 포인트, 캡션을 수정하고 사진 순서 변경 시 스토리라인도 같이 이동하는지 확인하세요." },
    { label: "리뷰 Provider Adapter", status: "ready", description: "Google Places, Kakao Local, Naver Search, manual provider의 availableFields, envRequired, status 반환을 확인하세요." },
    { label: "공식 API fallback", status: "ready", description: "API Key가 없을 때 search-link mode로 안전하게 돌아가고, 키가 있을 때 장소/검색 결과 구조가 반환되는지 확인하세요." },
    { label: "이미지 AI 크레딧 정책", status: "ready", description: "요금제, 리워드, 크레딧 부족 카드에서 썸네일/이미지 생성/편집 2크레딧 예정 안내를 확인하세요." },
    { label: "빠른 작성 모드", status: "ready", description: "/write에서 빠른 작성 모드가 기본 ON이고 사진, 장소/상품명, 한 줄 메모, 내 말투, 만들기만 먼저 보이는지 확인하세요." },
    { label: "리뷰 미리보기", status: "ready", description: "리뷰 참고에서 장소/상품명 검색 후 미리보기 5개 가로 슬라이드와 글에 반영 토글을 확인하세요." },
    { label: "Google Places fallback", status: "ready", description: "GOOGLE_PLACES_API_KEY가 없을 때 mock/search-link가 표시되고, 키가 있을 때 평점/리뷰 수/snippet 구조가 반환되는지 확인하세요." },
    { label: "사람다운 글 품질", status: "ready", description: "생성 후 사람이 쓴 느낌 점수와 낮은 점수의 자연스럽게 다시 다듬기 버튼을 확인하세요." },
    { label: "스마트 기본값", status: "ready", description: "사진 기반 글쓰기, 리뷰 참고 추천, 최근 말투, 대표사진 자동 선택, 키워드 자동 생성을 확인하세요." },
    { label: "원탭 생성", status: "ready", description: "/write에서 사진, 장소/상품명, 한 줄 메모만으로 자동 제목/키워드/말투/SEO가 잡히고 만들기가 동작하는지 확인하세요." },
    { label: "사진 타임라인", status: "ready", description: "AI 사진 분석 후 도착, 입장, 메인, 디테일, 마무리 타임라인과 적용 버튼을 확인하세요." },
    { label: "AI Designer 3.0", status: "ready", description: "AI 디자인 후 흰색 손그림, 하트, 별, 메모, 테이프, 폴라로이드 오버레이 후보가 사진별로 생기는지 확인하세요." },
    { label: "대표사진 후보", status: "ready", description: "PhotoManager에서 클릭률 기준 대표사진 후보 3개와 CTR 예상 수치를 확인하세요." },
    { label: "결과 미리보기", status: "ready", description: "생성 전 대표사진, 제목, 소제목 후보, 톤, 글 길이, 예상 읽는 시간이 표시되는지 확인하세요." },
    { label: "실패 복구", status: "ready", description: "OpenAI/크레딧/timeout 실패 시 빈 화면 대신 임시 초안이 편집기에 표시되는지 확인하세요." },
    { label: "Labs 숨김", status: "ready", description: "SEO, 첨부파일, 구성 보기, 직접 리뷰 메모 같은 고급 기능이 Labs 안에 접혀 있는지 확인하세요." },
    { label: "빈 상태", status: "ready", description: "사진이 없을 때 예시 사진 흐름, 리뷰가 없을 때 예시 리뷰 포인트가 보이는지 확인하세요." },
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


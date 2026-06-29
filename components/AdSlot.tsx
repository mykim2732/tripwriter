"use client";

import { AlertCircle, CheckCircle2, Loader2, Megaphone, PlayCircle } from "lucide-react";
import { useState } from "react";

export type AdSlotType = "reward_video" | "banner" | "native" | "affiliate";

type Props = {
  type: AdSlotType;
  title?: string;
  description?: string;
};

// Future SDK candidates:
// App: Google AdMob
// Web: Google AdSense
// Korea web/app: Kakao AdFit
// Review/detail commerce: Coupang Partners and affiliate links
export function AdSlot({ type, title, description }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "failed">("idle");
  const isReward = type === "reward_video";

  function simulate() {
    setState("loading");
    window.setTimeout(() => setState("done"), 900);
  }

  return (
    <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {isReward ? <PlayCircle size={24} /> : <Megaphone size={24} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-950">{title || defaultTitle(type)}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">광고 SDK 연결 예정</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description || defaultDescription(type)}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold leading-5 text-slate-500">현재는 mock 슬롯입니다. 로딩/완료/실패 상태를 실제 SDK 이벤트로 교체할 수 있게 준비했습니다.</div>
      {isReward && (
        <button type="button" onClick={simulate} disabled={state === "loading"} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-60">
          {state === "loading" ? <Loader2 className="animate-spin" size={16} /> : state === "done" ? <CheckCircle2 size={16} /> : state === "failed" ? <AlertCircle size={16} /> : <PlayCircle size={16} />}
          {state === "loading" ? "광고 로딩 중" : state === "done" ? "광고 시청 완료 mock" : "광고 보기 mock"}
        </button>
      )}
    </aside>
  );
}

function defaultTitle(type: AdSlotType) {
  if (type === "reward_video") return "리워드 광고";
  if (type === "affiliate") return "제휴 링크 안내";
  if (type === "native") return "추천 광고 슬롯";
  return "배너 광고 슬롯";
}

function defaultDescription(type: AdSlotType) {
  if (type === "reward_video") return "광고 4회 시청으로 1크레딧 상당의 리워드를 준비합니다.";
  if (type === "affiliate") return "리뷰와 상세페이지에는 Coupang Partners 같은 제휴 링크를 자연스럽게 연결할 수 있습니다.";
  if (type === "native") return "콘텐츠 흐름을 방해하지 않는 네이티브 광고 영역입니다.";
  return "대시보드나 발행 화면 하단에 배치할 수 있는 배너 광고 영역입니다.";
}

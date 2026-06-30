"use client";

import { ExternalLink, Loader2, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import type { ReviewResearchInput, ReviewResearchResult } from "@/types/editor";

type Props = {
  value: ReviewResearchInput;
  onChange: (next: ReviewResearchInput) => void;
  platform: string;
  contentType: string;
};

const emptyResult: ReviewResearchResult = {
  summary: "",
  commonPros: [],
  commonCons: [],
  keywords: [],
  suggestedAngles: [],
  cautionNotes: [],
  titleHints: [],
};

export function ReviewResearchPanel({ value, onChange, platform, contentType }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const links = useMemo(() => {
    const current = value.links || [];
    return Array.from({ length: 5 }, (_, index) => current[index] || { label: "", url: "" });
  }, [value.links]);

  function patch(next: Partial<ReviewResearchInput>) {
    onChange({ ...value, ...next });
  }

  function updateLink(index: number, field: "label" | "url", fieldValue: string) {
    const nextLinks = links.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: fieldValue } : link)).filter((link) => link.label || link.url);
    patch({ links: nextLinks });
  }

  function openSearch(kind: "google" | "naver" | "kakao") {
    const query = encodeURIComponent(`${value.subject || ""} 리뷰`);
    const url =
      kind === "google"
        ? `https://www.google.com/search?q=${query}`
        : kind === "naver"
          ? `https://search.naver.com/search.naver?query=${query}`
          : `https://map.kakao.com/?q=${query}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function analyze() {
    setLoading(true);
    setError("");

    try {
      const response = await authFetch("/api/analyze-review-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: value.subject,
          rating: value.rating,
          reviewMemo: value.reviewMemo,
          links: (value.links || []).filter((link) => link.url),
          pros: value.pros,
          cons: value.cons,
          platform,
          contentType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "리뷰 리서치 요약에 실패했어요.");
      patch({ result: { ...emptyResult, ...data } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "리뷰 리서치 요약에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-slate-950">리뷰 참고하기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            다른 후기 원문을 긁어오지 않고, 직접 입력한 메모와 링크 기준으로만 안전하게 참고 포인트를 정리해요.
          </p>
        </div>
        <Sparkles className="shrink-0 text-blue-500" size={21} aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3">
        <Input label="장소/상품명" value={value.subject || ""} onChange={(next) => patch({ subject: next })} placeholder="예: 후모톳파라 캠핑장, 무선 미니 가습기" />
        <Input label="평점" value={value.rating || ""} onChange={(next) => patch({ rating: next })} placeholder="예: 4.7, 대체로 만족" />
        <label className="block">
          <span className="text-xs font-black text-slate-500">리뷰 메모 붙여넣기</span>
          <textarea value={value.reviewMemo || ""} onChange={(event) => patch({ reviewMemo: event.target.value })} placeholder="직접 확인한 후기 메모나 인상 깊은 표현을 짧게 정리해 주세요. 원문을 그대로 복사하기보다 키워드 중심이 좋아요." className="mt-2 min-h-28 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="자주 보이는 장점" value={value.pros || ""} onChange={(next) => patch({ pros: next })} placeholder="예: 뷰가 좋음, 조용함" />
          <Input label="자주 보이는 단점" value={value.cons || ""} onChange={(next) => patch({ cons: next })} placeholder="예: 대기 있음, 가격대 있음" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-black text-slate-500">참고 링크</p>
        {links.map((link, index) => (
          <div key={index} className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[0.8fr_1.2fr]">
            <input value={link.label || ""} onChange={(event) => updateLink(index, "label", event.target.value)} placeholder="링크 설명" className="h-10 rounded-xl bg-white px-3 text-sm outline-none" />
            <input value={link.url || ""} onChange={(event) => updateLink(index, "url", event.target.value)} placeholder="https://" className="h-10 rounded-xl bg-white px-3 text-sm outline-none" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SearchButton onClick={() => openSearch("google")} label="Google" />
        <SearchButton onClick={() => openSearch("naver")} label="네이버" />
        <SearchButton onClick={() => openSearch("kakao")} label="카카오맵" />
      </div>

      <button type="button" onClick={analyze} disabled={loading} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-60">
        {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
        AI 리뷰 요약하기
      </button>
      {error && <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{error}</p>}

      {value.result?.summary && (
        <div className="mt-4 rounded-3xl bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-900">리서치 요약</p>
          <p className="mt-1 text-xs leading-5 text-blue-800">{value.result.summary}</p>
          <ResultChips title="키워드" items={value.result.keywords} />
          <ResultChips title="반영 포인트" items={value.result.suggestedAngles} />
          <ResultChips title="주의 표현" items={value.result.cautionNotes} muted />
        </div>
      )}
    </section>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
    </label>
  );
}

function SearchButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl bg-slate-50 px-3 text-xs font-black text-slate-600">
      <ExternalLink size={14} />
      {label}
    </button>
  );
}

function ResultChips({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className={`text-[11px] font-black ${muted ? "text-slate-500" : "text-blue-700"}`}>{title}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => (
          <span key={item} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${muted ? "bg-white text-slate-500" : "bg-white text-blue-700"}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

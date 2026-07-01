"use client";

import { ExternalLink, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { ReviewPreviewCarousel } from "@/components/ReviewPreviewCarousel";
import type { ReviewPreviewItem, ReviewResearchInput, ReviewResearchResult } from "@/types/editor";

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

type SourceResult = {
  provider: "google_places" | "kakao_local" | "naver_search" | "manual";
  title: string;
  description?: string;
  address?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  reviewSnippets?: { rating?: number; text: string; author?: string }[];
  url: string;
  source: "official-api" | "search-link";
};

export function ReviewResearchPanel({ value, onChange, platform, contentType }: Props) {
  const [loading, setLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visibleLinkCount, setVisibleLinkCount] = useState(Math.max(2, Math.min(5, value.links?.length || 2)));
  const [error, setError] = useState("");

  const previews = value.reviewPreviews || [];
  const selectedIds = value.selectedPreviewIds || [];
  const links = useMemo(() => {
    const current = value.links || [];
    return Array.from({ length: visibleLinkCount }, (_, index) => current[index] || { label: "", url: "" });
  }, [value.links, visibleLinkCount]);

  function patch(next: Partial<ReviewResearchInput>) {
    onChange({ ...value, ...next });
  }

  function updateLink(index: number, field: "label" | "url", fieldValue: string) {
    const nextLinks = links.map((link, linkIndex) => (linkIndex === index ? { ...link, [field]: fieldValue } : link)).filter((link) => link.label || link.url);
    patch({ links: nextLinks });
  }

  function openSearch(kind: "google" | "naver" | "kakao") {
    window.open(getSearchUrl(kind, value.subject || ""), "_blank", "noopener,noreferrer");
  }

  function togglePreview(id: string) {
    const nextSelected = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
    patch({
      selectedPreviewIds: nextSelected,
      reviewPreviews: previews.map((preview) => ({ ...preview, selected: nextSelected.includes(preview.id) })),
    });
  }

  async function loadSources() {
    setSourceLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ query: value.subject || "리뷰", provider: "all" });
      const response = await authFetch(`/api/review-sources/search?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "리뷰 검색 결과를 불러오지 못했어요.");
      const results = Array.isArray(data.results) ? data.results as SourceResult[] : [];
      const nextPreviews = buildPreviewItems(results, value.subject || "");
      patch({
        reviewPreviews: nextPreviews,
        selectedPreviewIds: nextPreviews.filter((item) => item.selected).map((item) => item.id),
        rating: results.find((item) => item.rating)?.rating?.toString() || value.rating,
      });
    } catch (caught) {
      const fallback = buildMockPreviews(value.subject || "리뷰");
      patch({ reviewPreviews: fallback, selectedPreviewIds: fallback.filter((item) => item.selected).map((item) => item.id) });
      setError(caught instanceof Error ? caught.message : "mock 미리보기로 대신 보여드려요.");
    } finally {
      setSourceLoading(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setError("");

    try {
      const selectedPreviews = previews.filter((preview) => selectedIds.includes(preview.id));
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
          reviewPreviews: selectedPreviews,
          platform,
          contentType,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "리뷰 참고 정보를 정리하지 못했어요.");
      patch({ result: { ...emptyResult, ...data } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "리뷰 참고 정보를 정리하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black text-slate-950">리뷰 참고</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">장소나 상품명을 검색하고, 반영할 포인트만 골라요.</p>
        </div>
        <Sparkles className="shrink-0 text-blue-500" size={21} aria-hidden="true" />
      </div>

      <div className="mt-4 grid gap-3">
        <Input label="장소/상품명" value={value.subject || ""} onChange={(next) => patch({ subject: next })} placeholder="예: 성남동 카페, 무선 미니 가습기" />
        <button type="button" onClick={loadSources} disabled={sourceLoading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white disabled:opacity-60">
          {sourceLoading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
          리뷰 미리보기
        </button>
      </div>

      <ReviewPreviewCarousel items={previews} selectedIds={selectedIds} onToggle={togglePreview} />

      <div className="mt-4 rounded-3xl bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black text-slate-500">참고 링크</p>
          <button type="button" onClick={() => setVisibleLinkCount((count) => Math.min(5, count + 1))} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600">
            <Plus size={13} />
            추가
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <SearchButton onClick={() => openSearch("google")} label="Google" />
          <SearchButton onClick={() => openSearch("naver")} label="Naver" />
          <SearchButton onClick={() => openSearch("kakao")} label="Kakao" />
        </div>
        <div className="mt-3 grid gap-2">
          {links.map((link, index) => (
            <div key={index} className="grid gap-2 rounded-2xl bg-white p-2 sm:grid-cols-[0.8fr_1.2fr]">
              <input value={link.label || ""} onChange={(event) => updateLink(index, "label", event.target.value)} placeholder="링크 설명" className="h-10 rounded-xl bg-slate-50 px-3 text-sm outline-none" />
              <input value={link.url || ""} onChange={(event) => updateLink(index, "url", event.target.value)} placeholder="https://" className="h-10 rounded-xl bg-slate-50 px-3 text-sm outline-none" />
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="mt-3 min-h-10 w-full rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-600">
        {showAdvanced ? "직접 메모 접기" : "직접 메모 입력"}
      </button>

      {showAdvanced && (
        <div className="mt-3 grid gap-3 rounded-3xl bg-slate-50 p-3">
          <Input label="평점" value={value.rating || ""} onChange={(next) => patch({ rating: next })} placeholder="예: 4.7, 대체로 만족" />
          <label className="block">
            <span className="text-xs font-black text-slate-500">직접 확인한 리뷰 메모</span>
            <textarea value={value.reviewMemo || ""} onChange={(event) => patch({ reviewMemo: event.target.value })} placeholder="원문 복사 대신 내가 확인한 공통 포인트만 적어주세요." className="mt-2 min-h-24 w-full rounded-2xl bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="자주 보이는 장점" value={value.pros || ""} onChange={(next) => patch({ pros: next })} placeholder="예: 조용함, 사진 잘 나옴" />
            <Input label="자주 보이는 아쉬운 점" value={value.cons || ""} onChange={(next) => patch({ cons: next })} placeholder="예: 대기 있음, 가격대 있음" />
          </div>
        </div>
      )}

      <button type="button" onClick={analyze} disabled={loading} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-60">
        {loading ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
        글에 참고
      </button>
      {error && <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">{error}</p>}

      {value.result?.summary && (
        <div className="mt-4 rounded-3xl bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-900">참고 포인트</p>
          <p className="mt-1 text-xs leading-5 text-blue-800">{value.result.summary}</p>
          <ResultChips title="키워드" items={value.result.keywords} />
          <ResultChips title="반영 포인트" items={value.result.suggestedAngles} />
          <ResultChips title="주의 표현" items={value.result.cautionNotes} muted />
        </div>
      )}
    </section>
  );
}

function buildPreviewItems(results: SourceResult[], subject: string): ReviewPreviewItem[] {
  const normalized = results.flatMap((item, resultIndex) => {
    const snippets = item.reviewSnippets?.length
      ? item.reviewSnippets.slice(0, 5).map((snippet, snippetIndex) => ({
          id: `${item.provider}-${resultIndex}-${snippetIndex}-${item.url}`,
          source: item.provider,
          sourceLabel: sourceLabel(item.provider),
          rating: snippet.rating || item.rating,
          summary: snippet.text,
          keywords: [item.category, item.rating ? `평점 ${item.rating}` : "", item.reviewCount ? `리뷰 ${item.reviewCount}` : ""].filter(Boolean) as string[],
          url: item.url,
          selected: resultIndex === 0 && snippetIndex < 2,
        }))
      : [];
    if (snippets.length) return snippets;
    return [{
      id: `${item.provider}-${resultIndex}-${item.url}`,
      source: item.provider,
      sourceLabel: sourceLabel(item.provider),
      rating: item.rating,
      summary: item.description || item.address || `${item.title} 검색 결과를 직접 확인해 참고할 수 있어요.`,
      keywords: [item.category, item.rating ? `평점 ${item.rating}` : "", item.reviewCount ? `리뷰 ${item.reviewCount}` : ""].filter(Boolean) as string[],
      url: item.url,
      selected: resultIndex < 2,
    }];
  }).slice(0, 5);
  return normalized.length ? normalized : buildMockPreviews(subject);
}

function buildMockPreviews(subject: string): ReviewPreviewItem[] {
  const base = subject || "검색 대상";
  return [
    { id: "mock-1", source: "mock", sourceLabel: "Mock", rating: 4.7, summary: `${base}의 분위기와 접근성을 확인해볼 만해요.`, keywords: ["분위기", "접근성"], selected: true },
    { id: "mock-2", source: "mock", sourceLabel: "Mock", rating: 4.5, summary: "사진으로 확인 가능한 디테일과 실제 경험을 구분해 쓰면 좋아요.", keywords: ["사진 포인트", "경험 구분"], selected: true },
    { id: "mock-3", source: "mock", sourceLabel: "Mock", summary: "장점과 아쉬운 점을 함께 다루면 글이 더 자연스러워져요.", keywords: ["장단점", "균형"], selected: false },
  ];
}

function getSearchUrl(kind: "google" | "naver" | "kakao", subject: string) {
  const query = encodeURIComponent(`${subject || "리뷰"} 리뷰`);
  if (kind === "google") return `https://www.google.com/search?q=${query}`;
  if (kind === "naver") return `https://search.naver.com/search.naver?query=${query}`;
  return `https://map.kakao.com/?q=${query}`;
}

function sourceLabel(source: ReviewPreviewItem["source"]) {
  if (source === "google_places") return "Google";
  if (source === "kakao_local") return "Kakao";
  if (source === "naver_search") return "Naver";
  if (source === "manual") return "Manual";
  return "Mock";
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
    <button type="button" onClick={onClick} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-2xl bg-white px-3 text-xs font-black text-slate-600">
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

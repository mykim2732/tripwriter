"use client";

import { ArrowLeft, Camera, Clipboard, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { FloatingEditorToolbar, type FloatingToolbarItem } from "@/components/FloatingEditorToolbar";
import { normalizeDecorators } from "@/components/ImageDecoratorEditor";
import { createEditorPhoto, defaultCaption, PhotoManager, photosFromUrls } from "@/components/PhotoManager";
import type { BlogEditorState, DesignTheme, EditorPhoto, ImageDecorator, ReviewPage } from "@/types/editor";

type Props = {
  state: BlogEditorState;
  onChange: (next: BlogEditorState) => void;
  onSave?: () => void | Promise<void>;
  onPolish?: (theme?: DesignTheme) => void | Promise<void>;
  onPublishReview?: () => void | Promise<void>;
  saving?: boolean;
  polishing?: boolean;
};

type Panel = "none" | "photos" | "design" | "copy";

const ratingOptions = ["★★★★★ 만족", "★★★★☆ 좋아요", "★★★☆☆ 보통", "재구매 고민", "솔직히 아쉬움"];

export function ReviewEditor({ state, onChange, onSave, onPolish, onPublishReview, saving = false, polishing = false }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [toast, setToast] = useState("");
  const photos = getManagedPhotos(state);
  const review = useMemo(() => ensureReviewPage(state), [state]);
  const html = useMemo(() => buildReviewHtml({ ...state, reviewPage: review }), [state, review]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function patch(partial: Partial<BlogEditorState>) {
    const merged = { ...state, ...partial };
    onChange({ ...merged, html: buildReviewHtml(merged) });
  }

  function patchReview(partial: Partial<ReviewPage>) {
    const nextReview = { ...review, ...partial };
    patch({
      reviewPage: nextReview,
      content: contentFromReview(nextReview),
      editorOptions: { ...state.editorOptions, reviewPage: nextReview, platform: "review", contentType: "review" },
    });
  }

  function applyPhotos(nextPhotos: EditorPhoto[], captions: string[], decorators: ImageDecorator[]) {
    const urls = nextPhotos.map((photo) => photo.url);
    const publicUrls = nextPhotos.filter((photo) => !photo.isLocal).map((photo) => photo.url);
    const normalized = normalizeDecorators(decorators, urls);
    patch({
      editorPhotos: nextPhotos,
      photoUrls: publicUrls,
      localPhotoPreviews: urls,
      photoCaptions: captions,
      photoDecorators: normalized,
      editorOptions: { ...state.editorOptions, photoCaptions: captions, imageDecorators: normalized },
    });
  }

  function addPhotos(files: File[]) {
    const added = files.map(createEditorPhoto);
    applyPhotos(
      [...photos, ...added],
      [...state.photoCaptions.slice(0, photos.length), ...added.map((_, index) => defaultCaption(photos.length + index))],
      state.photoDecorators || [],
    );
  }

  function removePhoto(index: number) {
    applyPhotos(
      photos.filter((_, photoIndex) => photoIndex !== index),
      state.photoCaptions.filter((_, captionIndex) => captionIndex !== index),
      (state.photoDecorators || [])
        .filter((decorator) => decorator.imageIndex !== index)
        .map((decorator) => typeof decorator.imageIndex === "number" && decorator.imageIndex > index ? { ...decorator, imageIndex: decorator.imageIndex - 1 } : decorator),
    );
  }

  function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= photos.length) return;
    applyPhotos(
      moveItem(photos, fromIndex, toIndex),
      moveItem(state.photoCaptions, fromIndex, toIndex),
      remapDecoratorsAfterMove(state.photoDecorators || [], fromIndex, toIndex),
    );
  }

  function changeCaption(index: number, caption: string) {
    const captions = [...state.photoCaptions];
    captions[index] = caption;
    patch({ photoCaptions: captions, editorOptions: { ...state.editorOptions, photoCaptions: captions } });
  }

  function applyPhotoAnalysis(result: {
    photos: { url: string; caption: string; shortMemo?: string; recommendedUse?: string; decoratorSuggestions?: ImageDecorator[] }[];
    coverPhotoUrl: string;
    coverReason: string;
    photoOrder: string[];
    summary: string;
  }) {
    const urls = photos.map((photo) => photo.url);
    const captions = photos.map((photo, index) => result.photos.find((item) => item.url === photo.url)?.caption || state.photoCaptions[index] || defaultCaption(index));
    const suggested = result.photos.flatMap((photo) => {
      const imageIndex = urls.indexOf(photo.url);
      return (photo.decoratorSuggestions || []).slice(0, 2).map((decorator, decoratorIndex) => ({
        ...decorator,
        id: `review-analysis-${imageIndex}-${decoratorIndex}-${Date.now()}`,
        imageIndex,
        imageUrl: photo.url,
        type: normalizeDecoratorType(decorator.type),
        enabled: true,
      }));
    });
    const reviewPage = { ...review, photoReviewPoints: result.photos.map((photo) => photo.shortMemo || photo.caption).filter(Boolean) };
    const decorators = normalizeDecorators([...(state.photoDecorators || []), ...suggested], urls);
    patch({
      reviewPage,
      content: contentFromReview(reviewPage),
      photoCaptions: captions,
      photoDecorators: decorators,
      photoAnalysis: result.photos,
      coverPhotoUrl: result.coverPhotoUrl,
      coverReason: result.coverReason,
      photoSummary: result.summary,
      editorOptions: {
        ...state.editorOptions,
        reviewPage,
        photoCaptions: captions,
        imageDecorators: decorators,
        photoAnalysis: result.photos,
        coverPhotoUrl: result.coverPhotoUrl,
        coverReason: result.coverReason,
        photoSummary: result.summary,
        photoOrder: result.photoOrder,
      },
    });
  }

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    showToast(message);
  }

  function saveNow() {
    patch({ html });
    void onSave?.();
  }

  return (
    <section className="min-h-[calc(100vh-24px)] bg-white shadow-sm ring-1 ring-slate-100 sm:rounded-[28px]">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
        <button type="button" onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500" aria-label="뒤로가기">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-slate-950">리뷰 편집</p>
          <p className="text-[11px] font-bold text-blue-600">AI 콘텐츠 스튜디오</p>
        </div>
        <button type="button" onClick={saveNow} disabled={saving} className="text-sm font-black text-blue-600 disabled:text-slate-300">
          {saving ? "저장중" : "저장"}
        </button>
      </header>

      <div className="px-5 pb-32 pt-5">
        <input
          value={state.selectedTitle}
          onChange={(event) => patch({ selectedTitle: event.target.value })}
          placeholder="리뷰 제목"
          className="w-full border-b border-slate-100 bg-white pb-4 text-3xl font-black text-slate-950 outline-none placeholder:text-slate-300"
        />

        <section className="mt-5 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-br from-blue-50 to-amber-50 p-5">
            <p className="text-xs font-black text-blue-700">{review.productName || "상품 리뷰"}</p>
            <textarea value={review.oneLineReview || ""} onChange={(event) => patchReview({ oneLineReview: event.target.value })} placeholder="한줄평을 입력하세요" className="mt-2 min-h-16 w-full resize-none bg-transparent text-2xl font-black leading-snug text-slate-950 outline-none placeholder:text-slate-300" />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {ratingOptions.map((option) => (
                <button key={option} type="button" onClick={() => patchReview({ ratingText: option })} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${review.ratingText === option ? "bg-blue-600 text-white" : "bg-white text-slate-600 shadow-sm"}`}>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 p-5">
            <ReviewField label="상품명" value={review.productName || ""} onChange={(value) => patchReview({ productName: value })} />
            <ReviewField label="좋았던 점" value={review.pros || ""} onChange={(value) => patchReview({ pros: value })} multiline />
            <ReviewField label="아쉬운 점" value={review.cons || ""} onChange={(value) => patchReview({ cons: value })} multiline />
            <ReviewField label="사용 후기" value={review.experience || ""} onChange={(value) => patchReview({ experience: value })} multiline />
            <ReviewField label="추천 대상" value={review.recommendTarget || ""} onChange={(value) => patchReview({ recommendTarget: value })} />
            <ReviewField label="재구매 의사" value={review.repurchaseIntent || ""} onChange={(value) => patchReview({ repurchaseIntent: value })} />
            <ReviewField label="해시태그" value={(review.hashtags || []).join(" ")} onChange={(value) => patchReview({ hashtags: value.split(/\s+/).filter(Boolean).map((tag) => tag.replace(/^#/, "")) })} />
          </div>
        </section>

        {review.photoReviewPoints && review.photoReviewPoints.length > 0 && (
          <section className="mt-4 rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100">
            <p className="text-sm font-black text-blue-950">사진 기반 리뷰 포인트</p>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-blue-700">
              {review.photoReviewPoints.slice(0, 5).map((point) => <li key={point}>- {point}</li>)}
            </ul>
          </section>
        )}

        <details className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <summary className="cursor-pointer list-none text-sm font-black text-slate-950">리뷰 카드 미리보기</summary>
          <div className="mt-4 overflow-hidden rounded-3xl bg-white p-4 shadow-inner" dangerouslySetInnerHTML={{ __html: html }} />
        </details>
      </div>

      <FloatingEditorToolbar
        items={[
          { key: "photos", icon: <Camera size={23} />, label: "사진", active: activePanel === "photos", onClick: () => setActivePanel(activePanel === "photos" ? "none" : "photos") },
          { key: "design", icon: <Sparkles size={23} />, label: "AI 디자인", active: activePanel === "design", onClick: () => setActivePanel(activePanel === "design" ? "none" : "design") },
          { key: "copy", icon: <Clipboard size={23} />, label: "복사", active: activePanel === "copy", onClick: () => setActivePanel(activePanel === "copy" ? "none" : "copy") },
          { key: "publish", icon: <Send size={23} />, label: "검수", active: false, onClick: () => onPublishReview?.() },
        ] satisfies FloatingToolbarItem[]}
        onSave={saveNow}
        saving={saving}
        columnsClass="grid-cols-[repeat(4,1fr)_auto]"
      >
        {activePanel === "photos" && (
          <PhotoManager
            photos={photos}
            photoCaptions={state.photoCaptions}
            imageDecorators={state.photoDecorators || []}
            onAddPhotos={addPhotos}
            onRemovePhoto={removePhoto}
            onMovePhoto={movePhoto}
            onChangeCaption={changeCaption}
            onChangeDecorators={(decorators) => patch({ photoDecorators: normalizeDecorators(decorators, photos.map((photo) => photo.url)), editorOptions: { ...state.editorOptions, imageDecorators: decorators } })}
            onApplyAnalysis={applyPhotoAnalysis}
            onSetCoverPhoto={(url, reason) => patch({ coverPhotoUrl: url, coverReason: reason, editorOptions: { ...state.editorOptions, coverPhotoUrl: url, coverReason: reason } })}
            coverPhotoUrl={state.coverPhotoUrl}
            coverReason={state.coverReason}
            photoAnalysis={state.photoAnalysis}
            photoSummary={state.photoSummary}
            mode="blog"
            platform="review"
            contentType="review"
            context={{ title: state.selectedTitle, keywords: (review.hashtags || []).join(","), style: "review" }}
          />
        )}
        {activePanel === "design" && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onPolish?.("전문 리뷰")} disabled={polishing} className="min-h-12 rounded-2xl bg-blue-600 px-3 text-sm font-black text-white disabled:opacity-60">{polishing ? "꾸미는 중" : "전문 리뷰"}</button>
            <button type="button" onClick={() => onPolish?.("감성 다이어리")} disabled={polishing} className="min-h-12 rounded-2xl bg-blue-50 px-3 text-sm font-black text-blue-700 disabled:opacity-60">감성 후기</button>
          </div>
        )}
        {activePanel === "copy" && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => copyText(review.oneLineReview || state.selectedTitle, "한줄평을 복사했어요.")} className="min-h-11 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-700">한줄평 복사</button>
            <button type="button" onClick={() => copyText(contentFromReview(review), "전체 리뷰를 복사했어요.")} className="min-h-11 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-700">전체 리뷰 복사</button>
            <button type="button" onClick={() => copyText((review.hashtags || []).map((tag) => `#${tag.replace(/^#/, "")}`).join(" "), "해시태그를 복사했어요.")} className="min-h-11 rounded-2xl bg-slate-100 px-3 text-sm font-black text-slate-700">해시태그 복사</button>
            <button type="button" onClick={() => onPublishReview?.()} className="min-h-11 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white">복사/검수</button>
          </div>
        )}
      </FloatingEditorToolbar>

      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
    </section>
  );
}

function ReviewField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-400">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-20 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none focus:ring-1 focus:ring-blue-400" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-400" />
      )}
    </label>
  );
}

function ensureReviewPage(state: BlogEditorState): ReviewPage {
  const optionReview = state.editorOptions.reviewPage;
  if (optionReview && typeof optionReview === "object" && !Array.isArray(optionReview)) return { ...state.reviewPage, ...(optionReview as ReviewPage) };
  if (state.reviewPage) return state.reviewPage;
  const lines = state.content.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return {
    productName: state.selectedTitle,
    oneLineReview: lines[0] || state.titleCandidates[0] || "",
    ratingText: "★★★★☆ 좋아요",
    pros: findSection(state.content, ["장점", "좋았던 점"]),
    cons: findSection(state.content, ["아쉬운 점", "단점"]),
    experience: state.content,
    recommendTarget: findSection(state.content, ["추천 대상"]),
    repurchaseIntent: findSection(state.content, ["재구매"]),
    photoReviewPoints: state.photoCaptions.filter(Boolean),
    hashtags: [],
  };
}

function contentFromReview(review: ReviewPage) {
  return [
    review.oneLineReview,
    review.ratingText,
    review.pros ? `좋았던 점\n${review.pros}` : "",
    review.cons ? `아쉬운 점\n${review.cons}` : "",
    review.experience ? `사용 후기\n${review.experience}` : "",
    review.recommendTarget ? `추천 대상\n${review.recommendTarget}` : "",
    review.repurchaseIntent ? `재구매 의사\n${review.repurchaseIntent}` : "",
    review.photoReviewPoints?.length ? `사진으로 본 포인트\n${review.photoReviewPoints.join("\n")}` : "",
    review.hashtags?.length ? review.hashtags.map((tag) => `#${tag.replace(/^#/, "")}`).join(" ") : "",
  ].filter(Boolean).join("\n\n");
}

export function buildReviewHtml(state: BlogEditorState) {
  const review = ensureReviewPage(state);
  const photoUrls = getPhotoUrls(state);
  const photoGrid = photoUrls.length
    ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(2, photoUrls.length)},1fr);gap:8px;margin:16px 0;">${photoUrls.slice(0, 4).map((url, index) => `<figure style="margin:0;"><img src="${escapeAttribute(url)}" alt="${escapeAttribute(state.photoCaptions[index] || `리뷰 사진 ${index + 1}`)}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px;" /><figcaption style="margin-top:6px;color:#94a3b8;font-size:12px;text-align:center;">${escapeHtml(state.photoCaptions[index] || "사진 설명")}</figcaption></figure>`).join("")}</div>`
    : "";
  return `<article style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.75;color:#1f2937;"><section style="padding:20px;border-radius:24px;background:linear-gradient(135deg,#eff6ff,#fffbeb);"><p style="margin:0;color:#2563eb;font-size:13px;font-weight:900;">${escapeHtml(review.productName || "리뷰")}</p><h1 style="margin:8px 0 0;color:#0f172a;font-size:24px;line-height:1.3;">${escapeHtml(review.oneLineReview || state.selectedTitle)}</h1><p style="margin:10px 0 0;color:#f59e0b;font-weight:900;">${escapeHtml(review.ratingText || "★★★★☆ 좋아요")}</p></section>${photoGrid}${renderReviewBox("좋았던 점", review.pros, "#eff6ff", "#1d4ed8")}${renderReviewBox("아쉬운 점", review.cons, "#fff7ed", "#c2410c")}${renderReviewBox("사용 후기", review.experience, "#ffffff", "#0f172a")}${renderReviewBox("추천 대상", review.recommendTarget, "#f0fdf4", "#15803d")}${renderReviewBox("재구매 의사", review.repurchaseIntent, "#fdf2f8", "#be185d")}${review.hashtags?.length ? `<p style="margin:18px 0 0;color:#2563eb;font-weight:800;">${review.hashtags.map((tag) => `#${escapeHtml(tag.replace(/^#/, ""))}`).join(" ")}</p>` : ""}</article>`;
}

function renderReviewBox(title: string, body?: string, background = "#f8fafc", color = "#334155") {
  if (!body?.trim()) return "";
  return `<section style="margin-top:14px;padding:16px;border-radius:18px;background:${background};"><h2 style="margin:0 0 8px;color:${color};font-size:18px;">${escapeHtml(title)}</h2><p style="margin:0;color:#475569;white-space:pre-wrap;">${escapeHtml(body)}</p></section>`;
}

function getManagedPhotos(state: BlogEditorState): EditorPhoto[] {
  if (state.editorPhotos?.length) return state.editorPhotos;
  return photosFromUrls(getPhotoUrls(state));
}

function getPhotoUrls(state: BlogEditorState) {
  if (state.editorPhotos?.length) return state.editorPhotos.map((photo) => photo.url);
  return state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function remapDecoratorsAfterMove(decorators: ImageDecorator[], fromIndex: number, toIndex: number) {
  return decorators.map((decorator) => {
    if (typeof decorator.imageIndex !== "number") return decorator;
    if (decorator.imageIndex === fromIndex) return { ...decorator, imageIndex: toIndex };
    if (fromIndex < toIndex && decorator.imageIndex > fromIndex && decorator.imageIndex <= toIndex) return { ...decorator, imageIndex: decorator.imageIndex - 1 };
    if (fromIndex > toIndex && decorator.imageIndex >= toIndex && decorator.imageIndex < fromIndex) return { ...decorator, imageIndex: decorator.imageIndex + 1 };
    return decorator;
  });
}

function normalizeDecoratorType(type: unknown): ImageDecorator["type"] {
  const value = String(type || "sparkle");
  if (value === "heart" || value === "star") return "handDrawn";
  if (value === "circle") return "circle";
  if (value === "arrow") return "arrow";
  if (value === "memo") return "memo";
  if (value === "polaroid") return "polaroid";
  if (value === "maskingTape") return "maskingTape";
  if (value === "sparkle") return "sparkle";
  return "sticker";
}

function findSection(content: string, labels: string[]) {
  const lines = content.split(/\n/);
  const index = lines.findIndex((line) => labels.some((label) => line.includes(label)));
  if (index < 0) return "";
  return lines.slice(index + 1).join("\n").split(/\n\n/)[0]?.trim() || "";
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

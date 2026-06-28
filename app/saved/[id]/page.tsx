"use client";

import { BarChart3, ChevronDown, Clipboard, Loader2, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlogEditor, buildEditorHtml } from "@/components/BlogEditor";
import { DetailEditor } from "@/components/DetailEditor";
import { PageShell } from "@/components/PageShell";
import { ReviewEditor } from "@/components/ReviewEditor";
import { ThumbnailStudio, type ThumbnailPlan } from "@/components/ThumbnailStudio";
import { authFetch } from "@/lib/auth-fetch";
import { getPost, updatePost, uploadPostPhotos } from "@/lib/posts";
import type { BlogEditorState, ContentPlatform, DesignTheme, DiarySticker, ImageDecorator } from "@/types/editor";
import type { Post } from "@/types/post";

type PolishResult = {
  decoratedTitle?: string;
  polishedContent: string;
  html: string;
  photoCaptions?: string[];
  imagePlacements: { url: string; positionHint: string; caption: string }[];
  imageDecorators?: ImageDecorator[];
  diaryStickers?: DiarySticker[];
  designOptions?: Record<string, unknown>;
  improvementSummary: string[];
};

type TrendResult = {
  summary: string;
  keywords: string[];
  expressions: string[];
  contentAngles: string[];
  titleIdeas: string[];
  quickWins: string[];
};

type RewriteResult = {
  mode: string;
  title: string;
  content: string;
  summary: string;
};

type AnalyzeResult = {
  totalScore: number;
  seoScore: number;
  clickScore: number;
  readabilityScore: number;
  photoScore: number;
  empathyScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  betterTitles: string[];
  recommendedKeywords: string[];
  quickFixes: string[];
};

const platforms: ContentPlatform[] = ["naver", "tistory", "threads", "detail", "review", "brunch", "instagram", "wordpress", "general"];

export default function SavedDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [editorState, setEditorState] = useState<BlogEditorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [titleLoading, setTitleLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [polishResult, setPolishResult] = useState<PolishResult | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [rewriteResults, setRewriteResults] = useState<RewriteResult[]>([]);
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null);
  const [thumbnailPlan, setThumbnailPlan] = useState<ThumbnailPlan | null>(null);

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const data = await getPost(params.id);
      const platform = getPlatform(data);
      if (platform === "threads") {
        router.replace(`/saved/threads/${data.id}`);
        return;
      }
      setPost(data);
      setEditorState(createEditorStateFromPost(data, platform));
      setPolishResult(null);
      setAnalyzeResult(null);
      setRewriteResults([]);
      setTrendResult(null);
      setThumbnailPlan(null);
    } catch (caught) {
      setError(caught instanceof Error ? `글을 불러오지 못했어요. ${caught.message}` : "글을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft() {
    if (!post || !editorState) return;
    setSaving(true);
    try {
      const photoUpload = await uploadEditorPhotos(editorState);
      const photoUrls = photoUpload.urls;
      const nextState = {
        ...editorState,
        photoUrls,
        localPhotoPreviews: photoUrls,
        editorPhotos: photoUrls.map((url, index) => ({ id: `remote-${index}-${url}`, url, isLocal: false, name: editorState.editorPhotos?.[index]?.name || `사진 ${index + 1}` })),
      };
      const updated = await updatePost(post.id, {
        travel_title: nextState.selectedTitle,
        ai_titles: nextState.titleCandidates,
        content: nextState.content,
        photo_urls: photoUrls,
        published_html: nextState.html || buildEditorHtml(nextState),
        editor_options: buildEditorOptions(post, nextState),
        html_updated_at: new Date().toISOString(),
      });
      setPost(updated);
      setEditorState((current) => current ? { ...nextState, html: updated.published_html || current.html } : current);
      showToast(photoUpload.failedCount > 0 ? "일부 사진 업로드에 실패했지만 저장했어요." : "저장했어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? `저장에 실패했어요. ${caught.message}` : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function goPublishReview() {
    if (!post || !editorState) return;
    setSaving(true);
    try {
      const photoUpload = await uploadEditorPhotos(editorState);
      const photoUrls = photoUpload.urls;
      const nextState = {
        ...editorState,
        photoUrls,
        localPhotoPreviews: photoUrls,
        editorPhotos: photoUrls.map((url, index) => ({ id: `remote-${index}-${url}`, url, isLocal: false, name: editorState.editorPhotos?.[index]?.name || `사진 ${index + 1}` })),
      };
      await updatePost(post.id, {
        travel_title: nextState.selectedTitle,
        ai_titles: nextState.titleCandidates,
        content: nextState.content,
        photo_urls: photoUrls,
        published_html: nextState.html || buildEditorHtml(nextState),
        editor_options: buildEditorOptions(post, nextState),
        html_updated_at: new Date().toISOString(),
      });
      router.push(`/publish/${post.id}`);
    } catch (caught) {
      showToast(caught instanceof Error ? `발행 검수 준비에 실패했어요. ${caught.message}` : "발행 검수 준비에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function recommendTitles() {
    if (!post || !editorState) return;
    setTitleLoading(true);
    try {
      const response = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editorState.content,
          place: post.destination || "",
          style: post.style || "",
          persona: "",
          tags: post.tags || [],
          currentTitles: editorState.titleCandidates,
          platform: editorState.platform,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "제목 추천에 실패했어요.");
      const titles = Array.isArray(data.titles) ? data.titles.map(String) : [];
      setEditorState({ ...editorState, titleCandidates: titles, selectedTitle: titles[0] || editorState.selectedTitle });
      showToast("새 제목 후보를 만들었어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "제목 추천 중 문제가 생겼어요.");
    } finally {
      setTitleLoading(false);
    }
  }

  async function polishWithAi(theme?: DesignTheme) {
    if (!post || !editorState) return;
    setPolishing(true);
    setPolishResult(null);
    try {
      const response = await authFetch("/api/polish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editorState.content,
          titles: editorState.titleCandidates,
          tags: post.tags || [],
          photoUrls: editorState.photoUrls,
          options: {
            ...editorState.editorOptions,
            platform: editorState.platform,
            style: post.style || "",
            designTheme: theme || editorState.editorOptions.designTheme,
            fontFamily: editorState.fontFamily,
            fontSize: editorState.fontSize,
            textAlign: editorState.textAlign,
            photoCaptions: editorState.photoCaptions,
            photoAnalysis: editorState.photoAnalysis || [],
            coverPhotoUrl: editorState.coverPhotoUrl || "",
            coverReason: editorState.coverReason || "",
            photoSummary: editorState.photoSummary || "",
            links: editorState.links,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI 꾸미기에 실패했어요.");
      const result = data as PolishResult;
      setPolishResult(result);
      setEditorState((current) => current ? applyPolishResult(current, result) : current);
      showToast("AI 디자이너가 글을 꾸몄어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "AI 꾸미기 중 문제가 생겼어요.");
    } finally {
      setPolishing(false);
    }
  }

  async function analyzePost() {
    if (!post || !editorState) return;
    setAnalyzeLoading(true);
    try {
      const response = await fetch("/api/analyze-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorState.selectedTitle,
          content: editorState.content,
          tags: post.tags || [],
          photoUrls: editorState.photoUrls || [],
          place: post.destination || "",
          style: post.style || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "블로그 점수 분석에 실패했어요.");
      const analyzed = data as AnalyzeResult;
      setAnalyzeResult(analyzed);
      const updated = await updatePost(post.id, {
        editor_options: { ...buildEditorOptions(post, editorState), aiScore: analyzed, aiScoreUpdatedAt: new Date().toISOString() },
      });
      setPost(updated);
      showToast("AI 블로그 코치 분석이 완료됐어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "분석 중 문제가 생겼어요.");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function generateThumbnail() {
    if (!post || !editorState) return;
    const photoUrls = editorState.localPhotoPreviews?.length ? editorState.localPhotoPreviews : editorState.photoUrls;
    if (!photoUrls.length) {
      showToast("???? ?? ??? ?? ??????.");
      return;
    }

    setThumbnailLoading(true);
    try {
      const response = await authFetch("/api/generate-thumbnail-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorState.selectedTitle,
          platform: editorState.platform,
          contentType: editorState.contentType,
          photoUrls,
          photoCaptions: editorState.photoCaptions || [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI ??? ??? ?????.");
      setThumbnailPlan(data as ThumbnailPlan);
      showToast("AI ??? ??? ?????.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "AI ??? ?? ? ??? ????.");
    } finally {
      setThumbnailLoading(false);
    }
  }

  async function loadTrendSuggestions() {
    if (!post || !editorState) return;
    setTrendLoading(true);
    try {
      const response = await authFetch("/api/trend-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorState.selectedTitle,
          content: editorState.content,
          platform: editorState.platform,
          style: post.style || "",
          tags: post.tags || [],
          place: post.destination || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "??? ??? ?????.");
      setTrendResult(data as TrendResult);
      showToast("??? ???? ?????.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "??? ?? ? ??? ????.");
    } finally {
      setTrendLoading(false);
    }
  }

  function applyTrendQuickWin(text: string) {
    if (!editorState) return;
    const nextState = {
      ...editorState,
      content: `${editorState.content.trim()}\n\n${text}`.trim(),
    };
    setEditorState({ ...nextState, html: buildEditorHtml(nextState) });
    showToast("??? ??? ??? ?????.");
  }

  async function rewritePro() {
    if (!post || !editorState) return;
    setRewriteLoading(true);
    try {
      const response = await authFetch("/api/rewrite-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorState.selectedTitle,
          content: editorState.content,
          platform: editorState.platform,
          style: post.style || "",
          tags: post.tags || [],
          photoCaptions: editorState.photoCaptions || [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI ????? ?????.");
      const rewrites = Array.isArray(data.rewrites) ? data.rewrites.map((item: Record<string, unknown>) => ({
        mode: String(item.mode || "?? ??"),
        title: String(item.title || editorState.selectedTitle),
        content: String(item.content || ""),
        summary: String(item.summary || "??? ?????."),
      })).filter((item: RewriteResult) => item.content.trim()) : [];
      setRewriteResults(rewrites);
      showToast("10?? ???? ??? ?????.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "AI ???? ? ??? ????.");
    } finally {
      setRewriteLoading(false);
    }
  }

  function applyRewriteResult(result: RewriteResult) {
    if (!editorState) return;
    const nextState = {
      ...editorState,
      selectedTitle: result.title || editorState.selectedTitle,
      content: result.content,
    };
    setEditorState({ ...nextState, html: buildEditorHtml(nextState) });
    showToast(`${result.mode} ??? ?????.`);
  }

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    showToast(message);
  }

  return (
    <PageShell>
      <section className="min-h-screen bg-white pb-24">
        {loading && (
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={30} aria-hidden="true" />
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-8">
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
              <p className="text-sm font-black">문제가 생겼어요</p>
              <p className="mt-2 text-sm leading-6">{error}</p>
              <button type="button" onClick={loadPost} className="mt-4 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">다시 불러오기</button>
            </div>
          </div>
        )}

        {!loading && post && editorState && (
          <>
            {editorState.platform === "detail" ? (
              <DetailEditor
                state={editorState}
                onChange={setEditorState}
                onSave={() => { void saveDraft(); }}
                onPolish={polishWithAi}
                onPublishReview={goPublishReview}
                saving={saving}
                polishing={polishing}
              />
            ) : editorState.platform === "review" ? (
              <ReviewEditor
                state={editorState}
                onChange={setEditorState}
                onSave={() => { void saveDraft(); }}
                onPolish={polishWithAi}
                onPublishReview={goPublishReview}
                saving={saving}
                polishing={polishing}
              />
            ) : (
              <BlogEditor
                state={editorState}
                onChange={setEditorState}
                onSave={() => { void saveDraft(); }}
                onPolish={polishWithAi}
                onPublishReview={goPublishReview}
                onRecommendTitles={recommendTitles}
                saving={saving}
                polishing={polishing}
                titleLoading={titleLoading}
              />
            )}

            <div className="px-5 py-5">
              <details className="group rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-950">고급 편집 / 분석</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">HTML 복사와 AI 블로그 코치를 접어서 관리해요.</p>
                  </div>
                  <ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={20} aria-hidden="true" />
                </summary>
                <div className="mt-5 space-y-4">
                  {polishResult && <PolishSummary result={polishResult} />}
                  <div className="grid grid-cols-2 gap-2">
                    <SecondaryAction label="HTML 복사" onClick={() => copyText(editorState.html || buildEditorHtml(editorState), "HTML을 복사했어요.")} />
                    <SecondaryAction label="본문 복사" onClick={() => copyText(editorState.content, "본문을 복사했어요.")} />
                  </div>
                  <section className="rounded-2xl bg-white p-4">
                    <div className="flex items-center gap-2"><BarChart3 className="text-blue-600" size={18} aria-hidden="true" /><h3 className="text-sm font-black text-slate-950">AI 블로그 코치</h3></div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">SEO, 클릭률, 가독성, 사진 활용, 공감도를 점수로 확인해요.</p>
                    <button type="button" onClick={analyzePost} disabled={analyzeLoading} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 text-sm font-bold text-white disabled:opacity-60">
                      {analyzeLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <BarChart3 size={16} aria-hidden="true" />}
                      {analyzeLoading ? "분석 중" : "블로그 점수 분석하기"}
                    </button>
                    {analyzeResult && <AnalyzeResultCard result={analyzeResult} />}
                  </section>
                </div>
              </details>
            </div>
          </>
        )}
      </section>
      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
    </PageShell>
  );
}

function createEditorStateFromPost(post: Post, platform: ContentPlatform): BlogEditorState {
  const options = post.editor_options || {};
  const titles = post.ai_titles || [];
  const photoCaptions = getStringArray(options.photoCaptions) || getStringArray(options.captions) || post.photo_urls.map(() => "사진 설명 추가");
  const links = Array.isArray(options.links) ? options.links.filter((item) => item && typeof item === "object").map((item) => {
    const record = item as Record<string, unknown>;
    const type: "link" | "map" | "youtube" = record.type === "map" || record.type === "youtube" || record.type === "link" ? record.type : "link";
    return { label: String(record.label || "링크"), url: String(record.url || ""), type };
  }).slice(0, 5) : [];
  const photoDecorators = Array.isArray(options.imageDecorators) ? options.imageDecorators as ImageDecorator[] : [];
  const photoAnalysis = Array.isArray(options.photoAnalysis) ? options.photoAnalysis as BlogEditorState["photoAnalysis"] : undefined;
  const detailPage = options.detailPage && typeof options.detailPage === "object" && !Array.isArray(options.detailPage) ? options.detailPage as BlogEditorState["detailPage"] : undefined;
  const base: BlogEditorState = {
    selectedTitle: post.travel_title || titles[0] || "제목 없음",
    titleCandidates: titles.length > 0 ? titles : [post.travel_title || "제목 없음"],
    content: post.content || "",
    html: post.published_html || "",
    editorPhotos: (post.photo_urls || []).map((url, index) => ({ id: `remote-${index}-${url}`, url, isLocal: false, name: `사진 ${index + 1}` })),
    photoUrls: post.photo_urls || [],
    localPhotoPreviews: [],
    photoCaptions,
    photoDecorators,
    photoAnalysis,
    coverPhotoUrl: typeof options.coverPhotoUrl === "string" ? options.coverPhotoUrl : undefined,
    coverReason: typeof options.coverReason === "string" ? options.coverReason : undefined,
    photoSummary: typeof options.photoSummary === "string" ? options.photoSummary : undefined,
    attachments: (post.attachment_urls || []).map((url, index) => ({ name: `첨부파일 ${index + 1}`, url })),
    links,
    platform,
    contentType: platform === "threads" ? "threads" : platform === "detail" ? "detail" : platform === "review" ? "review" : "blog",
    fontFamily: typeof options.fontFamily === "string" ? options.fontFamily : "기본",
    fontSize: typeof options.fontSize === "string" ? options.fontSize : "기본",
    textAlign: options.textAlign === "center" || options.textAlign === "right" ? options.textAlign : "left",
    pointIcon: typeof options.pointIcon === "string" ? options.pointIcon : "✅",
    emojiHeadings: typeof options.emojiHeadings === "boolean" ? options.emojiHeadings : true,
    paragraphSpacing: typeof options.paragraphSpacing === "boolean" ? options.paragraphSpacing : false,
    showCaptions: typeof options.showCaptions === "boolean" ? options.showCaptions : true,
    detailPage,
    reviewPage: options.reviewPage && typeof options.reviewPage === "object" && !Array.isArray(options.reviewPage) ? options.reviewPage as BlogEditorState["reviewPage"] : undefined,
    editorOptions: options,
  };
  return { ...base, html: post.published_html || buildEditorHtml(base) };
}

function buildEditorOptions(post: Post, state: BlogEditorState) {
  return {
    ...(post.editor_options || {}),
    ...state.editorOptions,
    platform: state.platform,
    contentType: state.contentType,
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    textAlign: state.textAlign,
    pointIcon: state.pointIcon,
    emojiHeadings: state.emojiHeadings,
    paragraphSpacing: state.paragraphSpacing,
    showCaptions: state.showCaptions,
    photoCaptions: state.photoCaptions,
    links: state.links || [],
    attachments: state.attachments || [],
    imageDecorators: state.photoDecorators || [],
    photoAnalysis: state.photoAnalysis || [],
    coverPhotoUrl: state.coverPhotoUrl || "",
    coverReason: state.coverReason || "",
    photoSummary: state.photoSummary || "",
    detailPage: state.detailPage,
    reviewPage: state.reviewPage,
  };
}

async function uploadEditorPhotos(state: BlogEditorState) {
  const photos = state.editorPhotos || [];
  if (photos.length === 0) return { urls: state.photoUrls || [], failedCount: 0 };

  const localPhotos = photos.filter((photo) => photo.file);
  const uploadedUrls = await uploadPostPhotos(localPhotos.map((photo) => photo.file as File));
  let uploadIndex = 0;
  let failedCount = 0;

  const urls = photos.flatMap((photo) => {
    if (!photo.file) return [photo.url];
    const uploadedUrl = uploadedUrls[uploadIndex];
    uploadIndex += 1;
    if (!uploadedUrl) {
      failedCount += 1;
      return [];
    }
    return [uploadedUrl];
  });

  return { urls, failedCount };
}

function applyPolishResult(current: BlogEditorState, result: PolishResult): BlogEditorState {
  const mergedCaptions = current.photoUrls.map((_, index) => result.photoCaptions?.[index] || result.imagePlacements?.[index]?.caption || current.photoCaptions[index] || "사진 설명 추가");
  const decoratedTitle = result.decoratedTitle?.trim();
  const next: BlogEditorState = {
    ...current,
    selectedTitle: current.selectedTitle,
    titleCandidates: decoratedTitle ? [decoratedTitle, ...current.titleCandidates.filter((title) => title !== decoratedTitle)].slice(0, 5) : current.titleCandidates,
    content: result.polishedContent || current.content,
    html: result.html || current.html,
    photoCaptions: mergedCaptions,
    photoDecorators: [...(current.photoDecorators || []), ...(result.imageDecorators || [])],
    editorOptions: {
      ...current.editorOptions,
      aiDesigner: result.designOptions || {},
      designTheme: result.designOptions?.theme || current.editorOptions.designTheme,
      diaryStickers: result.diaryStickers || [],
      imagePlacements: result.imagePlacements || [],
      imageDecorators: [...(current.photoDecorators || []), ...(result.imageDecorators || [])],
      photoCaptions: mergedCaptions,
      detailPage: current.detailPage,
    },
  };
  return next;
}

function getPlatform(post: Post): ContentPlatform {
  const value = post.editor_options?.platform;
  if (platforms.includes(value as ContentPlatform)) return value as ContentPlatform;
  if (post.style === "threads") return "threads";
  if (post.style?.toLowerCase().includes("tistory")) return "tistory";
  if (post.style?.toLowerCase().includes("review") || post.editor_options?.contentType === "review") return "review";
  return "naver";
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String) : null;
}

function SecondaryAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard size={15} aria-hidden="true" />{label}</button>;
}

function PolishSummary({ result }: { result: PolishResult }) {
  return (
    <section className="rounded-2xl bg-blue-50 p-4 text-blue-800">
      <div className="flex items-center gap-2"><Sparkles size={17} aria-hidden="true" /><h3 className="text-sm font-black">AI 디자이너 적용 결과</h3></div>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        {result.improvementSummary.map((item) => <li key={item}>- {item}</li>)}
        {result.imageDecorators && result.imageDecorators.length > 0 && <li>- 사진 데코레이터 {result.imageDecorators.length}개를 준비했어요.</li>}
      </ul>
    </section>
  );
}



function TrendResultCard({ result, onApply }: { result: TrendResult; onApply: (text: string) => void }) {
  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-bold leading-5 text-slate-600">{result.summary}</p>
      <TrendList title="?? ???" items={result.keywords} />
      <TrendList title="?? ??" items={result.expressions} />
      <TrendList title="??? ??" items={result.contentAngles} />
      <TrendList title="?? ????" items={result.titleIdeas} />
      {result.quickWins.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black text-slate-500">?? ??</p>
          <div className="grid gap-2">
            {result.quickWins.slice(0, 4).map((item) => (
              <button key={item} type="button" onClick={() => onApply(item)} className="rounded-xl bg-white px-3 py-2 text-left text-xs font-bold leading-5 text-blue-700 shadow-sm">
                + {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-black text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 8).map((item) => <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 shadow-sm">{item}</span>)}
      </div>
    </div>
  );
}

function RewriteResultList({ results, onApply }: { results: RewriteResult[]; onApply: (result: RewriteResult) => void }) {
  return (
    <div className="mt-3 grid gap-2">
      {results.map((result) => (
        <article key={`${result.mode}-${result.title}`} className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-black text-blue-700">{result.mode}</p>
              <h4 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{result.title}</h4>
            </div>
            <button type="button" onClick={() => onApply(result)} className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">??</button>
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{result.summary}</p>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{result.content}</p>
        </article>
      ))}
    </div>
  );
}

function AnalyzeResultCard({ result }: { result: AnalyzeResult }) {
  const scores = [
    { label: "SEO", value: result.seoScore },
    { label: "클릭률 예상", value: result.clickScore },
    { label: "가독성", value: result.readabilityScore },
    { label: "사진 활용", value: result.photoScore },
    { label: "공감도", value: result.empathyScore },
  ];
  return <div className="mt-4 space-y-3"><div className="rounded-3xl bg-slate-950 p-5 text-white"><p className="text-sm font-bold text-blue-200">총점</p><div className="mt-2 flex items-end gap-2"><span className="text-5xl font-black">{result.totalScore}</span><span className="pb-1 text-sm font-bold text-slate-300">/ 100</span></div><p className="mt-3 text-sm leading-6 text-slate-200">{result.summary}</p></div>{scores.map((score) => <ScoreRow key={score.label} label={score.label} value={score.value} />)}</div>;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-slate-800">{label}</span><span className="text-sm font-black text-blue-700">{value}점</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>;
}









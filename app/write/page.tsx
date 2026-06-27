"use client";

import {
  AlertCircle,
  CalendarDays,
  Clipboard,
  ImagePlus,
  Loader2,
  MapPin,
  PenLine,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { BlogEditor, buildEditorHtml } from "@/components/BlogEditor";
import { PageShell } from "@/components/PageShell";
import { createPost, updatePost, uploadPostAttachments, uploadPostPhotos } from "@/lib/posts";
import type { BlogEditorState, ImageDecorator } from "@/types/editor";

const styles = [
  "감성형",
  "정보형",
  "여행형",
  "맛집후기형",
  "카페후기형",
  "제품리뷰형",
  "육아일상형",
  "체험후기형",
  "일기형",
];

const personas = [
  "😊 친한 친구처럼",
  "✨ 감성 작가처럼",
  "📰 기자처럼",
  "📚 여행 작가처럼",
  "👩 엄마 블로거처럼",
  "👨 IT 리뷰어처럼",
  "📈 SEO 전문가처럼",
  "😄 활발하고 밝은 스타일",
  "😌 차분하고 신뢰감 있는 스타일",
  "😂 유쾌한 스타일",
  "💼 전문가 스타일",
  "💖 따뜻한 공감형",
  "🎨 나만의 스타일",
];

type GeneratedPost = {
  titles: string[];
  content: string;
  tags: string[];
  hooks?: string[];
  alternatives?: string[];
};

type PhotoPreview = {
  name: string;
  url: string;
};

type PlacementCandidate = {
  label: string;
  description: string;
  photo: PhotoPreview;
};

type PolishResult = {
  decoratedTitle?: string;
  polishedContent?: string;
  html?: string;
  photoCaptions?: string[];
  imagePlacements?: { url: string; positionHint: string; caption: string }[];
  imageDecorators?: ImageDecorator[];
  designOptions?: Record<string, unknown>;
  improvementSummary?: string[];
};

export default function WritePage() {
  return (
    <Suspense fallback={<PageShell><section className="px-5 py-8 text-sm font-bold text-slate-500">작성 화면을 불러오는 중이에요.</section></PageShell>}>
      <WritePageContent />
    </Suspense>
  );
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platformParam = (searchParams.get("platform") || "general") as BlogEditorState["platform"];
  if (platformParam === "threads") return <ThreadWritePage />;
  if (platformParam === "detail") return <DetailWritePage />;
  const placementRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState("");
  const [keywords, setKeywords] = useState("");
  const [memo, setMemo] = useState("");
  const [style, setStyle] = useState(styles[0]);
  const [persona, setPersona] = useState(personas[0]);
  const [customPersona, setCustomPersona] = useState("");
  // Later this can become a saved per-user voice profile.
  const [referenceText, setReferenceText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const [showSavedAction, setShowSavedAction] = useState(false);
  const [savedPostId, setSavedPostId] = useState("");
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [content, setContent] = useState("");
  const [editedHtml, setEditedHtml] = useState("");
  const [editorState, setEditorState] = useState<BlogEditorState | null>(null);

  useEffect(() => {
    const previews = photos.map((photo) => ({
      name: photo.name,
      url: URL.createObjectURL(photo),
    }));

    setPhotoPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [photos]);

  useEffect(() => {
    if (result) setEditedHtml(buildPreviewHtml(content, photoPreviews));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoPreviews.length]);

  const placementCandidates = useMemo(
    () => createPlacementCandidates(photoPreviews, content),
    [photoPreviews, content],
  );

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function requestGeneratedPost() {
    setLoading(true);
    setError("");
    setSaveError("");
    setToast("");
    setShowSavedAction(false);

    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          place,
          date,
          keywords,
          memo,
          style,
          persona,
          customPersona,
          referenceText,
          platform: platformParam,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI 초안 생성에 실패했어요.");
      }

      const generated = data as GeneratedPost;
      setResult(generated);
      setSelectedTitle(generated.titles[0] || title || "블로그 초안");
      setContent(generated.content);
      setEditedHtml(buildPreviewHtml(generated.content, photoPreviews));
      setEditorState(createInitialEditorState(generated, generated.content, photoPreviews, title, platformParam));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "OpenAI 초안 생성에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestGeneratedPost();
  }

  async function copyPost() {
    const tagText = result?.tags.map((tag) => `#${tag}`).join(" ") || "";
    await navigator.clipboard.writeText(`${selectedTitle}\n\n${content}\n\n${tagText}`);
    showToast("초안을 클립보드에 복사했어요.");
  }

  async function saveDraft() {
    if (!result) return "";

    setSaving(true);
    setSaveError("");
    setShowSavedAction(false);

    try {
      const photoUrls = await uploadPostPhotos(photos);
      const attachmentUrls = await uploadPostAttachments(attachments);
      const currentState = editorState;
      const html = currentState?.html || editorRef.current?.innerHTML || editedHtml || buildPreviewHtml(content, photoUrls.map((url, index) => ({ name: photos[index]?.name || `사진 ${index + 1}`, url })));
      const saved = savedPostId
        ? await updatePost(savedPostId, {
            travel_title: currentState?.selectedTitle || selectedTitle,
            ai_titles: result.titles,
            content: currentState?.content || content,
            tags: result.tags,
            photo_urls: photoUrls,
            attachment_urls: attachmentUrls,
            published_html: html,
            editor_options: { ...(currentState?.editorOptions || {}), attachments: attachmentUrls, links: currentState?.links, photoCaptions: currentState?.photoCaptions, imageDecorators: currentState?.photoDecorators },
            html_updated_at: new Date().toISOString(),
          })
        : await createPost({
        user_id: "guest",
        travel_title: currentState?.selectedTitle || selectedTitle || title,
        destination: place,
        travel_date: date,
        keywords,
        style,
        ai_titles: result.titles,
        content: currentState?.content || content,
        tags: result.tags,
        photo_urls: photoUrls,
        attachment_urls: attachmentUrls,
        published_html: html,
        editor_options: { ...(currentState?.editorOptions || {}), attachments: attachmentUrls, links: currentState?.links, photoCaptions: currentState?.photoCaptions, imageDecorators: currentState?.photoDecorators },
        html_updated_at: new Date().toISOString(),
        status: "draft",
        scheduled_at: null,
        published_at: null,
        naver_post_url: null,
      });
      setSavedPostId(saved.id);
      setEditedHtml(html);

      if (photoUrls.length < photos.length) {
        showToast("사진 일부 업로드 실패, 수정 중인 글로 저장했어요.");
      } else {
        showToast("수정 중인 글로 저장했어요. 저장함에서 이어서 수정할 수 있어요.");
      }
      setShowSavedAction(true);
      return saved.id;
    } catch (caught) {
      setSaveError(
        caught instanceof Error
          ? `저장에 실패했어요. ${caught.message}`
          : "저장에 실패했어요. Supabase 연결과 posts 테이블을 확인해주세요.",
      );
      return "";
    } finally {
      setSaving(false);
    }
  }

  function showPhotoPlacementGuide() {
    if (photoPreviews.length === 0) {
      showToast("사진을 먼저 추가해주세요.");
      return;
    }

    placementRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function regenerateLayout() {
    setEditedHtml(buildPreviewHtml(content, photoPreviews));
    showToast("사진 배치를 다시 정리했어요.");
  }

  function applyEditorCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
    setEditedHtml(editorRef.current?.innerHTML || "");
  }

  async function goPublishReview() {
    if (!result) return;
    const id = await saveDraft();
    if (id) router.push(`/publish/${id}`);
  }

  async function recommendEditorTitles() {
    if (!editorState) return;
    setLoading(true);
    try {
      const response = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editorState.content,
          place,
          style,
          persona,
          tags: result?.tags || [],
          currentTitles: editorState.titleCandidates,
          platform: platformParam,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "제목 추천에 실패했어요.");
      const titles = Array.isArray(data.titles) ? data.titles.map(String) : [];
      const nextState = { ...editorState, titleCandidates: titles, selectedTitle: titles[0] || editorState.selectedTitle };
      setEditorState(nextState);
      setSelectedTitle(nextState.selectedTitle);
      showToast("새 제목 후보를 만들었어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "제목 추천 중 문제가 생겼어요.");
    } finally {
      setLoading(false);
    }
  }
  async function polishDraft() {
    if (!result) return;
    setLoading(true);
    try {
      const response = await fetch("/api/polish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          titles: result.titles,
          tags: result.tags,
          photoUrls: photoPreviews.map((photo) => photo.url),
          options: { ...(editorState?.editorOptions || {}), fontFamily: editorState?.fontFamily || "기본", fontSize: editorState?.fontSize || "기본", textAlign: editorState?.textAlign || "left", platform: platformParam, photoCaptions: editorState?.photoCaptions || [], links: editorState?.links || [] },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "AI 꾸미기에 실패했어요.");
      const polished = data as PolishResult;
      setContent(polished.polishedContent || content);
      setEditedHtml(polished.html || editedHtml);
      if (editorState) {
        const mergedCaptions = editorState.photoCaptions.map((caption, index) => polished.photoCaptions?.[index] || polished.imagePlacements?.[index]?.caption || caption);
        const decoratedTitle = polished.decoratedTitle?.trim();
        const nextState: BlogEditorState = {
          ...editorState,
          selectedTitle: decoratedTitle || editorState.selectedTitle,
          titleCandidates: decoratedTitle ? [decoratedTitle, ...editorState.titleCandidates.filter((item) => item !== decoratedTitle)].slice(0, 5) : editorState.titleCandidates,
          content: polished.polishedContent || editorState.content,
          html: polished.html || editorState.html,
          photoCaptions: mergedCaptions,
          photoDecorators: [...(editorState.photoDecorators || []), ...(polished.imageDecorators || [])],
          editorOptions: {
            ...editorState.editorOptions,
            aiDesigner: polished.designOptions || {},
            imagePlacements: polished.imagePlacements || [],
            imageDecorators: [...(editorState.photoDecorators || []), ...(polished.imageDecorators || [])],
            photoCaptions: mergedCaptions,
          },
        };
        setEditorState(nextState);
        setSelectedTitle(nextState.selectedTitle);
      }
      showToast("AI 디자이너가 글을 꾸몄어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : "AI 꾸미기 중 문제가 생겼어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-normal text-slate-950">
            콘텐츠 작성하기
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            주제, 장소, 키워드, 상황 설명을 넣으면 플랫폼에 맞는 초안을 만들어드려요.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-4">
              <Field
                label="제목"
                placeholder="예: 아이와 다녀온 조용한 카페 후기"
                icon={<PenLine size={18} />}
                value={title}
                onChange={setTitle}
              />
              <div>
                <Field
                  label="장소"
                  placeholder="예: 후모톳바라 캠핑장, 울산 성남동 카페"
                  icon={<MapPin size={18} />}
                  value={place}
                  onChange={setPlace}
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  장소 검색과 지도 연동은 다음 Sprint에서 연결할 예정이에요.
                </p>
              </div>
              <Field
                label="날짜"
                type="date"
                icon={<CalendarDays size={18} />}
                value={date}
                onChange={setDate}
              />
              <Field
                label="키워드"
                placeholder="예: 조용한 카페, 아이와 함께, 산미 적은 커피"
                icon={<Sparkles size={18} />}
                value={keywords}
                onChange={setKeywords}
                required
              />
              <MemoField value={memo} onChange={setMemo} />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-bold text-slate-950">글쓰기 스타일</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {styles.map((item) => (
                <ChoiceLabel
                  key={item}
                  name="style"
                  value={item}
                  checked={style === item}
                  onChange={() => setStyle(item)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-2">
              <Wand2 className="text-blue-600" size={19} aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-950">AI 성격</h2>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {personas.map((item) => (
                <PersonaChip
                  key={item}
                  value={item}
                  checked={persona === item}
                  onChange={() => setPersona(item)}
                />
              ))}
            </div>
            {persona === "🎨 나만의 스타일" && (
              <label className="mt-4 block">
                <span className="text-sm font-bold text-slate-700">나만의 AI 성격</span>
                <input
                  value={customPersona}
                  onChange={(event) => setCustomPersona(event.target.value)}
                  placeholder="예: 존댓말로, 문장은 짧게, 감성 표현은 적당히, 정보는 자세하게"
                  className="mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                />
              </label>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <label className="block">
              <span className="text-base font-bold text-slate-950">
                기존 블로그 글 붙여넣기
              </span>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                기존에 작성한 글을 붙여넣으면 말투와 문체를 참고해요.
              </p>
              <textarea
                value={referenceText}
                onChange={(event) => setReferenceText(event.target.value)}
                placeholder="예전에 내가 쓴 블로그 글을 1~3개 정도 붙여넣어 주세요. 문장 길이, 말투, 이모티콘, 마무리 방식을 참고합니다."
                className="mt-3 min-h-40 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              1차 MVP에서는 저장하지 않고 이번 생성 요청에만 사용해요.
            </p>
          </div>

          <PhotoUploader photoPreviews={photoPreviews} setPhotos={setPhotos} />
          <AttachmentUploader files={attachments} setFiles={setAttachments} />

          {error && <ErrorCard message={error} />}

          <Button type="submit" disabled={loading} className="gap-2 disabled:opacity-60">
            {loading && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
            {loading ? "AI 콘텐츠 생성 중" : "AI 콘텐츠 만들기"}
          </Button>
        </form>

        {result && (
          <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-blue-600">AI 결과</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  초안이 완성됐어요
                </h2>
              </div>
              <button
                type="button"
                onClick={copyPost}
                className="flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white"
              >
                <Clipboard size={17} aria-hidden="true" />
                복사
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">추천 제목</p>
              {result.titles.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedTitle(item)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                    selectedTitle === item
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-100 bg-slate-50 text-slate-600"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {editorState && (
              <div className="mt-5">
                <BlogEditor
                  state={editorState}
                  onChange={(next) => {
                    setEditorState(next);
                    setSelectedTitle(next.selectedTitle);
                    setContent(next.content);
                    setEditedHtml(next.html);
                  }}
                  onSave={() => { void saveDraft(); }}
                  onPolish={polishDraft}
                  onPublishReview={goPublishReview}
                  onRegenerateLayout={regenerateLayout}
                  onRecommendTitles={recommendEditorTitles}
                  saving={saving}
                  polishing={loading}
                />
              </div>
            )}
            <div className="mt-5">
              <p className="text-sm font-bold text-slate-700">태그</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <PhotoPlacementPreview refEl={placementRef} candidates={placementCandidates} />

            {saveError && <div className="mt-5"><ErrorCard message={saveError} /></div>}
            {showSavedAction && (
              <div className="mt-5 rounded-3xl bg-blue-50 p-4 text-blue-800">
                <p className="text-sm font-black">임시저장 완료</p>
                <p className="mt-1 text-sm leading-6">수정 중인 글로 저장했어요. 저장함에서 이어서 수정할 수 있어요.</p>
                <button
                  type="button"
                  onClick={() => router.push("/saved")}
                  className="mt-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                >
                  저장함 보기
                </button>
              </div>
            )}

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                {saving ? "사진 업로드 및 임시저장 중" : "임시저장"}
              </button>
              <button
                type="button"
                onClick={regenerateLayout}
                className="min-h-12 w-full rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white"
              >
                본문 배치 재생성
              </button>
              <button
                type="button"
                onClick={polishDraft}
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
                AI가 보기 좋게 꾸미기
              </button>
              <button
                type="button"
                onClick={requestGeneratedPost}
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                ) : (
                  <RefreshCw size={17} aria-hidden="true" />
                )}
                재생성
              </button>
              <button
                type="button"
                onClick={goPublishReview}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white"
              >
                <Send size={17} aria-hidden="true" />
                발행 전 검수
              </button>
              <button
                type="button"
                onClick={copyPost}
                className="min-h-12 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700"
              >
                복사해서 발행하기
              </button>
            </div>
          </section>
        )}
      </section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}
    </PageShell>
  );
}

function DetailWritePage() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [category, setCategory] = useState("");
  const [keyBenefits, setKeyBenefits] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [priceInfo, setPriceInfo] = useState("");
  const [useCase, setUseCase] = useState("");
  const [cautions, setCautions] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("프리미엄형");
  const [photos, setPhotos] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [links, setLinks] = useState([{ label: "", url: "" }]);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [editorState, setEditorState] = useState<BlogEditorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previews = photos.map((photo) => ({ name: photo.name, url: URL.createObjectURL(photo) }));
    setPhotoPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [photos]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    setLinks((current) => current.map((link, linkIndex) => linkIndex === index ? { ...link, [field]: value } : link));
  }

  function addLink() {
    setLinks((current) => current.length >= 5 ? current : [...current, { label: "", url: "" }]);
  }

  async function generateDetail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const memo = [
        `브랜드/판매자: ${brandName}`,
        `카테고리: ${category}`,
        `핵심 장점: ${keyBenefits}`,
        `대상 고객: ${targetCustomer}`,
        `가격/혜택: ${priceInfo}`,
        `사용 상황: ${useCase}`,
        `주의사항/배송/구성품: ${cautions}`,
        `참고 링크: ${links.filter((link) => link.url.trim()).map((link) => `${link.label || "링크"}: ${link.url}`).join("\n")}`,
      ].join("\n");
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: productName, place: brandName, keywords, memo, style: tone, platform: "detail" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "상세페이지 생성에 실패했어요.");
      const generated = data as GeneratedPost;
      setResult(generated);
      const state = createInitialEditorState(generated, generated.content, photoPreviews, productName, "detail");
      const detailLinks = links.filter((link) => link.url.trim()).map((link) => ({ label: link.label || "참고 링크", url: link.url, type: "link" as const }));
      const nextState: BlogEditorState = {
        ...state,
        links: detailLinks,
        detailPage: {
          productName,
          brandName,
          category,
          targetCustomer,
          keyBenefits: keyBenefits.split(/,|\n/).map((item) => item.trim()).filter(Boolean),
          priceInfo,
          components: cautions,
          cautions,
          ctaText: "구매하러 가기",
        },
        editorOptions: { ...state.editorOptions, platform: "detail", links: detailLinks, detailPage: { productName, brandName, category, targetCustomer, keyBenefits, priceInfo, useCase, cautions } },
      };
      nextState.html = buildEditorHtml(nextState);
      setEditorState(nextState);
      showToast("상세페이지 초안을 만들었어요.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "상세페이지 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveDetail() {
    if (!result || !editorState) return;
    setSaving(true);
    try {
      const photoUrls = await uploadPostPhotos(photos);
      const attachmentUrls = await uploadPostAttachments(attachments);
      const html = editorState.html || buildEditorHtml(editorState);
      const saved = await createPost({
        user_id: "guest",
        travel_title: editorState.selectedTitle || productName,
        destination: brandName,
        travel_date: "",
        keywords,
        style: tone,
        ai_titles: editorState.titleCandidates,
        content: editorState.content,
        tags: result.tags,
        photo_urls: photoUrls,
        attachment_urls: attachmentUrls,
        published_html: html,
        editor_options: { ...editorState.editorOptions, platform: "detail", contentType: "detail", links: editorState.links, photoCaptions: editorState.photoCaptions, imageDecorators: editorState.photoDecorators, attachmentUrls },
        html_updated_at: new Date().toISOString(),
        status: "draft",
        scheduled_at: null,
        published_at: null,
        naver_post_url: null,
      });
      showToast("상세페이지를 저장했어요.");
      router.push(`/saved/${saved.id}`);
    } catch (caught) {
      showToast(caught instanceof Error ? `저장에 실패했어요. ${caught.message}` : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">상세페이지 만들기</p>
          <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">상품을 판매 페이지로 바꿔보세요</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">상품 사진과 장점만 넣으면 모바일 쇼핑몰용 상세페이지 초안을 만들어드려요.</p>
        </div>

        <form className="space-y-4" onSubmit={generateDetail}>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-4">
              <Field label="상품명" placeholder="예: 후모톳파라 감성 캠핑 의자" icon={<PenLine size={18} />} value={productName} onChange={setProductName} required />
              <Field label="브랜드/판매자명" placeholder="예: Trip Goods" icon={<Sparkles size={18} />} value={brandName} onChange={setBrandName} />
              <Field label="상품 카테고리" placeholder="예: 캠핑용품, 카페 원두, 육아용품" icon={<Sparkles size={18} />} value={category} onChange={setCategory} />
              <MemoInput label="핵심 장점" value={keyBenefits} onChange={setKeyBenefits} placeholder="예: 가볍고 접기 쉬움, 방수 원단, 감성 컬러, 무료배송" required />
              <Field label="대상 고객" placeholder="예: 미니멀 캠핑을 좋아하는 30대" icon={<Sparkles size={18} />} value={targetCustomer} onChange={setTargetCustomer} />
              <Field label="가격 또는 혜택" placeholder="예: 39,900원, 2개 구매 시 무료배송" icon={<Sparkles size={18} />} value={priceInfo} onChange={setPriceInfo} />
              <MemoInput label="사용 상황" value={useCase} onChange={setUseCase} placeholder="예: 캠핑장, 피크닉, 베란다 홈카페에서 쓰기 좋아요." />
              <MemoInput label="주의사항/배송/구성품" value={cautions} onChange={setCautions} placeholder="예: 본품 1개, 파우치 포함. 제주/도서산간 추가 배송비가 있어요." />
              <Field label="키워드" placeholder="예: 캠핑의자, 감성캠핑, 접이식의자" icon={<Sparkles size={18} />} value={keywords} onChange={setKeywords} required />
              <div>
                <p className="text-sm font-bold text-slate-700">톤 선택</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["프리미엄형", "감성형", "실속형", "리뷰형", "공동구매형", "상세 스펙형"].map((item) => <ChoiceLabel key={item} name="detail-tone" value={item} checked={tone === item} onChange={() => setTone(item)} />)}
                </div>
              </div>
            </div>
          </div>

          <PhotoUploader photoPreviews={photoPreviews} setPhotos={setPhotos} />
          <AttachmentUploader files={attachments} setFiles={setAttachments} />
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-950">참고 링크</h2><button type="button" onClick={addLink} className="text-sm font-black text-blue-600">추가</button></div>
            <div className="mt-3 space-y-2">{links.map((link, index) => <div key={index} className="rounded-2xl bg-slate-50 p-3"><input value={link.label} onChange={(event) => updateLink(index, "label", event.target.value)} placeholder="링크 이름" className="h-10 w-full rounded-xl bg-white px-3 text-sm outline-none" /><input value={link.url} onChange={(event) => updateLink(index, "url", event.target.value)} placeholder="https://" className="mt-2 h-10 w-full rounded-xl bg-white px-3 text-sm outline-none" /></div>)}</div>
          </div>
          {error && <ErrorCard message={error} />}
          <Button type="submit" disabled={loading} className="gap-2 disabled:opacity-60">{loading && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}{loading ? "상세페이지 생성 중" : "AI 상세페이지 만들기"}</Button>
        </form>

        {editorState && <div className="mt-6"><BlogEditor state={editorState} onChange={setEditorState} onSave={() => { void saveDetail(); }} onPolish={() => showToast("AI 상세페이지 디자이너는 저장 후 상세 화면에서 더 정교하게 적용할 수 있어요.")} onPublishReview={() => { void saveDetail(); }} saving={saving} polishing={loading} /></div>}
      </section>
      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
    </PageShell>
  );
}
function ThreadWritePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("친근하고 자연스럽게");
  const [keywords, setKeywords] = useState("");
  const [memo, setMemo] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previews = photos.map((photo) => ({ name: photo.name, url: URL.createObjectURL(photo) }));
    setPhotoPreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [photos]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function generateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic,
          keywords,
          memo: `핵심 메시지: ${message}\n참고 메모: ${memo}`,
          style: "스레드",
          persona: tone,
          platform: "threads",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "스레드 문구 생성에 실패했어요.");
      setResult(data as GeneratedPost);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "스레드 문구 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function copyThread() {
    if (!result) return;
    await navigator.clipboard.writeText(`${result.content}\n\n${result.tags.map((tag) => `#${tag}`).join(" ")}`);
    showToast("스레드 문구를 복사했어요.");
  }

  async function saveThread() {
    if (!result) return;
    setSaving(true);
    try {
      const photoUrls = await uploadPostPhotos(photos);
      await createPost({
        user_id: "guest",
        travel_title: topic || "스레드 초안",
        destination: "",
        travel_date: "",
        keywords,
        style: "threads",
        ai_titles: result.titles,
        content: result.content,
        tags: result.tags,
        photo_urls: photoUrls,
        attachment_urls: [],
        published_html: null,
        editor_options: { platform: "threads", hooks: result.hooks, alternatives: result.alternatives },
        html_updated_at: null,
        status: "draft",
        scheduled_at: null,
        published_at: null,
        naver_post_url: null,
      });
      showToast("스레드 초안을 저장했어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? `저장에 실패했어요. ${caught.message}` : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">스레드 작성</p>
          <h1 className="mt-1 text-3xl font-black tracking-normal text-slate-950">짧고 자연스럽게 올려보세요</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">핵심 메시지를 넣으면 댓글과 공감을 유도하는 스레드 문구를 만들어드려요.</p>
        </div>

        <form className="space-y-4" onSubmit={generateThread}>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-4">
              <Field label="주제" placeholder="예: 오늘 카페에서 느낀 점" icon={<PenLine size={18} />} value={topic} onChange={setTopic} />
              <MemoInput label="핵심 메시지" value={message} onChange={setMessage} placeholder="예: 조용한 공간이 생각보다 하루의 리듬을 바꿔줬어요." required />
              <Field label="말투" placeholder="예: 친근하고 자연스럽게" icon={<Sparkles size={18} />} value={tone} onChange={setTone} />
              <Field label="키워드" placeholder="예: 카페, 일상, 집중" icon={<Sparkles size={18} />} value={keywords} onChange={setKeywords} required />
              <MemoInput label="참고 메모" value={memo} onChange={setMemo} placeholder="추가로 반영할 분위기나 상황을 적어주세요." />
            </div>
          </div>

          <PhotoUploader photoPreviews={photoPreviews} setPhotos={setPhotos} />
          {error && <ErrorCard message={error} />}
          <Button type="submit" disabled={loading} className="gap-2 disabled:opacity-60">
            {loading && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
            {loading ? "스레드 생성 중" : "스레드 문구 만들기"}
          </Button>
        </form>

        {result && (
          <section className="mt-6 space-y-4">
            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">T</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950">트립라이터 초안</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-800">{result.content}</p>
                  {photoPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {photoPreviews.slice(0, 4).map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={photo.url} src={photo.url} alt={photo.name} className="aspect-square rounded-2xl object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">#{tag}</span>)}
                  </div>
                </div>
              </div>
            </article>

            <ResultList title="첫 문장 훅 3개" items={result.hooks?.length ? result.hooks : result.titles} />
            <ResultList title="대체 문구 3개" items={result.alternatives || []} />

            <div className="grid gap-2">
              <button type="button" onClick={copyThread} className="min-h-12 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white">스레드에 올릴 문구 복사</button>
              <button type="button" onClick={() => showToast("스레드 발행 API는 다음 Sprint에서 연결할 예정이에요.")} className="min-h-12 rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700">스레드 발행 준비</button>
              <button type="button" onClick={saveThread} disabled={saving} className="min-h-12 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700 disabled:opacity-60">{saving ? "저장 중" : "저장하기"}</button>
              <button type="button" onClick={() => router.push("/saved")} className="min-h-12 rounded-2xl bg-white px-4 text-sm font-bold text-slate-600 ring-1 ring-slate-100">저장함 보기</button>
            </div>
          </section>
        )}
      </section>
      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
    </PageShell>
  );
}

function MemoInput({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <textarea required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white" />
    </label>
  );
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.slice(0, 3).map((item) => <p key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{item}</p>)}
      </div>
    </div>
  );
}
function createInitialEditorState(
  generated: GeneratedPost,
  draft: string,
  photos: PhotoPreview[],
  fallbackTitle: string,
  platform: BlogEditorState["platform"],
): BlogEditorState {
  const base: BlogEditorState = {
    selectedTitle: generated.titles[0] || fallbackTitle || "콘텐츠 초안",
    titleCandidates: generated.titles,
    content: draft,
    html: "",
    photoUrls: [],
    localPhotoPreviews: photos.map((photo) => photo.url),
    photoCaptions: photos.map(() => "사진 설명 추가"),
    photoDecorators: [],
    attachments: [],
    links: [],
    platform,
    contentType: platform === "instagram" ? "instagram" : platform === "threads" ? "threads" : platform === "detail" ? "detail" : "blog",
    fontFamily: "기본",
    fontSize: "기본",
    textAlign: "left",
    pointIcon: "✅",
    emojiHeadings: true,
    paragraphSpacing: false,
    showCaptions: true,
    editorOptions: { platform, photoDecorators: [] },
  };

  return { ...base, html: buildEditorHtml(base) };
}
function createPlacementCandidates(photos: PhotoPreview[], draft: string): PlacementCandidate[] {
  if (photos.length === 0) return [];

  const headingCount = draft.match(/^##\s+/gm)?.length ?? 0;
  const paragraphCount = draft.split(/\n{2,}/).filter((part) => part.trim().length > 0).length;
  const context = `소제목 ${headingCount}개 · 문단 ${paragraphCount}개 기준`;

  if (photos.length === 1) {
    return [
      {
        label: "도입부 아래",
        description: `첫 번째 사진을 글 초반 분위기 소개 아래에 배치합니다. ${context}`,
        photo: photos[0],
      },
    ];
  }

  if (photos.length === 2) {
    return [
      {
        label: "도입부 아래",
        description: `첫 번째 사진을 글 초반 분위기 소개 아래에 배치합니다. ${context}`,
        photo: photos[0],
      },
      {
        label: "마무리 전",
        description: "마지막 사진을 팁이나 정리 문단 직전에 배치합니다.",
        photo: photos[1],
      },
    ];
  }

  return [
    {
      label: "도입부 아래",
      description: `첫 번째 사진을 글 초반 분위기 소개 아래에 배치합니다. ${context}`,
      photo: photos[0],
    },
    {
      label: "주요 내용 중간",
      description: "중간 사진을 핵심 경험이나 정보 문단 사이에 배치합니다.",
      photo: photos[Math.floor(photos.length / 2)],
    },
    {
      label: "마무리 전",
      description: "마지막 사진을 팁이나 정리 문단 직전에 배치합니다.",
      photo: photos[photos.length - 1],
    },
  ];
}

function PhotoPlacementPreview({
  refEl,
  candidates,
}: {
  refEl: React.RefObject<HTMLDivElement | null>;
  candidates: PlacementCandidate[];
}) {
  return (
    <div ref={refEl} className="mt-5 rounded-3xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">사진 배치 미리보기</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            본문 소제목과 문단 수를 기준으로 사진 후보 위치를 제안해요.
          </p>
        </div>
      </div>
      {candidates.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-400">
          사진을 추가하면 배치 후보가 여기에 표시돼요.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {candidates.map((candidate) => (
            <article key={`${candidate.label}-${candidate.photo.url}`} className="flex gap-3 rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={candidate.photo.url}
                alt={candidate.photo.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-950">{candidate.label}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{candidate.description}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{candidate.photo.name}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoUploader({
  photoPreviews,
  setPhotos,
}: {
  photoPreviews: PhotoPreview[];
  setPhotos: (files: File[]) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-base font-bold text-slate-950">사진</h2>
      <label className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-blue-50 px-4 text-center">
        <ImagePlus className="text-blue-600" size={30} aria-hidden="true" />
        <span className="mt-3 text-sm font-bold text-blue-700">사진 업로드</span>
        <span className="mt-1 text-xs leading-5 text-blue-700/70">
          저장 시 Supabase Storage에 업로드하고 글과 연결해요.
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => setPhotos(Array.from(event.target.files || []))}
        />
      </label>
      {photoPreviews.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {photoPreviews.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.url}
                src={photo.url}
                alt={photo.name}
                className="aspect-square rounded-2xl object-cover"
              />
            ))}
          </div>
          <ul className="grid gap-1 text-xs font-semibold text-slate-500">
            {photoPreviews.map((photo) => (
              <li key={photo.url} className="truncate rounded-xl bg-slate-50 px-3 py-2">
                {photo.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AttachmentUploader({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-base font-bold text-slate-950">첨부파일</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        PDF, 문서, 압축파일 등을 보관용으로 함께 저장할 수 있어요.
      </p>
      <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
        <span className="text-sm font-bold text-slate-700">파일 업로드</span>
        <span className="mt-1 text-xs text-slate-400">pdf, doc, xls, ppt, hwp, txt, zip</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.txt,.zip"
          multiple
          className="sr-only"
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-3 grid gap-1 text-xs font-semibold text-slate-500">
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="truncate rounded-xl bg-slate-50 px-3 py-2">
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildPreviewHtml(draft: string, photos: PhotoPreview[]) {
  const paragraphs = draft.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  if (paragraphs.length === 0) return "";
  const placements = createImagePlacementMap(paragraphs.length, photos);
  const blocks: string[] = [];

  paragraphs.forEach((paragraph, index) => {
    blocks.push(`<p style="margin:0 0 18px;white-space:pre-wrap;">${escapeHtml(paragraph).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^##\s*(.+)$/gm, "<strong>$1</strong>")}</p>`);
    (placements.get(index) || []).forEach((photo) => {
      blocks.push(`<figure style="margin:22px 0;text-align:center;"><img src="${escapeAttribute(photo.url)}" alt="${escapeAttribute(photo.name)}" style="max-width:100%;height:auto;border-radius:14px;" /></figure>`);
    });
  });

  return `<div style="line-height:1.85;color:#1f2937;">${blocks.join("")}</div>`;
}

function createImagePlacementMap(paragraphCount: number, photos: PhotoPreview[]) {
  const map = new Map<number, PhotoPreview[]>();
  if (paragraphCount === 0) return map;
  photos.forEach((photo, index) => {
    const target = photos.length > paragraphCount && index >= paragraphCount
      ? paragraphCount - 1
      : Math.min(paragraphCount - 1, Math.floor(((index + 1) * paragraphCount) / (photos.length + 1)));
    const current = map.get(target) || [];
    current.push(photo);
    map.set(target, current);
  });
  return map;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/```/g, "");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function ChoiceLabel({
  name,
  value,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-3 text-center text-sm font-bold text-slate-600 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {value}
    </label>
  );
}

function PersonaChip({
  value,
  checked,
  onChange,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex min-h-9 cursor-pointer items-center justify-center rounded-full border px-2.5 py-1.5 text-center text-[11px] font-bold leading-4 ${
        checked
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
          : "border-slate-100 bg-slate-50 text-slate-500"
      }`}
    >
      <input
        type="radio"
        name="persona"
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {value}
    </label>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex gap-3 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-rose-700">
      <AlertCircle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
      <div>
        <p className="text-sm font-black">초안 생성에 실패했어요</p>
        <p className="mt-1 text-sm leading-6">{message}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-400 focus-within:border-blue-400 focus-within:bg-white">
        {icon}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
        />
      </div>
    </label>
  );
}

function MemoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">내용 메모</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: 아이들과 함께 갔고, 조용한 분위기의 카페였어요. 창가 자리에서 사진을 찍기 좋았고 커피는 산미가 적었어요."
        className="mt-2 min-h-32 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
      />
      <p className="mt-2 text-xs leading-5 text-blue-700">
        AI가 글을 쓸 때 가장 중요하게 반영하는 내용이에요.
      </p>
    </label>
  );
}























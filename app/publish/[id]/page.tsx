"use client";

import { CheckCircle2, Clipboard, Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import { getPost, updatePost } from "@/lib/posts";
import type { ContentPlatform } from "@/types/editor";
import type { Post } from "@/types/post";

const copyWorkflows: Record<string, string[]> = {
  naver: ["제목 복사", "HTML 또는 본문 복사", "사진 다운로드/확인", "태그 복사"],
  tistory: ["제목 복사", "HTML 복사", "태그 복사"],
  threads: ["본문 복사", "해시태그 복사", "사진 확인"],
  review: ["한줄평 복사", "전체 리뷰 복사", "해시태그 복사"],
  detail: ["HTML 복사", "이미지 설명 복사", "CTA 복사"],
  general: ["제목 복사", "본문 복사", "태그 복사"],
};
const checklist = ["제목 확인", "본문 확인", "사진 확인", "태그 확인", "복사 준비 완료"];

const platformLabels: Record<ContentPlatform, string> = {
  naver: "네이버 블로그",
  tistory: "티스토리",
  threads: "스레드",
  brunch: "브런치",
  instagram: "인스타그램",
  wordpress: "워드프레스",
  general: "일반",
  review: "리뷰",
  detail: "상세페이지",
};

type ThreadOptions = {
  hooks?: string[];
  alternatives?: string[];
  platform?: string;
};

export default function PublishReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const platform = post ? getPostPlatform(post) : "naver";
  const threadOptions = (post?.editor_options || {}) as ThreadOptions;
  const threadHooks = Array.isArray(threadOptions.hooks) ? threadOptions.hooks.map(String) : post?.ai_titles || [];
  const threadAlternatives = Array.isArray(threadOptions.alternatives) ? threadOptions.alternatives.map(String) : [];
  const tagText = (post?.tags || []).map((tag) => `#${tag.replace(/^#/, "")}`).join(" ");

  const previewHtml = useMemo(() => {
    if (!post) return "";
    return post.published_html || basicHtmlFromContent(post.content || "");
  }, [post]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function loadPost() {
    setLoading(true);
    setError("");

    try {
      const data = await getPost(params.id);
      setPost(data);
      setSelectedTitle(data.travel_title || data.ai_titles?.[0] || "제목 없음");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `검수할 글을 불러오지 못했어요. ${caught.message}`
          : "검수할 글을 불러오지 못했어요.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text || "");
    showToast(message);
  }

  async function markPublished() {
    if (!post) return;
    const ok = window.confirm("외부 플랫폼에 붙여넣어 발행하셨나요?");
    if (!ok) {
      showToast("아직 발행 완료로 표시하지 않았어요.");
      return;
    }

    setPublishing(true);
    try {
      const updated = await updatePost(post.id, {
        status: "published",
        published_at: new Date().toISOString(),
        naver_post_url: null,
      });
      setPost(updated);
      showToast("발행 완료로 표시했어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? `상태 변경에 실패했어요. ${caught.message}` : "상태 변경에 실패했어요.");
    } finally {
      setPublishing(false);
    }
  }

  async function copyAllAndAskPublished() {
    if (!post) return;
    const body = platform === "threads"
      ? `${post.content}\n\n${tagText}`.trim()
      : `${selectedTitle}\n\n${post.content}\n\n${tagText}`.trim();
    await copyText(body, "발행용 전체 문구를 복사했어요.");
    await markPublished();
  }

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">{platformLabels[platform]} 발행 준비</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">복사해서 발행하기</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">복사 전에 제목, 사진, 태그, 본문을 빠르게 확인해요.</p>
        </div>

        {loading && <LoadingCard title="발행 화면을 준비하는 중" description="저장된 본문과 복사 도구를 불러오고 있어요." />}

        {!loading && error && <ErrorCard message={error} action={<button type="button" onClick={loadPost} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">다시 불러오기</button>} />}

        {!loading && post && <CopyWorkflow platform={platform} checkedItems={checkedItems} setCheckedItems={setCheckedItems} />}

        {!loading && post && platform === "threads" && (
          <div className="space-y-4">
            <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">T</div>
                  <div>
                    <p className="text-sm font-black text-slate-950">트립라이터</p>
                    <p className="text-xs font-bold text-slate-400">@tripwriter · {statusLabel(post.status)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">스레드</span>
              </div>
              <p className="whitespace-pre-wrap text-base leading-8 text-slate-900">{post.content}</p>
              {post.photo_urls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {post.photo_urls.slice(0, 4).map((url, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt={`스레드 이미지 ${index + 1}`} className="aspect-square rounded-2xl object-cover" />
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm font-bold leading-6 text-blue-700">{tagText}</p>
            </section>

            <TextList title="첫 문장 훅" items={threadHooks} />
            <TextList title="대체 문구" items={threadAlternatives} />

            <CopyPanel
              buttons={[
                { label: "본문 복사", onClick: () => copyText(post.content, "본문을 복사했어요.") },
                { label: "해시태그 복사", onClick: () => copyText(tagText, "해시태그를 복사했어요.") },
                { label: "전체 문구 복사", onClick: copyAllAndAskPublished, primary: true },
              ]}
            />

            <button type="button" onClick={() => showToast("다음 Sprint에서 스레드 발행 연동을 준비할 예정이에요.")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white">
              <Send size={17} aria-hidden="true" />
              스레드 발행 준비
            </button>

            <PublishChecklist checkedItems={checkedItems} setCheckedItems={setCheckedItems} />
            <AutoPublishCard />
            <Button href={`/saved/threads/${post.id}`} variant="secondary">스레드 상세로 돌아가기</Button>
          </div>
        )}


        {!loading && post && platform === "detail" && (
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-100">
              <div className="bg-blue-50 px-5 py-4">
                <p className="text-xs font-black text-blue-700">판매사이트 상세페이지</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{selectedTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">HTML, 본문, 이미지 설명, 구매 CTA를 복사해 쇼핑몰 에디터에 붙여넣을 수 있어요.</p>
              </div>
              <div className="p-4">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </section>

            <PhotoList urls={post.photo_urls} />
            <CopyPanel
              buttons={[
                { label: "HTML 복사", onClick: () => copyText(previewHtml, "HTML을 복사했어요."), primary: true },
                { label: "본문 복사", onClick: () => copyText(post.content, "본문을 복사했어요.") },
                { label: "이미지 설명 복사", onClick: () => copyText(getPhotoCaptions(post).join("\n"), "이미지 설명을 복사했어요.") },
                { label: "구매 CTA 복사", onClick: () => copyText(getDetailCta(post), "구매 CTA를 복사했어요.") },
                { label: "복사해서 발행하기", onClick: copyAllAndAskPublished, primary: true },
              ]}
            />
            <AutomationCard />
          </div>
        )}

        {!loading && post && platform === "review" && (
          <div className="space-y-4">
            <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-black text-amber-600">리뷰 발행 준비</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{selectedTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">한줄평, 전체 리뷰, 해시태그, 사진 설명을 복사해 쇼핑몰/블로그 리뷰에 붙여넣을 수 있어요.</p>
              <div className="mt-4 rounded-3xl bg-amber-50 p-4 text-sm leading-7 text-slate-800">
                <p className="font-black text-amber-700">한줄평</p>
                <p className="mt-2">{post.ai_titles?.[0] || selectedTitle}</p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">전체 리뷰</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>
            </section>

            <PhotoList urls={post.photo_urls} />

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">해시태그</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">#{tag}</span>)}
              </div>
            </section>

            <CopyPanel
              buttons={[
                { label: "한줄평 복사", onClick: () => copyText(post.ai_titles?.[0] || selectedTitle, "한줄평을 복사했어요.") },
                { label: "전체 리뷰 복사", onClick: () => copyText(post.content, "전체 리뷰를 복사했어요."), primary: true },
                { label: "해시태그 복사", onClick: () => copyText(tagText, "해시태그를 복사했어요.") },
                { label: "사진 설명 복사", onClick: () => copyText(getPhotoCaptions(post).join("\n"), "사진 설명을 복사했어요.") },
                { label: "복사해서 발행하기", onClick: copyAllAndAskPublished, primary: true },
              ]}
            />

            <PublishChecklist checkedItems={checkedItems} setCheckedItems={setCheckedItems} />
            <AutoPublishCard />
            <Button href={`/saved/${post.id}`} variant="secondary">리뷰 편집으로 돌아가기</Button>
          </div>
        )}

        {!loading && post && platform !== "threads" && platform !== "detail" && platform !== "review" && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">대표 제목</h2>
              <div className="mt-3 space-y-2">
                {(post.ai_titles?.length ? post.ai_titles : [post.travel_title || "제목 없음"]).map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setSelectedTitle(title)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                      selectedTitle === title ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">본문 HTML 미리보기</h2>
              <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-inner">
                <h1 className="mb-4 text-xl font-black text-slate-950">{selectedTitle}</h1>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-blue-600" size={19} aria-hidden="true" />
                <h2 className="text-base font-bold text-slate-950">사진 목록</h2>
              </div>
              {post.photo_urls.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">저장된 사진이 없어요.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {post.photo_urls.map((url, index) => (
                    <article key={url} className="rounded-2xl bg-slate-50 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`사진 ${index + 1}`} className="aspect-square rounded-xl object-cover" />
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">태그</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">#{tag}</span>)}
              </div>
            </section>

            <CopyPanel
              buttons={[
                { label: "제목 복사", onClick: () => copyText(selectedTitle, "제목을 복사했어요.") },
                { label: "본문 복사", onClick: () => copyText(post.content, "본문을 복사했어요.") },
                { label: "HTML 복사", onClick: () => copyText(post.published_html || previewHtml, "HTML을 복사했어요.") },
                { label: "태그 복사", onClick: () => copyText(tagText, "해시태그를 복사했어요.") },
                { label: "복사해서 발행하기", onClick: copyAllAndAskPublished, primary: true },
              ]}
            />

            <PublishChecklist checkedItems={checkedItems} setCheckedItems={setCheckedItems} />
            <AutoPublishCard />
            <Button href={`/saved/${post.id}`} variant="secondary">상세로 돌아가기</Button>
          </div>
        )}
      </section>

      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
      {publishing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60"><Loader2 className="animate-spin text-blue-600" size={30} /></div>}
    </PageShell>
  );
}

function CopyWorkflow({ platform, checkedItems, setCheckedItems }: { platform: ContentPlatform; checkedItems: Record<string, boolean>; setCheckedItems: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void }) {
  const steps = copyWorkflows[platform] || copyWorkflows.general;
  return (
    <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-slate-950">복사 발행 순서</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">외부 플랫폼에 붙여넣을 때 아래 순서대로 확인하면 빠르게 발행할 수 있어요.</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{platformLabels[platform]}</span>
      </div>
      <div className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const key = `workflow-${platform}-${step}`;
          return (
            <label key={key} className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(checkedItems[key])}
                onChange={(event) => setCheckedItems((prev) => ({ ...prev, [key]: event.target.checked }))}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-blue-700">{index + 1}</span>
              {step}
            </label>
          );
        })}
      </div>
    </section>
  );
}
function CopyPanel({ buttons }: { buttons: { label: string; onClick: () => void | Promise<void>; primary?: boolean }[] }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-base font-bold text-slate-950">복사 도구</h2>
      <div className="mt-3 grid gap-2">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.onClick}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold ${button.primary ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            <Clipboard size={17} aria-hidden="true" />
            {button.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function PublishChecklist({ checkedItems, setCheckedItems }: { checkedItems: Record<string, boolean>; setCheckedItems: (value: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void }) {
  return (
    <details className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <summary className="cursor-pointer list-none text-base font-bold text-slate-950">발행 전 확인</summary>
      <div className="mt-3 space-y-2">
        {checklist.map((item) => (
          <label key={item} className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-4 text-sm font-bold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(checkedItems[item])}
              onChange={(event) => setCheckedItems((prev) => ({ ...prev, [item]: event.target.checked }))}
              className="h-4 w-4 accent-blue-600"
            />
            {item}
          </label>
        ))}
      </div>
    </details>
  );
}

function AutoPublishCard() {
  return (
    <section className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 text-blue-600" size={20} aria-hidden="true" />
        <div>
          <h2 className="text-base font-black text-blue-950">자동 발행 준비 중</h2>
          <p className="mt-2 text-sm leading-6 text-blue-700">네이버, 티스토리, 스레드 자동 발행은 각 플랫폼 API 정책에 맞춰 추후 연결 예정이에요.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <button disabled className="min-h-11 rounded-2xl bg-white/70 px-3 text-sm font-bold text-blue-300">네이버 자동 발행 준비 중</button>
        <button disabled className="min-h-11 rounded-2xl bg-white/70 px-3 text-sm font-bold text-blue-300">티스토리 자동 발행 준비 중</button>
        <button disabled className="min-h-11 rounded-2xl bg-white/70 px-3 text-sm font-bold text-blue-300">스레드 자동 발행 준비 중</button>
      </div>
    </section>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-3 grid gap-2">
        {items.slice(0, 3).map((item) => <p key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{item}</p>)}
      </div>
    </section>
  );
}

function getPostPlatform(post: Post): ContentPlatform {
  const optionPlatform = post.editor_options?.platform;
  if (isContentPlatform(optionPlatform)) return optionPlatform;
  if (post.style === "threads") return "threads";
  if (post.style?.toLowerCase().includes("tistory")) return "tistory";
  return "naver";
}

function isContentPlatform(value: unknown): value is ContentPlatform {
  return ["naver", "tistory", "threads", "detail", "review", "brunch", "instagram", "wordpress", "general"].includes(String(value));
}

function statusLabel(status: Post["status"]) {
  return { draft: "수정 중", scheduled: "예약됨", published: "발행됨", failed: "발행 실패" }[status] || status;
}

function basicHtmlFromContent(content: string) {
  const paragraphs = content.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  return `<div style="line-height:1.85;color:#1f2937;">${paragraphs.map((paragraph) => `<p style="margin:0 0 18px;white-space:pre-wrap;">${escapeHtml(paragraph)}</p>`).join("")}</div>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}



function getPhotoCaptions(post: Post) {
  const options = post.editor_options || {};
  const captions = Array.isArray(options.photoCaptions) ? options.photoCaptions.map(String) : [];
  return post.photo_urls.map((_, index) => captions[index] || `상품 이미지 ${index + 1}`);
}

function getDetailCta(post: Post) {
  const detail = post.editor_options?.detailPage as Record<string, unknown> | undefined;
  return typeof detail?.ctaText === "string" ? detail.ctaText : "구매하러 가기";
}

function PhotoList({ urls }: { urls: string[] }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center gap-2"><ImageIcon className="text-blue-600" size={18} aria-hidden="true" /><h3 className="text-sm font-black text-slate-950">상품 사진</h3></div>
      {urls.length === 0 ? <p className="text-sm font-bold text-slate-400">저장된 상품 사진이 없어요.</p> : <div className="grid grid-cols-2 gap-2">{urls.map((url, index) => <img key={url} src={url} alt={`상품 이미지 ${index + 1}`} className="aspect-square rounded-2xl object-cover" />)}</div>}
    </section>
  );
}

function AutomationCard() {
  return (
    <section className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100">
      <h3 className="text-sm font-black text-slate-950">자동 발행 준비 중</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">판매사이트 자동 등록은 각 쇼핑몰 API 정책에 맞춰 추후 연결 예정이에요.</p>
      <button type="button" disabled className="mt-4 min-h-11 w-full rounded-2xl bg-slate-200 px-3 text-sm font-black text-slate-400">쇼핑몰 자동 등록 준비 중</button>
    </section>
  );
}



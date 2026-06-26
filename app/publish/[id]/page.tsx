"use client";

import { CheckCircle2, Clipboard, Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { getPost, updatePost } from "@/lib/posts";
import type { Post } from "@/types/post";

const checklist = [
  "제목 확인",
  "사진 확인",
  "오타 확인",
  "태그 확인",
  "복사 준비 완료",
];

export default function PublishReviewPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

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
      setSelectedTitle(data.ai_titles?.[0] || data.travel_title || "제목 없음");
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
    await navigator.clipboard.writeText(text);
    showToast(message);
  }

  async function copyAndMarkPublished() {
    if (!post) return;
    await navigator.clipboard.writeText(post.published_html || post.content);
    const ok = window.confirm("직접 발행을 완료했다면 글 상태를 발행됨으로 바꿀까요?");
    if (!ok) {
      showToast("발행용 내용을 복사했어요.");
      return;
    }
    const updated = await updatePost(post.id, {
      status: "published",
      published_at: new Date().toISOString(),
      naver_post_url: null,
    });
    setPost(updated);
    showToast("발행됨으로 표시했어요.");
  }

  function prepareNaverPublish() {
    showToast("다음 Sprint에서 네이버 OAuth와 발행 API를 연결할 예정이에요.");
  }

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">발행 전 확인</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            발행 전 검수
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            네이버 블로그에 올리기 전 제목, 사진, 태그, 본문을 마지막으로 확인해요.
          </p>
        </div>

        {loading && (
          <div className="flex min-h-48 items-center justify-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <Loader2 className="animate-spin text-blue-600" size={28} aria-hidden="true" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
            <p className="text-sm font-black">문제가 생겼어요</p>
            <p className="mt-2 text-sm leading-6">{error}</p>
            <button
              type="button"
              onClick={loadPost}
              className="mt-4 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!loading && post && (
          <div className="space-y-4">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">대표 제목 선택</h2>
              <div className="mt-3 space-y-2">
                {(post.ai_titles?.length ? post.ai_titles : [post.travel_title || "제목 없음"]).map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setSelectedTitle(title)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                      selectedTitle === title
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-100 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {post.destination || "장소 없음"} · {post.travel_date || "날짜 없음"} · {post.style || "스타일 없음"}
              </p>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-base font-bold text-slate-950">HTML 미리보기</h2>
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
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">
                  저장된 사진이 없어요.
                </p>
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
                {(post.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </section>

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

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={prepareNaverPublish}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white"
                >
                  <Send size={17} aria-hidden="true" />
                  네이버 발행 준비
                </button>
                <button
                  type="button"
                  onClick={copyAndMarkPublished}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white"
                >
                  <Clipboard size={17} aria-hidden="true" />
                  복사해서 직접 발행하기
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(post.content, "본문을 복사했어요.")}
                    className="min-h-11 rounded-2xl bg-slate-100 px-3 text-sm font-bold text-slate-700"
                  >
                    본문 복사
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(post.published_html || previewHtml, "HTML을 복사했어요.")}
                    className="min-h-11 rounded-2xl bg-blue-50 px-3 text-sm font-bold text-blue-700"
                  >
                    HTML 복사
                  </button>
                </div>
              </div>
            </section>

            <Button href={`/saved/${post.id}`} variant="secondary">상세로 돌아가기</Button>
          </div>
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

function basicHtmlFromContent(content: string) {
  const paragraphs = content.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  return `<div style="line-height:1.85;color:#1f2937;">${paragraphs
    .map((paragraph) => `<p style="margin:0 0 18px;white-space:pre-wrap;">${escapeHtml(paragraph)}</p>`)
    .join("")}</div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


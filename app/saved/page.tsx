"use client";

import { FileText, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { deletePost, getPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

const statusLabels: Record<Post["status"], string> = {
  draft: "수정 중",
  scheduled: "예약됨",
  published: "발행됨",
  failed: "발행 실패",
};

const actionLabels: Record<Post["status"], string> = {
  draft: "수정하기",
  scheduled: "예약 확인",
  published: "발행글 보기",
  failed: "다시 확인",
};

export default function SavedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPosts() {
    setLoading(true);
    setError("");

    try {
      const data = await getPosts();
      setPosts(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `저장함을 불러오지 못했어요. ${caught.message}`
          : "저장함을 불러오지 못했어요. Supabase 연결을 확인해주세요.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    const ok = window.confirm("이 초안을 삭제할까요?");
    if (!ok) return;

    try {
      await deletePost(id);
      await loadPosts();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `삭제에 실패했어요. ${caught.message}`
          : "삭제에 실패했어요. 잠시 후 다시 시도해주세요.",
      );
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">내 블로그 글</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            내 블로그 글
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            작성 중이거나 발행한 글을 확인해요.
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
              onClick={loadPosts}
              className="mt-4 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-950">
              아직 저장된 글이 없어요
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              블로그 초안을 만든 뒤 저장하기를 눌러 첫 글을 보관해보세요.
            </p>
            <div className="mt-6">
              <Button href="/write">새 글 작성하기</Button>
            </div>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <article
                key={post.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/saved/${post.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") router.push(`/saved/${post.id}`);
                }}
                className="cursor-pointer rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {statusLabels[post.status] || post.status}
                    </span>
                    <h2 className="mt-3 line-clamp-2 text-base font-black text-slate-950">
                      {post.travel_title || post.ai_titles?.[0] || "제목 없음"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {post.destination || "장소 없음"} · {post.travel_date || "날짜 없음"} · {post.style || "스타일 없음"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      생성일 {new Date(post.created_at).toLocaleString("ko-KR")}
                    </p>
                    <span className="mt-3 inline-flex rounded-2xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                      {actionLabels[post.status] || "확인하기"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, post.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                    aria-label="초안 삭제"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}


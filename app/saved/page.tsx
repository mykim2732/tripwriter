"use client";

import { FileText, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { PageShell } from "@/components/PageShell";
import { deletePost, getPosts } from "@/lib/posts";
import type { ContentPlatform } from "@/types/editor";
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

const platformLabels: Record<ContentPlatform, string> = {
  naver: "네이버 블로그",
  tistory: "티스토리",
  threads: "스레드",
  brunch: "브런치",
  instagram: "인스타그램",
  wordpress: "워드프레스",
  general: "일반",
};

const filters = ["전체", "네이버", "티스토리", "스레드", "수정 중", "발행됨"] as const;
type SavedFilter = (typeof filters)[number];

export default function SavedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<SavedFilter>("전체");

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesFilter(post, filter)),
    [posts, filter],
  );

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
    const ok = window.confirm("이 콘텐츠를 삭제할까요?");
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

  function openPost(post: Post) {
    const platform = getPostPlatform(post);
    router.push(platform === "threads" ? `/saved/threads/${post.id}` : `/saved/${post.id}`);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-5">
          <p className="text-sm font-bold text-blue-600">내 콘텐츠</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            저장함
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            블로그와 스레드 초안을 플랫폼별로 확인해요.
          </p>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                filter === item ? "bg-blue-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-100"
              }`}
            >
              {item}
            </button>
          ))}
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
              아직 저장된 콘텐츠가 없어요
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              초안을 만든 뒤 저장하기를 눌러 첫 콘텐츠를 보관해보세요.
            </p>
            <div className="mt-6">
              <Button href="/write">새 콘텐츠 작성하기</Button>
            </div>
          </div>
        )}

        {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-bold text-slate-400">선택한 필터에 해당하는 글이 없어요.</p>
          </div>
        )}

        {!loading && !error && filteredPosts.length > 0 && (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const platform = getPostPlatform(post);
              return (
                <article
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPost(post)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") openPost(post);
                  }}
                  className="cursor-pointer rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${platformTone(platform)}`}>
                          {platformLabels[platform] || "네이버 블로그"}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {statusLabels[post.status] || post.status}
                        </span>
                      </div>
                      <h2 className="mt-3 line-clamp-2 text-base font-black text-slate-950">
                        {post.travel_title || post.ai_titles?.[0] || "제목 없음"}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {platform === "threads"
                          ? post.content.slice(0, 80) || "스레드 초안"
                          : `${post.destination || "장소 없음"} · ${post.travel_date || "날짜 없음"} · ${post.style || "스타일 없음"}`}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        생성일 {new Date(post.created_at).toLocaleString("ko-KR")}
                      </p>
                      <span className="mt-3 inline-flex rounded-2xl bg-slate-950 px-3 py-2 text-xs font-bold text-white">
                        {platform === "threads" ? "스레드 보기" : actionLabels[post.status] || "확인하기"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => handleDelete(event, post.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                      aria-label="콘텐츠 삭제"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function matchesFilter(post: Post, filter: SavedFilter) {
  const platform = getPostPlatform(post);
  if (filter === "전체") return true;
  if (filter === "네이버") return platform === "naver";
  if (filter === "티스토리") return platform === "tistory";
  if (filter === "스레드") return platform === "threads";
  if (filter === "수정 중") return post.status === "draft";
  if (filter === "발행됨") return post.status === "published";
  return true;
}

function getPostPlatform(post: Post): ContentPlatform {
  const optionPlatform = post.editor_options?.platform;
  if (isContentPlatform(optionPlatform)) return optionPlatform;
  if (post.style === "threads") return "threads";
  if (post.style?.toLowerCase().includes("tistory")) return "tistory";
  return "naver";
}

function isContentPlatform(value: unknown): value is ContentPlatform {
  return ["naver", "tistory", "threads", "brunch", "instagram", "wordpress", "general"].includes(String(value));
}

function platformTone(platform: ContentPlatform) {
  if (platform === "threads") return "bg-slate-950 text-white";
  if (platform === "tistory") return "bg-sky-50 text-sky-700";
  return "bg-blue-50 text-blue-700";
}

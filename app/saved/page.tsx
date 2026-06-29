"use client";

import { ChevronDown, FileText, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
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
  review: "리뷰",
  detail: "상세페이지",
};

const filters = ["전체", "네이버", "티스토리", "스레드", "리뷰", "수정 중", "발행됨"] as const;
type SavedFilter = (typeof filters)[number];

type ProjectGroup = {
  key: string;
  title: string;
  posts: Post[];
};

export default function SavedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<SavedFilter>("전체");
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesFilter(post, filter)),
    [posts, filter],
  );

  const projectGroups = useMemo(() => groupPostsByProject(filteredPosts), [filteredPosts]);

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
    const url = getPlatformPostUrl(post);
    if (post.status === "published" && url) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const platform = getPostPlatform(post);
    router.push(platform === "threads" ? `/saved/threads/${post.id}` : `/saved/${post.id}`);
  }

  function toggleProject(key: string) {
    setOpenProjects((current) => ({ ...current, [key]: !(current[key] ?? true) }));
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-5">
          <p className="text-sm font-bold text-blue-600">AI 콘텐츠 스튜디오</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            내 블로그 글
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            작성 중이거나 발행한 글을 프로젝트별로 확인해요.
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

        {loading && <LoadingCard title="저장함을 불러오는 중" description="프로젝트와 콘텐츠를 정리하고 있어요." />}

        {!loading && error && <ErrorCard message={error} action={<button type="button" onClick={loadPosts} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">다시 불러오기</button>} />}

        {!loading && !error && posts.length === 0 && <EmptyState title="아직 저장된 콘텐츠가 없어요" description="초안을 만든 뒤 저장하기를 눌러 첫 콘텐츠를 보관해보세요." icon={<FileText size={28} aria-hidden="true" />} action={<Button href="/write">새 콘텐츠 작성하기</Button>} />}

        {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && <EmptyState title="선택한 필터에 해당하는 글이 없어요" description="다른 플랫폼이나 상태 필터를 선택해보세요." />}

        {!loading && !error && projectGroups.length > 0 && (
          <div className="space-y-4">
            {projectGroups.map((group) => {
              const isOpen = openProjects[group.key] ?? true;
              return (
                <section key={group.key} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleProject(group.key)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <FolderOpen size={22} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black text-slate-950">{group.title}</h2>
                        <p className="mt-1 text-xs font-bold text-slate-400">{group.posts.length}개 콘텐츠 · {summarizePlatforms(group.posts)}</p>
                      </div>
                    </div>
                    <ChevronDown className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} size={20} aria-hidden="true" />
                  </button>

                  {isOpen && (
                    <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-3">
                      {group.posts.map((post) => {
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
                            className="cursor-pointer rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${platformTone(platform)}`}>
                                    {platformLabels[platform] || "네이버 블로그"}
                                  </span>
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${post.status === "published" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                    {statusLabels[post.status] || post.status}
                                  </span>
                                </div>
                                <h3 className="mt-3 line-clamp-2 text-base font-black text-slate-950">
                                  {post.travel_title || post.ai_titles?.[0] || "제목 없음"}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {platform === "threads"
                                    ? post.content.slice(0, 80) || "스레드 초안"
                                    : `${post.destination || "장소 없음"} · ${post.travel_date || "날짜 없음"} · ${post.style || "스타일 없음"}`}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  생성일 {new Date(post.created_at).toLocaleString("ko-KR")}
                                </p>
                                {getPlatformPostUrl(post) && <p className="mt-2 truncate text-xs font-bold text-blue-600">발행 URL 저장됨</p>}
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
  if (filter === "리뷰") return platform === "review";
  if (filter === "수정 중") return post.status === "draft";
  if (filter === "발행됨") return post.status === "published";
  return true;
}

function groupPostsByProject(posts: Post[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();

  posts.forEach((post) => {
    const title = getProjectName(post);
    const key = normalizeProjectKey(title);
    const current = map.get(key);
    if (current) {
      current.posts.push(post);
      return;
    }
    map.set(key, { key, title, posts: [post] });
  });

  return Array.from(map.values()).sort((a, b) => newestTime(b.posts) - newestTime(a.posts));
}

function getProjectName(post: Post) {
  const optionProject = post.editor_options?.projectName;
  if (typeof optionProject === "string" && optionProject.trim()) return optionProject.trim();
  return post.destination || post.travel_title || post.keywords.split(",")[0]?.trim() || "기타 프로젝트";
}

function normalizeProjectKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-") || "project";
}

function newestTime(posts: Post[]) {
  return Math.max(...posts.map((post) => new Date(post.html_updated_at || post.published_at || post.created_at).getTime()));
}

function summarizePlatforms(posts: Post[]) {
  const platforms = Array.from(new Set(posts.map((post) => platformLabels[getPostPlatform(post)] || "네이버 블로그")));
  return platforms.slice(0, 3).join(" · ");
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

function platformTone(platform: ContentPlatform) {
  if (platform === "threads") return "bg-slate-950 text-white";
  if (platform === "review") return "bg-amber-50 text-amber-700";
  if (platform === "tistory") return "bg-sky-50 text-sky-700";
  return "bg-blue-50 text-blue-700";
}

function getPlatformPostUrl(post: Post) {
  const optionUrl = post.editor_options?.platformPostUrl;
  if (typeof optionUrl === "string" && optionUrl) return optionUrl;
  return post.naver_post_url || "";
}



